import { auth } from "@/auth"
import { db } from "@/lib/db";
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const user = await auth();
    const userId = user?.user.id;
    const body = await req.json();

    const {
      name,
      data,
      store,
      method,
      value
    } = body;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!data) return new NextResponse("Data is required", { status: 400 });
    if (!store) return new NextResponse("Store is required", { status: 400 });
    if (!method) return new NextResponse("Method is required", { status: 400 });
    if (value === undefined || value === null) return new NextResponse("Value is required", { status: 400 });

    const outFinance = await db.outFinanceColumn.create({
      data: {
        name,
        data: new Date(data),
        store,
        method,
        value,
      }
    });

    return NextResponse.json(outFinance);

  } catch (error) {
    console.log('[OUT_FINANCE_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("ID is required", { status: 400 });
  }

  const outFinance = await db.outFinanceColumn.findUnique({
    where: { id },
  });

  if (!outFinance) {
    return new NextResponse("OutFinance not found", { status: 404 });
  }

  return NextResponse.json(outFinance);
}