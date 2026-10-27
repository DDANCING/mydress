"use server";

import { db } from "@/lib/db";

export const getProductWithSuggestions = async (productId: string) => {
  const product = await db.product.findFirst({
    where: {
      id: productId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      images: {
        select: {
          id: true,
          url: true,
        },
      },
      color: {
        select: {
          id: true,
          name: true,
          value: true,
        },
      },
      size: {
        select: {
          id: true,
          name: true,
          value: true,
        },
      },
    },
  });

  if (!product) {
    return {
      product: null,
      suggestedProducts: [],
    };
  }

  const suggested = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: productId },
      isArchived: false,
      siteVisible: true,
    },
    take: 6,
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      images: {
        select: {
          id: true,
          url: true,
        },
      },
      color: {
        select: {
          id: true,
          name: true,
          value: true,
        },
      },
      size: {
        select: {
          id: true,
          name: true,
          value: true,
        },
      },
    },
  });

const formattedProduct = {
  ...product,
  price: Number(product.price),
  sku: product.sku !== null ? product.sku : undefined,
  originalPrice: product.originalPrice !== null ? Number(product.originalPrice) : null,
  rating: product.rating !== null ? product.rating : undefined,
  reviewCount: product.reviewCount !== null ? product.reviewCount : undefined,
  description: product.description ?? undefined,
};

 const formattedSuggested = suggested.map((p) => ({
  ...p,
  price: Number(p.price),
  sku: p.sku !== null ? p.sku : undefined,
  originalPrice: p.originalPrice !== null ? Number(p.originalPrice) : null,
  rating: p.rating !== null ? p.rating : undefined,
  reviewCount: p.reviewCount !== null ? p.reviewCount : undefined,
  description: p.description ?? undefined,
}));

  return {
    product: formattedProduct,
    suggestedProducts: formattedSuggested,
  };
};
