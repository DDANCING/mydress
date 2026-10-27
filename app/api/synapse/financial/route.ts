import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Middleware de autenticação
async function authenticateRequest(request: NextRequest) {
  const authorization = request.headers.get("Authorization");
  const synapseSecret = process.env.SYNAPSE_SECRET;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Token de autorização é obrigatório", status: "error", code: 401 },
      { status: 401, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  const token = authorization.replace("Bearer ", "");

  if (!synapseSecret || token !== synapseSecret) {
    return NextResponse.json(
      { error: "Token de autorização inválido", status: "error", code: 403 },
      { status: 403, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  return null; // Autorizado
}

export async function GET(request: NextRequest) {
  // Verificar autenticação
  const authError = await authenticateRequest(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period"); // YYYY-MM ou YYYY
    const months = searchParams.get("months") || "12"; // Últimos X meses

    // Calcular datas
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - parseInt(months));

    // Se período específico for fornecido
    if (period) {
      if (period.includes("-")) {
        // Formato YYYY-MM
        const [year, month] = period.split("-");
        startDate.setFullYear(parseInt(year), parseInt(month) - 1, 1);
        endDate.setFullYear(parseInt(year), parseInt(month), 0);
      } else {
        // Formato YYYY
        startDate.setFullYear(parseInt(period), 0, 1);
        endDate.setFullYear(parseInt(period), 11, 31);
      }
    }

    // Buscar dados financeiros
    const [
      contractPayments,
      invoices,
      outFinances,
      contracts
    ] = await db.$transaction([
      // Receitas (pagamentos de contratos)
      db.contractPayment.findMany({
        where: {
          paymentDate: { gte: startDate, lte: endDate },
          isPaid: true
        },
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          description: true,
          contract: {
            select: {
              id: true,
              totalAmount: true,
              buyer: {
                select: {
                  fullName: true
                }
              }
            }
          },
          paymentMethod: {
            select: {
              name: true
            }
          }
        },
        orderBy: { paymentDate: "desc" }
      }),

      // Receitas de NFe
      db.invoice.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          type: "NFE",
          nfeStatus: "ACTIVE"
        },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          chaveNfe: true,
          focusNfeStatus: true,
          buyer: {
            select: {
              fullName: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),

      // Despesas
      db.outFinanceColumn.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        select: {
          id: true,
          name: true,
          value: true,
          createdAt: true,
          store: true,
          method: true,
          data: true
        },
        orderBy: { createdAt: "desc" }
      }),

      // Contratos para contexto
      db.contract.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          type: true,
          buyer: {
            select: {
              fullName: true
            }
          },
          paymentMethod: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    // Processar dados para análise
    interface FinancialItem {
      id: string;
      type: "revenue" | "expense";
      source: string;
      amount: number;
      date: string;
      description: string;
      method?: string;
      contractId?: string;
      clientName?: string;
      category: string;
      nfeKey?: string;
      nfeStatus?: string;
      isPaid?: boolean;
      paymentDate?: string;
      details?: string;
    }

    const financialData: FinancialItem[] = [];

    // Adicionar receitas de contratos
    contractPayments.forEach(payment => {
      financialData.push({
        id: payment.id,
        type: "revenue",
        source: "contract_payment",
        amount: Number(payment.amount),
        date: payment.paymentDate.toISOString(),
        description: `Pagamento - ${payment.contract.buyer.fullName}`,
        method: payment.paymentMethod.name,
        contractId: payment.contract.id,
        clientName: payment.contract.buyer.fullName,
        category: "service_payment"
      });
    });

    // Adicionar receitas de NFe
    invoices.forEach(invoice => {
      financialData.push({
        id: invoice.id,
        type: "revenue",
        source: "nfe",
        amount: Number(invoice.amount || 0),
        date: invoice.createdAt.toISOString(),
        description: `NFe - ${invoice.buyer?.fullName || "Cliente"}`,
        nfeKey: invoice.chaveNfe || undefined,
        nfeStatus: invoice.focusNfeStatus || undefined,
        clientName: invoice.buyer?.fullName,
        category: "invoice"
      });
    });

    // Adicionar despesas
    outFinances.forEach(expense => {
      financialData.push({
        id: expense.id,
        type: "expense",
        source: "out_finance",
        amount: Number(expense.value),
        date: expense.createdAt.toISOString(),
        description: expense.name,
        category: expense.store || "general",
        method: expense.method,
        isPaid: true, // Assumindo que se está registrado, foi pago
        paymentDate: expense.data.toISOString(),
        details: `Loja: ${expense.store}`
      });
    });

    // Calcular métricas
    const totalRevenue = financialData
      .filter(item => item.type === "revenue")
      .reduce((sum, item) => sum + item.amount, 0);

    const totalExpenses = financialData
      .filter(item => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);

    const netProfit = totalRevenue - totalExpenses;

    // Agrupar por mês para análise temporal
    const monthlyData = financialData.reduce((acc: any, item) => {
      const month = item.date.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, revenue: 0, expenses: 0, transactions: 0 };
      }
      if (item.type === "revenue") {
        acc[month].revenue += item.amount;
      } else {
        acc[month].expenses += item.amount;
      }
      acc[month].transactions++;
      return acc;
    }, {});

    const monthlyAnalysis = Object.values(monthlyData).map((item: any) => ({
      ...item,
      profit: item.revenue - item.expenses,
      margin: item.revenue > 0 ? ((item.revenue - item.expenses) / item.revenue * 100) : 0
    }));

    return NextResponse.json({
      data: financialData,
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        margin: totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0,
        transactionCount: financialData.length,
        contractsCount: contracts.length,
        monthlyAnalysis
      },
      metadata: {
        total: financialData.length,
        period: period || `${months} meses`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: "financial",
        currency: "BRL",
        industry: "services",
        company_size: "medium",
        analysisType: "financial_comprehensive"
      },
      status: "success"
    }, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error("Erro na API financeira:", error);
    return NextResponse.json({
      error: "Erro interno do servidor",
      status: "error",
      code: 500
    }, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type"
    }
  });
}
