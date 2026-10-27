import { getProducts } from "@/actions/getProducts";
import ProductCard from "../_components/ui/product-card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { auth } from "@/auth";

export const metadata = {
  title: "Produtos",
  description: "Encontre seu vestido ideal. Envio rápido e atendimento personalizado.",
};

export default async function ProductsPage(props: any) {
  // You may need to handle searchParams as a Promise if the type says so
  const searchParams = props.searchParams && typeof props.searchParams.then === "function"
    ? await props.searchParams
    : props.searchParams;

  const user = await auth();
  const userId = user?.user?.id;

  const nameParam = searchParams?.name;
  const nameFilter = typeof nameParam === "string"
    ? nameParam
    : Array.isArray(nameParam)
      ? nameParam[0] || ""
      : "";

  const Products = await getProducts({ name: nameFilter });

  const products = Products.map((product) => {
    return {
      ...product,
      price: product.price.toNumber(),
      originalPrice: product.originalPrice?.toNumber() ?? null,
      rating: typeof product.rating === "number" ? product.rating : undefined,
      rentalValue: product.rentalValue ? product.rentalValue.toNumber() : 0,
      isOnlyRental: product.isOnlyRental ?? false,
      description: typeof product.description === "string" ? product.description : undefined,
      reviewCount: typeof product.reviewCount === "number" ? product.reviewCount : undefined,
      sku: typeof product.sku === "string" ? product.sku : "",
      initialInWishlist: product.wishlists.some((wishlist) => wishlist.userId === userId),
    };
  });

  if (products.length === 0) {
    return (
      <div className="w-screen flex flex-col items-center justify-center text-muted-foreground my-80">
        <h1 className="text-2xl font-bold text-center">Nenhum produto encontrado nesta loja.</h1>
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
                <BreadcrumbPage>Produtos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 my-4 mx-auto">
          {products.map((product) => (
            <ProductCard initialInWishlist={product.initialInWishlist} key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}