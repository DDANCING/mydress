import authConfig from "./auth.config"
import NextAuth from "next-auth"
import { DEFAULT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, isPublicRoute, customerApiRoutes, matchesRoute, staffRoles } from "@/routes"

const { auth } = NextAuth(authConfig);

export default auth((req) => {
   const { nextUrl } = req; 
   const isLoggedIn = !!req.auth;

   const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
   const isPublic = isPublicRoute(nextUrl.pathname);
   const isAuthRoute = authRoutes.includes(nextUrl.pathname);

   if (isApiAuthRoute) {
      return;
   }

   if (isAuthRoute){
      if (isLoggedIn) {
        return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
      }
      return;
   }
   const isApiRoute = nextUrl.pathname.startsWith("/api/");

   // APIs: responde 401/403 em JSON (nada de redirect) e só libera o painel para a equipe
   if (isApiRoute && !isPublic) {
      if (!isLoggedIn) {
        return Response.json({ error: "Faça login para continuar" }, { status: 401 })
      }
      const role = req.auth?.user?.role as string | undefined;
      const isStaff = !!role && staffRoles.includes(role);
      if (!isStaff && !matchesRoute(nextUrl.pathname, customerApiRoutes)) {
        return Response.json({ error: "Acesso restrito à equipe" }, { status: 403 })
      }
      return;
   }

   if(!isLoggedIn && !isPublic){
      let callbackUrl = nextUrl.pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search
      } 

      const encodedCallbackUrl = encodeURIComponent(callbackUrl);

      return Response.redirect(new URL(
        `/auth/login?callbackUrl=${encodedCallbackUrl}`,
        nextUrl))
    }
    return;
 
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}