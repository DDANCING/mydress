/* eslint-disable react-hooks/rules-of-hooks */
import { auth } from "@/auth";
import { useUserId } from "@/data/hooks/use-current-id";
import { db } from "@/lib/db";
import { NextResponse } from "next/server"


export async function PATCH(
  req: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  try {
    const userId = await useUserId(req);
    const body = await req.json();
    const { name } = body;
    const { storeId } = await context.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if (!storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    const store = await db.store.updateMany({
      where: {
        id: storeId,
      },
      data: {
        name,
      },
    });

    return NextResponse.json(store);
  } catch (error) {
    console.log("[STORE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  try {
    const userId = await useUserId(req);
    const { storeId } = await context.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    const store = await db.store.deleteMany({
      where: {
        id: storeId,
      },
    });

    return NextResponse.json(store);
  } catch (error) {
    console.log("[STORE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
