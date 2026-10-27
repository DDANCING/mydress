import { formatter } from "@/lib/utils";
import { SafeOrder } from "@/app/types";
import Image from "next/image";
import { TestimonialStars } from "./TestimonialStars";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface OrderCardProps {
  order: SafeOrder;
  userName: string;
  userId: string;
}

function formatDate(date: Date | string | undefined) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: Date | string | undefined) {
  if (!date) return "";
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status: string | null) {
  if (!status) return "text-gray-500";
  
  const statusColors: { [key: string]: string } = {
    "PENDING": "text-yellow-600",
    "CONFIRMED": "text-blue-600", 
    "DELIVERED": "text-green-600",
    "RETURNED": "text-purple-600",
    "CANCELED": "text-red-600",
    "PROCESSING": "text-orange-600",
    "SHIPPED": "text-indigo-600",
    "OUT_FOR_DELIVERY": "text-cyan-600",
    "AWAITING_PAYMENT": "text-amber-600",
    "PAID": "text-emerald-600",
    "REFUNDED": "text-rose-600"
  };
  
  return statusColors[status.toUpperCase()] || "text-gray-500";
}

function translateStatus(status: string | null) {
  if (!status) return "Pendente";
  
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
  
  return statusTranslations[status.toUpperCase()] || status;
}

export function OrderCard({ order, userName, userId }: OrderCardProps) {
  const orderNumber = order.id;
  const totalProducts = order.orderItems.length;
  const buyerName = userName;
  const createdAt = order.createdAt;
  const deliveryStatus = translateStatus(order.status);
  const deliveryDate = order.eventDate || order.createdAt; // Usa eventDate se disponível, senão createdAt
  const total = typeof order.totalAmount === "number"
    ? order.totalAmount
    : 0;

  return (
    <div className="bg-background border rounded-xl p-6 shadow-sm font-extralight">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 mb-3">
        <div className="flex flex-col gap-0.5">
          <span className=" text-lg">
            Pedido #: {orderNumber}
          </span>
          <span className=" text-muted-foreground text-sm">
            {totalProducts} Produtos | Por {buyerName} | {formatDateTime(createdAt)}
          </span>
          
        </div>
      </div>
      {order.status === "PENDING" && (
            <Link
              href={`/cart/checkout/${order.id}`}         
            >
              <Button variant={"ghost"} className="font-extralight text-md">
                Finalizar pagamento
              </Button>
            </Link>
          )}
      </div>
      <hr className="mb-3" />

      {/* Detalhes da entrega */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex flex-col gap-1 text-sm">
          <div>
            <span className=" text-muted-foreground">Status: </span>
            <span className={`${getStatusColor(order.status)} font-medium`}>
              {deliveryStatus}
            </span>
          </div>
          <div>
            <span className=" text-muted-foreground">
              {order.eventDate ? "Data do evento: " : "Data de entrega: "}
            </span>
            <span>{formatDate(deliveryDate)}</span>
          </div>
          <div>
            <span className=" text-muted-foreground">Rastreio: </span>
            {order.trackingCode ? (
              order.trackingUrl ? (
                <a 
                  href={order.trackingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  {order.trackingCode}
                </a>
              ) : (
                <span className="font-medium">{order.trackingCode}</span>
              )
            ) : (
              <span className=" text-muted-foreground">Não disponível</span>
            )}
          </div>
        </div>
        <div className="text-base font-semibold">
          <span className=" text-muted-foreground">Total:</span>{" "}
          <span className="text-foreground">{formatter.format(total)}</span>
        </div>
      </div>

      {/* Lista de produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        {order.orderItems.map((item) => {
          const product = item.product;
          return (
            <div key={item.product.id} className="flex gap-3 bg-background rounded-lg p-2 items-center border">
              <div className="w-14 h-14 relative flex-shrink-0 rounded-lg overflow-hidden border bg-white">
                {product?.images?.[0]?.url ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm truncate">{product?.name || "Nome do produto"}</div>
              <div className="text-xs font-medium text-muted-foreground">
                  Quantidade: {item.quantity}x = {product ? formatter.format(Number(product.price)) : "-"}
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Cor: {product?.color?.name || "-"}
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Tamanho: {product?.size?.name || "-"}
                </div>
                {order.status === "DELIVERED" && (
                  <div className="mt-2">
                    <TestimonialStars userId={userId} productId={product.id} canTestimonial={true} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}