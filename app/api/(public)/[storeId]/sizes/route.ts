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

    const { sizeName, value } = body; 

    if (!userId) {
        return new NextResponse("Unauthenticated", {status: 401});
    }

    if (!sizeName) {
        return new NextResponse("Name is required", {status: 400});
    } 
    if (!value) {
        return new NextResponse("Value is required", {status: 400});
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
    

    const size = await db.size.create({
        data: {
            name: sizeName,
            value,
            storeId,
        }
    });

    return NextResponse.json(size);

} catch (error) {
    console.log('[SIZES_POST]', error)
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
    
    const sizes = await db.size.findMany({
        where: {
            storeId: storeId,
        },
    });
    
  return NextResponse.json(sizes);
} catch (error) {
    console.log('[SIZES_POST]', error)
    return new NextResponse("Internal error", {status: 500});
 }
};