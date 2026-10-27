import { db } from "@/lib/db";
import { Testimonials } from "./_components/testemonials";
import ProductCard from "../../_components/ui/product-card";
import { Separator } from "@/components/ui/separator";


interface  TestimonialsPageProps {
  params: Promise<{ productId: string }>
}
async function TestimonialsPage({ params }: TestimonialsPageProps) {

  const { productId} = await params;

  const products = await db.product.findMany({
    where: {
      siteVisible: true,
      isArchived: false,

    },
    include: {
      category: true,
      size: true,
      color: true,
      images: true,
    },
    take: 5
  });

  const productForId = await db.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      category: true,
      size: true,
      color: true,
      images: true,
    },
  });

  const safeProducts = products.map((product) => ({
  ...product,
  id: product.id,
  price: typeof product.price === "object" && "toNumber" in product.price
    ? product.price.toNumber()
    : Number(product.price),
  originalPrice: product.originalPrice === null
    ? null
    : (typeof product.originalPrice === "object" && "toNumber" in product.originalPrice
        ? product.originalPrice.toNumber()
        : Number(product.originalPrice)),
  rating: product.rating === null ? undefined : product.rating,
  description: product.description === null ? undefined : product.description,
  reviewCount: product.reviewCount === null ? undefined : product.reviewCount,
  sku: product.sku === null ? undefined : product.sku,
  rentalValue: product.rentalValue === null
    ? 0
    : (typeof product.rentalValue === "object" && "toNumber" in product.rentalValue
        ? product.rentalValue.toNumber()
        : Number(product.rentalValue)),
}));

  if (!productForId) {
    return <div>Product not found.</div>;
  }

  return (
    <div className="flex flex-1 flex-col mx-auto">
      <Testimonials productId={productForId.id} productName={productForId.name} />
      <Separator />
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 m-8">
        {safeProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default TestimonialsPage;
