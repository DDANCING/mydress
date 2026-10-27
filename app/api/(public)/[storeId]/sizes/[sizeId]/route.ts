/* eslint-disable react-hooks/rules-of-hooks */
import { useUserId } from "@/data/hooks/use-current-id";
import { db } from "@/lib/db";
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  context: { params: Promise<{  sizeId: string }> }
) {
  try {
    const { sizeId } = await context.params;


    if (!sizeId) {
      return new NextResponse("Size ID is required", { status: 400 });
    }


    const size = await db.size.findUnique({
      where: {
        id: sizeId,
      },
    });

    return NextResponse.json(size);
  } catch (error) {
    console.log("[SIZE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ storeId: string, sizeId: string }> }
) {
  try {
    const userId = await useUserId(req);
    const body = await req.json();
    const { sizeName, value } = body;
    const { sizeId, storeId } = await context.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!sizeName) {
      return new NextResponse("Name is required", { status: 400 });
    }
    if (!value) {
      return new NextResponse("Value is required", { status: 400 });
    }

    if (!sizeId) {
      return new NextResponse("Size ID is required", { status: 400 });
    }

       const storeByUserId = await db.store.findFirst({
        where: {
            id: storeId,
        }
    });

    if(!storeByUserId) {
        return new NextResponse("Unauthorized", {status: 403});
    }
    

    const size = await db.size.updateMany({
      where: {
        id: sizeId,
      },
      data: {
       name: sizeName,
       value,
      },
    });

    return NextResponse.json(size);
  } catch (error) {
    console.log("[SIZE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ storeId: string, sizeId: string }> }
) {
  try {
    const userId = await useUserId(req);
    const { storeId, sizeId } = await context.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!sizeId) {
      return new NextResponse("size ID is required", { status: 400 });
    }

           const storeByUserId = await db.store.findFirst({
        where: {
            id: storeId,

        }
    });

    if(!storeByUserId) {
        return new NextResponse("Unauthorized", {status: 403});
    }

    const size = await db.size.deleteMany({
      where: {
        id: sizeId,
       
      },
    });

    return NextResponse.json(size);
  } catch (error) {
    console.log("[SIZE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

