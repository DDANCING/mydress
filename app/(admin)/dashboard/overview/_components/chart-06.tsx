"use client"

import { Bar, BarChart, XAxis } from "recharts"

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
  ChartTooltip,
} from "@/components/ui/chart"

interface MonthlyPaymentsData {
  month: string;
  contractRevenue: number;
  orderRevenue: number;
  projectedContractRevenue: number;
  projectedOrderRevenue: number;
}

interface Props {
  data: MonthlyPaymentsData[];
}

const chartConfig = {
  contractRevenue: {
    label: "Receita de Contratos",
    color: "var(--chart-1)",
  },
  orderRevenue: {
    label: "Receita de Pedidos",
    color: "var(--chart-2)",
  },
  projectedContractRevenue: {
    label: "Projeção Contratos",
    color: "var(--chart-3)",
  },
  projectedOrderRevenue: {
    label: "Projeção Pedidos",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export function MonthlyPaymentsChart({ data }: Props) {

  // Transform data to match chart format
  const chartData = data.map((item) => ({
    date: item.month,
    contractRevenue: item.contractRevenue,
    orderRevenue: item.orderRevenue,
    projectedContractRevenue: item.projectedContractRevenue,
    projectedOrderRevenue: item.projectedOrderRevenue,
  }));

  return (
    <Card className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md gap-4">
      <CardHeader>
        <CardTitle>Receita Mensal</CardTitle>
        <CardDescription>
          Receita em reais de contratos e pedidos online com projeção
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 12)}
            />
            <Bar
              dataKey="contractRevenue"
              stackId="a"
              fill="var(--color-contractRevenue)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="orderRevenue"
              stackId="a"
              fill="var(--color-orderRevenue)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="projectedContractRevenue"
              stackId="b"
              fill="var(--color-projectedContractRevenue)"
              opacity={0.6}
              radius={[0, 0, 2, 2]}
            />
            <Bar
              dataKey="projectedOrderRevenue"
              stackId="b"
              fill="var(--color-projectedOrderRevenue)"
              opacity={0.6}
              radius={[2, 2, 0, 0]}
            />
            <ChartTooltip
              cursor={false}
              formatter={(value: number, name: string) => {
                const formattedValue = `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                if (name === "contractRevenue") return [formattedValue, "Receita de Contratos"];
                if (name === "orderRevenue") return [formattedValue, "Receita de Pedidos"];
                if (name === "projectedContractRevenue") return [formattedValue, "Projeção Contratos"];
                if (name === "projectedOrderRevenue") return [formattedValue, "Projeção Pedidos"];
                return [formattedValue, name];
              }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
