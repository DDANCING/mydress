import { auth } from "@/auth"
import { db } from "@/lib/db";
import { NextResponse } from "next/server"

export async function POST(
    req: Request,
    context: { params: Promise<{ storeId: string }> }
) {
try {
    const user = await auth();
    const userId = user?.user.id;
    const body = await req.json();
    const { storeId} = await context.params;

    const { colorName, value } = body; 

    if (!userId) {
        return new NextResponse("Unauthenticated", {status: 401});
    }

    if (!colorName) {
        return new NextResponse("Name is required", {status: 400});
    } 
    if (!value) {
        return new NextResponse("hex is required", {status: 400});
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
    

    const color = await db.color.create({
        data: {
            name: colorName,
            value,
            storeId,
        }
    });

    return NextResponse.json(color);

} catch (error) {
    console.log('[COLORS_POST]', error)
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
    
    const colors = await db.color.findMany({
        where: {
            storeId: storeId,
        },
    });
    
  return NextResponse.json(colors);
} catch (error) {
    console.log('[COLORS_POST]', error)
    return new NextResponse("Internal error", {status: 500});
 }
};