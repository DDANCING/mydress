import { db } from "@/lib/db";
import { OrderForm } from "./_components/order-form";
import { Product, Color, Size } from "@prisma/client";
import { SafeOrder, SafeProduct } from "@/app/types";

interface BuyerIdPageProps {
  params: Promise<{ orderId: string }>;
}

// Atualização: incluir `size` e `color` nos campos permitidos
type CleanProduct = Omit<
  Product,
  "price" | "originalPrice" | "rating" | "reviewCount"
> & {
  price: number;
  size: Size;
  color: Color;
};

function sanitizeProduct(product: any): SafeProduct {
  return {
    id: product.id,
    name: product.name,
    price: product.price.toNumber(),
    sku: product.sku,
    storeId: product.storeId,
    categoryId: product.categoryId,
    isFeatured: product.isFeatured,
    isArchived: product.isArchived,
    description: product.description,
    sizeId: product.sizeId,
    colorId: product.colorId,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    isOnlyRental: product.isOnlyRental || false,
    rentalValue: product.rentalValue ? product.rentalValue.toNumber() : null,
    size: product.size,
    color: product.color,
    siteVisible: product.siteVisible ?? false,
    originalPrice: product.originalPrice ? product.originalPrice.toNumber() : null,
    rating: product.rating ?? 0,
    reviewCount: product.reviewCount ?? 0,
  };
}

const OrderIdPage = async ({ params }: BuyerIdPageProps) => {
  const { orderId } = await params;

  const rawOrder = await db.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              color: true,
              size: true,
            },
          },
        },
      },
    },
  });

  const order = rawOrder
    ? ({
        ...rawOrder,
        totalAmount: rawOrder.totalAmount?.toNumber() ?? 0,
        shippingCost: rawOrder.shippingCost?.toNumber() ?? 0,
        orderItems: rawOrder.orderItems.map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
          subtotal: item.subtotal.toNumber(),
          product: sanitizeProduct(item.product),
        })),
        product: rawOrder.orderItems.map((item) => ({ id: item.product.id })),
      } as SafeOrder)
    : null;

  const buyers = await db.buyer.findMany();

  const rawProducts = await db.product.findMany({
    include: { color: true, size: true },
    orderBy: {
      name: "asc",
    },
  });

  const products = rawProducts.map(sanitizeProduct) as unknown as SafeProduct[];

  return (
    <div className="flex-col">
      <OrderForm
        buyers={buyers}
        products={products}
        initialData={order}
        orderId={orderId}
        isModal={false}
      />
    </div>
  );
};

export default OrderIdPage;
