export type CalendarView = "month" | "week" | "day" | "agenda"

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  allDay?: boolean
  color?: EventColor
  vendedor?: string
  productId?: string
  contractId?: string
  orderId?: string
  tags?: string[]
}

export type EventColor =
  | "sky"
  | "amber"
  | "violet"
  | "rose"
  | "emerald"
  | "orange"
  | "blue"
  | "indigo"
  | "purple"
  | "pink"
  | "red"
  | "yellow"
  | "green"
  | "teal"
  | "cyan"
