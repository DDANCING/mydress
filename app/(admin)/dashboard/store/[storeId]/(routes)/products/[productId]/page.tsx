import { db } from "@/lib/db";
import { ProductForm } from "./_components/product-form";

interface ProductIdPageProps {
  params: Promise<{ productId: string; storeId: string }>;
}

const ProductIdPage = async ({ params }: ProductIdPageProps) => {

  const { productId, storeId } = await params;

  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
    
    include: {
      images: true,
    },
  });

  const categories = await db.category.findMany({
    where: {
      storeId,
    },
  });

  const sizes = await db.size.findMany({
    where: {
      storeId,
    },
  });

  const colors = await db.color.findMany({
    where: {
      storeId,
    },
  });

  const productFormatted = product
  ? {
      ...product,
      price: Number(product.price) || 0,
      rentalValue: product.rentalValue !== null && product.rentalValue !== undefined ? Number(product.rentalValue) : 0,
      originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
      sku: product.sku ?? '', // Ensure sku is always a string
      rating: product.rating ?? undefined,
      reviewCount: product.reviewCount ?? undefined,
      description: product.description ?? '',
    }
  : null;
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8">
        <ProductForm
          initialData={productFormatted}
          categories={categories}
          colors={colors}
          sizes={sizes}
        />
      </div>
    </div>
  );
};

export default ProductIdPage;
