import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCouponDiscount } from "@/lib/store-orders";
import CheckoutClientForm, { CheckoutOrder } from "./_components/checkout-client-form";

// O carrinho antigo gravava valores fictícios no cadastro; não mostrá-los como se fossem da cliente
const PLACEHOLDERS = new Set(["00000000000", "Rua Exemplo", "Cidade", "UF", "Bairro", "123", "Complemento"]);
const clean = (value?: string | null) => (value && !PLACEHOLDERS.has(value) ? value : "");

interface CheckoutIdPageProps {
  params: Promise<{ checkoutId: string }>;
  searchParams: Promise<{ canceled?: string }>;
}

const CheckoutPage = async ({ params, searchParams }: CheckoutIdPageProps) => {
  const { checkoutId } = await params;
  const { canceled } = await searchParams;
  const session = await auth();

  if (!session?.user?.email) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/cart/checkout/${checkoutId}`)}`);
  }

  const order = await db.order.findFirst({
    where: { id: checkoutId, buyer: { email: session.user.email } },
    include: {
      buyer: true,
      coupon: true,
      orderItems: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              images: { select: { url: true }, take: 1 },
              color: { select: { name: true } },
              size: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!order) notFound();
  if (order.isPaid) redirect(`/order/${order.id}`);

  const subtotal = order.orderItems.reduce((acc, item) => acc + Number(item.subtotal), 0);

  const checkoutOrder: CheckoutOrder = {
    id: order.id,
    eventDate: order.eventDate?.toISOString() ?? null,
    shippingMethod: order.shippingMethod,
    shippingCost: Number(order.shippingCost ?? 0),
    shippingTime: order.shippingTime,
    subtotal,
    discount: getCouponDiscount(order.coupon, subtotal),
    couponCode: order.coupon?.code ?? null,
    hasRental: order.orderItems.some((item) => item.type === "RENTAL" || item.type === "clothingRENTAL"),
    items: order.orderItems.map((item) => ({
      id: item.id,
      name: item.product.name,
      sku: item.product.sku,
      image: item.product.images[0]?.url ?? null,
      color: item.product.color.name,
      size: item.product.size.name,
      type: item.type === "SALE" || item.type === "ClothingSALE" ? "SALE" : "RENTAL",
      unitPrice: Number(item.unitPrice),
    })),
    buyer: {
      fullName: order.buyer.fullName,
      email: order.buyer.email ?? session.user.email,
      phone: clean(order.buyer.phone),
      document: clean(order.buyer.document),
      cep: clean(order.buyer.cep),
      address: clean(order.buyer.address),
      number: clean(order.buyer.number),
      complement: clean(order.buyer.complement),
      neighborhood: clean(order.buyer.neighborhood),
      city: clean(order.buyer.city),
      state: clean(order.buyer.state),
    },
  };

  return (
    <div className="mt-20">
      <CheckoutClientForm order={checkoutOrder} canceled={canceled === "1"} />
    </div>
  );
};

export default CheckoutPage;
