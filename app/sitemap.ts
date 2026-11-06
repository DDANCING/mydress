import type { MetadataRoute } from "next";
import { occasions } from "@/lib/site-content";
import { siteConfig } from "@/lib/site-config";

const pages: [string, number][] = [
  ["", 1],
  ["/ocasioes", 0.9],
  ["/colecao-cris-mazzonetto", 0.9],
  ["/acervo", 0.9],
  ["/experiencia", 0.7],
  ["/agendar", 0.8],
  ["/policies", 0.3],
  ...occasions.map((occasion): [string, number] => [`/ocasioes/${occasion.slug}`, 0.8]),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  return pages.map(([path, priority]) => ({ url: `${base}${path}`, priority }));
}
