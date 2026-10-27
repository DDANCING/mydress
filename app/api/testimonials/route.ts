import { auth } from "@/auth"
import { db } from "@/lib/db";
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const user = await auth();
    const userId = user?.user.id;

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const testimonials = await db.testimonial.findMany({
      where: { userId, productId },
      select: { id: true, stars: true, quote: true, createdAt: true },
    });

    if (testimonials.length > 0) {
      return new NextResponse(
        "You have already submitted a testimonial for this product.",
        { status: 400 }
      );
    }

    return NextResponse.json(testimonials);
  } catch (error) {
    console.log("[TESTIMONIALS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await auth();
    const userId = user?.user.id;
    const body = await req.json();

    const { stars, productId, message } = body;

    // 🔒 Autenticação
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 🛠 Validação básica
    if (!stars || !productId) {
      return new NextResponse("Stars and Product ID are required", { status: 400 });
    }

    const parsedStars = Number(stars);
    if (isNaN(parsedStars) || parsedStars < 1 || parsedStars > 5) {
      return new NextResponse("Stars must be a number between 1 and 5", { status: 400 });
    }

    // 📌 Criar testimonial
    const testimonial = await db.testimonial.create({
      data: {
        stars: parsedStars,
        productId,
        userId,
        quote: message,
      },
    });

    // 🔍 Buscar produto
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { rating: true, reviewCount: true },
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // Conversão segura de Decimal para number
    const toNumber = (v: any) =>
      v == null
        ? null
        : typeof v === "object" && "toNumber" in v
        ? v.toNumber()
        : Number(v);

    let currentRating = toNumber(product.rating) ?? 0;
    let currentCount = toNumber(product.reviewCount) ?? 0;

    let newAvgRating: number;
    let newReviewCount: number;

    if (currentCount === 0) {
      // Primeira avaliação
      newAvgRating = parsedStars;
      newReviewCount = 1;
    } else {
      // Média com avaliações anteriores
      newAvgRating = ((currentRating * currentCount) + parsedStars) / (currentCount + 1);
      newReviewCount = currentCount + 1;
    }

    // 💾 Atualizar produto
    await db.product.update({
      where: { id: productId },
      data: {
        rating: newAvgRating,
        reviewCount: newReviewCount,
      },
    });

    return NextResponse.json(testimonial);
  } catch (error) {
    console.error("[TESTIMONIALS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}