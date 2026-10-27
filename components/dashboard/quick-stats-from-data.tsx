"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Package, Users } from "lucide-react";

interface QuickStatData {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  iconType: 'dollar' | 'package' | 'calendar' | 'users';
  progress?: number;
  target?: string;
}

interface QuickStatsFromDataProps {
  stats: QuickStatData[];
}

const getIcon = (iconType: string) => {
  switch (iconType) {
    case 'dollar':
      return <DollarSign className="h-4 w-4" />;
    case 'package':
      return <Package className="h-4 w-4" />;
    case 'calendar':
      return <Calendar className="h-4 w-4" />;
    case 'users':
      return <Users className="h-4 w-4" />;
    default:
      return <DollarSign className="h-4 w-4" />;
  }
};

export function QuickStatsFromData({ stats }: QuickStatsFromDataProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              {getIcon(stat.iconType)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {stat.change > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </span>
                <span>vs média 10 dias</span>
              </div>
              {stat.progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Meta: {stat.target}</span>
                    <span>{stat.progress}%</span>
                  </div>
                  <Progress value={stat.progress} className="h-1" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
