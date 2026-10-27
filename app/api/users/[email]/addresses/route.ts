import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/users/[email]/addresses
export async function GET(
  req: Request,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const session = await auth();
    const { email } = await context.params;
    if (!session?.user?.email || session.user.email !== email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const buyer = await db.buyer.findUnique({ where: { email } });
    if (!buyer) return NextResponse.json([]);
    if (buyer.address && buyer.city && buyer.state && buyer.cep && buyer.number) {
      return NextResponse.json([
        {
          id: buyer.id,
          fullName: buyer.fullName,
          address: buyer.address,
          number: buyer.number,
          complement: buyer.complement || "",
          neighborhood: buyer.neighborhood || "",
          city: buyer.city,
          state: buyer.state,
          cep: buyer.cep,
          isDefault: true,
        },
      ]);
    }
    return NextResponse.json([]);
  } catch (error) {
    console.log("[ADDRESSES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST /api/users/[email]/addresses
export async function POST(
  req: Request,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const session = await auth();
    const { email } = await context.params;
    if (!session?.user?.email || session.user.email !== email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const body = await req.json();
    let buyer = await db.buyer.findUnique({ where: { email } });
    if (!buyer) {
      // Não existe buyer, criar novo
      buyer = await db.buyer.create({
        data: {
          email,
          fullName: body.fullName,
          address: body.address,
          number: body.number,
          complement: body.complement,
          neighborhood: body.neighborhood,
          city: body.city,
          state: body.state,
          cep: body.cep,
        },
      });
    } else {
      // Atualizar campos de endereço do buyer existente
      buyer = await db.buyer.update({
        where: { email },
        data: {
          fullName: body.fullName,
          address: body.address,
          number: body.number,
          complement: body.complement,
          neighborhood: body.neighborhood,
          city: body.city,
          state: body.state,
          cep: body.cep,
        },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[ADDRESSES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH /api/users/[email]/addresses
export async function PATCH(
  req: Request,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const session = await auth();
    const { email } = await context.params;
    if (!session?.user?.email || session.user.email !== email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const body = await req.json();
    let buyer = await db.buyer.findUnique({ where: { email } });
    if (!buyer) {
      return new NextResponse("Endereço não encontrado", { status: 404 });
    }
    buyer = await db.buyer.update({
      where: { email },
      data: {
        fullName: body.fullName,
        address: body.address,
        number: body.number,
        complement: body.complement,
        neighborhood: body.neighborhood,
        city: body.city,
        state: body.state,
        cep: body.cep,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[ADDRESSES_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE /api/users/[email]/addresses
export async function DELETE(
  req: Request,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const session = await auth();
    const { email } = await context.params;

    if (!session?.user?.email || session.user.email !== email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    let buyer = await db.buyer.findUnique({ where: { email } });
    if (!buyer) {
      return new NextResponse("Endereço não encontrado", { status: 404 });
    }
    // Limpar campos de endereço do buyer
    await db.buyer.update({
      where: { email },
      data: {
        address: null,
        number: null,
        complement: null,
        neighborhood: null,
        city: null,
        state: null,
        cep: null,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[ADDRESSES_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}