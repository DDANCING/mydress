"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getUpcomingOrders() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { orders: [], contracts: [] };
    }

    // Busca pedidos dos próximos 7 dias com eventDate
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const orders = await db.order.findMany({
      where: {
        orderItems: {
          some: {
            product: {
              store: {
                userId: session.user.id
              }
            }
          }
        },
        eventDate: {
          lte: sevenDaysFromNow,
          gte: new Date()
        }
      },
      include: {
        buyer: {
          select: {
            fullName: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        eventDate: 'asc'
      },
      take: 5
    });

    const contracts = await db.contract.findMany({
      where: {
        contractItems: {
          some: {
            product: {
              store: {
                userId: session.user.id
              }
            }
          }
        },
        deliveryDate: {
          lte: sevenDaysFromNow,
          gte: new Date()
        }
      },
      include: {
        buyer: {
          select: {
            fullName: true
          }
        },
        contractItems: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        eventDate: 'asc'
      },
      take: 5
    });

    return {
      orders: orders.map(order => ({
        id: order.id,
        totalAmount: Number(order.totalAmount || 0),
        deliveryDate: order.eventDate?.toISOString() || new Date().toISOString(),
        status: order.status || 'PENDING',
        buyer: { name: order.buyer.fullName },
        items: order.orderItems.map(item => ({
          product: { name: item.product.name },
          quantity: item.quantity
        }))
      })),
      contracts: contracts.map(contract => ({
        id: contract.id,
        totalAmount: Number(contract.totalAmount || 0),
        deliveryDate: contract.eventDate?.toISOString() || new Date().toISOString(),
        status: contract.status || 'PENDING',
        buyer: { name: contract.buyer.fullName },
        items: contract.contractItems.map(item => ({
          product: { name: item.product.name },
          quantity: item.quantity
        }))
      }))
    };
  } catch (error) {
    console.error("Erro ao buscar pedidos e contratos próximos:", error);
    return { orders: [], contracts: [] };
  } 
}