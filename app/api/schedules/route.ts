import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contractId = searchParams.get('contractId');

    // Build where clause based on query parameters
    const whereClause: any = {};
    
    if (contractId) {
      whereClause.contractId = contractId;
    }

    const schedules = await db.schedule.findMany({
      where: whereClause,
      include: {
        seller: {
          include: {
            user: true,
          },
        },
        buyer: true,
        product: true,
        contract: true,
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.log("[SCHEDULES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      startDate,
      endDate,
      type,
      tags,
      sellerId,
      buyerId,
      contractId,
      productId,
    } = body;

    if (!startDate || !endDate || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const schedule = await db.schedule.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        tags: tags || [],
        sellerId,
        buyerId,
        contractId,
        productId,
      },
      include: {
        seller: {
          include: {
            user: true,
          },
        },
        buyer: true,
        product: true,
        contract: true,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.log("[SCHEDULES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}