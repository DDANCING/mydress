import { auth } from "@/auth";
import { useUserId } from "@/data/hooks/use-current-id";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ outFinanceColumnId: string }> }
) {
  try {
    const { outFinanceColumnId } = await context.params;

    if (!outFinanceColumnId) {
      return new NextResponse("outFinanceColumn ID is required", { status: 400 });
    }

    const outFinance = await db.outFinanceColumn.findUnique({
      where: {
        id: outFinanceColumnId,
      },
    });

    return NextResponse.json(outFinance);
  } catch (error) {
    console.log("[OUTFINANCE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ outFinanceColumnId: string }> }
) {
  try {
    const user = await auth();
    if (!user?.user.id) return new NextResponse("Unauthenticated", { status: 401 });

    const { outFinanceColumnId } = await context.params;
    const body = await req.json();
    const {
      name,
      data,
      store,
      method,
      value,
    } = body;

    // Busca a saída financeira atual
    const currentOutFinance = await db.outFinanceColumn.findUnique({
      where: { id: outFinanceColumnId },
    });
    if (!currentOutFinance) {
      return new NextResponse("Saída financeira não encontrada", { status: 404 });
    }

    // Atualização dos dados
    const updatedOutFinance = await db.outFinanceColumn.update({
      where: { id: outFinanceColumnId },
      data: {
        name,
        data: data ? new Date(data) : undefined,
        store,
        method,
        value,
      },
    });

    return NextResponse.json(updatedOutFinance);
  } catch (error) {
    console.log("[OUTFINANCE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ outFinanceColumnId: string }> }
) {
  try {
    const user = await auth();
    const userId = user?.user.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { outFinanceColumnId } = await context.params;
    if (!outFinanceColumnId) {
      return new NextResponse("outFinanceColumn ID is required", { status: 400 });
    }

    // Buscar a saída financeira corretamente na tabela "outFinanceColumn"
    const outFinanceExists = await db.outFinanceColumn.findUnique({
      where: { id: outFinanceColumnId },
    });
    if (!outFinanceExists) {
      return new NextResponse("Saída financeira não encontrada", { status: 404 });
    }

    // Deletar o registro usando o método "delete"
    const deletedOutFinance = await db.outFinanceColumn.delete({
      where: { id: outFinanceColumnId },
    });

    return NextResponse.json(deletedOutFinance);
  } catch (error) {
    console.log("[OUTFINANCE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}