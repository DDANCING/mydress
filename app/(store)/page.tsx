
import { getBillboardData } from "@/actions/getBillboardData";
import { db } from "@/lib/db";
import { registerVisitor } from "@/actions/register-visitor";
import { auth } from "@/auth";
import { getTestimonials } from "@/actions/get-testimonials";
import { getProducts } from "@/actions/getProducts";
import { HomeClient } from "./_components/home-client";
import { siteConfig } from "@/lib/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "My Dress Floripa | Aluguel de vestidos de festa em Florianópolis" },
  description: "Aluguel de vestidos de festa em Florianópolis. Vestidos para madrinhas, formaturas, casamentos e eventos. Escolha online e prove no nosso provador em Coqueiros.",
  alternates: { canonical: "/" },
};

// Dados estruturados para o Google mostrar a loja (endereço, telefone, redes) na busca e no Maps
const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: siteConfig.fullName,
  legalName: siteConfig.legalName,
  description: siteConfig.tagline,
  url: siteConfig.url,
  logo: `${siteConfig.url}/icons/icon-512.png`,
  image: `${siteConfig.url}/og-image.png`,
  telephone: `+${siteConfig.whatsapp.number}`,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.address.street,
    addressLocality: siteConfig.address.city,
    addressRegion: siteConfig.address.state,
    postalCode: siteConfig.address.zip,
    addressCountry: "BR",
  },
  areaServed: siteConfig.address.city,
  sameAs: [siteConfig.instagram.url],
};

export default async function Home() {
  const { billboardData } = await getBillboardData();
  await registerVisitor();
  
  let testimonialsRaw = await getTestimonials();
  let testimonials = testimonialsRaw?.map(t => ({
    ...t,
    product: t.product
      ? {
          ...t.product,
          rentalValue:
            t.product.rentalValue && typeof t.product.rentalValue === "object" && "toNumber" in t.product.rentalValue && typeof (t.product.rentalValue as any).toNumber === "function"
              ? (t.product.rentalValue as any).toNumber()
              : (typeof t.product.rentalValue === "number" ? t.product.rentalValue : 0),
          isOnlyRental: t.product.isOnlyRental ?? false,
        }
      : t.product,
  })) ?? [];
  
  const user = await auth();

  const billboardProductIds = Array.isArray(billboardData)
    ? billboardData
        .map(b => b.highlightProduct?.id)
        .filter((id): id is string => typeof id === "string" && !!id)
    : [];

  const wishlistItems = await db.wishlist.findMany({
    where: {
      userId: user?.user.id,
      productId: { in: billboardProductIds },
    },
  });

  const wishlistProductIds = new Set(wishlistItems.map(item => item.productId));

  const billboardWithWishlist = billboardData.map((item) => ({
    ...item,
    highlightProduct: item.highlightProduct
      ? {
          ...item.highlightProduct,
          isInWishlist: wishlistProductIds.has(item.highlightProduct.id),
          siteVisible: item.highlightProduct.siteVisible ?? true,
          rentalValue: item.highlightProduct.rentalValue ?? 0,
          isOnlyRental: item.highlightProduct.isOnlyRental ?? false,
        }
      : null,
  }));

  const ProductsRaw = await getProducts({ name: "" });
  // Converte todos os campos Decimal para number
  const Products = Array.isArray(ProductsRaw)
    ? ProductsRaw.map((p) => ({
        ...p,
        price:
          p.price && typeof p.price === "object" && "toNumber" in p.price && typeof (p.price as any).toNumber === "function"
            ? (p.price as any).toNumber()
            : (typeof p.price === "number" ? p.price : 0),
        originalPrice:
          p.originalPrice && typeof p.originalPrice === "object" && "toNumber" in p.originalPrice && typeof (p.originalPrice as any).toNumber === "function"
            ? (p.originalPrice as any).toNumber()
            : (typeof p.originalPrice === "number" ? p.originalPrice : 0),
        rentalValue:
          p.rentalValue && typeof p.rentalValue === "object" && "toNumber" in p.rentalValue && typeof (p.rentalValue as any).toNumber === "function"
            ? (p.rentalValue as any).toNumber()
            : (typeof p.rentalValue === "number" ? p.rentalValue : 0),
        rating: p.rating === null ? undefined : p.rating,
        description: p.description === null ? undefined : p.description,
        reviewCount: p.reviewCount === null ? undefined : p.reviewCount,
        sku: p.sku === null ? undefined : p.sku,
      }))
    : [];

  const firstTestimonialProduct = testimonials?.[0]?.product
    ? {
        ...testimonials[0].product,
        rentalValue:
          testimonials[0].product.rentalValue && typeof testimonials[0].product.rentalValue === "object" && "toNumber" in testimonials[0].product.rentalValue && typeof (testimonials[0].product.rentalValue as any).toNumber === "function"
            ? (testimonials[0].product.rentalValue as any).toNumber()
            : (typeof testimonials[0].product.rentalValue === "number" ? testimonials[0].product.rentalValue : 0),
      }
    : undefined;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd).replace(/</g, "\\u003c") }}
      />
      <HomeClient
        billboardData={billboardWithWishlist}
        products={Products}
        testimonials={testimonials}
        firstTestimonialProduct={firstTestimonialProduct}
      />
    </>
  );
}