import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import OrderSuccess from "./_components/order-success";

interface OrderPageProps {
  params: Promise<{ orderId: string }>;
}

const OrderPage = async ({ params }: OrderPageProps) => {
  const { orderId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Buscar o pedido com todos os dados
  const order = await db.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      buyer: true,
      orderItems: {
        include: {
          product: {
            include: {
              images: true,
              color: true,
              size: true,
            },
          },
        },
      },
      coupon: true,
    },
  });

  if (!order) {
    notFound();
  }

  // Verificar se o usuário tem permissão para ver este pedido
  if (order.buyer.email !== session.user.email) {
    notFound();
  }

  if (!order.isPaid) {
    return redirect(`/cart/checkout/${orderId}`);
  }
  
  // Verificar se o pedido já foi pago 
  if (order.isPaid) {

  // Converter Decimal para number para compatibilidade com o componente
  const orderFormatted = {
    ...order,
    status: order.status || "PROCESSANDO", // Garantir que sempre tenha um status
    totalAmount: order.totalAmount ? Number(order.totalAmount) : null,
    shippingCost: order.shippingCost ? Number(order.shippingCost) : null,
    orderItems: order.orderItems.map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      product: {
        ...item.product,
        price: Number(item.product.price),
      }
    })),
    coupon: order.coupon ? {
      id: order.coupon.id,
      code: order.coupon.code,
      discountType: order.coupon.discountType as "fixed" | "percentage",
      discountValue: Number(order.coupon.discountValue),
    } : null,
    buyer: {
      ...order.buyer,
      email: order.buyer.email ?? "", 
    },
  };

  return <OrderSuccess order={orderFormatted} />;
};}

export default OrderPage;
