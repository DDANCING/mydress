"use server"

import { db } from "@/lib/db"
import { CalendarEvent, EventColor } from "@/components/event-calendar/types"
import { getTagColor } from "@/lib/schedule-tags"

export async function getSchedules(): Promise<CalendarEvent[]> {
  try {
    const schedules = await db.schedule.findMany({
      include: {
        seller: {
          include: {
            user: true,
          },
        },
        buyer: true,
        product: true,
        contract: true,
      },
      orderBy: {
        startDate: "asc",
      },
    })

    return schedules.map((schedule) => {
      let title = schedule.title || "" // Priorizar título do banco
      let description = schedule.description || "" // Priorizar descrição do banco
      let color: EventColor = "sky" // Valor padrão
      
      // Se há tags, usar a cor da primeira tag para o evento
      if (schedule.tags && schedule.tags.length > 0) {
        const firstTagColor = getTagColor(schedule.tags[0])
        // Mapear cores das tags para EventColor
        const colorMap: Record<string, EventColor> = {
          blue: "blue",
          emerald: "emerald", 
          green: "green",
          gray: "sky", // gray não existe no EventColor, usar sky
          purple: "purple",
          plum: "purple", // plum não existe, usar purple
          brown: "amber", // brown não existe, usar amber
          indigo: "indigo",
          gold: "yellow", // gold não existe, usar yellow
          orange: "orange",
          salmon: "rose", // salmon não existe, usar rose
          teal: "teal",
          pink: "pink",
          skyblue: "cyan", // skyblue não existe, usar cyan
          coral: "rose", // coral não existe, usar rose
          lightgreen: "green",
          lightblue: "cyan",
          darkorange: "orange",
          chocolate: "amber", // chocolate não existe, usar amber
          crimson: "red", // crimson não existe, usar red
          orchid: "purple", // orchid não existe, usar purple
          lavender: "purple", // lavender não existe, usar purple
          darkslategray: "sky", // darkslategray não existe, usar sky
          lightgray: "sky", // lightgray não existe, usar sky
          violet: "violet",
          goldenrod: "yellow", // goldenrod não existe, usar yellow
          silver: "sky", // silver não existe, usar sky
          red: "red"
        }
        color = colorMap[firstTagColor] || "sky"
      }
      
      // Se não há título no banco, gerar um baseado no tipo e dados relacionados
      if (!title) {
        if (schedule.type === "PRODUCT_BLOCK") {
          // Para bloqueios, verificar se é entrega ou devolução baseado no contrato
          if (schedule.contract) {
            const isDelivery = schedule.startDate.getTime() === new Date(schedule.contract.deliveryDate).getTime()
            const isReturn = schedule.contract.returnDate && 
              schedule.startDate.getTime() === new Date(schedule.contract.returnDate).getTime()
            
            if (isDelivery) {
              title = `Entrega - ${schedule.product?.name || 'Produto'}`
            } else if (isReturn) {
              title = `Devolução - ${schedule.product?.name || 'Produto'}`
            } else {
              title = `Bloqueio - ${schedule.product?.name || 'Produto'}`
            }
          } else {
            title = `Bloqueio - ${schedule.product?.name || 'Produto'}`
          }
        } else {
          // Para CLIENT_APPOINTMENT, verificar se é entrega ou devolução baseado no contrato
          if (schedule.contract) {
            const isDelivery = schedule.startDate.getTime() === new Date(schedule.contract.deliveryDate).getTime()
            const isReturn = schedule.contract.returnDate && 
              schedule.startDate.getTime() === new Date(schedule.contract.returnDate).getTime()
            
            if (isDelivery) {
              title = `Entrega - ${schedule.product?.name || 'Produto'}`
            } else if (isReturn) {
              title = `Devolução - ${schedule.product?.name || 'Produto'}`
            } else {
              title = `Agendamento - ${schedule.buyer?.fullName || 'Cliente'}`
            }
          } else {
            title = `Agendamento - ${schedule.buyer?.fullName || 'Cliente'}`
          }
        }
      }

      // Se não há descrição no banco, gerar uma baseada no tipo e dados relacionados
      if (!description) {
        if (schedule.type === "PRODUCT_BLOCK") {
          if (schedule.contract) {
            const isDelivery = schedule.startDate.getTime() === new Date(schedule.contract.deliveryDate).getTime()
            const isReturn = schedule.contract.returnDate && 
              schedule.startDate.getTime() === new Date(schedule.contract.returnDate).getTime()
            
            if (isDelivery) {
              description = `Entrega para ${schedule.buyer?.fullName || 'cliente'}`
            } else if (isReturn) {
              description = `Devolução de ${schedule.buyer?.fullName || 'cliente'}`
            } else {
              description = `Produto bloqueado para ${schedule.buyer?.fullName || 'cliente'}`
            }
          } else {
            description = `Produto bloqueado para ${schedule.buyer?.fullName || 'cliente'}`
          }
        } else {
          if (schedule.contract) {
            const isDelivery = schedule.startDate.getTime() === new Date(schedule.contract.deliveryDate).getTime()
            const isReturn = schedule.contract.returnDate && 
              schedule.startDate.getTime() === new Date(schedule.contract.returnDate).getTime()
            
            if (isDelivery) {
              description = `Entrega para ${schedule.buyer?.fullName || 'cliente'}`
            } else if (isReturn) {
              description = `Devolução de ${schedule.buyer?.fullName || 'cliente'}`
            } else {
              description = `Agendamento com ${schedule.buyer?.fullName || 'cliente'}`
            }
          } else {
            description = `Agendamento com ${schedule.buyer?.fullName || 'cliente'}`
          }
        }
      }

      return {
        id: schedule.id,
        title,
        description,
        start: schedule.startDate,
        end: schedule.endDate,
        allDay: false,
        color: color, // Usar a cor determinada pelas tags ou fallback
        vendedor: schedule.sellerId || "",
        productId: schedule.productId || undefined,
        contractId: schedule.contractId || undefined,
        orderId: schedule.orderId || undefined,
        tags: schedule.tags || [],
      }
    })
  } catch (error) {
    console.error("Erro ao buscar schedules:", error)
    return []
  }
}

export async function getSellers() {
  try {
    const sellers = await db.seller.findMany({
      include: {
        user: true,
      },
    })

    return sellers.map((seller) => ({
      id: seller.id,
      name: seller.user.name || "",
      email: seller.user.email || "",
    }))
  } catch (error) {
    console.error("Erro ao buscar vendedores:", error)
    return []
  }
}

export async function getProducts() {
  try {
    const products = await db.product.findMany({
      where: {
        isArchived: false,
      },
      include: {
        category: true,
        size: true,
        color: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price.toNumber(), // Converter Decimal para number
      category: product.category.name,
      size: product.size.name,
      color: product.color.name,
    }))
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
    return []
  }
}

export async function createSchedule(data: {
  title: string
  description?: string
  startDate: Date
  endDate: Date
  type: "PRODUCT_BLOCK" | "CLIENT_APPOINTMENT"
  sellerId?: string
  buyerId?: string
  contractId?: string
  productId?: string
  tags?: string[]
}): Promise<CalendarEvent> {
  try {
    const schedule = await db.schedule.create({
      data: {
        title: data.title, // Salvar o título fornecido
        description: data.description, // Salvar a descrição fornecida
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type,
        tags: data.tags || [],
        sellerId: data.sellerId,
        buyerId: data.buyerId,
        contractId: data.contractId,
        productId: data.productId,
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
      },
    })

    // Determinar cor baseada na primeira tag
    let color: EventColor = "sky"
    if (schedule.tags && schedule.tags.length > 0) {
      const firstTagColor = getTagColor(schedule.tags[0])
      const colorMap: Record<string, EventColor> = {
        blue: "blue", emerald: "emerald", green: "green", gray: "sky", purple: "purple",
        plum: "purple", brown: "amber", indigo: "indigo", gold: "yellow", orange: "orange",
        salmon: "rose", teal: "teal", pink: "pink", skyblue: "cyan", coral: "rose",
        lightgreen: "green", lightblue: "cyan", darkorange: "orange", chocolate: "amber",
        crimson: "red", orchid: "purple", lavender: "purple", darkslategray: "sky",
        lightgray: "sky", violet: "violet", goldenrod: "yellow", silver: "sky", red: "red"
      }
      color = colorMap[firstTagColor] || "sky"
    }

    return {
      id: schedule.id,
      title: schedule.title || data.title || "Novo Agendamento",
      description: schedule.description || data.description,
      start: schedule.startDate,
      end: schedule.endDate,
      allDay: false,
      color: color,
      vendedor: schedule.sellerId || "",
      productId: schedule.productId || undefined,
      contractId: schedule.contractId || undefined,
      orderId: schedule.orderId || undefined,
      tags: schedule.tags || [],
    }
  } catch (error) {
    console.error("Erro ao criar schedule:", error)
    throw new Error("Falha ao criar agendamento")
  }
}

export async function updateSchedule(
  id: string,
  data: {
    title?: string
    description?: string
    startDate: Date
    endDate: Date
    sellerId?: string
    tags?: string[]
  }
): Promise<CalendarEvent> {
  try {
    const schedule = await db.schedule.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        sellerId: data.sellerId,
        tags: data.tags,
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
      },
    })

    // Determinar cor baseada na primeira tag
    let color: EventColor = "sky"
    if (schedule.tags && schedule.tags.length > 0) {
      const firstTagColor = getTagColor(schedule.tags[0])
      const colorMap: Record<string, EventColor> = {
        blue: "blue", emerald: "emerald", green: "green", gray: "sky", purple: "purple",
        plum: "purple", brown: "amber", indigo: "indigo", gold: "yellow", orange: "orange",
        salmon: "rose", teal: "teal", pink: "pink", skyblue: "cyan", coral: "rose",
        lightgreen: "green", lightblue: "cyan", darkorange: "orange", chocolate: "amber",
        crimson: "red", orchid: "purple", lavender: "purple", darkslategray: "sky",
        lightgray: "sky", violet: "violet", goldenrod: "yellow", silver: "sky", red: "red"
      }
      color = colorMap[firstTagColor] || "sky"
    }

    return {
      id: schedule.id,
      title: schedule.title || data.title || (() => {
        if (schedule.type === "PRODUCT_BLOCK") {
          // Para bloqueios, verificar se é entrega ou devolução baseado no contrato
          if (schedule.contract) {
            const isDelivery = schedule.startDate.getTime() === new Date(schedule.contract.deliveryDate).getTime()
            const isReturn = schedule.contract.returnDate && 
              schedule.startDate.getTime() === new Date(schedule.contract.returnDate).getTime()
            
            if (isDelivery) {
              return `Entrega - ${schedule.product?.name || 'Produto'}`
            } else if (isReturn) {
              return `Devolução - ${schedule.product?.name || 'Produto'}`
            } else {
              return `Bloqueio - ${schedule.product?.name || 'Produto'}`
            }
          } else {
            return `Bloqueio - ${schedule.product?.name || 'Produto'}`
          }
        } else {
          // Para CLIENT_APPOINTMENT, verificar se é entrega ou devolução baseado no contrato
          if (schedule.contract) {
            const isDelivery = schedule.startDate.getTime() === new Date(schedule.contract.deliveryDate).getTime()
            const isReturn = schedule.contract.returnDate && 
              schedule.startDate.getTime() === new Date(schedule.contract.returnDate).getTime()
            
            if (isDelivery) {
              return `Entrega - ${schedule.product?.name || 'Produto'}`
            } else if (isReturn) {
              return `Devolução - ${schedule.product?.name || 'Produto'}`
            } else {
              return `Agendamento - ${schedule.buyer?.fullName || 'Cliente'}`
            }
          } else {
            return `Agendamento - ${schedule.buyer?.fullName || 'Cliente'}`
          }
        }
      })(),
      description: schedule.description || data.description || (() => {
        if (schedule.type === "PRODUCT_BLOCK") {
          // Para bloqueios, verificar se é entrega ou devolução baseado no contrato
          if (schedule.contract) {
            const isDelivery = schedule.startDate.getTime() === new Date(schedule.contract.deliveryDate).getTime()
            const isReturn = schedule.contract.returnDate && 
              schedule.startDate.getTime() === new Date(schedule.contract.returnDate).getTime()
            
            if (isDelivery) {
              return `Entrega para ${schedule.buyer?.fullName || 'cliente'}`
            } else if (isReturn) {
              return `Devolução de ${schedule.buyer?.fullName || 'cliente'}`
            } else {
              return `Produto bloqueado para ${schedule.buyer?.fullName || 'cliente'}`
            }
          } else {
            return `Produto bloqueado para ${schedule.buyer?.fullName || 'cliente'}`
          }
        } else {
          if (schedule.contract) {
            const isDelivery = schedule.startDate.getTime() === new Date(schedule.contract.deliveryDate).getTime()
            const isReturn = schedule.contract.returnDate && 
              schedule.startDate.getTime() === new Date(schedule.contract.returnDate).getTime()
            
            if (isDelivery) {
              return `Entrega para ${schedule.buyer?.fullName || 'cliente'}`
            } else if (isReturn) {
              return `Devolução de ${schedule.buyer?.fullName || 'cliente'}`
            } else {
              return `Agendamento com ${schedule.buyer?.fullName || 'cliente'}`
            }
          } else {
            return `Agendamento com ${schedule.buyer?.fullName || 'cliente'}`
          }
        }
      })(),
      start: schedule.startDate,
      end: schedule.endDate,
      allDay: false,
      color: color,
      vendedor: schedule.sellerId || "",
      productId: schedule.productId || undefined,
      contractId: schedule.contractId || undefined,
      orderId: schedule.orderId || undefined,
      tags: schedule.tags || [],
    }
  } catch (error) {
    console.error("Erro ao atualizar schedule:", error)
    throw new Error("Falha ao atualizar agendamento")
  }
}

export async function deleteSchedule(id: string): Promise<void> {
  try {
    await db.schedule.delete({
      where: { id },
    })
  } catch (error) {
    console.error("Erro ao deletar schedule:", error)
    throw new Error("Falha ao deletar agendamento")
  }
}
