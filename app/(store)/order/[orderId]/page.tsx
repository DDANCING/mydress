import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { getCouponDiscount, syncCheckoutSession } from "@/lib/store-orders";
import OrderSuccess from "./_components/order-success";

interface OrderPageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

const findOrder = (orderId: string, email: string) =>
  db.order.findFirst({
    where: { id: orderId, buyer: { email } },
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

const OrderPage = async ({ params, searchParams }: OrderPageProps) => {
  const { orderId } = await params;
  const { session_id: sessionId } = await searchParams;
  const session = await auth();

  if (!session?.user?.email) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/order/${orderId}`)}`);
  }

  let order = await findOrder(orderId, session.user.email);
  if (!order) notFound();

  // A cliente pode voltar do Stripe antes do webhook chegar: confere a sessão direto no Stripe
  if (!order.isPaid && sessionId) {
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      if (checkoutSession.metadata?.orderId === order.id) {
        await syncCheckoutSession(checkoutSession);
        order = (await findOrder(orderId, session.user.email))!;
      }
    } catch (error) {
      console.error("[ORDER_PAGE] Não foi possível conferir a sessão do Stripe:", error);
    }
  }

  const awaitingPayment = !order.isPaid && order.status === "AWAITING_PAYMENT";
  if (!order.isPaid && !awaitingPayment) {
    redirect(`/cart/checkout/${orderId}`);
  }

  const subtotal = order.orderItems.reduce((acc, item) => acc + Number(item.subtotal), 0);

  const orderFormatted = {
    ...order,
    status: order.status || "PROCESSING",
    totalAmount: order.totalAmount ? Number(order.totalAmount) : null,
    shippingCost: order.shippingCost ? Number(order.shippingCost) : null,
    discount: getCouponDiscount(order.coupon, subtotal),
    orderItems: order.orderItems.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      product: {
        ...item.product,
        price: Number(item.product.price),
      },
    })),
    coupon: order.coupon
      ? {
          id: order.coupon.id,
          code: order.coupon.code,
          discountType: order.coupon.discountType as "fixed" | "percentage",
          discountValue: Number(order.coupon.discountValue),
        }
      : null,
    buyer: {
      ...order.buyer,
      email: order.buyer.email ?? "",
    },
  };

  return <OrderSuccess order={orderFormatted} />;
};

export default OrderPage;
