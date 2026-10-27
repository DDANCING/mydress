import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * POST /api/n8n/functions/activate-buyers
 * Recebe uma lista de IDs e marca os buyers como IsEffected = true
 *
 * Header obrigatório:
 * X-Synapse-Secret
 */
export async function POST(req: Request) {
  try {
    // Validar secret
    const synapseSecret = req.headers.get("X-Synapse-Secret");

    if (
      !synapseSecret ||
      synapseSecret !== process.env.SYNAPSE_SECRET
    ) {
      return new NextResponse(
        "Invalid or missing Synapse Secret",
        { status: 403 }
      );
    }

    const body = await req.json();
    const { buyerIds } = body;

    // Validar entrada
    if (!Array.isArray(buyerIds) || buyerIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "buyerIds deve ser um array não vazio",
        },
        {
          status: 400,
        }
      );
    }

    // Atualizar buyers
    const result = await db.buyer.updateMany({
      where: {
        id: {
          in: buyerIds,
        },
        IsEffected: false,
      },
      data: {
        IsEffected: true,
      },
    });

    // Buscar buyers atualizados
    const activatedBuyers = await db.buyer.findMany({
      where: {
        id: {
          in: buyerIds,
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        document: true,
        IsEffected: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} buyer(s) ativado(s) com sucesso`,
      updatedCount: result.count,
      activatedBuyers,
    });
  } catch (error) {
    console.error("[N8N_ACTIVATE_BUYERS]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}
