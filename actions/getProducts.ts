import { db } from "@/lib/db";

interface GetProductsParams {
  name?: string;
}

export async function getProducts({ name }: GetProductsParams) {

  const products = await db.product.findMany({
    where: {
      isArchived: false,
      siteVisible: true,
      ...(name
        ? {
            OR: [
              {
                name: {
                  contains: name,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: name,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
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
      sku: true,
      rentalValue: true,
      isOnlyRental: true,
      wishlists: {
        select: {
          id: true,
          userId: true,
        },
      },
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
      createdAt: true,
    },
  });

  return products;
}