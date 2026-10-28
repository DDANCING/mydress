"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { RATE_LIMITS, rateLimit, tooManyAttemptsMessage } from "@/lib/rate-limit";

interface TestimonialInput {
  productId: string;
  stars: number;
  quote: string;
}

export async function createTestimonial({ productId, stars, quote }: TestimonialInput) {
  try {
    // Validate input
    if (!productId || typeof stars !== "number" || stars < 1 || stars > 5 || !Number.isInteger(stars) || typeof quote !== "string" || quote.trim().length < 2 || quote.length > 1000) {
      return { error: "Dados inválidos para o depoimento." };
    }

    // Get logged user
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "É necessário estar logado para enviar um depoimento." };
    }

    const attempt = await rateLimit(`testimonial:user:${userId}`, RATE_LIMITS.testimonial);
    if (!attempt.success) {
      return { error: tooManyAttemptsMessage(attempt) };
    }

    // Prevent duplicate testimonial by user for the same product
    const existingTestimonial = await db.testimonial.findFirst({
      where: { userId, productId }
    });
    if (existingTestimonial) {
      return { error: "Você já enviou um depoimento para este produto." };
    }

    // Create testimonial
    const testimonial = await db.testimonial.create({
      data: {
        userId,
        productId,
        stars,
        quote: quote.trim(),
      }
    });

    // Atualiza reviewCount e rating do produto
    // Busca todos os testemunhos do produto para recalcular a média
    const testimonials = await db.testimonial.findMany({
      where: { productId },
      select: { stars: true },
    });

    const reviewCount = testimonials.length;
    const rating = reviewCount > 0
      ? Math.round(testimonials.reduce((sum, t) => sum + t.stars, 0) / reviewCount)
      : stars;

    await db.product.update({
      where: { id: productId },
      data: {
        reviewCount,
        rating,
      }
    });

    return { success: true, testimonial };

  } catch (error: any) {
    console.error('[TESTIMONIAL_CREATE]', error);
    return { error: "Erro interno do servidor ao criar depoimento." };
  }
}

interface HasTestimonialParams {
  productId: string;
  userId: string;
}

/**
 * Verifica se o usuário já enviou depoimento para o produto.
 * Retorna true se já existe, false se não.
 */
export async function hasTestimonial({ productId, userId }: HasTestimonialParams): Promise<boolean> {
  if (!productId || !userId) return false;

  const testimonial = await db.testimonial.findFirst({
    where: {
      productId,
      userId,
    },
    select: { id: true },
  });

  return !!testimonial;
}