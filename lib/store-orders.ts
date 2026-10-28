import { Coupon, Prisma, Product } from "@prisma/client";
import Stripe from "stripe";
import { subDays, subMinutes } from "date-fns";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { Booking, ContractKind, toContractKind } from "@/lib/booking-rules";

// Regras de pedido da loja. Tudo que vale dinheiro é calculado aqui, no servidor.

// Tempo de vida da sessão de pagamento do Stripe (usado também para reservar o vestido enquanto a cliente paga)
export const CHECKOUT_SESSION_MINUTES = 31;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

type PricedProduct = Pick<Product, "price" | "rentalValue" | "isOnlyRental">;

// Aluguel usa o valor de locação; sem ele, metade do preço de venda (mesma regra da vitrine)
export function getUnitPrice(product: PricedProduct, kind: ContractKind) {
  const price = Number(product.price);
  if (kind === "RENTAL") {
    const rental = product.rentalValue !== null ? Number(product.rentalValue) : NaN;
    return roundMoney(rental > 0 ? rental : price / 2);
  }
  return roundMoney(price);
}

export function getCouponError(coupon: Coupon) {
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return "Cupom atingiu o limite de uso";
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return "Cupom expirado";
  return null;
}

// O desconto vale só sobre os produtos (não sobre o frete) e nunca passa do subtotal
export function getCouponDiscount(coupon: Pick<Coupon, "discountType" | "discountValue"> | null, subtotal: number) {
  if (!coupon) return 0;
  const value = Number(coupon.discountValue);
  const discount = coupon.discountType === "percentage" ? subtotal * (value / 100) : value;
  return roundMoney(Math.min(Math.max(discount, 0), subtotal));
}

const BLOCKING_CONTRACT_STATUSES = ["PENDING", "CONFIRMED", "DELIVERED"] as const;
const RELEASED_ORDER_STATUSES = ["CANCELED", "REFUNDED", "RETURNED", "EXPIRED", "PAYMENT_FAILED"];

// Reservas que ocupam cada vestido: contratos do painel, pedidos pagos do site,
// boletos aguardando pagamento e checkouts em andamento.
// excludeBuyerId ignora checkouts abandonados da própria cliente, para ela poder refazer o pedido.
export async function getProductBookings(
  productIds: string[],
  options: { excludeOrderId?: string; excludeBuyerId?: string } = {}
) {
  const bookings = new Map<string, Booking[]>(productIds.map((id) => [id, []]));
  if (productIds.length === 0) return bookings;

  const add = (productId: string, eventDate: Date | null, type: string | null) => {
    if (!eventDate) return;
    bookings.get(productId)?.push({ eventDate, contractType: toContractKind(type) });
  };

  const [contractItems, orderItems] = await Promise.all([
    db.contractItem.findMany({
      where: {
        productId: { in: productIds },
        contract: { status: { in: [...BLOCKING_CONTRACT_STATUSES] } },
      },
      select: { productId: true, contract: { select: { type: true, eventDate: true, deliveryDate: true } } },
    }),
    db.orderItem.findMany({
      where: {
        productId: { in: productIds },
        ...(options.excludeOrderId && { orderId: { not: options.excludeOrderId } }),
        order: {
          eventDate: { not: null },
          OR: [
            { isPaid: true, status: { notIn: RELEASED_ORDER_STATUSES } },
            { isPaid: false, status: "AWAITING_PAYMENT", updatedAt: { gte: subDays(new Date(), 5) } },
            {
              isPaid: false,
              status: "PENDING",
              updatedAt: { gte: subMinutes(new Date(), CHECKOUT_SESSION_MINUTES) },
              ...(options.excludeBuyerId && { buyerId: { not: options.excludeBuyerId } }),
            },
          ],
        },
      },
      select: { productId: true, type: true, order: { select: { eventDate: true } } },
    }),
  ]);

  for (const item of contractItems) {
    add(item.productId, item.contract.eventDate ?? item.contract.deliveryDate, item.contract.type);
  }
  for (const item of orderItems) {
    add(item.productId, item.order.eventDate, item.type);
  }

  return bookings;
}

type OrderWithItems = Prisma.OrderGetPayload<{ include: { orderItems: true; buyer: true } }>;

async function createOrderSchedules(tx: Prisma.TransactionClient, order: OrderWithItems) {
  if (!order.eventDate) return;
  const shippingTime = order.shippingTime ?? 3;
  const eventDate = new Date(order.eventDate);
  const buyerName = order.buyer?.fullName || "cliente";

  for (const item of order.orderItems) {
    const shippingDate = new Date(eventDate);
    shippingDate.setDate(eventDate.getDate() - shippingTime);

    await tx.schedule.create({
      data: {
        orderId: order.id,
        productId: item.productId,
        type: "CLIENT_APPOINTMENT",
        startDate: shippingDate,
        endDate: new Date(shippingDate.getTime() + 60 * 60 * 1000),
        title: `Envio do Produto: ${item.productId}`,
        description: `Envio do produto ${item.productId} do pedido ${order.id} para ${buyerName}`,
        tags: ["enviar! 📦", "site 🛜"],
        buyerId: order.buyerId,
      },
    });

    if (toContractKind(item.type) === "RENTAL") {
      const returnDate = new Date(eventDate);
      returnDate.setDate(eventDate.getDate() + shippingTime);
      await tx.schedule.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          type: "CLIENT_APPOINTMENT",
          startDate: returnDate,
          endDate: new Date(returnDate.getTime() + 60 * 60 * 1000),
          title: `Devolução do Produto: ${item.productId}`,
          description: `Devolução do produto ${item.productId} do pedido ${order.id} de ${buyerName}`,
          tags: ["devolução! 📦", "site 🛜"],
          buyerId: order.buyerId,
        },
      });
    }
  }
}

// Marca o pedido como pago e executa os efeitos (cupom, agenda, arquivar vendidos) uma única vez.
// Pode ser chamado pelo webhook e pela página de retorno ao mesmo tempo sem duplicar nada.
export async function fulfillPaidOrder(
  orderId: string,
  payment: { paymentMethod: string; installments?: number | null }
) {
  return db.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, isPaid: false },
      data: {
        isPaid: true,
        status: "CONFIRMED",
        paymentMethod: payment.paymentMethod,
        ...(payment.installments && { installments: payment.installments }),
      },
    });
    if (count === 0) return false;

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { orderItems: true, buyer: true },
    });

    if (order.couponId) {
      await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
    }

    const soldIds = order.orderItems.filter((item) => toContractKind(item.type) === "SALE").map((item) => item.productId);
    if (soldIds.length > 0) {
      await tx.product.updateMany({ where: { id: { in: soldIds } }, data: { isArchived: true } });
    }

    await createOrderSchedules(tx, order);
    return true;
  });
}

export async function markOrderStatus(orderId: string, status: string) {
  await db.order.updateMany({ where: { id: orderId, isPaid: false }, data: { status } });
}

// Aplica o estado de uma sessão do Stripe ao pedido. Usado pelo webhook e pela página de retorno.
export async function syncCheckoutSession(checkoutSession: Stripe.Checkout.Session) {
  const orderId = checkoutSession.metadata?.orderId ?? checkoutSession.client_reference_id;
  if (!orderId) return;

  if (checkoutSession.payment_status === "paid") {
    await fulfillPaidOrder(orderId, await getPaymentDetails(checkoutSession));
  } else if (checkoutSession.status === "complete") {
    // Boleto e Pix: a cliente concluiu o checkout, mas o pagamento confirma depois
    await markOrderStatus(orderId, "AWAITING_PAYMENT");
  }
}

async function getPaymentDetails(checkoutSession: Stripe.Checkout.Session) {
  const fallback = { paymentMethod: checkoutSession.payment_method_types?.[0] ?? "stripe", installments: null };
  const paymentIntentId =
    typeof checkoutSession.payment_intent === "string"
      ? checkoutSession.payment_intent
      : checkoutSession.payment_intent?.id;
  if (!paymentIntentId) return fallback;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
    const details = (paymentIntent.latest_charge as Stripe.Charge | null)?.payment_method_details;
    return {
      paymentMethod: details?.type ?? fallback.paymentMethod,
      installments: details?.card?.installments?.plan?.count ?? null,
    };
  } catch (error) {
    console.error("[STRIPE] Não foi possível ler o pagamento:", error);
    return fallback;
  }
}
