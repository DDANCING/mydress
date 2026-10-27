"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function subscribeToNewsletter(email: string) {
  try {
    if (!email || !email.includes("@")) {
      return { error: "Email inválido" };
    }

    // Verificar se o email já existe
    const existingBuyer = await db.buyer.findFirst({
      where: {
        OR: [
          { email },
        ]
      }
    });

    if (existingBuyer && existingBuyer.email === email) {
      return { error: "Este email já está na newsletter." };
    }

    // Obter o usuário logado
    const session = await auth();
    const userName = session?.user?.name || "Visitante";
   

    // Criar o buyer
    const buyer = await db.buyer.create({
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

    return { success: true, buyer };

  } catch (error: any) {
   new NextResponse('[NEWSLETTER_SUBSCRIBE]', error);
    return { error: "Erro interno do servidor" };
  }
}
