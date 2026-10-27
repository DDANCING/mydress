"use client"

import { useState, useEffect } from "react"

import {
  EventCalendar,
  type CalendarEvent,
} from '@/components/event-calendar'
import { getSchedules, getSellers, getProducts, createSchedule, updateSchedule, deleteSchedule } from '@/actions/schedule'
import { toast } from "sonner"

interface Seller {
  id: string
  name: string
  email: string
}

interface Product {
  id: string
  name: string
  sku?: string | null
  price: number 
  category: string
  size: string
  color: string
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [schedulesData, sellersData, productsData] = await Promise.all([
          getSchedules(),
          getSellers(),
          getProducts()
        ])
        setEvents(schedulesData)
        setSellers(sellersData)
        setProducts(productsData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast.error("Erro ao carregar dados do calendário")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleEventAdd = async (event: CalendarEvent) => {
    try {
      console.log("Criando evento:", event) // Debug log
      const newSchedule = await createSchedule({
        title: event.title || "Novo Agendamento",
        description: event.description,
        startDate: new Date(event.start),
        endDate: new Date(event.end),
        type: "CLIENT_APPOINTMENT",
        sellerId: event.vendedor || undefined,
        productId: event.productId || undefined,
        tags: event.tags || [],
      })

      setEvents([...events, newSchedule])
      toast.success("Agendamento criado com sucesso")
    } catch (error) {
      console.error("Erro ao criar agendamento:", error)
      toast.error("Erro ao criar agendamento")
    }
  }

  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    try {
      console.log("Atualizando evento:", updatedEvent) // Debug log
      const updated = await updateSchedule(updatedEvent.id, {
        title: updatedEvent.title,
        description: updatedEvent.description,
        startDate: new Date(updatedEvent.start),
        endDate: new Date(updatedEvent.end),
        sellerId: updatedEvent.vendedor || undefined,
        tags: updatedEvent.tags || [],
      })
      console.log("Evento atualizado:", updated) // Debug log
      setEvents(
        events.map((event) =>
          event.id === updatedEvent.id ? updated : event
        )
      )
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error)
    }
  }
  const handleEventDelete = async (eventId: string) => {
    try {
      await deleteSchedule(eventId)
      setEvents(events.filter((event) => event.id !== eventId))
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error)
      toast.error("Erro ao excluir agendamento")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando calendário...</p>
        </div>
      </div>
    )
  }

  return (
    <EventCalendar
      events={events}
      onEventAdd={handleEventAdd}
      onEventUpdate={handleEventUpdate}
      onEventDelete={handleEventDelete}
      sellers={sellers}
      products={products}
    />
  )
}
