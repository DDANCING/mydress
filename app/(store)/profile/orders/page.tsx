import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Orders } from "../_components/orders";
import { SafeOrder } from "@/app/types";
import { redirect } from "next/navigation";

const OrdersPage = async () => {
  const session = await auth();
  const userEmail = session?.user?.email;

  const userId = session?.user?.id;

  if (!userId || !userEmail) {
    return redirect("/login?callbackUrl=/profile/orders");
  }

  const buyerWithOrders = await db.buyer.findUnique({
    where: {
      email: userEmail || "",
    },
    include: {
      orders: {
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  images: true,
                  color: true,
                  size: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  function serializeOrders(orders: any[]): SafeOrder[] {
  return orders.map((order) => ({
    id: order.id,
    buyerId: order.buyerId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    isPaid: order.isPaid,
    status: order.status,
    paymentMethod: order.paymentMethod,
    installments: order.installments,
    totalAmount: Number(order.totalAmount), // Decimal para number
    shippingCost: order.shippingCost ? Number(order.shippingCost) : 0,
    trackingCode: order.trackingCode,
    trackingUrl: order.trackingUrl,
    eventDate: order.eventDate,
    product: order.orderItems.map((item: any) => ({ id: item.product.id })),
    orderItems: order.orderItems.map((item: any) => ({
      product: {
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        images: item.product.images.map((img: any) => ({
          id: img.id,
          url: img.url,
        })),
        color: item.product.color,
        size: item.product.size,
        category: item.product.category,
      },
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  }));
}

  const buyerName = buyerWithOrders?.fullName || session?.user?.name || "";

  const safeOrders = serializeOrders(buyerWithOrders?.orders || []);

  return (
    <div className="container mx-auto px-4 py-8">
      <Orders orders={safeOrders} userName={buyerName} userId={userId} />
    </div>
  );
};

export default OrdersPage; 