import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { db } from "@/lib/db";
import ProductCard from "../../_components/ui/product-card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface  CategoryIdPageProps {
  params: Promise<{ categoryId: string }>
}


export async function generateMetadata({ params }: CategoryIdPageProps): Promise<Metadata> {
  const { categoryId } = await params;
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { name: true } });
  if (!category) return { title: "Categoria não encontrada", robots: { index: false } };
  const title = `Aluguel de vestidos ${category.name.toLowerCase()} em ${siteConfig.city}`;
  const description = `Vestidos ${category.name.toLowerCase()} para alugar na ${siteConfig.fullName}. Escolha online e prove no provador em ${siteConfig.address.district}, ${siteConfig.city}.`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${categoryId}` },
    openGraph: { url: `/category/${categoryId}`, title, description },
  };
}

export default async function CategoriesPage({ params }: CategoryIdPageProps) {

 const { categoryId } = await params;
const ProductsByCategory = await db.category.findMany({
  where: {
    id: categoryId
  },
  include: {
    products: {
      where: {
        isArchived: false,
        siteVisible: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        isFeatured: true,
        isArchived: true,
        siteVisible: true,
        originalPrice: true,
        rating: true,
        description: true,
        reviewCount: true,
        rentalValue: true,
        isOnlyRental: true,
        sku: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        size: {
          select: {
            id: true,
            name: true,
            value: true,
          },
        },
        color: {
          select: {
            id: true,
            name: true,
            value: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    },
  },
});

const products = ProductsByCategory.flatMap((category) =>
  category.products.map((product) => ({
    ...product,
    price: product.price.toNumber(),
    originalPrice: product.originalPrice?.toNumber() ?? null,
    rating: product.rating ?? undefined,
    description: product.description ?? undefined,
    reviewCount: product.reviewCount ?? undefined,
    sku: product.sku ?? "",
    rentalValue: product.rentalValue?.toNumber?.() ?? 0,
    isOnlyRental: product.isOnlyRental ?? false,
  }))
);

if (products.length === 0) {
  return (
    <div className="w-screen flex flex-col items-center justify-center text-muted-foreground my-80">
      <h1 className="text-2xl font-bold text-center">Nenhum produto encontrado nesta categoria.</h1>
    </div>
  );
 }

 return (
  <div className="w-screen flex flex-col flex-wrap items-center justify-center gap-4 mt-24">
    <div className="w-[80%]">
    <div className="w-full mb-10">
    <h1 className="text-2xl font-bold">{ProductsByCategory[0]?.name}</h1>
      <Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/category">Categorias</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>{ProductsByCategory[0]?.name}</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4  gap-4 my-4 mx-auto">
  {products.map((product) => ( 
    <ProductCard key={product.id} product={product} />
  ))}
</div>
    </div>
  </div>
);

}
