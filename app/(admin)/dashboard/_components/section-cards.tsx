import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type DashboardCardProps = {
  titulo: string
  valor: string
  percentual: string
  tendencia: "up" | "down"
  destaque: string
  subtitulo: string
}

type SectionCardsProps = {
  cards: DashboardCardProps[]
}

export function SectionCards({ cards }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-5">
      {cards.map((card, i) => {
        const isUp = card.tendencia === "up"
        const Icon = isUp ? IconTrendingUp : IconTrendingDown
        const badgeColor = isUp
          ? "bg-emerald-500/20 text-emerald-500"
          : "bg-rose-500/20 text-rose-500"

        return (
          <Card
            key={i}
            className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md @container/card"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardDescription>{card.titulo}</CardDescription>
                  <CardTitle className="font-semibold text-2xl @[250px]/card:text-3xl">
                    {card.valor}
                  </CardTitle>
                </div>
                <CardAction>
                  <Badge
                    className={`${badgeColor} border-none mt-1.5 flex gap-1 items-center`}
                  >
                    <Icon className="size-4" />
                    {card.percentual}
                  </Badge>
                </CardAction>
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.destaque}
                <Icon className="size-4" />
              </div>
              <div className="text-muted-foreground">{card.subtitulo}</div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
