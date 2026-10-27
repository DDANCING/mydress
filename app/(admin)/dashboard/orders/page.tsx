import { db } from "@/lib/db";
import { OrderClient } from "./_components/client";
import { OrderColumn } from "./_components/columns";
import { formatter } from "@/lib/utils";
import { formatDateForDisplay } from "@/lib/date-utils";

const OrdersPage = async () => {
 const orders = await db.order.findMany({
  orderBy: {
    createdAt: "desc",
  },
  include: {
    coupon: {
      select: {
        id: true,
        discountType: true,
        discountValue: true,
        code: true,
      },
    },
    buyer: {
      select: {
        fullName: true,
        email: true,
        phone: true,
      },
    },
  }
});

  const formatedOrders: OrderColumn[] = orders.map((item) => {
  return {
    id: item.id,
    fullName: item.buyer.fullName,
    email: item.buyer.email ?? "",
    phone: item.buyer.phone ?? "",
    isPaid: item.isPaid,
    method: item.paymentMethod ?? "",
    totalAmount: item.totalAmount
      ? formatter.format(item.totalAmount.toNumber())
      : "R$ 0,00",
    sent: item.status ?? "",
    createdAt: formatDateForDisplay(item.createdAt),
    installments: item.installments ?? 0,
    shippingMethod: item.shippingMethod ?? "N/S",
    deliveryDate: item.eventDate ? formatDateForDisplay(item.eventDate) : null,
    shippingCost: item.shippingCost
      ? item.shippingCost.toNumber?.() ?? item.shippingCost
      : 0,
    coupon: {
      code: item.coupon?.code ?? "N/S",
      discountType: (item.coupon?.discountType === "fixed" || item.coupon?.discountType === "percentage")
        ? item.coupon.discountType as "fixed" | "percentage"
        : "fixed",
      discountValue: item.coupon?.discountValue
        ? typeof item.coupon.discountValue === "number"
          ? item.coupon.discountValue
          : item.coupon.discountValue.toNumber()
        : 0,
      id: item.coupon?.id ?? "",
    }
  };
});

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderClient data={formatedOrders} />
      </div>
    </div>
  );
};

export default OrdersPage;
