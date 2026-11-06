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
  // A compra online saiu do site público: links antigos e do Google levam para a página equivalente.
  redirects: async () => [
    ...[
      ["/products", "/acervo"],
      ["/product/:id", "/acervo"],
      ["/color", "/acervo"],
      ["/color/:id", "/acervo"],
      ["/category", "/ocasioes"],
      ["/category/:id", "/ocasioes"],
      ["/contact", "/agendar"],
      ["/faq", "/agendar"],
      ["/payment-methods", "/agendar"],
      ["/cart", "/"],
      ["/wishlist", "/"],
      ["/order/:path*", "/"],
      ["/profile/:path*", "/"],
      ["/testimonials/:path*", "/"],
    ].map(([source, destination]) => ({ source, destination, permanent: true })),
  ],
  headers: async () => [
    { source: "/(.*)", headers: securityHeaders },
  ],
};

export default nextConfig;
