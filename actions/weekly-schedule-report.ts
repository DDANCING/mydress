"use server"

import { weeklyReportRecipients } from '@/lib/site-config';
import { db } from "@/lib/db"
import { sendWeeklyScheduleReport } from "@/lib/mail"

interface WeeklyScheduleData {
  id: string
  startDate: Date
  endDate: Date
  type: string
  title?: string | null
  description?: string | null
  tags: string[]
  buyer?: {
    fullName: string
    email?: string | null
    phone?: string | null
  } | null
  seller?: {
    name: string
    user: {
      name?: string | null
      email?: string | null
    }
  } | null
  product?: {
    name: string
    sku?: string | null
  } | null
  contract?: {
    id: string
    type: string
    totalAmount: number
    notes?: string | null
    deliveryDate: Date
    eventDate?: Date | null
  } | null
  order?: {
    id: string
    totalAmount?: number | null
    status?: string | null
  } | null
}

export async function getWeeklySchedules(): Promise<WeeklyScheduleData[]> {
  try {
    // Calcular início e fim da semana atual (Segunda a Domingo)
    const now = new Date()
    const currentDay = now.getDay() // 0 = Domingo, 1 = Segunda, etc.
    const startOfWeek = new Date(now)
    
    // Ajustar para começar na segunda-feira
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1
    startOfWeek.setDate(now.getDate() - daysToSubtract)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)


    const schedules = await db.schedule.findMany({
      where: {
        OR: [
          {
            startDate: {
              gte: startOfWeek,
              lte: endOfWeek,
            },
          },
          {
            endDate: {
              gte: startOfWeek,
              lte: endOfWeek,
            },
          },
          {
            AND: [
              {
                startDate: {
                  lte: startOfWeek,
                },
              },
              {
                endDate: {
                  gte: endOfWeek,
                },
              },
            ],
          },
        ],
      },
      include: {
        seller: {
          include: {
            user: true,
          },
        },
        buyer: true,
        product: true,
        contract: true,
        order: true,
      },
      orderBy: {
        startDate: "asc",
      },
    })

    function traduzirContractType(type: string): string {
  switch (type) {
    case "SALE":
      return "Venda";
    case "RENTAL":
      return "Locação";
    case "ClothingSALE":
      return "Venda de Confecção";
    case "clothingRENTAL":
      return "Locação e Confecção";
    default:
      return type;
  }
}


    return schedules.map((schedule) => ({
      id: schedule.id,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      type: schedule.type,
      title: schedule.title,
      description: schedule.description,
      tags: schedule.tags,
      buyer: schedule.buyer ? {
        fullName: schedule.buyer.fullName,
        email: schedule.buyer.email,
        phone: schedule.buyer.phone,
      } : null,
      seller: schedule.seller ? {
        name: schedule.seller.name,
        user: {
          name: schedule.seller.user.name,
          email: schedule.seller.user.email,
        },
      } : null,
      product: schedule.product ? {
        name: schedule.product.name,
        sku: schedule.product.sku,
      } : null,
      contract: schedule.contract ? {
        id: schedule.contract.id,
        type: traduzirContractType(schedule.contract.type),
        totalAmount: Number(schedule.contract.totalAmount),
        notes: schedule.contract.notes,
        deliveryDate: schedule.contract.deliveryDate,
        eventDate: schedule.contract.eventDate,
      } : null,
      order: schedule.order ? {
        id: schedule.order.id,
        totalAmount: schedule.order.totalAmount ? Number(schedule.order.totalAmount) : null,
        status: schedule.order.status,
      } : null,
    }))
  } catch (error) {
    console.error('Erro ao buscar schedules da semana:', error)
    throw new Error('Erro ao buscar schedules da semana')
  }
}

export async function sendWeeklyReport() {
  try {
    const schedules = await getWeeklySchedules()
    
    const emails = weeklyReportRecipients()

    if (emails.length === 0) {
      return { success: false, message: 'Nenhum destinatário configurado em WEEKLY_REPORT_EMAILS' }
    }

    for (const email of emails) {
      await sendWeeklyScheduleReport(email, schedules)
    }

    return { success: true, message: 'Relatório enviado com sucesso' }
  } catch (error) {
    console.error('Erro ao enviar relatório semanal:', error)
    throw new Error('Erro ao enviar relatório semanal')
  }
}
