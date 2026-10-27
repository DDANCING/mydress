import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";

const chartData = [
  { month: "Jan", receita: 12000, pedidos: 45, contratos: 23 },
  { month: "Fev", receita: 15000, pedidos: 52, contratos: 28 },
  { month: "Mar", receita: 18000, pedidos: 61, contratos: 35 },
  { month: "Abr", receita: 22000, pedidos: 68, contratos: 42 },
  { month: "Mai", receita: 25000, pedidos: 75, contratos: 48 },
  { month: "Jun", receita: 28000, pedidos: 82, contratos: 55 },
  { month: "Jul", receita: 32000, pedidos: 89, contratos: 62 },
  { month: "Ago", receita: 35000, pedidos: 96, contratos: 68 },
  { month: "Set", receita: 38000, pedidos: 103, contratos: 75 },
  { month: "Out", receita: 42000, pedidos: 110, contratos: 82 },
  { month: "Nov", receita: 45000, pedidos: 118, contratos: 89 },
  { month: "Dez", receita: 48000, pedidos: 125, contratos: 95 },
];

const chartConfig = {
  receita: {
    label: "Receita",
    color: "hsl(var(--dashboard-primary))",
  },
  pedidos: {
    label: "Pedidos",
    color: "hsl(var(--dashboard-success))",
  },
  contratos: {
    label: "Contratos",
    color: "hsl(var(--dashboard-warning))",
  },
};

export function ChartAreaInteractive() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Anual</CardTitle>
        <CardDescription>
          Visualização da receita, pedidos e contratos ao longo do ano
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--dashboard-primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--dashboard-primary))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--dashboard-success))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--dashboard-success))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorContratos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--dashboard-warning))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--dashboard-warning))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                className="text-xs fill-muted-foreground"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-xs fill-muted-foreground"
              />
              <ChartTooltip content={(props) => <ChartTooltipContent {...props} />} />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="hsl(var(--dashboard-primary))"
                fillOpacity={1}
                fill="url(#colorReceita)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="pedidos"
                stroke="hsl(var(--dashboard-success))"
                fillOpacity={1}
                fill="url(#colorPedidos)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="contratos"
                stroke="hsl(var(--dashboard-warning))"
                fillOpacity={1}
                fill="url(#colorContratos)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}