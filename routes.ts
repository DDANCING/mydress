/**
 * Verifica se uma rota é pública, incluindo rotas dinâmicas
 */
export function isPublicRoute(path: string) {
  return publicRoutes.some((route) => {
    if (route.includes(":")) {

      const regex = new RegExp("^" + route.replace(/:[^/]+/g, "[^/]+") + "$", "i");
      return regex.test(path);
    }
    return route === path;
  });
}
/**
 * an array of routes that are accessible to the public
 * these routes do not require authentication
 * @type {string[]}
 */

export const publicRoutes = [
  "/", 
  "/auth/new-verification",
  "/api/uploadthing",
  "/api/webhook",
  "/api/products",
  "/api/products/:productId/availability",
  "/api/webhooks/stripe",
  "/api/auth/callback",
  "/api/coupons",
  "/api/cron/weekly-report",
  "/api/synapse/auth",
  "/api/synapse/data",
  "/api/synapse/financial",
  "/api/synapse/sales",
  "/api/synapse/docs",
  "/api/n8n/functions/activate-buyers",
  "/api/n8n/functions/get-non-effected-buyers",
  "/cart",
  "/products",
  "/product/:productId",
  "/category/:categoryId",
  "/color/:colorId",
  "/category",
  "/color",
  "/bio",  
  "/policies",
  "/faq",
  "/payment-methods",
  "/contact",
];
/**
 * APIs que qualquer cliente logada pode usar (cada rota confere se o dado é dela).
 * Todas as outras APIs fora de publicRoutes são exclusivas da equipe (ADMIN, OWNER, SELLER).
 */
export const customerApiRoutes = [
  "/api/store/orders",
  "/api/checkout",
  "/api/testimonials",
  "/api/user/image",
  "/api/users/:email/addresses",
];

export const staffRoles = ["ADMIN", "OWNER", "SELLER"];

export function matchesRoute(path: string, routes: string[]) {
  return routes.some((route) => {
    if (route.includes(":")) {
      const regex = new RegExp("^" + route.replace(/:[^/]+/g, "[^/]+") + "$", "i");
      return regex.test(path);
    }
    return route === path;
  });
}

/**
 * an array of routes that are used for authentication
 * these routes will redirect logged in users to /settings
 * @type {string[]}
 */

export const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/auth/reset",
  "/auth/new-password"
];

/**
 * the prefix for API authentication routes
 * routes that start with this prefix are user for API autentication only
 * @type {string}
 */

export const apiAuthPrefix = "/api/auth";


/**
 * the default redirect route path after logging in
 * @type {string}
 */

export const DEFAULT_LOGIN_REDIRECT = "/";
