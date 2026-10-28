"use server";
import * as z from "zod";
import bcrypt from "bcryptjs";

import { signIn } from "@/auth"
import { LoginSchema } from "@/schemas";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import {
   sendVerificationEmail,
   sendTwoFactorTokenEmail
  } from "@/lib/mail";
import { AuthError } from "next-auth";
import { getUserByEmail } from "@/data/user";
import {
  generateTwoFactorToken,
  generateVerificationToken
} from "@/lib/tokens";
import { db } from "@/lib/db";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";
import {
  RATE_LIMITS,
  getClientIp,
  rateLimit,
  rateLimitAll,
  resetRateLimit,
  tooManyAttemptsMessage,
} from "@/lib/rate-limit";

// Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails têm conta
const INVALID_CREDENTIALS = "E-mail ou senha inválidos";

const isRedirect = (error: unknown) =>
  typeof (error as { digest?: unknown })?.digest === "string" &&
  (error as { digest: string }).digest.startsWith("NEXT_REDIRECT");

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null,
) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Preencha e-mail e senha corretamente" }
  }
  const { email, password, code } = validatedFields.data;

  const ip = await getClientIp();
  const emailKey = `login:email:${email}`;
  const attempt = await rateLimitAll([
    [`login:ip:${ip}`, RATE_LIMITS.loginIp],
    [emailKey, RATE_LIMITS.loginEmail],
  ]);
  if (!attempt.success) {
    return { error: tooManyAttemptsMessage(attempt) };
  }

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: INVALID_CREDENTIALS }
  }

  // Senha conferida antes de qualquer e-mail: sem ela ninguém dispara verificação ou código 2FA
  const passwordsMatch = await bcrypt.compare(password, existingUser.password);
  if (!passwordsMatch) {
    return { error: INVALID_CREDENTIALS }
  }

  if (!existingUser.emailVerified) {
    const sending = await rateLimit(`email:verification:${existingUser.email}`, RATE_LIMITS.sendEmail);
    if (!sending.success) {
      return { error: "Já enviamos o link de confirmação. Confira sua caixa de entrada e o spam." };
    }

    const verificationToken = await generateVerificationToken(
      existingUser.email,
    );

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    return { success: "Confirmação de email enviada!" }
  }

  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (code) {
      const codeAttempt = await rateLimit(`login:2fa:${existingUser.email}`, RATE_LIMITS.twoFactorCode);
      if (!codeAttempt.success) {
        return { error: tooManyAttemptsMessage(codeAttempt) };
      }

      const twoFactorToken = await getTwoFactorTokenByEmail(
        existingUser.email
      );
      if (!twoFactorToken) {
        return { error: "Código inválido!"};
      }

      if (twoFactorToken.token !== code) {
        return { error: "Código inválido!"};
      }
      const hasExpired = new Date(twoFactorToken.expires) < new Date();

      if (hasExpired) {
        return {error: "Código expirado!"}
      }
      await db.twoFactorToken.delete({
        where: { id: twoFactorToken.id }
      });

      const existingConfirmation = await getTwoFactorConfirmationByUserId
      (
        existingUser.id
      );

      if (existingConfirmation) {
        await db.twoFactorConfirmation.delete({
          where: { id: existingConfirmation.id }
        })
      }

      await db.twoFactorConfirmation.create({
        data: {
          userId: existingUser.id,
        }
      });
      await resetRateLimit(`login:2fa:${existingUser.email}`);
    } else {
      const sending = await rateLimit(`email:2fa:${existingUser.email}`, RATE_LIMITS.sendEmail);
      if (!sending.success) {
        return { error: tooManyAttemptsMessage(sending) };
      }

      const twoFactorToken = await generateTwoFactorToken(existingUser.email)
      await sendTwoFactorTokenEmail(
        twoFactorToken.email,
        twoFactorToken.token
      );

      return {twoFactor: true}
    }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: INVALID_CREDENTIALS }

        default:
          return { error: "Não foi possível entrar. Tente novamente." }
      }
    }

    // O signIn bem-sucedido termina num redirect: libera o contador da conta
    if (isRedirect(error)) {
      await resetRateLimit(emailKey);
    }

    throw error;
  }
};
