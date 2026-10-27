import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { toast } from "sonner";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    // Processar diferentes tipos de eventos
    switch (event.type) {
        case "checkout.session.completed":
            await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
            break;
        case "payment_intent.succeeded":
            await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
            break;
        case "payment_intent.payment_failed":
            await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
            break;
        case "charge.updated":
            await handleChargeUpdated(event.data.object as Stripe.Charge);
            break;
        default:
            break;
    }

    return new NextResponse(null, { status: 200 });
}

// ATENÇÃO: Alteração principal para boleto é aqui
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const orderId = session?.metadata?.orderId;

    if (!orderId) {
        return;
    }

    // Se for boleto, não marcar como pago, apenas atualizar status
    if (session.payment_method_types && session.payment_method_types.includes("boleto")) {
        await db.order.update({
            where: { id: orderId },
            data: {
                status: "AWAITING_PAYMENT",
                paymentMethod: "boleto",
                updatedAt: new Date(),
            }
        });
        return;
    }

    // Demais métodos (cartão, apple pay, google pay, etc)
    try {
        const updatedOrder = await db.order.update({
            where: { id: orderId },
            data: {
                isPaid: true,
                status: "CONFIRMED",
                paymentMethod: session.payment_method_types[0],
                updatedAt: new Date(),
            },
            include: {
                coupon: true,
                buyer: true,
                orderItems: true
            }
        });

        if (updatedOrder?.coupon) {
            await db.coupon.update({
                where: { id: updatedOrder.coupon.id },
                data: {
                    usedCount: {
                        increment: 1
                    }
                }
            });
        }

        if (updatedOrder.eventDate && updatedOrder.shippingTime) {
            const eventDate = new Date(updatedOrder.eventDate);
            const shippingTime = updatedOrder.shippingTime;

            for (const item of updatedOrder.orderItems) {
                const shippingDate = new Date(eventDate);
                shippingDate.setDate(eventDate.getDate() - shippingTime);

                try {
                    await db.schedule.create({
                        data: {
                            orderId: orderId,
                            productId: item.productId,
                            type: "CLIENT_APPOINTMENT",
                            startDate: shippingDate,
                            endDate: new Date(shippingDate.getTime() + 60 * 60 * 1000),
                            title: `Envio do Produto: ${item.productId}`,
                            description: `Envio do produto ${item.productId} do pedido ${orderId} para ${updatedOrder.buyer?.fullName || 'cliente'}`,
                            tags: ["enviar! 📦", "site 🛜"],
                            buyerId: updatedOrder.buyerId,
                        }
                    });
                } catch (scheduleError) {}

                if (item.type === "RENTAL" || item.type === "clothingRENTAL") {
                    const returnDate = new Date(eventDate);
                    returnDate.setDate(eventDate.getDate() + shippingTime);
                    try {
                        await db.schedule.create({
                            data: {
                                orderId: orderId,
                                productId: item.productId,
                                type: "CLIENT_APPOINTMENT",
                                startDate: returnDate,
                                endDate: new Date(returnDate.getTime() + 60 * 60 * 1000),
                                title: `Devolução do Produto: ${item.productId}`,
                                description: `Devolução do produto ${item.productId} do pedido ${orderId} de ${updatedOrder.buyer?.fullName || 'cliente'}`,
                                tags: ["devolução! 📦", "site 🛜"],
                                buyerId: updatedOrder.buyerId,
                            }
                        });
                    } catch (scheduleError) {}
                }
            }
        }
    } catch (error) {
        throw error;
    }
}

// Marcar como pago apenas se for boleto (ou outros métodos válidos)
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
        return;
    }

    // Se boleto, marcar como pago aqui!
    if (paymentIntent.payment_method_types && paymentIntent.payment_method_types.includes("boleto")) {
        try {
            await db.order.update({
                where: { id: orderId },
                data: {
                    isPaid: true,
                    status: "CONFIRMED",
                    paymentMethod: "BOLETO",
                    updatedAt: new Date(),
                },
            });
        } catch (error) {}
        return;
    }

    // Demais métodos (cartão, apple pay, google pay, etc)
    try {
        await db.order.update({
            where: { id: orderId },
            data: {
                isPaid: true,
                status: "CONFIRMED",
                paymentMethod: paymentIntent.payment_method_types[0],
                updatedAt: new Date(),
            },
        });
    } catch (error) {}
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
        return;
    }

    try {
        await db.order.update({
            where: { id: orderId },
            data: {
                status: "PAYMENT_FAILED",
                updatedAt: new Date(),
            },
        });
    } catch (error) {}
}

// Checa método e status antes de marcar como pago
async function handleChargeUpdated(charge: Stripe.Charge) {
    const orderId = charge.metadata?.orderId;
    if (!orderId) {
        return;
    }

    // Se for boleto e pago, marca como pago!
    if (
        charge.status === "succeeded" &&
        charge.payment_method_details &&
        charge.payment_method_details.type === "boleto"
    ) {
        try {
            const existingOrder = await db.order.findUnique({
                where: { id: orderId },
                include: {
                    coupon: true,
                    buyer: true,
                    orderItems: true
                }
            });

            if (!existingOrder || existingOrder.isPaid) {
                return;
            }

            const updatedOrder = await db.order.update({
                where: { id: orderId },
                data: {
                    isPaid: true,
                    status: "CONFIRMED",
                    paymentMethod: "BOLETO",
                    updatedAt: new Date(),
                },
                include: {
                    coupon: true,
                    buyer: true,
                    orderItems: true
                }
            });

            if (updatedOrder?.coupon) {
                await db.coupon.update({
                    where: { id: updatedOrder.coupon.id },
                    data: {
                        usedCount: {
                            increment: 1
                        }
                    }
                });
            }

            if (updatedOrder.eventDate && updatedOrder.shippingTime) {
                const eventDate = new Date(updatedOrder.eventDate);
                const shippingTime = updatedOrder.shippingTime;

                for (const item of updatedOrder.orderItems) {
                    const shippingDate = new Date(eventDate);
                    shippingDate.setDate(eventDate.getDate() - shippingTime);

                    try {
                        await db.schedule.create({
                            data: {
                                orderId: orderId,
                                productId: item.productId,
                                type: "CLIENT_APPOINTMENT",
                                startDate: shippingDate,
                                endDate: new Date(shippingDate.getTime() + 60 * 60 * 1000),
                                title: `Envio do Produto: ${item.productId}`,
                                description: `Envio do produto ${item.productId} do pedido ${orderId} para ${updatedOrder.buyer?.fullName || 'cliente'}`,
                                tags: ["enviar! 📦", "site 🛜"],
                                buyerId: updatedOrder.buyerId,
                            }
                        });
                    } catch (scheduleError) {}

                    if (item.type === "SALE" || item.type === "ClothingSALE") {
                        await db.product.update({
                            where: { id: item.productId },
                            data: {
                                isArchived: true,
                            }
                        });
                    }

                    if (item.type === "RENTAL" || item.type === "clothingRENTAL") {
                        const returnDate = new Date(eventDate);
                        returnDate.setDate(eventDate.getDate() + shippingTime);
                        try {
                            await db.schedule.create({
                                data: {
                                    orderId: orderId,
                                    productId: item.productId,
                                    type: "CLIENT_APPOINTMENT",
                                    startDate: returnDate,
                                    endDate: new Date(returnDate.getTime() + 60 * 60 * 1000),
                                    title: `Devolução do Produto: ${item.productId}`,
                                    description: `Devolução do produto ${item.productId} do pedido ${orderId} de ${updatedOrder.buyer?.fullName || 'cliente'}`,
                                    tags: ["devolução! 📦", "site 🛜"],
                                    buyerId: updatedOrder.buyerId,
                                }
                            });
                        } catch (scheduleError) {
                            toast.error("Error creating schedule:" + scheduleError);
                        }
                    }
                }
            }
        } catch (error) {
            toast.error("Error processing order:" + error);
            throw error;
        }
        return;
    }

    // Demais métodos (cartão, apple pay, google pay, etc)
    if (charge.paid && charge.status === 'succeeded') {
        try {
            const existingOrder = await db.order.findUnique({
                where: { id: orderId },
                include: {
                    coupon: true,
                    buyer: true,
                    orderItems: true
                }
            });

            if (!existingOrder || existingOrder.isPaid) {
                return;
            }

            const updatedOrder = await db.order.update({
                where: { id: orderId },
                data: {
                    isPaid: true,
                    status: "CONFIRMED",
                    paymentMethod: charge.payment_method_details?.type ?? "STRIPE",
                    updatedAt: new Date(),
                },
                include: {
                    coupon: true,
                    buyer: true,
                    orderItems: true
                }
            });

            if (updatedOrder?.coupon) {
                await db.coupon.update({
                    where: { id: updatedOrder.coupon.id },
                    data: {
                        usedCount: {
                            increment: 1
                        }
                    }
                });
            }

            if (updatedOrder.eventDate && updatedOrder.shippingTime) {
                const eventDate = new Date(updatedOrder.eventDate);
                const shippingTime = updatedOrder.shippingTime;

                for (const item of updatedOrder.orderItems) {
                    const shippingDate = new Date(eventDate);
                    shippingDate.setDate(eventDate.getDate() - shippingTime);

                    try {
                        await db.schedule.create({
                            data: {
                                orderId: orderId,
                                productId: item.productId,
                                type: "CLIENT_APPOINTMENT",
                                startDate: shippingDate,
                                endDate: new Date(shippingDate.getTime() + 60 * 60 * 1000),
                                title: `Envio do Produto: ${item.productId}`,
                                description: `Envio do produto ${item.productId} do pedido ${orderId} para ${updatedOrder.buyer?.fullName || 'cliente'}`,
                                tags: ["enviar! 📦", "site 🛜"],
                                buyerId: updatedOrder.buyerId,
                            }
                        });
                    } catch (scheduleError) {}

                    if (item.type === "SALE" || item.type === "ClothingSALE") {
                        await db.product.update({
                            where: { id: item.productId },
                            data: {
                                isArchived: true,
                            }
                        });
                    }

                    if (item.type === "RENTAL" || item.type === "clothingRENTAL") {
                        const returnDate = new Date(eventDate);
                        returnDate.setDate(eventDate.getDate() + shippingTime);
                        try {
                            await db.schedule.create({
                                data: {
                                    orderId: orderId,
                                    productId: item.productId,
                                    type: "CLIENT_APPOINTMENT",
                                    startDate: returnDate,
                                    endDate: new Date(returnDate.getTime() + 60 * 60 * 1000),
                                    title: `Devolução do Produto: ${item.productId}`,
                                    description: `Devolução do produto ${item.productId} do pedido ${orderId} de ${updatedOrder.buyer?.fullName || 'cliente'}`,
                                    tags: ["devolução! 📦", "site 🛜"],
                                    buyerId: updatedOrder.buyerId,
                                }
                            });
                        } catch (scheduleError) {
                            toast.error("Error creating schedule:" + scheduleError);
                        }
                    }
                }
            }
        } catch (error) {
            toast.error("Error processing order:" + error);
            throw error;
        }
    }
}