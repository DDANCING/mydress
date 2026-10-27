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
  ChartTooltipContent,
} from "@/components/ui/chart"

interface SellerPerformanceData {
  name: string;
  contracts: number;
  revenue: number;
}

interface Props {
  data: SellerPerformanceData[];
}

const chartConfig = {
  revenue: {
    label: "Receita",
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)",
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)",
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)",
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export function SellerPerformanceChart({ data }: Props) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalContracts = data.reduce((sum, item) => sum + item.contracts, 0);
  const topSeller = data[0];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Transform data to match chart format with dynamic colors
  const chartData = data.map((item, index) => {
    const colorKeys = ['chrome', 'safari', 'firefox', 'edge', 'other'];
    const colorKey = colorKeys[index % colorKeys.length];
    return {
      browser: item.name,
      visitors: item.revenue,
      revenueFormatted: formatCurrency(item.revenue),
      fill: `var(--color-${colorKey})`
    };
  });

  return (
    <Card className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md gap-4">
      <CardHeader>
        <CardTitle>Performance de Vendedores</CardTitle>
        <CardDescription>Receita por vendedor</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ right: 80 }}
            
          >
            <YAxis
              dataKey="browser"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <XAxis dataKey="visitors" type="number" hide />
            <ChartTooltip
              cursor={false}
              formatter={(value: number) => [formatCurrency(value), "Receita"]}
            />
            <Bar dataKey="visitors" radius={5}>
              <LabelList
                dataKey="browser"
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
          Total: {formatCurrency(totalRevenue)} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          {topSeller && `${topSeller.name} lidera com ${topSeller.contracts} contratos`}
        </div>
      </CardFooter>
    </Card>
  );
}
