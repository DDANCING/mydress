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

    const { name, billboardId } = body; 

    if (!userId) {
        return new NextResponse("Unauthenticated", {status: 401});
    }

    if (!name) {
        return new NextResponse("name is required", {status: 400});
    } 
    if (!billboardId) {
        return new NextResponse("billboard ID is required", {status: 400});
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
    

    const category = await db.category.create({
        data: {
            name,
            billboardId,
            storeId,
        }
    });

    return NextResponse.json(category);

} catch (error) {
    console.log('[CATEGORIES_POST]', error)
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
    
    const categories = await db.category.findMany({
        where: {
            storeId: storeId,
        },
    });
    
  return NextResponse.json(categories);
} catch (error) {
    console.log('[CATEGORIES_GET]', error)
    return new NextResponse("Internal error", {status: 500});
 }
};