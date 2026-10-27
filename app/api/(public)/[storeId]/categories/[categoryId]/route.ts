/* eslint-disable react-hooks/rules-of-hooks */
import { useUserId } from "@/data/hooks/use-current-id";
import { db } from "@/lib/db";
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  context: { params: Promise<{  categoryId: string }> }
) {
  try {
    const { categoryId } = await context.params;


    if (!categoryId) {
      return new NextResponse("category ID is required", { status: 400 });
    }


    const category = await db.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.log("[CATEGORY_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ storeId: string, categoryId: string }> }
) {
  try {
    const userId = await useUserId(req);
    const body = await req.json();
    const { name, billboardId } = body;
    const { categoryId, storeId } = await context.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!name) {
      return new NextResponse("name is required", { status: 400 });
    }
    if (!billboardId) {
      return new NextResponse("billboard Id is required", { status: 400 });
    }

    if (!categoryId) {
      return new NextResponse("Category Id is required", { status: 400 });
    }

       const storeByUserId = await db.store.findFirst({
        where: {
            id: storeId,
        }
    });

    if(!storeByUserId) {
        return new NextResponse("Unauthorized", {status: 403});
    }
    

    const category = await db.category.updateMany({
      where: {
        id: categoryId,
      },
      data: {
       name,
       billboardId,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.log("[CATEGORY_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ storeId: string, categoryId: string }> }
) {
  try {
    const userId = await useUserId(req);
    const { storeId, categoryId } = await context.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!categoryId) {
      return new NextResponse("Category Id is required", { status: 400 });
    }

           const storeByUserId = await db.store.findFirst({
        where: {
            id: storeId,
        }
    });

    if(!storeByUserId) {
        return new NextResponse("Unauthorized", {status: 403});
    }

    const category = await db.category.deleteMany({
      where: {
        id: categoryId,
       
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.log("[CATEGORY_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

