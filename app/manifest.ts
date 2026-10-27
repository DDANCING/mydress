import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

// Cores da paleta da loja (globals.css) em hex, exigido pelo manifest
const IVORY = "#fbf7f2";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.fullName,
    short_name: siteConfig.name,
    description: `${siteConfig.tagline}. Vestidos para madrinhas, formaturas, casamentos e festas, com provador em ${siteConfig.address.district}.`,
    start_url: "/?utm_source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: IVORY,
    theme_color: IVORY,
    lang: "pt-BR",
    dir: "ltr",
    categories: ["shopping", "lifestyle", "fashion"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Ver vestidos",
        short_name: "Vestidos",
        description: "Todos os vestidos disponíveis para aluguel",
        url: "/products",
        icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Minha sacola",
        short_name: "Sacola",
        description: "Vestidos que você separou",
        url: "/cart",
        icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Fale com a gente",
        short_name: "Contato",
        description: "WhatsApp, Instagram e endereço do provador",
        url: "/contact",
        icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Página inicial da My Dress Floripa",
      },
      {
        src: "/screenshots/mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Página inicial no celular",
      },
    ],
    prefer_related_applications: false,
  };
}
