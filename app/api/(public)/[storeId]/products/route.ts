import { auth } from "@/auth"
import { db } from "@/lib/db";
import { NextResponse } from "next/server"

const DEFAULT_IMAGE_URL = "https://res.cloudinary.com/dwjbrlatc/image/upload/v1753643519/d0b8jfguhbcw6e4tifar.png";

export async function POST(
  req: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  try {
    const user = await auth();
    const userId = user?.user.id;
    const body = await req.json();
    const { storeId } = await context.params;

    const {
      name,
      price,
      originalPrice,
      sku,
      rating,
      reviewCount,
      description,
      categoryId,
      colorId,
      sizeId,
      images,
      isFeatured,
      isArchived,
      siteVisible,
      isOnlyRental,
      rentalValue,
    } = body;

    // validações
    if (!userId) {
      console.log("[PRODUCTS_POST] Validation failed: Unauthenticated - userId not found");
      return new NextResponse("Unauthenticated", { status: 401 });
    }
    if (!name) {
      console.log("[PRODUCTS_POST] Validation failed: Name is required");
      return new NextResponse("Name is required", { status: 400 });
    }
    if (price === undefined || price === null || price < 0) {
      console.log("[PRODUCTS_POST] Validation failed: Price is required");
      return new NextResponse("Price is required", { status: 400 });
    }
    if (!categoryId) {
      console.log("[PRODUCTS_POST] Validation failed: Category id is required");
      return new NextResponse("Category id is required", { status: 400 });
    }
    if (!colorId) {
      console.log("[PRODUCTS_POST] Validation failed: Color id is required");
      return new NextResponse("Color id is required", { status: 400 });
    }
    if (!sizeId) {
      console.log("[PRODUCTS_POST] Validation failed: Size id is required");
      return new NextResponse("Size id is required", { status: 400 });
    }
    if (!storeId) {
      console.log("[PRODUCTS_POST] Validation failed: Store id is required");
      return new NextResponse("Store id is required", { status: 400 });
    }

    // Fallback para imagem padrão se não houver imagens fornecidas
    const productImages =
      !images || !Array.isArray(images) || images.length === 0
        ? [{ url: DEFAULT_IMAGE_URL }]
        : images;

    const storeByUserId = await db.store.findFirst({
      where: {
        id: storeId,
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

        const Sku = await db.product.findFirst({
      where: {
        sku,
      },
    });

   if (Sku) {
  return new NextResponse(
  JSON.stringify({ message: "SKU já existe" }),
  {
    status: 400,
    headers: { "Content-Type": "application/json" },
  }
);
}

    const product = await db.product.create({
      data: {
        name,
        price,
        originalPrice,
        sku,
        rating,
        reviewCount,
        description,
        isArchived,
        isFeatured,
        siteVisible,
        colorId,
        categoryId,
        sizeId,
        storeId,
        isOnlyRental,
        rentalValue,
        images: {
          createMany: {
            data: productImages.map((image: { url: string }) => image),
          },
        },
      },
    });

    // Converter Decimals para numbers antes de retornar
    const serializedProduct = {
      ...product,
      price: product.price.toNumber(),
      originalPrice: product.originalPrice?.toNumber() ?? null,
    };

    return NextResponse.json(serializedProduct);
  } catch (error) {
    console.log("[PRODUCTS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
    req: Request,
    context: { params: Promise<{ storeId: string }> }
) {
try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const colorId = searchParams.get("colorId") || undefined;
    const sizeId = searchParams.get("sizeId") || undefined;
    const isFeatured = searchParams.get("isFeatured");
    const { storeId} = await context.params;

    if (!storeId) {
        return new NextResponse("Store id is required", {status: 400});
    } 
    
    
    const products = await db.product.findMany({
        where: {
            storeId: storeId,
            categoryId,
            colorId,
            sizeId,
            isFeatured: isFeatured ? true : undefined,
            isArchived: false
        },
        include: {
            images: true,
            category: true,
            color: true,
            size: true,
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    // Converter Decimals para numbers antes de retornar
    const serializedProducts = products.map(product => ({
      ...product,
      price: product.price.toNumber(),
      originalPrice: product.originalPrice?.toNumber() ?? null,
    }));
    
  return NextResponse.json(serializedProducts);
} catch (error) {
    console.log('[PRODUCTS_GET]', error)
    return new NextResponse("Internal error", {status: 500});
 }
};