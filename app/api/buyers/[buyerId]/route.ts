/* eslint-disable react-hooks/rules-of-hooks */
import { auth } from "@/auth";
import { useUserId } from "@/data/hooks/use-current-id";
import { db } from "@/lib/db";
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  context: { params: Promise<{  buyerId: string }> }
) {
  try {
    const { buyerId } = await context.params;


    if (!buyerId) {
      return new NextResponse("billboard ID is required", { status: 400 });
    }


    const buyer = await db.buyer.findUnique({
      where: {
        id: buyerId,
       
      },
    });

    return NextResponse.json(buyer);
  } catch (error) {
    console.log("[BUYER_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{  buyerId: string }> }
) {
  try {
    const user = await auth();
    if (!user?.user.id) return new NextResponse("Unauthenticated", { status: 401 });

    const { buyerId } = await context.params;
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      address,
      city,
      state,
      cep,
      document,
      neighborhood,
      number,
      complement,
      IsEffected,
    } = body;

    // Busca o comprador atual
    const currentBuyer = await db.buyer.findUnique({
      where: { id: buyerId },
    });
    if (!currentBuyer) {
      return new NextResponse("Comprador não encontrado", { status: 404 });
    }

    // Só realiza a verificação se houve alteração no e‑mail ou documento
    if (email !== currentBuyer.email || document !== currentBuyer.document) {
      const existingBuyer = await db.buyer.findFirst({
        where: {
          id: { not: buyerId },
          OR: [
            ...(email ? [{ email }] : []),
            ...(document ? [{ document }] : [])
          ],
        },
      });
      if (existingBuyer) {
        return NextResponse.json(
          { error: "Email ou documento já está em uso por outro comprador." },
          { status: 409 }
        );
      }
    }

    const updatedBuyer = await db.buyer.update({
      where: { id: buyerId },
      data: {
        fullName,
        email: email || null,
        phone,
        address: IsEffected ? address : null,
        city: IsEffected ? city : null,
        state: IsEffected ? state : null,
        cep: IsEffected ? cep : null,
        document: IsEffected ? document : null,
        neighborhood: IsEffected ? neighborhood : null,
        number: IsEffected ? number : null,
        complement: IsEffected ? complement : null,
        IsEffected,
      },
    });

    return NextResponse.json(updatedBuyer);
  } catch (error) {
    console.log("[BUYER_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
   context: { params: Promise<{  buyerId: string }> }
) {
  try {
    const userId = await useUserId(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { buyerId } = await context.params;
    if (!buyerId) {
      return new NextResponse("buyer ID is required", { status: 400 });
    }

    // Buscar o comprador corretamente na tabela "buyer"
    const buyerExists = await db.buyer.findUnique({
      where: { id: buyerId },
    });
    if (!buyerExists) {
      return new NextResponse("Comprador não encontrado", { status: 404 });
    }

    // Deletar o registro usando o método "delete"
    const deletedBuyer = await db.buyer.delete({
      where: { id: buyerId },
    });

    return NextResponse.json(deletedBuyer);
  } catch (error) {
    console.log("[BUYER_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
