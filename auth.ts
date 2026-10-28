import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import authConfig from "@/auth.config";
import { getUserByEmail, getUserById } from "@/data/user";
import { LoginSchema } from "@/schemas";
import { UserRole } from "@prisma/client";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";
import { getAccountByUserId } from "./data/account";
import { RATE_LIMITS, getIpFromHeaders, rateLimitAll, resetRateLimit } from "@/lib/rate-limit";

export const { 
  handlers,
  auth, 
  signIn,
  signOut,
} = NextAuth({
  providers: [
    ...authConfig.providers,
    Credentials({
      async authorize(credentials, request) {
        const validatedFields = LoginSchema.safeParse(credentials);
        if (!validatedFields.success) return null;

        const { email, password } = validatedFields.data;

        // Também limita quem chama /api/auth/callback/credentials direto, sem passar pela action de login
        const ip = request?.headers ? getIpFromHeaders(request.headers) : "unknown";
        const emailKey = `auth:email:${email}`;
        const checks: Parameters<typeof rateLimitAll>[0] = [[emailKey, RATE_LIMITS.loginEmail]];
        if (ip !== "unknown") checks.push([`auth:ip:${ip}`, RATE_LIMITS.loginIp]);
        const attempt = await rateLimitAll(checks);
        if (!attempt.success) return null;

        const user = await getUserByEmail(email);
        if (!user?.password) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        await resetRateLimit(emailKey);
        return user;
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error", 
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      });
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return true;

      const existingUser = await getUserById(user.id as string);
      if (!existingUser?.emailVerified) return false;

      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);
        if (!twoFactorConfirmation) return false;

        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id }
        });
      }

      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }
      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
        session.user.name = token.name;
        session.user.email = token.email as string;
        session.user.isOAuth = token.isOAuth as boolean;
      }
      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);
      if (!existingUser) return token;

      const existingAccount = await getAccountByUserId(existingUser.id);
      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

      return token;
    }
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
});
