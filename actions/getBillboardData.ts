"use server";

import { db } from "@/lib/db";

function sample<T>(base: T[], amount: number): T[] {
  const arr = [...base];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, amount);
}

export const getBillboardData = async () => {
  const billboards = await db.billboard.findMany({
    select: {
      id: true,
      label: true,
      subtitle: true,
      description: true,
      imageUrl: true,
      storeId: true,
      createdAt: true,
      updatedAt: true,
      callToAction: { select: { href: true, text: true } },
      categories: {
        select: {
          id: true,
          name: true,
          products: {
            where: { isArchived: false, isFeatured: true, siteVisible: true },
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              isFeatured: true,
              isArchived: true,
              siteVisible: true,
              originalPrice: true,
              isOnlyRental: true,
              rentalValue: true,
              rating: true,
              description: true,
              reviewCount: true,
              category: { select: { id: true, name: true } },
              size: { select: { id: true, name: true, value: true } },
              color: { select: { id: true, name: true, value: true } },
              images: { select: { id: true, url: true } },
            },
          },
        },
      },
    },
  });

  // Filtrar apenas billboards que possuem ao menos 1 produto visível em qualquer categoria
  const filteredBillboards = billboards.filter((bb) =>
    bb.categories.some((cat) =>
      cat.products.some((p) => p.siteVisible === true)
    )
  );

  const billboardData = filteredBillboards.map((bb) => {
    const categories = bb.categories.map((cat) => {
      // O primeiro produto real da categoria
      const firstProduct = cat.products[0];
      // Produtos embaralhados para exibição
      const selected = sample(cat.products, 3);
      return {
        id: cat.id,
        name: cat.name,
        products: selected.map((p) => ({
          id: p.id,
          sku: p.sku ?? undefined,
          name: p.name,
          price: Number(p.price),
          isFeatured: p.isFeatured,
          isArchived: p.isArchived,
          siteVisible: p.siteVisible ?? true,
          originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
          rating: p.rating ?? undefined,
          description: p.description ?? undefined,
          reviewCount: p.reviewCount ?? undefined,
          category: { id: p.category.id, name: p.category.name },
          size: { id: p.size.id, name: p.size.name, value: p.size.value },
          color: { id: p.color.id, name: p.color.name, value: p.color.value },
          images: p.images.map((img) => ({ id: img.id, url: img.url })),
        })),
        highlightProduct: firstProduct
          ? {
              id: firstProduct.id,
              sku: firstProduct.sku ?? undefined,
              name: firstProduct.name,
              price: Number(firstProduct.price),
              isFeatured: firstProduct.isFeatured,
              isArchived: firstProduct.isArchived,
              siteVisible: firstProduct.siteVisible ?? true,
              originalPrice: firstProduct.originalPrice ? Number(firstProduct.originalPrice) : undefined,
              rating: firstProduct.rating ?? undefined,
              description: firstProduct.description ?? undefined,
              reviewCount: firstProduct.reviewCount ?? undefined,
              isOnlyRental: firstProduct.isOnlyRental ?? false,
              rentalValue: firstProduct.rentalValue ? Number(firstProduct.rentalValue) : 0,
              category: { id: firstProduct.category.id, name: firstProduct.category.name },
              size: { id: firstProduct.size.id, name: firstProduct.size.name, value: firstProduct.size.value },
              color: { id: firstProduct.color.id, name: firstProduct.color.name, value: firstProduct.color.value },
              images: firstProduct.images.map((img) => ({ id: img.id, url: img.url })),
            }
          : null,
      };
    });

    // O produto em destaque do primeiro grupo de categorias
    const highlightProduct = categories[0]?.highlightProduct ?? null;

    return {
      id: bb.id,
      title: bb.label,
      subtitle: bb.subtitle ?? undefined,
      description: bb.description ?? undefined,
      imageUrl: bb.imageUrl,
      storeId: bb.storeId,
      createdAt: bb.createdAt,
      updatedAt: bb.updatedAt,
      callToAction: bb.callToAction
        ? { text: bb.callToAction.text ?? undefined, href: bb.callToAction.href ?? undefined }
        : undefined,
      categories,
      highlightProduct,
    };
  });

  return { billboardData };
};