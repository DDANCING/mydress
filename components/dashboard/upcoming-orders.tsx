import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Package, ArrowRight } from "lucide-react";
import { formatDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface Order {
  id: string;
  totalAmount: number;
  deliveryDate: string;
  status: string;
  buyer: {
    name: string;
  };
  items: {
    product: {
      name: string;
    };
    quantity: number;
  }[];
}

interface Contract {
  id: string;
  totalAmount: number;
  deliveryDate: string;
  status: string;
  buyer: {
    name: string;
  };
  items: {
    product: {
      name: string;
    };
    quantity: number;
  }[];
}

interface UpcomingOrdersProps {
  orders: Order[];
  contracts: Contract[];
}

export function UpcomingOrders({ orders, contracts }: UpcomingOrdersProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'CONFIRMED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'DELIVERED':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'CONFIRMED':
        return 'Confirmado';
      case 'IN_PROGRESS':
        return 'Em Andamento';
      case 'DELIVERED':
        return 'Entregue';
      default:
        return status;
    }
  };

  return (
    <Card className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md @container/card h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Próximos Pedidos e Contratos
        </CardTitle>
        <Link href="/dashboard/orders">
          <Button variant="ghost" size="sm" className="text-xs">
            Ver todos
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.length === 0 && contracts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum pedido ou contrato próximo</p>
          </div>
        ) : (
          <>
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">
                      {order.buyer.name}
                    </p>
                    <Badge
                      variant={getStatusColor(order.status) as any}
                      className="text-xs"
                    >
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(new Date(order.deliveryDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.items.length} item(s) • R$ {order.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
            {contracts.slice(0, 5).map((contract) => (
              <div
                key={contract.id}
                className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">
                      {contract.buyer.name}
                    </p>
                    <Badge
                      variant={getStatusColor(contract.status) as any}
                      className="text-xs"
                    >
                      {getStatusText(contract.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(new Date(contract.deliveryDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {contract.items.length} item(s) • R$ {contract.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}