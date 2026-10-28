import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

interface OrderItemPayload {
  productId: string;
  quantity: number;
}

// GET /api/orders/:orderId
export async function GET(
  req: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    // Rota do painel: só a equipe lê, altera ou apaga pedidos
    const denied = await requireStaff();
    if (denied) return denied;

    const { orderId } = await context.params;

    if (!orderId) {
      return new NextResponse("Order ID is required", { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        orderItems: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Serializar Decimals para números
    const serializedOrder = {
      ...order,
      totalAmount: order.totalAmount?.toNumber() || 0,
      shippingCost: order.shippingCost?.toNumber() || 0,
      orderItems: order.orderItems.map(item => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
        subtotal: item.subtotal.toNumber(),
        product: {
          ...item.product,
          price: item.product.price.toNumber(),
          originalPrice: item.product.originalPrice?.toNumber() || null
        }
      }))
    };

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.log("[ORDER_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH /api/orders/:orderId

export async function PATCH(
  req: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    // Rota do painel: só a equipe lê, altera ou apaga pedidos
    const denied = await requireStaff();
    if (denied) return denied;

    const { orderId } = await context.params;
    const body = await req.json();

    const {
      buyer: buyerData,
      order: orderData,
      orderItems,
    }: {
      buyer: any;
      order: any;
      orderItems?: OrderItemPayload[];
    } = body;

    if (!orderId) {
      return new NextResponse("Order ID is required", { status: 400 });
    }
    if (!buyerData || !orderData) {
      return new NextResponse("Buyer and Order data are required", {
        status: 400,
      });
    }


    // Corrigir buyerData.document se vier como objeto
    if (buyerData && typeof buyerData.document === 'object' && buyerData.document !== null) {
      if ('cpfCnpj' in buyerData.document) {
        buyerData.document = buyerData.document.cpfCnpj;
      } else {
        buyerData.document = '';
      }
    }

    // ✅ Validação de itens
    if (orderItems && orderItems.length > 0) {
      const invalidItems = orderItems.filter(
        (item) => !item.productId || typeof item.quantity !== "number"
      );
      if (invalidItems.length > 0) {
        return new NextResponse("Invalid order items", { status: 400 });
      }
    }

    const currentOrder = await db.order.findUnique({
      where: { id: orderId },
      include: { buyer: true },
    });

    if (!currentOrder) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const updatedOrder = await db.$transaction(async (prisma) => {
      // Atualiza comprador
      await prisma.buyer.update({
        where: { id: currentOrder.buyerId },
        data: buyerData,
      });

      // Atualiza pedido
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          isPaid: orderData.isPaid,
          paymentMethod: orderData.paymentMethod,
          installments: orderData.installments,
          status: orderData.status,
          totalAmount: orderData.totalAmount,
          shippingMethod: orderData.shippingMethod,
          shippingCost: orderData.shippingCost,
          shippingTime: orderData.shippingTime,
          eventDate: orderData.eventDate ? new Date(orderData.eventDate) : null,
          trackingCode: orderData.trackingCode,
          trackingUrl: orderData.trackingUrl,
        },
      });

      // Atualiza/insere itens, se houver
      if (Array.isArray(orderItems)) {
        if (orderItems.length > 0) {
          // 🗑️ Remove todos os OrderItems existentes primeiro
          await prisma.orderItem.deleteMany({
            where: { orderId },
          });

          const productIds = orderItems
            .map((item) => item.productId)
            .filter((id): id is string => !!id);

          const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
          });

          if (products.length !== productIds.length) {
            const missingIds = productIds.filter(
              (id) => !products.find((p) => p.id === id)
            );
            throw new Error(`Products not found: ${missingIds.join(", ")}`);
          }

          // ✅ Cria apenas os OrderItems do formulário
          for (const item of orderItems) {
            const product = products.find((p) => p.id === item.productId)!;

            await prisma.orderItem.create({
              data: {
                orderId,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: product.price,
                subtotal: new Prisma.Decimal(
                  product.price.toNumber() * item.quantity
                ),
              },
            });
          }
        } else {
          // Se o array veio vazio explicitamente, remove todos os OrderItems
          await prisma.orderItem.deleteMany({
            where: { orderId },
          });
        }
      }

      return order;
    });

    // Serializar Decimals para números
    const serializedOrder = {
      ...updatedOrder,
      totalAmount: updatedOrder.totalAmount?.toNumber() || 0,
      shippingCost: updatedOrder.shippingCost?.toNumber() || 0
    };

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.log("[ORDER_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE /api/orders/:orderId
export async function DELETE(
  req: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    // Rota do painel: só a equipe lê, altera ou apaga pedidos
    const denied = await requireStaff();
    if (denied) return denied;

    const { orderId } = await context.params;

    if (!orderId) {
      return new NextResponse("Order ID is required", { status: 400 });
    }

    const orderExists = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!orderExists) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const deletedOrder = await db.$transaction(async (prisma) => {
      await prisma.orderItem.deleteMany({
        where: { orderId },
      });

      return await prisma.order.delete({
        where: { id: orderId },
      });
    });

    // Serializar Decimals para números
    const serializedOrder = {
      ...deletedOrder,
      totalAmount: deletedOrder.totalAmount?.toNumber() || 0,
      shippingCost: deletedOrder.shippingCost?.toNumber() || 0
    };

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.log("[ORDER_DELETE]", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return new NextResponse("Order not found.", { status: 404 });
      }
    }

    return new NextResponse("Internal error", { status: 500 });
  }
}
