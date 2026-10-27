"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, LabelList } from "recharts"

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

interface ProductRevenue {
  name: string;
  revenue: number;
  color?: string;
}

interface Props {
  data: ProductRevenue[];
}

const chartConfig = {
  revenue: {
    label: "Receita",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ProductRevenueChart({ data }: Props) {
  // Filtrar produtos com receita positiva
  const validData = data.filter(item => item.revenue > 0);
  const totalRevenue = validData.reduce((sum, item) => sum + item.revenue, 0);
  const topProduct = validData[0];

  const topProductPercentage = topProduct && totalRevenue > 0
    ? ((topProduct.revenue / totalRevenue) * 100).toFixed(1)
    : "0.0";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Transform data to match chart format - usar apenas dados válidos
  const chartData = validData.slice(0, 16).map(item => ({
    month: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
    desktop: item.revenue,
    revenueFormatted: formatCurrency(item.revenue),
    productName: item.name
  }));

  // Se não há dados válidos, mostrar mensagem
  if (validData.length === 0) {
    return (
      <Card className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md gap-4">
        <CardHeader>
          <CardTitle>Receita por Produto</CardTitle>
          <CardDescription>Produtos com maior receita</CardDescription>
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
        <CardTitle>Receita por Produto</CardTitle>
        <CardDescription>Produtos com maior receita</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 20,
              right: 80,
            }}
          >
            <XAxis type="number" dataKey="desktop" hide />
            <YAxis
              dataKey="month"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <ChartTooltip
              cursor={false}
              formatter={(value: number, name: string, props: any) => [
                formatCurrency(value), 
                props.payload?.productName || "Produto"
              ]}
            />
            <Bar dataKey="desktop" fill="var(--color-revenue)" radius={5}>
              <LabelList
                dataKey="month"
                position="insideLeft"
                offset={8}
                className="fill-background hidden sm:block"
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
          Total: {formatCurrency(totalRevenue)} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          {topProduct && `${topProduct.name} lidera com ${topProductPercentage}% do total`}
        </div>
      </CardFooter>
    </Card>
  );
}