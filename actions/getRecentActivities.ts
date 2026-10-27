"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getRecentActivities() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const activities: Array<{
      id: string;
      type: 'order' | 'payment' | 'schedule' | 'contract';
      title: string;
      description: string;
      timestamp: string;
      user?: {
        name: string;
        avatar?: string;
      };
    }> = [];

    // Buscar contratos recentes (últimos 7 dias)
    const recentContracts = await db.contract.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        contractItems: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        },
        seller: {
          select: {
            name: true
            }
        },
        buyer: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    recentContracts.forEach(contract => {
      activities.push({
        id: `contract-${contract.id}`,
        type: 'contract',
        title: 'Novo contrato criado por ' + contract.seller.name,
        description: `Contrato de ${contract.contractItems.map(item => item.product.name).join(", ")}`,
        timestamp: contract.createdAt.toISOString(),
        user: { name: contract.buyer.fullName }
      });
    });

    // Buscar pagamentos recentes
    const recentPayments = await db.contractPayment.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        contract: {
          include: {
            buyer: {
              select: {
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      },
      take: 5
    });

    recentPayments.forEach(payment => {
      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        title: 'Pagamento recebido',
        description: `R$ ${Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${payment.contract.buyer.fullName}`,
        timestamp: payment.paymentDate.toISOString(),
        user: { name: payment.contract.buyer.fullName }
      });
    });

    // Buscar pedidos recentes
    const recentOrders = await db.order.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        buyer: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 2
    });

    recentOrders.forEach(order => {
      activities.push({
        id: `order-${order.id}`,
        type: 'order',
        title: 'Novo pedido',
        description: `Pedido de ${order.buyer.fullName} - R$ ${Number(order.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        timestamp: order.createdAt.toISOString(),
        user: { name: order.buyer.fullName }
      });
    });

    // Ordenar todas as atividades por timestamp
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

  } catch (error) {
    console.error("Erro ao buscar atividades recentes:", error);
    return [];
  }
}
