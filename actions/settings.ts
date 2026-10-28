"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { SettingsSchema } from "@/schemas";
import { db } from "@/lib/db";
import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { RATE_LIMITS, rateLimit, tooManyAttemptsMessage } from "@/lib/rate-limit";


export const settings = async (
  input: z.infer<typeof SettingsSchema>
) => {
  // Server action aceita qualquer objeto: valida e usa só os campos do schema (nada de role, emailVerified...)
  const parsed = SettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }
  const values = parsed.data;

  const user = await currentUser();

  if (!user) {
    return { error: "Unauthorized" }
  }

  const dbUser = await getUserById(user.id as string);

  if(!dbUser) {
    return { error: "Unauthorized" }
  }
  if (user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
    values.isTwoFactorEnabled = undefined;
  }

 if ( values.email && values.email !== user.email?.toLowerCase()) {
   const existingUser = await getUserByEmail(values.email)

   if (existingUser && existingUser.id !== user.id) {
    return { error: "Email alredy in use! "}
   }

   const sending = await rateLimit(`email:change:${user.id}`, RATE_LIMITS.sendEmail);
   if (!sending.success) {
    return { error: tooManyAttemptsMessage(sending) }
   }

   const verificationToken = await generateVerificationToken(
    values.email
   );
   await sendVerificationEmail(
    verificationToken.email,
    verificationToken.token,
   );

   return { success: "Verification email sent!"}
 }

 // Só grava senha nova já com hash (nunca o texto enviado pelo formulário)
 let hashedPassword: string | undefined;
 if (values.password && values.newPassword && dbUser.password) {
  const attempt = await rateLimit(`password:change:${user.id}`, RATE_LIMITS.passwordChange);
  if (!attempt.success) {
    return { error: tooManyAttemptsMessage(attempt) }
  }

  const passwordsMatch = await bcrypt.compare(
    values.password,
    dbUser.password,
  );

  if (!passwordsMatch) {
    return { error: "Incorrect password!"}
  }

  hashedPassword = await bcrypt.hash(
    values.newPassword,
    10,
  );
 }

  await db.user.update({
    where: { id: dbUser.id },
    data : {
      name: values.name,
      isTwoFactorEnabled: values.isTwoFactorEnabled,
      password: hashedPassword,
    }
  });

   
  return {success: "Settings Update"}
}