"use server";

import { db } from "@/lib/db";

export async function getTestimonials() {
  const testimonialsRaw = await db.testimonial.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, image: true } },
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          images: { select: { id: true, url: true }, take: 1 }, // <-- fix aqui
          isFeatured: true,
          isArchived: true,
          siteVisible: true,
          isOnlyRental: true,
          rentalValue: true,
          category: { select: { id: true, name: true } },
          color: { select: { id: true, name: true, value: true } },
          size: { select: { id: true, name: true, value: true } },
          reviewCount: true,
          rating: true,
          description: true,
          originalPrice: true,
          storeId: true,
        }
      }
    },
  });

  return testimonialsRaw.map(item => ({
    id: item.id,
    userId: item.userId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    productId: item.productId,
    stars: item.stars,
    quote: item.quote,
    name: item.user?.name || "Usuário",
    designation: "Cliente",
    src: item.user?.image || "/placeholder-user.jpg",
    product: {
      id: item.product.id,
      name: item.product.name,
      price: typeof item.product.price === "object" && "toNumber" in item.product.price
        ? item.product.price.toNumber()
        : item.product.price,
      images: item.product.images, // agora images tem id e url!
      isFeatured: item.product.isFeatured,
      isArchived: item.product.isArchived,
      siteVisible: item.product.siteVisible,
      category: item.product.category,
      color: item.product.color,
      size: item.product.size,
      rentalValue: item.product.rentalValue ?? 0,
      isOnlyRental: item.product.isOnlyRental ?? false,
      reviewCount: item.product.reviewCount ?? undefined,
      rating: item.product.rating ?? undefined,
      description: item.product.description ?? undefined,
      originalPrice: item.product.originalPrice
        ? (typeof item.product.originalPrice === "object" && "toNumber" in item.product.originalPrice
            ? item.product.originalPrice.toNumber()
            : item.product.originalPrice)
        : undefined,
      storeId: item.product.storeId,
    },
  }));
}