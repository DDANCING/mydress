// Este é o config que o Next carrega (.mjs tem prioridade sobre next.config.ts)

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    // Só HTTPS e só estes hosts podem passar pelo otimizador de imagens
    remotePatterns: ["i.imgur.com", "utfs.io", "res.cloudinary.com", "placehold.co"].map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
  headers: async () => [
    { source: "/(.*)", headers: securityHeaders },
  ],
};

export default nextConfig;
