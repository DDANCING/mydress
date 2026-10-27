"use client"

import { TrendingUp, Plus } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend, Tooltip } from "recharts"
import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface AdsSalesData {
  date: string;
  dateObj: Date;
  salesAmount: number;
  adSpending: number;
}

interface Props {
  data: AdsSalesData[];
}

const chartConfig = {
  salesAmount: {
    label: "Vendas do Dia",
    color: "var(--chart-1)",
  },
  adSpending: {
    label: "Gasto em Ads",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function MonthlyContractsChart({ data }: Props) {
  const totalSales = data.reduce((sum, item) => sum + item.salesAmount, 0);
  const totalAdSpending = data.reduce((sum, item) => sum + item.adSpending, 0);
  const averageROI = totalAdSpending > 0 ? ((totalSales - totalAdSpending) / totalAdSpending * 100) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Transform data to match chart format
  const chartData = data.map(item => ({
    date: item.date,
    salesAmount: Math.round(item.salesAmount),
    adSpending: Math.round(item.adSpending * 100) / 100
  }));

  return (
    <Card className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md gap-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex-1">
          <CardTitle>Vendas vs Investimento em Ads (30 dias)</CardTitle>
          <CardDescription>Comparação entre vendas diárias e gastos em publicidade</CardDescription>
        </div>
        <Link href="/dashboard/ads">
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Ad
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis />
            <ChartTooltip 
              cursor={false} 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <p className="text-sm font-medium">{payload[0].payload.date}</p>
                      {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                          {entry.name}: {entry.name === 'Vendas do Dia' ? formatCurrency(entry.value as number) : formatCurrency(entry.value as number)}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              dataKey="salesAmount"
              name="Vendas do Dia"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="adSpending"
              name="Gasto em Ads"
              type="monotone"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Total Vendas: {formatCurrency(totalSales)} <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Total Gasto em Ads: {formatCurrency(totalAdSpending)}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              ROI Médio: {averageROI.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
