/* eslint-disable react-hooks/rules-of-hooks */
import { useUserId } from "@/data/hooks/use-current-id";
import { db } from "@/lib/db";
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  context: { params: Promise<{  colorId: string }> }
) {
  try {
    const { colorId } = await context.params;


    if (!colorId) {
      return new NextResponse("Color ID is required", { status: 400 });
    }


    const color = await db.color.findUnique({
      where: {
        id: colorId,
       
      },
    });

    return NextResponse.json(color);
  } catch (error) {
    console.log("[COLOR_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ storeId: string, colorId: string }> }
) {
  try {
    const userId = await useUserId(req);
    const body = await req.json();
    const { colorName, value } = body;
    const { colorId, storeId } = await context.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!colorName) {
      return new NextResponse("Name is required", { status: 400 });
    }
    if (!value) {
      return new NextResponse("Value is required", { status: 400 });
    }

    if (!colorId) {
      return new NextResponse("color ID is required", { status: 400 });
    }

       const storeByUserId = await db.store.findFirst({
        where: {
            id: storeId,
        }
    });

    if(!storeByUserId) {
        return new NextResponse("Unauthorized", {status: 403});
    }
    

    const color = await db.color.updateMany({
      where: {
        id: colorId,
      },
      data: {
       name: colorName,
       value,
      },
    });

    return NextResponse.json(color);
  } catch (error) {
    console.log("[SIZE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ storeId: string, colorId: string }> }
) {
  try {
    const userId = await useUserId(req);
    const { storeId, colorId } = await context.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!colorId) {
      return new NextResponse("color ID is required", { status: 400 });
    }

           const storeByUserId = await db.store.findFirst({
        where: {
            id: storeId,
        }
    });

    if(!storeByUserId) {
        return new NextResponse("Unauthorized", {status: 403});
    }

    const color = await db.color.deleteMany({
      where: {
        id: colorId,
       
      },
    });

    return NextResponse.json(color);
  } catch (error) {
    console.log("[COLOR_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

