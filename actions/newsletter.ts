"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { RATE_LIMITS, getClientIp, rateLimit, tooManyAttemptsMessage } from "@/lib/rate-limit";

export async function subscribeToNewsletter(rawEmail: string) {
  try {
    const email = String(rawEmail ?? "").trim().toLowerCase();
    if (!email || !email.includes("@") || email.length > 254) {
      return { error: "Email inválido" };
    }

    const attempt = await rateLimit(`newsletter:ip:${await getClientIp()}`, RATE_LIMITS.newsletter);
    if (!attempt.success) {
      return { error: tooManyAttemptsMessage(attempt) };
    }

    // Verificar se o email já existe
    const existingBuyer = await db.buyer.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (existingBuyer) {
      return { error: "Este email já está na newsletter." };
    }

    // Obter o usuário logado
    const session = await auth();
    const userName = session?.user?.name || "Visitante";
   

    // Criar o buyer
    await db.buyer.create({
      data: {
        fullName: userName,
        email: email,
        phone: "",
        address: "",
        city: "",
        state: "",
        neighborhood: "",
        number: "",
        cep: "",
        complement: "",
      }
    });

    // Não devolve o registro criado: a resposta vai para o navegador
    return { success: true };

  } catch (error: any) {
    console.error("[NEWSLETTER_SUBSCRIBE]", error);
    return { error: "Erro interno do servidor" };
  }
}
