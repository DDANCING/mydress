"use server";

import bcrypt from "bcrypt";
import * as z from "zod";

import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { RATE_LIMITS, getClientIp, rateLimit, tooManyAttemptsMessage } from "@/lib/rate-limit";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" }
  }

  const { email, password, name } = validatedFields.data;

  // Barra criação de contas em massa (cada cadastro dispara um e-mail)
  const attempt = await rateLimit(`register:ip:${await getClientIp()}`, RATE_LIMITS.register);
  if (!attempt.success) {
    return { error: tooManyAttemptsMessage(attempt) }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "Email already in use!" }
  }

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    }
  })

  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(
    verificationToken.email,
    verificationToken.token,
  )

  return { success: "Confirmação por email enviada!" }
};