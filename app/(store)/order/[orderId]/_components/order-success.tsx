"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Calendar, Clock, Package, CreditCard, Truck, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatter } from "@/lib/utils";

interface OrderSuccessProps {
  order: {
    id: string;
    totalAmount: number | null;
    shippingCost: number | null;
    shippingMethod: string | null;
    shippingTime: number | null;
    eventDate: Date | null;
    paymentMethod: string | null;
    installments: number | null;
    status: string;
    isPaid: boolean;
    createdAt: Date;
    // Desconto calculado no servidor (mesma regra usada na cobrança)
    discount: number;
    buyer: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      cep: string | null;
    };
    orderItems: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      type: string;
      product: {
        id: string;
        name: string;
        price: number;
        images: Array<{ url: string }>;
        color: { name: string; value: string };
        size: { name: string; value: string };
      };
    }>;
    coupon: {
      id: string;
      code: string;
      discountType: "percentage" | "fixed";
      discountValue: number;
    } | null;
  };
}

const OrderSuccess: React.FC<OrderSuccessProps> = ({ order }) => {
  // Debug: Log para verificar os dados do pedido
  
  // Usar os valores reais do pedido ao invés de recalcular
  const baseTotal = order.orderItems.reduce(
    (acc, item) => acc + Number(item.subtotal), // Usar subtotal já calculado
    0
  );

  // Usar o totalAmount real do pedido se disponível
  const orderTotal = order.totalAmount ? Number(order.totalAmount) : 0;

   // Função para formatar o status
  const getStatusLabel = (status: string) => {
    const statusTranslations: { [key: string]: string } = {
      "PENDING": "Pendente",
      "CONFIRMED": "Confirmado",
      "DELIVERED": "Entregue",
      "RETURNED": "Devolvido",
      "CANCELED": "Cancelado",
      "PROCESSING": "Processando",
      "SHIPPED": "Enviado",
      "OUT_FOR_DELIVERY": "Saiu para entrega",
      "AWAITING_PAYMENT": "Aguardando pagamento",
      "PAID": "Pago",
      "REFUNDED": "Reembolsado"
    };
    
    return statusTranslations[status?.toUpperCase()] || "Processando";
  };

   const getStatusVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
      case "AWAITING_PAYMENT":
        return "default";
      case "PROCESSING":
      case "CONFIRMED":
        return "secondary";
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return "secondary";
      case "DELIVERED":
      case "PAID":
        return "outline";
      case "CANCELED":
      case "REFUNDED":
        return "destructive";
      case "RETURNED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const discount = order.discount;

  // Calcular com base nos valores reais do pedido
  const subtotalBeforeDiscount = baseTotal;
  const subtotalAfterDiscount = baseTotal - discount;
  const shippingCost = order.shippingCost ? Number(order.shippingCost) : 0;
  
  // Usar o total real do pedido se disponível, senão calcular
  const finalTotal = orderTotal > 0 ? orderTotal : (subtotalAfterDiscount + shippingCost);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-background px-4 py-6 sm:p-6 dark:from-emerald-950/20">
      <div className="max-w-4xl mx-auto">
        {/* Header de Sucesso */}
        <div className="text-center mb-8 mt-20">
          {order.isPaid ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Pagamento confirmado!
              </h1>
              <p className="text-base sm:text-lg text-foreground mb-2">
                Olá <span className="font-semibold">{order.buyer.fullName}</span>, seu pedido foi processado com sucesso.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-4">
                <Clock className="w-10 h-10 text-amber-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Aguardando pagamento
              </h1>
              <p className="text-base sm:text-lg text-foreground mb-2">
                Olá <span className="font-semibold">{order.buyer.fullName}</span>, seu pedido está reservado. Assim que o
                boleto ou Pix for compensado, o pedido é confirmado.
              </p>
            </>
          )}
          <p className="text-sm text-muted-foreground">
            Pedido #{order.id.split('-')[0].toUpperCase()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações do Pedido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Produtos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Produtos do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.orderItems.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={item.product.images[0]?.url || "/placeholder-product.jpg"}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium text-foreground">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.product.color.name} • {item.product.size.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={item.type === "SALE" ? "default" : "secondary"}>
                            {item.type === "SALE" ? "Venda" : "Aluguel"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Qtd: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatter.format(item.unitPrice)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-muted-foreground">
                            Total: {formatter.format(item.subtotal)}
                          </p>
                        )}
                      </div>
                    </div>
                    {index < order.orderItems.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Informações de Entrega */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Informações de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                    <p className="text-muted-foreground">
                      {order.buyer.address || "Não informado"}
                    </p>
                    <p className="text-muted-foreground">
                      {order.buyer.city}, {order.buyer.state}
                    </p>
                    <p className="text-muted-foreground">CEP: {order.buyer.cep}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Método de Envio</p>
                    <p className="text-muted-foreground">
                      {order.shippingMethod || "Retirada"}
                    </p>
                    {order.shippingTime && (
                      <p className="text-sm text-foreground">
                        Prazo: {order.shippingTime} dias úteis
                      </p>
                    )}
                  </div>
                </div>
                {order.eventDate && (
                  <div>
                    <p className="text-sm font-medium text-foreground">Data do Evento</p>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(order.eventDate), "PPP", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pagamento */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Resumo do Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatter.format(baseTotal)}</span>
                </div>
                
                {order.coupon && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Desconto ({order.coupon.code}):</span>
                    <span>-{formatter.format(discount)}</span>
                  </div>
                )}
                
                {shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Frete:</span>
                    <span>{formatter.format(shippingCost)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatter.format(finalTotal)}</span>
                </div>
                
               
                <div className="flex justify-between text-sm">
                    <span>Status do Pedido:</span>
                    <Badge variant={getStatusVariant(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                
              </CardContent>
            </Card>

            {/* Próximos Passos */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Acompanhe o pedido</p>
                    <p className="text-sm text-muted-foreground">
                      O status fica sempre atualizado em Meus Pedidos
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Preparação do Pedido</p>
                    <p className="text-sm text-muted-foreground">
                      Entraremos em contato para coordenar a entrega
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-foreground rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Entrega</p>
                    <p className="text-sm text-muted-foreground">
                      {order.eventDate 
                        ? `Até ${format(new Date(order.eventDate), "dd/MM/yyyy")}`
                        : "Conforme prazo informado"
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button asChild>
            <Link href="/profile/orders">
              Ver Meus Pedidos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/">
              Continuar Comprando
            </Link>
          </Button>
        </div>
        
        <div className="text-center mt-6 text-sm text-foreground">
          <p>Dúvidas? Entre em contato conosco pelo WhatsApp ou email.</p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
