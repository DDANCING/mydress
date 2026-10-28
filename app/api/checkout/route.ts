import Stripe from "stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { siteConfig } from "@/lib/site-config";
import { isDateAvailable } from "@/lib/booking-rules";
import { quoteShipping } from "@/lib/shipping";
import { checkoutBuyerSchema } from "@/schemas/checkout";
import {
  CHECKOUT_SESSION_MINUTES,
  getCouponDiscount,
  getCouponError,
  getProductBookings,
} from "@/lib/store-orders";
import { RATE_LIMITS, rateLimit, tooManyRequests } from "@/lib/rate-limit";

// Salva os dados de entrega e abre a sessão de pagamento do Stripe.
// Valores vêm do banco; o frete é recalculado para o CEP do endereço informado.

const bodySchema = z.object({
  orderId: z.string().min(1),
  buyer: checkoutBuyerSchema,
});

const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

const toCents = (value: number) => Math.round(value * 100);

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return fail("Faça login para pagar", 401);

    const attempt = await rateLimit(`checkout:email:${email}`, RATE_LIMITS.checkout);
    if (!attempt.success) return tooManyRequests(attempt);

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos");
    const { orderId, buyer: buyerData } = parsed.data;

    const order = await db.order.findFirst({
      where: { id: orderId, buyer: { email } },
      include: {
        buyer: true,
        coupon: true,
        orderItems: {
          include: { product: { select: { id: true, name: true, isArchived: true, images: { select: { url: true }, take: 1 } } } },
        },
      },
    });

    if (!order) return fail("Pedido não encontrado", 404);
    if (order.isPaid) return fail("Este pedido já foi pago", 409);
    if (order.orderItems.length === 0) return fail("Pedido sem produtos");
    if (!order.eventDate) return fail("Pedido sem data definida. Refaça o pedido pelo carrinho.");

    const soldOut = order.orderItems.find((item) => item.product.isArchived);
    if (soldOut) return fail(`"${soldOut.product.name}" não está mais disponível`, 409);

    // O CPF é único no cadastro. Se já pertence a outra ficha (ex.: cliente atendida na loja), mantemos a ficha atual.
    const documentOwner = await db.buyer.findUnique({ where: { document: buyerData.document } });
    const canSaveDocument = !documentOwner || documentOwner.id === order.buyerId;

    await db.buyer.update({
      where: { id: order.buyerId },
      data: {
        fullName: buyerData.fullName,
        phone: buyerData.phone,
        cep: buyerData.cep,
        address: buyerData.address,
        number: buyerData.number,
        complement: buyerData.complement || null,
        neighborhood: buyerData.neighborhood,
        city: buyerData.city,
        state: buyerData.state,
        ...(canSaveDocument && { document: buyerData.document }),
      },
    });

    const subtotal = order.orderItems.reduce((acc, item) => acc + Number(item.subtotal), 0);

    // Recalcula o frete para o CEP de entrega com o mesmo serviço escolhido no carrinho
    const quotes = await quoteShipping({ cep: buyerData.cep, quantity: order.orderItems.length, insuranceValue: subtotal });
    const shipping = quotes.find((quote) => quote.name === order.shippingMethod);
    if (!shipping) {
      return fail(`${order.shippingMethod ?? "O frete escolhido"} não atende esse CEP. Volte ao carrinho e calcule o frete de novo.`, 409);
    }

    const bookings = await getProductBookings(
      order.orderItems.map((item) => item.productId),
      { excludeOrderId: order.id }
    );
    const unavailable = order.orderItems.find(
      (item) =>
        !isDateAvailable({
          date: order.eventDate!,
          contractType: item.type === "SALE" || item.type === "ClothingSALE" ? "SALE" : "RENTAL",
          bookings: bookings.get(item.productId) ?? [],
          shippingDays: shipping.delivery_time,
        })
    );
    if (unavailable) {
      return fail(
        `"${unavailable.product.name}" não pode mais ser entregue nessa data (reservado ou prazo de frete). Escolha outra data no carrinho.`,
        409
      );
    }

    if (order.coupon) {
      const couponError = getCouponError(order.coupon);
      if (couponError) return fail(`${couponError}. Refaça o pedido sem o cupom.`);
    }
    const discount = getCouponDiscount(order.coupon, subtotal);
    const totalAmount = Math.round((subtotal - discount + shipping.price) * 100) / 100;

    // Atualizar o pedido também renova a reserva do vestido durante o pagamento
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "PENDING",
        shippingCost: shipping.price,
        shippingTime: shipping.delivery_time,
        totalAmount,
      },
    });

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = order.orderItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "brl",
        unit_amount: toCents(Number(item.unitPrice)),
        product_data: {
          name: `${item.product.name} (${item.type === "SALE" || item.type === "ClothingSALE" ? "Compra" : "Aluguel"})`,
          images: item.product.images[0]?.url ? [item.product.images[0].url] : [],
          metadata: { productId: item.productId, type: item.type },
        },
      },
    }));

    // Desconto como valor fixo já calculado aqui, para o Stripe cobrar exatamente o total do pedido
    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
    if (discount > 0) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: toCents(discount),
        currency: "brl",
        duration: "once",
        max_redemptions: 1,
        name: `Cupom ${order.coupon?.code ?? ""}`.trim(),
      });
      discounts.push({ coupon: stripeCoupon.id });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ? siteConfig.url : new URL(req.url).origin;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "pt-BR",
      line_items,
      discounts: discounts.length > 0 ? discounts : undefined,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: shipping.name,
            fixed_amount: { amount: toCents(shipping.price), currency: "brl" },
            ...(shipping.delivery_time > 0 && {
              delivery_estimate: {
                minimum: { unit: "business_day", value: shipping.delivery_time },
                maximum: { unit: "business_day", value: shipping.delivery_time },
              },
            }),
          },
        },
      ],
      customer_email: email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, buyerId: order.buyerId },
      payment_intent_data: { metadata: { orderId: order.id } },
      success_url: `${baseUrl}/order/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart/checkout/${order.id}?canceled=1`,
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_MINUTES * 60,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[CHECKOUT_POST]", error);
    return fail("Não foi possível abrir o pagamento. Tente novamente.", 500);
  }
}
