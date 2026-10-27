import { notFound } from "next/navigation";
import ProductClient from "./_components/ProductClient";
import { getProductWithSuggestions } from "@/actions/getProductWithSuggestions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface CategoryIdPageProps {
  params: Promise<{ productId: string }>;
}

// Helper function to map rentalValue and any other Decimal fields to number or undefined
function mapStoreProduct(product: any): any {
  return {
    ...product,
    rentalValue: product.rentalValue !== null && product.rentalValue !== undefined
      ? Number(product.rentalValue)
      : undefined,
  };
}

const page = async ({ params }: CategoryIdPageProps) => {
  const { productId } = await params;

  const user = await auth();
  const userId = user?.user?.id;

  const wishlistItems = await db.wishlist.findMany({
    where: {
      userId,
      productId: productId,
    },
  });

  const schedules = await db.contract.findMany({
    where: {
      contractItems: {
        some: {
          productId: productId
        }
      },
      status: {
        in: ["CONFIRMED", "DELIVERED"]
      }
    },
    include: {
      contractItems: {
        where: {
          productId: productId
        }
      }
    }
  });

  const mappedSchedules = schedules
    .map(contract => ({
      id: contract.id,
      eventDate: contract.eventDate || contract.deliveryDate,
      contractType: contract.type === "SALE" || contract.type === "ClothingSALE" ? "SALE" as const : "RENTAL" as const
    }))
    .filter(schedule => schedule.eventDate !== null);

  const isInWishlist = wishlistItems.length > 0;

  const { product, suggestedProducts } = await getProductWithSuggestions(productId);

  if (!product) return notFound();

  // Map product and suggestedProducts to ensure rentalValue is number | undefined
  const mappedProduct = mapStoreProduct(product);
  const mappedSuggestedProducts = Array.isArray(suggestedProducts)
    ? suggestedProducts.map(mapStoreProduct)
    : [];

  if (mappedProduct.isArchived === true) {
    return (
      <div className="relative mt-20">
        <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center text-center px-4">
          <div className="bg-background p-6 rounded-lg shadow-xl max-w-md">
            <h1 className="text-xl font-semibold mb-4">
              Este produto está indisponível no momento.
            </h1>
            <p>
              Para mais informações, entre em{" "}
              <a href="/contato" className="text-blue-600 underline font-medium">
                contato
              </a>.
            </p>
            <div className="flex justify-end mt-4 gap-4">
              <Link href="/products">
                <Button variant={"secondary"}>Catálogo</Button>
              </Link>
              <Link href="/">
                <Button>Inicio</Button>
              </Link>
            </div>
          </div>
        </Card>
        <ProductClient
          wishlist={isInWishlist}
          product={mappedProduct}
          suggestedProducts={mappedSuggestedProducts}
          schedules={mappedSchedules}
        />
      </div>
    );
  }

  return (
    <div className="mt-20">
      <ProductClient
        userId={userId}
        wishlist={isInWishlist}
        product={mappedProduct}
        suggestedProducts={mappedSuggestedProducts}
        schedules={mappedSchedules}
      />
    </div>
  );
};

export default page;