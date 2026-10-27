"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"

interface CategoryRevenueData {
  name: string
  revenue: number
  contracts: number
  averageTicket: number
}

interface Props {
  data: CategoryRevenueData[]
}

const chartConfig = {
  revenue: {
    label: "Receita",
    color: "var(--chart-2)",
  },
  contracts: {
    label: "Contratos",
    color: "var(--chart-3)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

export function CategoryRevenueChart({ data }: Props) {
  // Filtrar categorias com receita positiva
  const validData = data.filter(item => item.revenue > 0)
  const totalRevenue = validData.reduce((sum, item) => sum + item.revenue, 0)
  const totalContracts = validData.reduce((sum, item) => sum + item.contracts, 0)
  const overallAverageTicket = totalContracts > 0 ? totalRevenue / totalContracts : 0

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)

  // Transform data para o chart - usar apenas dados válidos
  const chartData = validData.map((item) => ({
    month: item.name,
    revenue: item.revenue,
    revenueFormatted: formatCurrency(item.revenue),
    contracts: item.contracts,
  }))

  // Se não há dados válidos, mostrar mensagem
  if (validData.length === 0) {
    return (
      <Card className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md gap-4">
        <CardHeader>
          <CardTitle>Receita por Categoria</CardTitle>
          <CardDescription>Receita e contratos por categoria</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Nenhum dado de receita disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md gap-4">
      <CardHeader>
        <CardTitle>Receita por Categoria</CardTitle>
        <CardDescription>Receita e contratos por categoria</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ right: 80 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="month"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <XAxis dataKey="revenue" type="number" hide />

            <ChartTooltip
              cursor={false}
              formatter={(value: number, name: string) => {
                if (name === "revenue") {
                  return [formatCurrency(value), chartConfig.revenue.label]
                }
                if (name === "contracts") {
                  return [value, chartConfig.contracts.label]
                }
                return [value, name]
              }}
            />

            <Bar dataKey="revenue" fill={chartConfig.revenue.color} radius={4}>
              <LabelList
                dataKey="month"
                position="insideLeft"
                offset={8}
                className="fill-background"
                fontSize={12}
              />
              <LabelList
                dataKey="revenueFormatted"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Total: {formatCurrency(totalRevenue)}{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Ticket médio geral: {formatCurrency(overallAverageTicket)} em{" "}
          {totalContracts} contratos
        </div>
      </CardFooter>
    </Card>
  )
}