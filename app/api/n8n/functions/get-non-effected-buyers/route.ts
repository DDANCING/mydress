import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/n8n/functions/get-non-effected-buyers
 * Retorna lista de compradores com IsEffected = false e criados há mais de 1 semana
 * 
 * Header obrigatório: X-Synapse-Secret
 * 
 * @returns {Array} Lista de buyers não efetivados
 */
export async function GET(req: Request) {
  try {
    const synapseSecret = req.headers.get("X-Synapse-Secret");

    // Sem SYNAPSE_SECRET configurado a rota fica fechada (antes, header ausente == env ausente liberava)
    if (!process.env.SYNAPSE_SECRET || synapseSecret !== process.env.SYNAPSE_SECRET) {
      return new NextResponse("Invalid or missing Synapse Secret", {
        status: 403,
      });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const nonEffectedBuyers = await db.buyer.findMany({
      where: {
        IsEffected: false,
        createdAt: {
          lte: oneWeekAgo,
        },
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: nonEffectedBuyers.length,
      data: nonEffectedBuyers,
    });
  } catch (error) {
    console.error(error);

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