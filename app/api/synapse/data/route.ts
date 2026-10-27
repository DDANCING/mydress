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
    const type = searchParams.get("type") || "comprehensive"; // financial, sales, comprehensive
    const period = searchParams.get("period"); // YYYY-MM ou YYYY
    const months = searchParams.get("months") || "6"; // Últimos X meses

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

    // Buscar dados do sistema completo
    const [
      contractPayments,
      invoices,
      outFinances,
      contracts,
      schedules
    ] = await db.$transaction([
      // Receitas - Pagamentos de contratos
      db.contractPayment.aggregate({
        where: {
          paymentDate: { gte: startDate, lte: endDate },
          isPaid: true
        },
        _sum: { amount: true },
        _count: { id: true }
      }),

      // Receitas - NFe
      db.invoice.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          type: "NFE"
        },
        _sum: { amount: true },
        _count: { id: true }
      }),

      // Despesas
      db.outFinanceColumn.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { value: true },
        _count: { id: true }
      }),

      // Contratos
      db.contract.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),

      // Agendamentos
      db.schedule.count({
        where: {
          startDate: { gte: startDate, lte: endDate }
        }
      })
    ]);

    // Buscar dados detalhados para análise temporal (últimos 12 meses)
    const last12Months = new Date();
    last12Months.setMonth(last12Months.getMonth() - 12);

    const monthlyData = await db.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date_col) as month,
        SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END) as revenue,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
        COUNT(CASE WHEN type = 'contract' THEN 1 END) as contracts,
        COUNT(CASE WHEN type = 'schedule' THEN 1 END) as schedules
      FROM (
        SELECT "paymentDate" as date_col, amount, 'revenue' as type FROM "ContractPayment" 
        WHERE "paymentDate" >= ${last12Months} AND "isPaid" = true
        UNION ALL
        SELECT "createdAt" as date_col, amount, 'revenue' as type FROM "Invoice" 
        WHERE "createdAt" >= ${last12Months} AND type = 'NFE'
        UNION ALL
        SELECT "createdAt" as date_col, value as amount, 'expense' as type FROM "OutFinanceColumn" 
        WHERE "createdAt" >= ${last12Months}
        UNION ALL
        SELECT "createdAt" as date_col, "totalAmount" as amount, 'contract' as type FROM "Contract" 
        WHERE "createdAt" >= ${last12Months}
        UNION ALL
        SELECT "startDate" as date_col, 0 as amount, 'schedule' as type FROM "Schedule" 
        WHERE "startDate" >= ${last12Months}
      ) combined
      GROUP BY DATE_TRUNC('month', date_col)
      ORDER BY month DESC
      LIMIT 12
    ` as Array<{
      month: Date;
      revenue: number;
      expenses: number;
      contracts: number;
      schedules: number;
    }>;

    // Calcular métricas principais
    const totalRevenue = Number(contractPayments._sum.amount || 0) + Number(invoices._sum.amount || 0);
    const totalExpenses = Number(outFinances._sum.value || 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

    const totalContracts = contracts._count.id;
    const totalContractValue = Number(contracts._sum.totalAmount || 0);
    const averageContractValue = totalContracts > 0 ? totalContractValue / totalContracts : 0;

    const totalSchedules = schedules;

    // Análise de crescimento (comparar com período anterior)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setMonth(startDate.getMonth() - parseInt(months));
    const previousPeriodEnd = new Date(startDate);

    const [prevRevenue, prevExpenses, prevContracts] = await db.$transaction([
      db.contractPayment.aggregate({
        where: {
          paymentDate: { gte: previousPeriodStart, lte: previousPeriodEnd },
          isPaid: true
        },
        _sum: { amount: true }
      }),
      db.outFinanceColumn.aggregate({
        where: {
          createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd }
        },
        _sum: { value: true }
      }),
      db.contract.count({
        where: {
          createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd }
        }
      })
    ]);

    const previousRevenue = Number(prevRevenue._sum.amount || 0);
    const previousExpenses = Number(prevExpenses._sum.value || 0);
    const previousContracts = prevContracts;

    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue * 100) : 0;
    const contractGrowth = previousContracts > 0 ? ((totalContracts - previousContracts) / previousContracts * 100) : 0;

    // Estruturar resposta baseada no tipo solicitado
    const responseData = {
      // Dados principais sempre incluídos
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalContracts,
        totalContractValue,
        averageContractValue,
        totalSchedules,
        revenueGrowth,
        contractGrowth
      },
      
      // Análise temporal
      monthlyTrends: monthlyData.map(item => ({
        month: item.month.toISOString().substring(0, 7),
        revenue: Number(item.revenue),
        expenses: Number(item.expenses),
        profit: Number(item.revenue) - Number(item.expenses),
        contracts: Number(item.contracts),
        schedules: Number(item.schedules)
      })),

      // KPIs específicos do tipo de negócio
      businessMetrics: {
        cashFlow: totalRevenue - totalExpenses,
        burnRate: totalExpenses / parseInt(months), // Gasto mensal médio
        runwayMonths: netProfit > 0 ? (totalRevenue / (totalExpenses / parseInt(months))) : 0,
        contractConversionRate: totalSchedules > 0 ? (totalContracts / totalSchedules * 100) : 0,
        averageRevenuePerContract: totalContracts > 0 ? totalRevenue / totalContracts : 0
      },

      // Análise detalhada se solicitada
      ...(type === "comprehensive" && {
        detailedAnalysis: {
          revenueBreakdown: {
            contractPayments: Number(contractPayments._sum.amount || 0),
            invoices: Number(invoices._sum.amount || 0),
            contractPaymentsCount: contractPayments._count.id,
            invoicesCount: invoices._count.id
          },
          expenseAnalysis: {
            totalExpenses: Number(outFinances._sum.value || 0),
            expenseCount: outFinances._count.id,
            averageExpense: outFinances._count.id > 0 ? Number(outFinances._sum.value || 0) / outFinances._count.id : 0
          },
          operationalMetrics: {
            totalTransactions: contractPayments._count.id + invoices._count.id + outFinances._count.id,
            activeContracts: totalContracts,
            scheduledAppointments: totalSchedules
          }
        }
      })
    };

    return NextResponse.json({
      data: responseData,
      metadata: {
        total: contractPayments._count.id + invoices._count.id + outFinances._count.id + totalContracts + totalSchedules,
        period: period || `${months} meses`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: type,
        currency: "BRL",
        industry: "services",
        company_size: "medium",
        analysisType: type === "financial" ? "financial_comprehensive" : 
                     type === "sales" ? "sales_performance" : "business_comprehensive",
        dataPoints: {
          revenue: totalRevenue,
          expenses: totalExpenses,
          contracts: totalContracts,
          schedules: totalSchedules,
          invoices: invoices._count.id
        }
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
    console.error("Erro na API principal:", error);
    return NextResponse.json({
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Erro desconhecido",
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
