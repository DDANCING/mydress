"use client";

import { useId } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { CustomTooltipContent } from "./charts-extra";
import { Badge } from "@/components/ui/badge";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

type SalesDataItem = {
  month: string;
  actual: number;
  projected: number;
};

type Props = {
  title: string;
  data: SalesDataItem[];
  totalLabel: string;
  percentageChange: string;
};

const chartConfig = {
  actual: {
    label: "Real",
    color: "var(--chart-1)",
  },
  projected: {
    label: "Projeção",
    color: "var(--muted)",
  },
} satisfies ChartConfig;

export function SalesBarChart({
  title,
  data,
  totalLabel,
  percentageChange,
}: Props) {
  const id = useId();
  const firstMonth = data[0]?.month as string;
  const lastMonth = data[data.length - 1]?.month as string;

  return (
    <Card className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md gap-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle>{title}</CardTitle>
            <div className="flex items-start gap-2">
              <div className="font-semibold text-2xl">{totalLabel}</div>
              {parseFloat(percentageChange) > 0 ? (
                <Badge className="mt-1.5 bg-emerald-500/24 text-emerald-500 border-none"> 
                  +{parseFloat(percentageChange).toFixed(1)}%
                  <IconTrendingUp />
                </Badge>
              ) : parseFloat(percentageChange) < 0 ? (
                <Badge className="mt-1.5 bg-rose-500/24 text-rose-500 border-none"> 
                  {parseFloat(percentageChange).toFixed(1)}%
                  <IconTrendingDown />
                </Badge>
              ) : (
                <Badge className="mt-1.5 bg-muted text-muted-foreground border-none"> 
                  0.0%
                </Badge>
              )}

            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-60 w-full [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-[var(--chart-1)]/15"
        >
          <BarChart
            data={data}
            maxBarSize={20}
            margin={{ left: -12, right: 12, top: 12 }}
          >
            <defs>
              <linearGradient id={`${id}-gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" />
                <stop offset="100%" stopColor="var(--chart-2)" />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="2 2"
              stroke="var(--border)"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={12}
              ticks={[firstMonth, lastMonth]}
              stroke="var(--border)"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                `R$ ${new Intl.NumberFormat("pt-BR", {
                  notation: "compact",
                  compactDisplay: "short",
                }).format(value)}`
              }
            />
            <ChartTooltip
              content={
                <CustomTooltipContent
                  colorMap={{
                    actual: "var(--chart-1)",
                    projected: "var(--chart-3)",
                  }}
                  labelMap={{
                    actual: "Real",
                    projected: "Projeção",
                  }}
                  dataKeys={["actual", "projected"]}
                  valueFormatter={(value) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                />
              }
            />
            <Bar dataKey="actual" fill={`url(#${id}-gradient)`} stackId="a" />
            <Bar
              dataKey="projected"
              fill="var(--color-projected)"
              stackId="a"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}