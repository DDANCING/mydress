/* eslint-disable react-hooks/rules-of-hooks */
import { useUserId } from "@/data/hooks/use-current-id";
import { db } from "@/lib/db";
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  context: { params: Promise<{  billboardId: string }> }
) {
  try {
    const { billboardId } = await context.params;


    if (!billboardId) {
      return new NextResponse("billboard ID is required", { status: 400 });
    }


    const billboard = await db.billboard.findUnique({
      where: {
        id: billboardId,
      },
      include: {
        callToAction: true,
      }
    });

    return NextResponse.json(billboard);
  } catch (error) {
    console.log("[BILLBOARD_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ storeId: string, billboardId: string }> }
) {
  try {
    const userId = await useUserId(req);
    const body = await req.json();
    const { label, imageUrl, subtitle, category, description, callToActionText, callToActionHref } = body;
    const { billboardId, storeId } = await context.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!label) {
      return new NextResponse("Label is required", { status: 400 });
    }
    if (!imageUrl) {
      return new NextResponse("Image Url is required", { status: 400 });
    }

    if (!billboardId) {
      return new NextResponse("Billboard ID is required", { status: 400 });
    }

       const storeByUserId = await db.store.findFirst({
        where: {
            id: storeId,
        }
    });

    if(!storeByUserId) {
        return new NextResponse("Unauthorized", {status: 403});
    }
    

    // Buscar billboard atual para verificar callToAction existente
    const currentBillboard = await db.billboard.findUnique({
      where: { id: billboardId },
      include: { callToAction: true }
    });

    if (!currentBillboard) {
      return new NextResponse("Billboard not found", { status: 404 });
    }

    // Gerenciar callToAction
    let callToActionId = currentBillboard.callToActionId;
    
    if (callToActionText || callToActionHref) {
      if (currentBillboard.callToAction) {
        // Atualizar callToAction existente
        await db.callToAction.update({
          where: { id: currentBillboard.callToAction.id },
          data: {
            text: callToActionText || null,
            href: callToActionHref || null,
          }
        });
      } else {
        // Criar novo callToAction
        const newCallToAction = await db.callToAction.create({
          data: {
            text: callToActionText || null,
            href: callToActionHref || null,
          }
        });
        callToActionId = newCallToAction.id;
      }
    } else if (currentBillboard.callToAction) {
      // Remover callToAction se não há mais dados
      await db.callToAction.delete({
        where: { id: currentBillboard.callToAction.id }
      });
      callToActionId = null;
    }

    const billboard = await db.billboard.update({
      where: {
        id: billboardId,
      },
      data: {
        label,
        imageUrl,
        subtitle: subtitle || null,
        category: category || null,
        description: description || null,
        callToActionId,
      },
      include: {
        callToAction: true,
      }
    });

    return NextResponse.json(billboard);
  } catch (error) {
    console.log("[BILLBOARD_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ storeId: string, billboardId: string }> }
) {
  try {
    const userId = await useUserId(req);
    const { storeId, billboardId } = await context.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!billboardId) {
      return new NextResponse("billboard ID is required", { status: 400 });
    }

           const storeByUserId = await db.store.findFirst({
        where: {
            id: storeId,
        }
    });

    if(!storeByUserId) {
        return new NextResponse("Unauthorized", {status: 403});
    }

    const billboard = await db.billboard.deleteMany({
      where: {
        id: billboardId,
       
      },
    });

    return NextResponse.json(billboard);
  } catch (error) {
    console.log("[BILLBOARD_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

