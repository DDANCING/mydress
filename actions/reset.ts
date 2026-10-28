"use server"

import * as z from "zod";

import { ResetSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { sendPasswordResetEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/lib/tokens";
import { RATE_LIMITS, getClientIp, rateLimitAll, tooManyAttemptsMessage } from "@/lib/rate-limit";

// Resposta igual exista ou não a conta: o formulário não serve para descobrir e-mails cadastrados
const RESET_SENT = "Se este e-mail tiver uma conta, enviamos o link de redefinição.";

export const reset = async (values: z.infer<typeof ResetSchema>) => {
  const validatedFields = ResetSchema.safeParse(values);

  if(!validatedFields.success) {
    return { error: "Invalid email!" };
  }

  const { email } = validatedFields.data;

  const attempt = await rateLimitAll([
    [`reset:ip:${await getClientIp()}`, RATE_LIMITS.resetIp],
    [`email:reset:${email}`, RATE_LIMITS.sendEmail],
  ]);
  if (!attempt.success) {
    return { error: tooManyAttemptsMessage(attempt) };
  }

  const existingUser = await getUserByEmail(email);

  if(!existingUser) {
    return { success: RESET_SENT };
  }

  const passwordResetToken = await generatePasswordResetToken(email);
  await sendPasswordResetEmail(
    passwordResetToken.email,
    passwordResetToken.token,
  )

  return { success: RESET_SENT };
}