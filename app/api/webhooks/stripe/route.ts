import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { markOrderStatus, syncCheckoutSession } from "@/lib/store-orders";

// Eventos usados (configure-os no endpoint do Stripe Dashboard):
// checkout.session.completed, checkout.session.async_payment_succeeded,
// checkout.session.async_payment_failed, checkout.session.expired
//
// O mesmo evento pode chegar mais de uma vez: syncCheckoutSession só confirma o pedido uma vez.
// Se o processamento falhar, devolvemos 500 para o Stripe tentar de novo.

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return new NextResponse("Webhook Error: assinatura ou segredo ausente", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    return new NextResponse(`Webhook Error: ${(error as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await syncCheckoutSession(event.data.object);
        break;
      case "checkout.session.async_payment_failed": {
        const orderId = event.data.object.metadata?.orderId;
        if (orderId) await markOrderStatus(orderId, "PAYMENT_FAILED");
        break;
      }
      case "checkout.session.expired": {
        // Libera a reserva do vestido; a cliente pode tentar pagar de novo pelo pedido
        const orderId = event.data.object.metadata?.orderId;
        if (orderId) await markOrderStatus(orderId, "EXPIRED");
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(`[STRIPE_WEBHOOK] Falha ao processar ${event.type} (${event.id}):`, error);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
