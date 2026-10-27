"use client"

import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"

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

interface PaymentMethodData {
  name: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface Props {
  data: PaymentMethodData[];
}

const chartConfig = {
  revenue: {
    label: "Receita",
  },
  pix: {
    label: "PIX",
    color: "var(--chart-1)",
  },
  credit: {
    label: "Cartão de Crédito",
    color: "var(--chart-2)",
  },
  debit: {
    label: "Cartão de Débito",
    color: "var(--chart-3)",
  },
  boleto: {
    label: "Boleto",
    color: "var(--chart-4)",
  },
  check: {
    label: "Cheque",
    color: "var(--chart-4)",
  },
   money: {
    label: "Dinheiro",
    color: "var(--chart-4)",
  },
  other: {
    label: "Outros",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export function PaymentMethodsChart({ data }: Props) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Function to get the correct label from chartConfig
  const getPaymentMethodLabel = (methodName: string) => {
    const normalizedName = methodName.toLowerCase();
    if (normalizedName.includes('pix')) return chartConfig.pix.label;
    if (normalizedName.includes('crédito') || normalizedName.includes('credit')) return chartConfig.credit.label;
    if (normalizedName.includes('débito') || normalizedName.includes('debit')) return chartConfig.debit.label;
    if (normalizedName.includes('boleto')) return chartConfig.boleto.label;
    if (normalizedName.includes('cheque')) return chartConfig.check.label;
    if (normalizedName.includes('dinheiro') || normalizedName.includes('money')) return chartConfig.money.label;
    return chartConfig.other.label;
  };

  // Function to get the correct color key based on payment method name
  const getPaymentMethodColorKey = (methodName: string) => {
    const normalizedName = methodName.toLowerCase();
    if (normalizedName.includes('pix')) return 'pix';
    if (normalizedName.includes('crédito') || normalizedName.includes('credit')) return 'credit';
    if (normalizedName.includes('débito') || normalizedName.includes('debit')) return 'debit';
    if (normalizedName.includes('boleto')) return 'boleto';
    if (normalizedName.includes('cheque')) return 'check';
    if (normalizedName.includes('dinheiro') || normalizedName.includes('money')) return 'money';
    return 'other';
  };

  // Transform data to match chart format with dynamic colors
  const chartData = data.map((item) => {
    const colorKey = getPaymentMethodColorKey(item.name);
    return {
      browser: item.name,
      visitors: item.revenue,
      fill: `var(--color-${colorKey})`
    };
  });

  return (
    <Card className="flex flex-col bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md gap-4">
      <CardHeader className="items-center pb-0">
        <CardTitle>Mix de Métodos de Pagamento</CardTitle>
        <CardDescription>Receita por método de pagamento</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              formatter={(value: number, name: string, props: any) => [
                formatCurrency(value), 
                getPaymentMethodLabel(props.payload.browser)
              ]}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <Sector {...props} outerRadius={outerRadius + 10} />
              )}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Total: {formatCurrency(totalRevenue)} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          {totalCount} contratos processados no período
        </div>
      </CardFooter>
    </Card>
  );
}
