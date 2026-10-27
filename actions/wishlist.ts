"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

// Adiciona ou remove produto da wishlist
export async function toggleWishlist(productId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Usuário não autenticado");

  const existing = await db.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await db.wishlist.delete({
      where: { id: existing.id },
    });
    return { action: "removed" };
  } else {
    await db.wishlist.create({
      data: { userId, productId },
    });
    return { action: "added" };
  }
}

// Busca se produto está na wishlist do usuário logado
export async function isInWishlist(productId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return false;

  const exists = await db.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  return !!exists;
}