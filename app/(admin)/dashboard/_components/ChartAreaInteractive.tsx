"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getVisitorsData } from "@/actions/register-visitor"

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState<"7d" | "30d" | "90d">("90d")
  const [data, setData] = React.useState<
    { date: string; desktop: number; mobile: number }[]
  >([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const visitors = await getVisitorsData(timeRange)
        setData(visitors)
      } catch (error) {
        console.error("Erro ao carregar dados de visitantes:", error)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  return (
    <Card className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md @container/card">
   
      <CardHeader className="pb-4">
        <div className="flex justify-between">
            <div>
        <CardTitle>Visitantes do site</CardTitle>
        <CardDescription>
          Acompanhe o tráfego por plataforma
        </CardDescription>
      </div>
          <Select value={timeRange} onValueChange={(val) => setTimeRange(val as any)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          </div>
        </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6"> {/* Adicione essa classe */}
  {isLoading ? (
    <div className="text-center py-10 text-muted-foreground">Carregando...</div>
  ) : (
    <ChartContainer className="h-[150px] w-full" config={chartConfig}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            {Object.entries(chartConfig).map(([key, config]) => (
              <linearGradient id={key} key={key} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip content={(props) => <ChartTooltipContent {...props} />} />
          {Object.entries(chartConfig).map(([key, config]) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={config.color}
              fill={`url(#${key})`}
              strokeWidth={2}
            />
          ))}
          <Legend
            content={(props) => (
              <ChartLegendContent
                payload={[...(props.payload ?? [])]}
                verticalAlign="bottom"
              />
            )}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )}
</CardContent>
    </Card>
  )
}
