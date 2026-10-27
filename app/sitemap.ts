import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/site-config";

// Regera o sitemap a cada hora para incluir vestidos novos
export const revalidate = 3600;

const staticPages: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/products", priority: 0.9, changeFrequency: "daily" },
  { path: "/category", priority: 0.8, changeFrequency: "weekly" },
  { path: "/color", priority: 0.7, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/payment-methods", priority: 0.4, changeFrequency: "yearly" },
  { path: "/policies", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  const pages: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${base}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  try {
    const [products, categories, colors] = await Promise.all([
      db.product.findMany({
        where: { isArchived: false, siteVisible: true },
        select: { id: true, updatedAt: true, images: { select: { url: true }, take: 1 } },
      }),
      db.category.findMany({ select: { id: true, updatedAt: true } }),
      db.color.findMany({ select: { id: true, updatedAt: true } }),
    ]);

    return [
      ...pages,
      ...products.map((product) => ({
        url: `${base}/product/${product.id}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        images: product.images.map((image) => image.url),
      })),
      ...categories.map((category) => ({
        url: `${base}/category/${category.id}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...colors.map((color) => ({
        url: `${base}/color/${color.id}`,
        lastModified: color.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    // Sem banco disponível (ex.: build), publica ao menos as páginas fixas
    console.error("[SITEMAP]", error);
    return pages;
  }
}
