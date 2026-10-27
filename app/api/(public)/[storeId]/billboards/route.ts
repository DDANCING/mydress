import { auth } from "@/auth"
import { db } from "@/lib/db";
import { NextResponse } from "next/server"

export async function POST(
    req: Request,
    context: { params: Promise<{ storeId: string }> }
) {
try {
    const user = await auth();
    const userId = user?.user?.id;
    const body = await req.json();
    const { storeId} = await context.params;

    const { label, imageUrl, subtitle, category, description, callToActionText, callToActionHref } = body; 

    if (!userId) {
        return new NextResponse("Unauthenticated", {status: 401});
    }

    if (!label) {
        return new NextResponse("Label is required", {status: 400});
    } 
    if (!imageUrl) {
        return new NextResponse("Image URL is required", {status: 400});
    }  
    if (!storeId) {
        return new NextResponse("Store id is required", {status: 400});
    } 
    
    const storeByUserId = await db.store.findFirst({
        where: {
            id: storeId,
        }
    });

    if(!storeByUserId) {
        return new NextResponse("Unauthorized", {status: 403});
    }
    

    // Criar callToAction se necessário
    let callToActionId = null;
    if (callToActionText || callToActionHref) {
        const callToAction = await db.callToAction.create({
            data: {
                text: callToActionText || null,
                href: callToActionHref || null,
            }
        });
        callToActionId = callToAction.id;
    }

    const billboard = await db.billboard.create({
        data: {
            label,
            imageUrl,
            subtitle: subtitle || null,
            category: category || null,
            description: description || null,
            storeId,
            callToActionId,
        },
        include: {
            callToAction: true,
        }
    });

    return NextResponse.json(billboard);

} catch (error) {
    console.log('[BILLBOARDS_POST]', error)
    return new NextResponse("Internal error", {status: 500});
 }
}


export async function GET(
    req: Request,
    context: { params: Promise<{ storeId: string }> }
) {
try {

    const { storeId} = await context.params;

    if (!storeId) {
        return new NextResponse("Store id is required", {status: 400});
    } 
    
    const billboards = await db.billboard.findMany({
        where: {
            id: storeId,
        },
    });
    
  return NextResponse.json(billboards);
} catch (error) {
    console.log('[BILLBOARDS_POST]', error)
    return new NextResponse("Internal error", {status: 500});
 }
};