import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar contratos relacionados ao produto
    const contracts = await db.contract.findMany({
      where: {
        contractItems: {
          some: {
            productId: productId
          }
        },
        status: {
          in: ["CONFIRMED", "DELIVERED"] // Apenas contratos confirmados ou entregues
        }
      },
      select: {
        id: true,
        type: true,
        eventDate: true,
        deliveryDate: true,
        status: true,
      }
    });

    // Mapear os dados do banco para o formato esperado pelo componente
    const schedules = contracts
      .map(contract => ({
        id: contract.id,
        eventDate: contract.eventDate || contract.deliveryDate, // Usar eventDate para aluguéis ou deliveryDate para vendas
        type: contract.type,
        status: contract.status
      }))
      .filter(schedule => schedule.eventDate !== null);

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Erro ao buscar agendamentos do produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
