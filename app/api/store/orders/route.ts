import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isDateAvailable, isSameEventDay } from "@/lib/booking-rules";
import { quoteShipping } from "@/lib/shipping";
import { getCouponDiscount, getCouponError, getProductBookings, getUnitPrice } from "@/lib/store-orders";
import { RATE_LIMITS, rateLimit, tooManyRequests } from "@/lib/rate-limit";

// Cria o pedido da loja a partir do carrinho.
// O navegador envia só o que a cliente escolheu; preço, frete, desconto e disponibilidade são calculados aqui.

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        type: z.enum(["SALE", "RENTAL"]),
        eventDate: z.coerce.date(),
      })
    )
    .min(1, "O carrinho está vazio")
    .max(10, "Máximo de 10 vestidos por pedido"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  shippingServiceId: z.string().min(1, "Escolha uma opção de frete"),
  couponCode: z.string().trim().max(50).optional(),
});

const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!session?.user?.id || !email) return fail("Faça login para finalizar a compra", 401);

    const attempt = await rateLimit(`store-order:user:${session.user.id}`, RATE_LIMITS.storeOrder);
    if (!attempt.success) return tooManyRequests(attempt);

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos");
    const { items, cep, shippingServiceId, couponCode } = parsed.data;

    const productIds = items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      return fail("O mesmo vestido aparece duas vezes no carrinho. Remova uma das opções.");
    }

    // Um pedido tem uma única data de evento/entrega
    const eventDate = items[0].eventDate;
    if (!items.every((item) => isSameEventDay(item.eventDate, eventDate))) {
      return fail("Todos os itens precisam ter a mesma data. Faça um pedido para cada data.");
    }

    const products = await db.product.findMany({ where: { id: { in: productIds } } });
    if (products.length !== productIds.length) return fail("Um dos produtos não está mais disponível", 404);

    const lines = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return { item, product, unitPrice: getUnitPrice(product, item.type) };
    });

    for (const { item, product } of lines) {
      if (product.isArchived) return fail(`"${product.name}" não está mais disponível`, 409);
      if (item.type === "SALE" && product.isOnlyRental) return fail(`"${product.name}" é somente para aluguel`);
    }

    const subtotal = lines.reduce((acc, line) => acc + line.unitPrice, 0);

    const quotes = await quoteShipping({ cep, quantity: items.length, insuranceValue: subtotal });
    const shipping = quotes.find((quote) => quote.id === shippingServiceId);
    if (!shipping) return fail("A opção de frete mudou. Calcule o frete novamente.", 409);

    let coupon = null;
    if (couponCode) {
      coupon = await db.coupon.findFirst({ where: { code: { equals: couponCode, mode: "insensitive" } } });
      if (!coupon) return fail("Cupom não encontrado", 404);
      const couponError = getCouponError(coupon);
      if (couponError) return fail(couponError);
    }

    const existingBuyer = await db.buyer.findUnique({ where: { email } });

    const bookings = await getProductBookings(productIds, { excludeBuyerId: existingBuyer?.id });
    for (const { item, product } of lines) {
      const available = isDateAvailable({
        date: item.eventDate,
        contractType: item.type,
        bookings: bookings.get(product.id) ?? [],
        shippingDays: shipping.delivery_time,
      });
      if (!available) {
        return fail(`"${product.name}" não está disponível nessa data. Escolha outra data.`, 409);
      }
    }

    const discount = getCouponDiscount(coupon, subtotal);
    const totalAmount = Math.round((subtotal - discount + shipping.price) * 100) / 100;

    // Ficha da cliente criada só depois de tudo validado; endereço e CPF são pedidos no checkout
    const buyer =
      existingBuyer ?? (await db.buyer.create({ data: { fullName: session.user.name || email, email, cep } }));

    const order = await db.order.create({
      data: {
        buyerId: buyer.id,
        isPaid: false,
        status: "PENDING",
        paymentMethod: null,
        installments: 1,
        totalAmount,
        shippingMethod: shipping.name,
        shippingCost: shipping.price,
        shippingTime: shipping.delivery_time,
        eventDate,
        couponId: coupon?.id ?? null,
        orderItems: {
          create: lines.map(({ item, unitPrice }) => ({
            productId: item.productId,
            type: item.type,
            quantity: 1,
            unitPrice,
            subtotal: unitPrice,
          })),
        },
      },
    });

    return NextResponse.json({ id: order.id }, { status: 201 });
  } catch (error) {
    console.error("[STORE_ORDER_POST]", error);
    return fail("Não foi possível criar o pedido. Tente novamente.", 500);
  }
}
