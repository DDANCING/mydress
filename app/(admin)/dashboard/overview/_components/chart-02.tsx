"use client";

import { useId } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Rectangle,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { CustomTooltipContent } from "./charts-extra";
import { Badge } from "@/components/ui/badge";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

interface BuyerChartData {
  month: string;
  actual: number;
  projected: number;
}

type Props = {
  data: BuyerChartData[];
  total: number;
  percentageChange: number; 
};

const chartConfig = {
  actual: {
    label: "Real",
    color: "var(--chart-1)",
  },
  projected: {
    label: "Projeção",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function CustomCursor({
  fill,
  pointerEvents,
  height,
  points,
  className,
}: {
  fill?: string;
  pointerEvents?: string;
  height?: number;
  points?: Array<{ x: number; y: number }>;
  className?: string;
}) {
  if (!points || points.length === 0) return null;

  const { x, y } = points[0]!;

  return (
    <>
      <Rectangle
        x={x - 12}
        y={y}
        fill={fill}
        pointerEvents={pointerEvents}
        width={24}
        height={height}
        className={className}
        type="linear"
      />
      <Rectangle
        x={x - 1}
        y={y}
        fill={fill}
        pointerEvents={pointerEvents}
        width={1}
        height={height}
        className="recharts-tooltip-inner-cursor"
        type="linear"
      />
    </>
  );
}

export function NewBuyersChart({ data, total, percentageChange }: Props) {
  const id = useId();

  return (
    <Card className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md gap-4">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>Novos Clientes</CardTitle>
            <div className="flex items-start gap-2">
              <div className="font-semibold text-2xl">{total.toLocaleString()}</div>
               {percentageChange > 0 ? (
                <Badge className="mt-1.5 bg-emerald-500/24 text-emerald-500 border-none"> 
                  +{percentageChange.toFixed(1)}%
                  <IconTrendingUp />
                </Badge>
              ) : percentageChange < 0 ? (
                <Badge className="mt-1.5 bg-rose-500/24 text-rose-500 border-none"> 
                  {percentageChange.toFixed(1)}%
                  <IconTrendingDown />
                </Badge>
              ) : (
                <Badge className="mt-1.5 bg-muted text-muted-foreground border-none"> 
                  0.0%
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="size-1.5 shrink-0 rounded-xs bg-chart-1" />
              <div className="text-[13px]/3 text-muted-foreground/50">Real</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-1.5 shrink-0 rounded-xs bg-chart-3" />
              <div className="text-[13px]/3 text-muted-foreground/50">Projeção</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-60 w-full [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-(--chart-1)/15 [&_.recharts-rectangle.recharts-tooltip-inner-cursor]:fill-white/20"
        >
          <LineChart
            data={data}
            margin={{ left: -12, right: 12, top: 12 }}
          >
            <defs>
              <linearGradient id={`${id}-gradient`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--chart-2)" />
                <stop offset="100%" stopColor="var(--chart-1)" />
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
              tickFormatter={(value) => value.slice(0, 3)}
              stroke="var(--border)"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value / 1}`}
              interval="preserveStartEnd"
            />
            <Line
              type="linear"
              dataKey="projected"
              stroke="var(--color-projected)"
              strokeWidth={2}
              dot={false}
              activeDot={false}
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
                  valueFormatter={(value) => `${value.toLocaleString()} clientes`}
                />
              }
              cursor={<CustomCursor fill="var(--chart-1)" />}
            />
            <Line
              type="linear"
              dataKey="actual"
              stroke={`url(#${id}-gradient)`}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: "var(--chart-1)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
