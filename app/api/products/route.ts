import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await auth();
    const userId = user?.user?.id;

    if (!userId) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const products = await db.product.findMany({
      include: {
        color: true,
        size: true,
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Converter Decimals para numbers antes de retornar
    const serializedProducts = products.map(product => ({
      ...product,
      price: product.price.toNumber(),
      originalPrice: product.originalPrice?.toNumber() ?? null,
    }));

    return NextResponse.json(serializedProducts);
  } catch (error) {
    console.log("[PRODUCTS_GET]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
