import { db } from "@/lib/db";

// Contas antigas podem ter sido gravadas com maiúsculas: a busca ignora caixa
export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } },
    });

    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({ where: { id } });

    return user;
  } catch {
    return null;
  }
};
