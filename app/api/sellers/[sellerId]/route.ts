import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ sellerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sellerId } = await context.params;
    const body = await req.json();
    const { name, document, isActive } = body;

    if (!sellerId) {
      return new NextResponse("Seller ID required", { status: 400 });
    }

if (document) {
  const existingSeller = await db.seller.findFirst({
    where: {
      document,
      NOT: { id: sellerId }
    }
  });

  if (existingSeller) {
    return new NextResponse("Já existe um vendedor para este documento", { status: 400 });
  }
}
    const seller = await db.seller.update({
      where: {
        id: sellerId,
      },
      data: {
        name,
        document: document || undefined,
        isActive,
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
    console.log('[SELLER_PATCH]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ sellerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sellerId } = await context.params;

    if (!sellerId) {
      return new NextResponse("Seller ID required", { status: 400 });
    }

    const seller = await db.seller.delete({
      where: {
        id: sellerId,
      },
    });

    return NextResponse.json(seller);
  } catch (error) {
    console.log('[SELLER_DELETE]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
