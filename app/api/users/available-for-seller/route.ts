import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Buscar usuários que não têm um seller associado
    const usersWithoutSeller = await db.user.findMany({
      where: {
        seller: null
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(usersWithoutSeller);
  } catch (error) {
    console.log('[USERS_WITHOUT_SELLER_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
