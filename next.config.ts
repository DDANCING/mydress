import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Pass all other options to withSerwist
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"],
  },
  ...withSerwist({
    swSrc: "src/sw.ts",
    swDest: "public/sw.js",
  }),
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
    {
      source: "/manifest.json",
      headers: [
        { key: "Cache-Control", value: "public, max-age=3600, must-revalidate" },
      ],
    },
    {
      source: "/icons/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
