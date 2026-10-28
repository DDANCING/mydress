import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const denied = await requireStaff();
    if (denied) return denied;
    const body = await req.json();

    const {
      fullName,
      email,
      phone,
      address,
      city,
      state,
      neighborhood,
      number,
      cep,
      document,
      complement,
      IsEffected = true
    } = body;


    if (!fullName) return new NextResponse("Fullname is required", { status: 400 });
   
    
  
    const existingBuyer = await db.buyer.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(document ? [{ document }] : [])
        ]
      }
    });

    if (existingBuyer) {
      return NextResponse.json(
        { error: "Email ou documento já registrado." },
        { status: 409 }
      );
    }

    const buyer = await db.buyer.create({
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
      }
    });

    return NextResponse.json(buyer);

  } catch (error) {
    console.log('[BUYER_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
  const denied = await requireStaff();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return new NextResponse("Email is required", { status: 400 });
  }

  const buyer = await db.buyer.findUnique({
    where: { email },
  });

  if (!buyer) {
    return new NextResponse("Buyer not found", { status: 404 });
  }

  return NextResponse.json(buyer);
}
