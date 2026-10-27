import { db } from "@/lib/db";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import ProductCard from "../_components/ui/product-card";
import { auth } from "@/auth";



export default async function ProductsPage() {
const user = await auth();
const userId = user?.user?.id;

const Products = await db.product.findMany({
      where: {
        isArchived: false,
        siteVisible: true,
        wishlists: {
          some: {
            userId: userId,
          },
        }
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
  )

const products = Products.map((product) => ({
    ...product,
    price: product.price.toNumber(),
    originalPrice: product.originalPrice?.toNumber() ?? null,
    rating: product.rating ?? undefined,
    description: product.description ?? undefined,
    rentalValue: product.rentalValue && typeof product.rentalValue === "object" && "toNumber" in product.rentalValue && typeof (product.rentalValue as any).toNumber === "function"
      ? (product.rentalValue as any).toNumber()
      : (typeof product.rentalValue === "number" ? product.rentalValue : 0),
    reviewCount: product.reviewCount ?? undefined,
    sku: product.sku ?? "",
  }))

  if (products.length === 0) {
    return (
      <div className="w-screen flex flex-col items-center justify-center my-72">
        <h1 className="text-2xl font-bold text-muted-foreground">Sua wishlist está vazia</h1>
        <p className="text-muted-foreground">Adicione produtos aos seus favoritos para visualizá-los aqui.</p>
      </div>
    );
  }

 return (
  <div className="w-screen flex flex-col flex-wrap items-center justify-center gap-4 mt-24">
    <div className="w-[90%]">
    <div className="w-full mb-10">
      <Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Wishlist ♡</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
    </div>
    <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 my-4 mx-auto">
  {products.map((product) => ( 
    <ProductCard initialInWishlist={true} size={1.1} key={product.id} product={product} />
  ))}
</div>
    </div>
  </div>
);
}
