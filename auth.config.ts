import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // Usado só pelo middleware (auth.ts tem os próprios callbacks): expõe id e cargo que já estão no token
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.role) session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;