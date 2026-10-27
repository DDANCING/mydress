import { siteConfig } from "@/lib/site-config";
import { NextResponse } from "next/server";

export async function GET() {
  const apiDocumentation = {
    name: `${siteConfig.fullName} - Synapse API`,
    version: "1.0.0",
    description: "API completa para análise de dados via IA com Synapse Insight Engine",
    baseUrl: siteConfig.url,
    
    authentication: {
      type: "Bearer Token",
      header: "Authorization: Bearer {SYNAPSE_SECRET}",
      description: "Use o token SYNAPSE_SECRET configurado no ambiente"
    },

    endpoints: [
      {
        path: "/api/synapse/auth",
        method: "GET",
        description: "Verificar autenticação",
        parameters: [],
        response: {
          message: "Synapse API Auth Check",
          status: "success",
          timestamp: "2024-01-01T00:00:00.000Z"
        }
      },
      {
        path: "/api/synapse/financial",
        method: "GET",
        description: "Dados financeiros completos (receitas, despesas, contratos)",
        parameters: [
          {
            name: "period",
            type: "string",
            required: false,
            description: "Período específico (YYYY-MM ou YYYY)",
            example: "2024-01"
          },
          {
            name: "months",
            type: "string",
            required: false,
            description: "Últimos X meses (padrão: 12)",
            example: "6"
          }
        ],
        response: {
          data: [
            {
              id: "uuid",
              type: "revenue|expense",
              source: "contract_payment|nfe|out_finance",
              amount: 1500.00,
              date: "2024-01-15T10:30:00Z",
              description: "Pagamento - Cliente ABC",
              category: "service_payment",
              clientName: "Cliente ABC",
              method: "PIX"
            }
          ],
          summary: {
            totalRevenue: 50000.00,
            totalExpenses: 20000.00,
            netProfit: 30000.00,
            margin: 60.0,
            transactionCount: 156,
            contractsCount: 25
          },
          metadata: {
            type: "financial",
            currency: "BRL",
            analysisType: "financial_comprehensive"
          }
        }
      },
      {
        path: "/api/synapse/data",
        method: "GET",
        description: "Endpoint principal com dados agregados para análise completa",
        parameters: [
          {
            name: "type",
            type: "string",
            required: false,
            description: "Tipo de análise (financial|sales|comprehensive)",
            example: "comprehensive"
          },
          {
            name: "period",
            type: "string",
            required: false,
            description: "Período específico (YYYY-MM ou YYYY)",
            example: "2024"
          },
          {
            name: "months",
            type: "string",
            required: false,
            description: "Últimos X meses (padrão: 6)",
            example: "12"
          }
        ],
        response: {
          data: {
            summary: {
              totalRevenue: 150000.00,
              totalExpenses: 80000.00,
              netProfit: 70000.00,
              profitMargin: 46.67,
              totalContracts: 45,
              averageContractValue: 3333.33,
              totalSchedules: 128,
              revenueGrowth: 15.5,
              contractGrowth: 22.0
            },
            monthlyTrends: [
              {
                month: "2024-01",
                revenue: 25000.00,
                expenses: 12000.00,
                profit: 13000.00,
                contracts: 8,
                schedules: 15
              }
            ],
            businessMetrics: {
              cashFlow: 70000.00,
              burnRate: 13333.33,
              runwayMonths: 11.25,
              contractConversionRate: 35.15,
              averageRevenuePerContract: 3333.33
            }
          },
          metadata: {
            type: "comprehensive",
            industry: "services",
            analysisType: "business_comprehensive",
            dataPoints: {
              revenue: 150000.00,
              expenses: 80000.00,
              contracts: 45,
              schedules: 128,
              invoices: 67
            }
          }
        }
      }
    ],

    dataTypes: {
      financial: {
        description: "Dados financeiros detalhados",
        includes: ["receitas", "despesas", "contratos", "NFe", "fluxo de caixa"],
        useCases: ["Análise financeira", "Previsão de receita", "Controle de custos"]
      },
      sales: {
        description: "Dados de vendas e performance comercial",
        includes: ["contratos", "pedidos", "agendamentos", "conversões"],
        useCases: ["Performance de vendas", "Análise de conversão", "Gestão comercial"]
      },
      comprehensive: {
        description: "Visão completa do negócio",
        includes: ["todos os dados financeiros", "vendas", "operações", "KPIs"],
        useCases: ["Visão executiva", "Planejamento estratégico", "Análise completa"]
      }
    },

    businessContext: {
      industry: "Serviços de costura e alfaiataria",
      businessModel: "B2C - Contratos de serviço personalizados",
      keyMetrics: [
        "Receita por contrato",
        "Taxa de conversão agendamento → contrato",
        "Margem de lucro",
        "Fluxo de caixa operacional",
        "Valor médio por cliente"
      ],
      seasonality: "Maior demanda em períodos de festividades e eventos",
      geography: "Região Sudeste do Brasil"
    },

    examples: {
      authentication: {
        curl: `curl -H "Authorization: Bearer ${process.env.SYNAPSE_SECRET || 'YOUR_TOKEN'}" ${process.env.NEXT_PUBLIC_APP_URL}/api/synapse/auth`,
        javascript: `
fetch('${process.env.NEXT_PUBLIC_APP_URL}/api/synapse/data', {
  headers: {
    'Authorization': 'Bearer ${process.env.SYNAPSE_SECRET || 'YOUR_TOKEN'}',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));`
      },
      comprehensiveAnalysis: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/synapse/data?type=comprehensive&months=12`,
        description: "Análise completa dos últimos 12 meses para insights estratégicos"
      },
      financialFocus: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/synapse/financial?period=2024-01`,
        description: "Foco em dados financeiros de janeiro/2024"
      }
    },

    notes: [
      "Todos os valores monetários estão em BRL (Real brasileiro)",
      "Datas estão no formato ISO 8601 (UTC)",
      "A API suporta CORS para integração web",
      "Taxa limiting aplicada por IP",
      "Dados são atualizados em tempo real",
      "Histórico disponível desde o início das operações"
    ],

    support: {
      contact: "Desenvolvedor do sistema",
      documentation: `${process.env.NEXT_PUBLIC_APP_URL}/api/synapse/docs`,
      status: "✅ Operacional",
      lastUpdate: new Date().toISOString()
    }
  };

  return NextResponse.json(apiDocumentation, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    }
  });
}
