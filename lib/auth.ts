import { NextResponse } from "next/server";
import { Session } from "next-auth";
import { UserRole } from "@prisma/client";

import { auth } from "@/auth";

export const STAFF_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.OWNER, UserRole.SELLER];

export const isStaff = (session: Session | null) =>
  !!session?.user?.role && STAFF_ROLES.includes(session.user.role);

export const currentRole =  async() => {
  const session = await auth();

  return session?.user?.role;
}
export const currentUser =  async() => {
  const session = await auth();

  return session?.user;
}

// Para rotas de API do painel: devolve a resposta de erro quando quem chama não é da equipe
export const requireStaff = async () => {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthenticated", { status: 401 });
  if (!isStaff(session)) return new NextResponse("Forbidden", { status: 403 });
  return null;
};

// Para server actions do painel: actions podem ser chamadas de qualquer página, então cada uma confere o cargo
export const assertStaff = async () => {
  const session = await auth();
  if (!isStaff(session)) throw new Error("Acesso restrito à equipe");
  return session!;
};
