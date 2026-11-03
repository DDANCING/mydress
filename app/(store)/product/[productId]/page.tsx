import { notFound } from "next/navigation";
import ProductClient from "./_components/ProductClient";
import { getProductWithSuggestions } from "@/actions/getProductWithSuggestions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getProductBookings } from "@/lib/store-orders";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

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

const getSeoProduct = (id: string) =>
  db.product.findUnique({
    where: { id },
    select: {
      name: true,
      description: true,
      isArchived: true,
      siteVisible: true,
      category: { select: { name: true } },
      color: { select: { name: true } },
      images: { select: { url: true }, take: 1 },
    },
  })

export async function generateMetadata({ params }: CategoryIdPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getSeoProduct(productId);
  if (!product) return { title: "Vestido não encontrado", robots: { index: false } };

  const title = `${product.name} para alugar em ${siteConfig.city}`;
  const description = (
    product.description?.trim() ||
    `Alugue o vestido ${product.name} (${product.color.name.toLowerCase()}) na ${siteConfig.fullName}. Prove no nosso provador em ${siteConfig.address.district}, ${siteConfig.city}.`
  ).slice(0, 160);
  const images = product.images.map((image) => ({ url: image.url, alt: product.name }));

  return {
    title,
    description,
    alternates: { canonical: `/product/${productId}` },
    openGraph: { type: "website", url: `/product/${productId}`, title, description, images },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
    // Vestido arquivado ou oculto continua acessível, mas fora do Google
    robots: product.isArchived || !product.siteVisible ? { index: false, follow: true } : undefined,
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

  // Contratos do painel + pedidos do site (pagos, boletos em aberto e checkouts em andamento)
  const bookings = (await getProductBookings([productId])).get(productId) ?? [];

  const isInWishlist = wishlistItems.length > 0;

  const { product, suggestedProducts } = await getProductWithSuggestions(productId);

  if (!product) return notFound();

  // Map product and suggestedProducts to ensure rentalValue is number | undefined
  const mappedProduct = mapStoreProduct(product);
  const mappedSuggestedProducts = Array.isArray(suggestedProducts)
    ? suggestedProducts.map(mapStoreProduct)
    : [];

  const base = siteConfig.url;
  const productUrl = `${base}/product/${productId}`;
  const price = mappedProduct.rentalValue ?? Number(product.price);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description ?? undefined,
      sku: product.sku ?? undefined,
      image: product.images.map((image) => image.url),
      color: product.color.name,
      size: product.size.name,
      category: product.category.name,
      brand: { "@type": "Brand", name: siteConfig.fullName },
      url: productUrl,
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: "BRL",
        price,
        availability: product.isArchived ? "https://schema.org/Discontinued" : "https://schema.org/InStock",
        itemCondition: "https://schema.org/UsedCondition",
        seller: { "@type": "Organization", name: siteConfig.fullName },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: base },
        { "@type": "ListItem", position: 2, name: product.category.name, item: `${base}/category/${product.categoryId}` },
        { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
      ],
    },
  ];
  const jsonLdScript = (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );

  if (mappedProduct.isArchived === true) {
    return (
      <div className="relative mt-20">
        {jsonLdScript}
        <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center text-center px-4">
          <div className="bg-background p-6 rounded-lg shadow-xl max-w-md">
            <h1 className="text-xl font-semibold mb-4">
              Este produto está indisponível no momento.
            </h1>
            <p>
              Para mais informações, entre em{" "}
              <a href="/contact" className="text-blue-600 underline font-medium">
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
          bookings={bookings}
        />
      </div>
    );
  }

  return (
    <div className="mt-20">
      {jsonLdScript}
      <ProductClient
        userId={userId}
        wishlist={isInWishlist}
        product={mappedProduct}
        suggestedProducts={mappedSuggestedProducts}
        bookings={bookings}
      />
    </div>
  );
};

export default page;