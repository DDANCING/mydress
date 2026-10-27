import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toast } from "sonner";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const sellers = await db.seller.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(sellers);
  } catch (error) {
    console.log('[SELLERS_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userId, name, document } = body;

    if (!userId || !name) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verificar se o usuário já tem um seller
    const existingSeller = await db.seller.findFirst({
      where: {
        OR: [
          { userId },
          { document }
        ]
      }
    });

    if (existingSeller) {
      return new NextResponse("User already has a seller profile", { status: 400 });
    }

    const seller = await db.seller.create({
      data: {
        userId,
        name,
        document,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(seller);
  } catch (error) {
    console.log('[SELLERS_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
