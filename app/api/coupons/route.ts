import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return new NextResponse("Código do cupom ausente", { status: 400 });
  }

  try {
    const cupom = await db.coupon.findFirst({
      where: {
        code: {
          equals: code,
          mode: "insensitive",
        },
      },
    });

    if (!cupom) {
      return new NextResponse("Cupom não encontrado", { status: 404 });
    }

    // Verificar se o cupom ainda é válido
    const agora = new Date();
    
    // Verificar limite de uso
    if (cupom.usageLimit && cupom.usedCount >= cupom.usageLimit) {
      return new NextResponse("Cupom atingiu o limite de uso", { status: 400 });
    }

    // Verificar expiração
    if (cupom.expiresAt && new Date(cupom.expiresAt) < agora) {
      return new NextResponse("Cupom expirado", { status: 400 });
    }

    return NextResponse.json(cupom);
  } catch (error) {
    console.error("Erro ao buscar cupom:", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
