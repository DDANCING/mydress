import { siteConfig } from "@/lib/site-config";
import Stripe from "stripe";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { User } from "lucide-react";
import { auth } from "@/auth";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{}> }
) {
    try {
        const body = await req.json();
        const { orderId, successUrl, cancelUrl } = body;
        const user = await auth();

        if (!orderId) {
            return new NextResponse("Order ID is required", { status: 400 });
        }

        // Buscar o pedido com todos os dados necessários
        const order = await db.order.findUnique({
            where: { id: orderId },
            include: {
                buyer: true,
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                images: {
                                    select: {
                                        url: true
                                    },
                                    take: 1
                                }
                            }
                        }
                    }
                },
                coupon: true
            }
        });

        if (!order) {
            return new NextResponse("Order not found", { status: 404 });
        }

        if (order.isPaid) {
            return new NextResponse("Order already paid", { status: 400 });
        }

        // Criar line items para o Stripe
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];


        // Se não houver produtos, retornar erro explícito
        if (!order.orderItems || order.orderItems.length === 0) {
            return new NextResponse("Pedido sem produtos. Adicione produtos ao pedido antes de pagar.", { status: 400 });
        }

        // Adicionar itens do pedido
        order.orderItems.forEach((orderItem) => {
            // Validar dados essenciais
            const unitPriceNumber = Number(orderItem.unitPrice);
            if (!orderItem.product || !orderItem.product.id || !orderItem.product.name || !unitPriceNumber || unitPriceNumber <= 0) {
                console.warn('[CHECKOUT] Produto inválido no orderItem:', orderItem);
                return;
            }
            line_items.push({
                quantity: orderItem.quantity,
                price_data: {
                    currency: "BRL",
                    product_data: {
                        name: orderItem.product.name,
                        images: orderItem.product.images.length > 0 ? [orderItem.product.images[0].url] : [],
                        metadata: {
                            productId: orderItem.product.id,
                            type: orderItem.type || "SALE"
                        }
                    },
                    unit_amount: Math.round(unitPriceNumber * 100), // Converter para centavos
                },
            });
        });

        // Adicionar frete se houver
        if (order.shippingCost && Number(order.shippingCost) > 0) {
            line_items.push({
                quantity: 1,
                price_data: {
                    currency: "BRL",
                    product_data: {
                        name: `Frete - ${order.shippingMethod || "Entrega"}`,
                        description: order.shippingTime ? `Prazo: ${order.shippingTime} dias úteis` : undefined,
                    },
                    unit_amount: Math.round(Number(order.shippingCost) * 100), // Converter para centavos
                },
            });
        }

        // Configurar desconto se houver cupom
        const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
        if (order.coupon) {
            // Criar um código de desconto no Stripe
            let stripeCoupon;
            try {
                if (order.coupon.discountType === "percentage") {
                    stripeCoupon = await stripe.coupons.create({
                        percent_off: Number(order.coupon.discountValue),
                        duration: "once",
                        name: `Cupom ${order.coupon.code || order.coupon.id}`,
                    });
                } else {
                    stripeCoupon = await stripe.coupons.create({
                        amount_off: Math.round(Number(order.coupon.discountValue) * 100), // Converter para centavos
                        currency: "BRL",
                        duration: "once",
                        name: `Cupom ${order.coupon.code || order.coupon.id}`,
                    });
                }

                discounts.push({ coupon: stripeCoupon.id });
            } catch (error) {
                console.error("Erro ao criar cupom no Stripe:", error);
                // Continuar sem desconto se houver erro
            }
        }

        if (!order.buyer.email && !user?.user?.email) {
            return new NextResponse("Email do comprador é obrigatório", { status: 400 });
        }
        // Configurar URLs de redirecionamento
        const baseUrl = process.env.FRONTEND_STORE_URL || 
                       process.env.NEXTAUTH_URL || 
                       process.env.NEXT_PUBLIC_APP_URL ||
                       (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : siteConfig.url);
        
        const successUrlFinal = typeof successUrl === "string" ? successUrl : `${baseUrl}/cart?success=1&orderId=${order.id}`;
        const cancelUrlFinal = typeof cancelUrl === "string" ? cancelUrl : `${baseUrl}/cart/checkout/${order.id}?canceled=1`;

        // Criar sessão do Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: "payment",
            billing_address_collection: "required",
            phone_number_collection: {
                enabled: true,
            },
            customer_email: (order.buyer.email ?? user?.user?.email) || undefined,
            discounts: discounts.length > 0 ? discounts : undefined,
            success_url: successUrlFinal,
            cancel_url: cancelUrlFinal,
            metadata: {
                orderId: order.id,
                buyerId: order.buyer.id,
                ...(order.coupon && { couponId: order.coupon.id }),
                ...(order.eventDate && { eventDate: order.eventDate.toISOString() }),
            },
            payment_intent_data: {
                metadata: {
                    orderId: order.id,
                }
            },
            expires_at: Math.floor(Date.now() / 1000) + (31 * 60), // 31 minutos
        });

        return NextResponse.json({ 
            url: session.url,
            sessionId: session.id 
        }, { 
            headers: corsHeaders 
        });

    } catch (error) {
        console.log('[CHECKOUT_POST]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}