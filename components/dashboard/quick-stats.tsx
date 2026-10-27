"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Package, Users } from "lucide-react";

interface QuickStat {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  progress?: number;
  target?: string;
}

interface QuickStatsProps {
  stats: QuickStat[];
}

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stat.changeType === 'increase' ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(stat.change)}%
              </span>
              <span className="ml-1">em relação ao mês anterior</span>
            </div>
            {stat.progress !== undefined && stat.target && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Meta: {stat.target}</span>
                  <span>{stat.progress}%</span>
                </div>
                <Progress value={stat.progress} className="h-1" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const defaultStats: QuickStat[] = [
  {
    title: "Receita Total",
    value: "R$ 45.231,89",
    change: 12.5,
    changeType: 'increase',
    icon: <DollarSign className="h-4 w-4" />,
    progress: 78,
    target: "R$ 58.000"
  },
  {
    title: "Pedidos Ativos",
    value: "23",
    change: 8.2,
    changeType: 'increase',
    icon: <Package className="h-4 w-4" />
  },
  {
    title: "Agendamentos Hoje",
    value: "7",
    change: -2.1,
    changeType: 'decrease',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    title: "Clientes Ativos",
    value: "89",
    change: 15.3,
    changeType: 'increase',
    icon: <Users className="h-4 w-4" />,
    progress: 62,
    target: "144"
  }
];