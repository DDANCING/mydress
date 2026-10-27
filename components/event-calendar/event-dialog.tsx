"use client"

import { useEffect, useMemo, useState } from "react"
import { RiCalendarLine, RiDeleteBinLine, RiFileTextLine } from "@remixicon/react"
import { format, isBefore } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Check, ChevronsUpDown } from "lucide-react"

import type {
  CalendarEvent,
  EventColor,
} from '@/components/event-calendar'
import {
  DefaultEndHour,
  DefaultStartHour,
  EndHour,
  StartHour,
} from '@/components/event-calendar/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TagSelector } from '@/components/ui/tag-selector'
import { getTagColor } from '@/lib/schedule-tags'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"

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

interface EventDialogProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onSave: (event: CalendarEvent) => void
  onDelete: (eventId: string) => void
  sellers?: Seller[]
  products?: Product[]
}

export function EventDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  sellers,
  products,
}: EventDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`)
  const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`)
  const [allDay, setAllDay] = useState(false)
  const [vendedor, setVendedor] = useState<string | undefined>(undefined)
  const [productId, setProductId] = useState<string | undefined>(undefined)
  const [productOpen, setProductOpen] = useState(false)
  const [color, setColor] = useState<EventColor>("sky")
  const [tags, setTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)


  // Atualizar cor baseada na primeira tag selecionada
  useEffect(() => {
    if (tags.length > 0) {
      const firstTagColor = getTagColor(tags[0])
      const colorMap: Record<string, EventColor> = {
        blue: "blue", emerald: "emerald", green: "green", gray: "sky", purple: "purple",
        plum: "purple", brown: "amber", indigo: "indigo", gold: "yellow", orange: "orange",
        salmon: "rose", teal: "teal", pink: "pink", skyblue: "teal", coral: "rose",
        lightgreen: "green", lightblue: "teal", darkorange: "orange", chocolate: "amber",
        crimson: "red", orchid: "purple", lavender: "purple", darkslategray: "sky",
        lightgray: "sky", violet: "violet", goldenrod: "yellow", silver: "sky", red: "red"
      }
      const mappedColor = colorMap[firstTagColor] || "sky"
      // Verificar se a cor existe no EventColor
      const validColors: EventColor[] = ["sky", "amber", "violet", "rose", "emerald", "orange", "blue", "indigo", "purple", "pink", "red", "yellow", "green", "teal"]
      if (validColors.includes(mappedColor as EventColor)) {
        setColor(mappedColor as EventColor)
      } else {
        setColor("sky")
      }
    } else {
      setColor("sky")
    }
  }, [tags])

  useEffect(() => {
    if (event) {
      setTitle(event.title || "")
      setDescription(event.description || "")

      const start = new Date(event.start)
      const end = new Date(event.end)

      setStartDate(start)
      setEndDate(end)
      setStartTime(formatTimeForInput(start))
      setEndTime(formatTimeForInput(end))
      setAllDay(event.allDay || false)
      setVendedor(event.vendedor || undefined)
      setProductId(event.productId || undefined)
      setColor((event.color as EventColor) || "sky")
      setTags(event.tags || [])
      setError(null) // Reset error when opening dialog
    } else {
      resetForm()
    }
  }, [event])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setStartDate(new Date())
    setEndDate(new Date())
    setStartTime(`${DefaultStartHour}:00`)
    setEndTime(`${DefaultEndHour}:00`)
    setAllDay(false)
    setVendedor(undefined)
    setProductId(undefined)
    setColor("sky")
    setTags([])
    setError(null)
  }

  const formatTimeForInput = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = Math.floor(date.getMinutes() / 15) * 15
    return `${hours}:${minutes.toString().padStart(2, "0")}`
  }

  // Memoize time options so they're only calculated once
  const timeOptions = useMemo(() => {
    const options = []
    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0")
        const formattedMinute = minute.toString().padStart(2, "0")
        const value = `${formattedHour}:${formattedMinute}`
        // Use a fixed date to avoid unnecessary date object creations
        const date = new Date(2000, 0, 1, hour, minute)
        const label = format(date, "h:mm a", { locale: ptBR })
        options.push({ value, label })
      }
    }
    return options
  }, []) // Empty dependency array ensures this only runs once

  const handleSave = () => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (!allDay) {
      const [startHours = 0, startMinutes = 0] = startTime
        .split(":")
        .map(Number)
      const [endHours = 0, endMinutes = 0] = endTime.split(":").map(Number)

      if (
        startHours < StartHour ||
        startHours > EndHour ||
        endHours < StartHour ||
        endHours > EndHour
      ) {
        setError(
          `O horário selecionado deve estar entre ${StartHour}:00 e ${EndHour}:00`
        )
        return
      }

      start.setHours(startHours, startMinutes, 0)
      end.setHours(endHours, endMinutes, 0)
    } else {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    }

    // Validate that end date is not before start date
    if (isBefore(end, start)) {
      setError("A data de término não pode ser anterior à data de início")
      return
    }

    // Use generic title if empty
    const eventTitle = title.trim() ? title : "(sem título)"

    onSave({
      id: event?.id || "",
      title: eventTitle,
      description,
      start,
      end,
      allDay,
      vendedor,
      productId,
      contractId: event?.contractId,
      orderId: event?.orderId,
      tags,
    })
  }

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id)
    }
  }

  return (
   <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent
    className={cn(
      "w-full max-w-full sm:max-w-[800px] md:max-w-[900px]",
      " overflow-y-auto px-2 sm:px-6 md:px-8",
      "rounded-lg"
    )}
  >
    <DialogHeader>
      <DialogTitle className="text-lg sm:text-xl">
        {event?.id ? "Editar Evento" : "Criar Evento"}
      </DialogTitle>
      <DialogDescription className="sr-only">
        {event?.id
          ? "Edite os detalhes deste evento"
          : "Adicione um novo evento ao seu calendário"}
      </DialogDescription>
    </DialogHeader>

    {error && (
      <div className="bg-destructive/15 text-destructive rounded-md px-3 py-2 text-sm">
        {error}
      </div>
    )}
         <div className="grid gap-4 py-4">
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 *:not-first:mt-1.5">
              <Label htmlFor="start-date">Data de Início</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant={"outline"}
                    className={cn(
                      "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "truncate",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </span>
                    <RiCalendarLine
                      size={16}
                      className="text-muted-foreground/80 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    defaultMonth={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date)
                        // If end date is before the new start date, update it to match the start date
                        if (isBefore(endDate, date)) {
                          setEndDate(date)
                        }
                        setError(null)
                        setStartDateOpen(false)
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="min-w-28 *:not-first:mt-1.5">
                <Label htmlFor="start-time">Horário de Início</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="start-time">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1 *:not-first:mt-1.5">
              <Label htmlFor="end-date">Data de Término</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant={"outline"}
                    className={cn(
                      "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "truncate",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </span>
                    <RiCalendarLine
                      size={16}
                      className="text-muted-foreground/80 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    defaultMonth={endDate}
                    disabled={{ before: startDate }}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date)
                        setError(null)
                        setEndDateOpen(false)
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="min-w-28 *:not-first:mt-1.5">
                <Label htmlFor="end-time">Horário de Término</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger id="end-time">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="all-day"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="all-day">Dia todo</Label>
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="vendedor">Vendedor (Opcional)</Label>
            <Select value={vendedor} onValueChange={setVendedor}>
              <SelectTrigger id="vendedor">
                <SelectValue placeholder="Selecione um vendedor" />
              </SelectTrigger>
              <SelectContent>
                {sellers?.map((seller: Seller) => (
                  <SelectItem key={seller.id} value={seller.id}>
                    {seller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="product">Produto (Opcional)</Label>
            <Popover open={productOpen} onOpenChange={setProductOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={productOpen}
                  className={cn(
                    "w-full justify-between truncate max-w-[300px] sm:max-w-[400px] md:max-w-[1000px] mr-6",
                    !productId && "text-muted-foreground"
                  )}
                >
                  {productId
                    ? products?.find((product) => product.id === productId)?.name
                    : "Selecione um produto"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar produto..." />
                  <CommandList>
                    <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                    <CommandGroup>
                      {products?.map((product: Product) => (
                        <CommandItem
                          key={product.id}
                          value={`${product.name} ${product.sku || ''} ${product.category} ${product.size} ${product.color}`}
                          onSelect={() => {
                            setProductId(product.id)
                            setProductOpen(false)
                          }}
                        >
                          <div className="flex flex-col max-w-full">
                            <span className="font-medium truncate max-w-[300px] sm:max-w-[400px] md:max-w-[500px]">
                              {product.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {product.sku && `SKU: ${product.sku} • `}
                              {product.category} • {product.size} • {product.color}
                            </span>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              productId === product.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
            <fieldset className="space-y-4">
        <TagSelector selectedTags={tags} onTagsChange={setTags} maxTags={3} />
      </fieldset>
    </div>

    {/* Rodapé */}
    <DialogFooter className="flex-row sm:justify-between md:gap-3 sm:gap-0">
      <div className="flex gap-1 md:gap-2">
        {event?.id && (
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            aria-label="Excluir evento"
          >
            <RiDeleteBinLine size={16} aria-hidden="true" />
          </Button>
        )}
        {event?.contractId && (
          <Link href={`/dashboard/contracts/${event.contractId}`}>
            <Button aria-label="Ver contrato">
              <RiFileTextLine size={16} className="mr-2" aria-hidden="true" />
              Ver Contrato
            </Button>
          </Link>
        )}
        {event?.orderId && (
          <Link href={`/dashboard/orders/${event.orderId}`}>
            <Button aria-label="Ver pedido">
              <RiFileTextLine size={16} className="mr-2" aria-hidden="true" />
              Ver Pedido
            </Button>
          </Link>
        )}
      </div>
      <div className="flex flex-1 justify-end gap-1 md:gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>Salvar</Button>
      </div>
    </DialogFooter>
  </DialogContent>
</Dialog>
  )
}
