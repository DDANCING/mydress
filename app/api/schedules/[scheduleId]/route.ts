import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { scheduleId } = await context.params;

    const schedule = await db.schedule.findUnique({
      where: { id: scheduleId },
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

    if (!schedule) {
      return new NextResponse("Schedule not found", { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.log("[SCHEDULE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { scheduleId } = await context.params;
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

    if (!startDate || !endDate) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const updateData: any = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    // Only update fields that are provided
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (tags !== undefined) updateData.tags = tags;
    if (sellerId !== undefined) updateData.sellerId = sellerId;
    if (buyerId !== undefined) updateData.buyerId = buyerId;
    if (contractId !== undefined) updateData.contractId = contractId;
    if (productId !== undefined) updateData.productId = productId;

    const schedule = await db.schedule.update({
      where: { id: scheduleId },
      data: updateData,
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
    console.log("[SCHEDULE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { scheduleId } = await context.params;

    const schedule = await db.schedule.delete({
      where: { id: scheduleId },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.log("[SCHEDULE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}