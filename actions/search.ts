"use server"

import { SafeProduct } from "@/app/types"
import { db } from "@/lib/db"
import { Product, Category, Color, Size } from "@prisma/client"

export type SearchResults = {
  products: SafeProduct[]
  categories: Category[]
  colors: Color[]
  sizes: Size[]
}

export async function getGlobalSearchResults(query: string): Promise<SearchResults> {
  if (!query.trim()) {
    return {
      products: [],
      categories: [],
      colors: [],
      sizes: [],
    }
  }

  const [products, categories, colors, sizes] = await Promise.all([
    db.product.findMany({
       where: {
    name: { contains: query, mode: "insensitive" },
    isArchived: false,
    siteVisible: true,
  },
  take: 5,
  include: {
    color: true,
    size: true,
  },
    }),
    db.category.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
      take: 5,
    }),
    db.color.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
      take: 5,
    }),
    db.size.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
      take: 5,
    }),
  ])

  const safeProducts: SafeProduct[] = products.map((product) => ({
    ...product,
    price: product.price.toNumber(),
    originalPrice: product.originalPrice?.toNumber() ?? null,
  }))

  return {
    products: safeProducts,
    categories,
    colors,
    sizes,
  }
}
