import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authorization = request.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const token = authorization.split(' ')[1];
    const expectedToken = process.env.SYNAPSE_SECRET;

    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 403 }
      );
    }

    // Buscar dados de vendas
    const contracts = await db.contract.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'DELIVERED', 'RETURNED']
        }
      },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        contractItems: {
          select: {
            id: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true
              },
              include: {
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcular métricas de vendas
    const totalSales = contracts.reduce((sum, contract) => sum + (contract.totalAmount ? contract.totalAmount.toNumber() : 0), 0);
    const totalContracts = contracts.length;
    const averageSaleValue = totalContracts > 0 ? totalSales / totalContracts : 0;

    // Vendas por status
    const salesByStatus = contracts.reduce((acc, contract) => {
      const status = contract.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Vendas por mês (últimos 12 meses)
    const salesByMonth = contracts.reduce((acc, contract) => {
      const month = contract.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          contracts: 0,
          value: 0
        };
      }
      acc[month].contracts += 1;
      acc[month].value += contract.totalAmount ? Number(contract.totalAmount) : 0;
      return acc;
    }, {} as Record<string, { contracts: number; value: number }>);

    // Top produtos vendidos
    const productSales = contracts.reduce((acc, contract) => {
      if (contract.contractItems) {
        const productId = contract.contractItems[0].product.id;
        if (!acc[productId]) {
          acc[productId] = {
            product: contract.contractItems[0].product,
            contracts: 0,
            totalValue: 0
          };
        }
        acc[productId].contracts += 1;
        acc[productId].totalValue += contract.totalAmount ? Number(contract.totalAmount) : 0;
      }
      return acc;
    }, {} as Record<string, any>);

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.totalValue - a.totalValue)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalContracts,
          averageSaleValue,
          salesByStatus
        },
        salesByMonth,
        topProducts,
        recentSales: contracts.slice(0, 50) // Últimas 50 vendas
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na API de vendas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}