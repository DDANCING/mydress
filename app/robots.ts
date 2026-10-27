import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Áreas privadas, de conta e de checkout não devem aparecer no Google
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard",
          "/newstore",
          "/profile",
          "/cart",
          "/wishlist",
          "/order/",
          "/search/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
