import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { image } = await req.json();

  await db.user.update({
    where: { email: session.user.email },
    data: { image },
  });

  return NextResponse.json({ success: true });
}