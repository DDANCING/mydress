import { db } from "@/lib/db";
import { ProductClient } from "./_components/client";
import { ProductColumn } from "./_components/columns";
import { formatter } from "@/lib/utils";
import { formatDateForDisplay } from "@/lib/date-utils";


interface BillboardsPageProps {
  params: Promise<{ storeId: string }>;
}

const ProductsPage = async ({ params }: BillboardsPageProps) => {
  
  const { storeId } = await params;

  const products = await db.product.findMany({
    where: {
      storeId,
    },
    include: {
      category: true,
      size: true,
      color: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formatedProducts: ProductColumn[] = products.map((item) => {
    return {
      id: item.id,
      name: item.name,
      isFeatured: item.isFeatured,
      isArchived: item.isArchived,
      price: formatter.format(item.price.toNumber()),
      category: item.category.name,
      size: item.size.name,
      color: item.color.value,
      colorName: item.color.name,
      createdAt: formatDateForDisplay(item.createdAt),
      sku: item.sku || "",
    };
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductClient data={formatedProducts} />
      </div>
    </div>
  );
};

export default ProductsPage;