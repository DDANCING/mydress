/* eslint-disable react-hooks/rules-of-hooks */
import { useUserId } from "@/data/hooks/use-current-id";
import { db } from "@/lib/db";
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  context: { params: Promise<{  productId: string }> }
) {
  try {
    const { productId } = await context.params;

    const DEFAULT_IMAGE_URL = "https://res.cloudinary.com/dwjbrlatc/image/upload/v1753643519/d0b8jfguhbcw6e4tifar.png";
    
    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const product = await db.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        images: true,
        category: true,
        size: true,
        color: true,
      }
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // Se não tem imagens, usar a imagem padrão
    const images = product.images.length > 0 
      ? product.images 
      : [{ id: 'default', url: DEFAULT_IMAGE_URL, productId: product.id }];

    // Converter Decimals para numbers antes de retornar
    const serializedProduct = {
      ...product,
      price: product.price.toNumber(),
      originalPrice: product.originalPrice?.toNumber() ?? null,
      images: images,
    };

    return NextResponse.json(serializedProduct);
  } catch (error) {
    console.log("[PRODUCT_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const userId = await useUserId(req);
    const body = await req.json();
    
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
    const { productId, storeId } = await context.params;

    const DEFAULT_IMAGE_URL = "https://res.cloudinary.com/dwjbrlatc/image/upload/v1753643519/d0b8jfguhbcw6e4tifar.png";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }
    
    // Se não há imagens fornecidas, usar a imagem padrão
    const imagesToUse = (!images || !images.length) 
      ? [{ url: DEFAULT_IMAGE_URL }]
      : images;
    
    if (!productId) {
      return new NextResponse("Product id is required", { status: 400 });
    }
    if (price === undefined || price === null || price < 0) {
      return new NextResponse("Price is required", { status: 400 });
    }
    if (!categoryId) {
      return new NextResponse("Category id is required", { status: 400 });
    }
    if (!colorId) {
      return new NextResponse("Color id is required", { status: 400 });
    }
    if (!sizeId) {
      return new NextResponse("Size id is required", { status: 400 });
    }

    const storeByUserId = await db.store.findFirst({
      where: {
        id: storeId,
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Only check SKU if it's provided
    if (sku) {
      const Sku = await db.product.findFirst({
        where: {
          sku,
          id: {
            not: productId, // Exclui o produto atual da verificação
          },
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
    }

    const product = await db.$transaction(async (tx) => {
      
      await tx.product.update({
        where: {
          id: productId,
        },
        data: {
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
          isOnlyRental,
          rentalValue,
          images: {
            deleteMany: {},
          },
          isFeatured,
          isArchived,
          siteVisible,
        },
      });

      // Depois cria as novas imagens (usando imagesToUse que inclui fallback)
      return await tx.product.update({
        where: {
          id: productId,
        },
        data: {
          images: {
            createMany: {
              data: imagesToUse.map((image: { url: string }) => image),
            },
          },
        },
      });
    });

    // Converter Decimals para numbers antes de retornar
    const serializedProduct = {
      ...product,
      price: product.price.toNumber(),
      originalPrice: product.originalPrice?.toNumber() ?? null,
    };

    return NextResponse.json(serializedProduct);
  } catch (error) {
    console.log("[PRODUCT_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ storeId: string, productId: string }> }
) {
  try {
    const userId = await useUserId(req);
    const { storeId, productId } = await context.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!productId) {
      return new NextResponse("product ID is required", { status: 400 });
    }

    const storeByUserId = await db.store.findFirst({
      where: {
        id: storeId,
      }
    });

    if(!storeByUserId) {
      return new NextResponse("Unauthorized", {status: 403});
    }

    const product = await db.product.deleteMany({
      where: {
        id: productId,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.log("[PRODUCT_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}