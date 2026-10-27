"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getUpcomingSchedules() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    // Busca agendamentos dos próximos 7 dias
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const schedules = await db.schedule.findMany({
      where: {
        OR: [
          {
            product: {
              store: {
                userId: session.user.id
              }
            }
          },
          {
            seller: {
              userId: session.user.id
            }
          }
        ],
        startDate: {
          lte: sevenDaysFromNow,
          gte: new Date()
        }
      },
      include: {
        product: {
          select: {
            name: true
          }
        },
        buyer: {
          select: {
            fullName: true
          }
        },
        seller: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 5
    });

    return schedules.map(schedule => ({
      id: schedule.id,
      title: schedule.title || 'Agendamento sem título',
      description: schedule.description || '',
      startDate: schedule.startDate.toISOString(),
      endDate: schedule.endDate.toISOString(),
      type: schedule.type,
      tags: schedule.tags || [],
      buyer: schedule.buyer ? { name: schedule.buyer.fullName } : undefined,
      seller: schedule.seller ? { name: schedule.seller.name } : undefined,
      product: schedule.product ? { name: schedule.product.name } : undefined
    }));
  } catch (error) {
    console.error("Erro ao buscar agendamentos próximos:", error);
    return [];
  }
}
