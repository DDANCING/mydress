import { auth } from "@/auth"
import { db } from "@/lib/db";
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const user = await auth();
        const userId = user?.user?.id;

        if (!userId) {
            return new NextResponse("Unauthorized", {status: 401 })
        }

        const stores = await db.store.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(stores);

    } catch (error) {
        console.log('[STORES_GET]', error)
        return new NextResponse("Internal error", {status: 500})
    }
}

export async function POST(
    req: Request,
) {
try {
    const user = await auth();
    const userId = user?.user?.id;
    const body = await req.json();

    const { name } = body; 

    if (!userId) {
        return new NextResponse("Unauthorized", {status: 401 })
    }

    if (!name) {
        return new NextResponse("Name is required", {status: 400})
    }     

    const store = await db.store.create({
        data: {
            name,
            userId,
        }
    });

    return NextResponse.json(store);

} catch (error) {
    console.log('[STORES_POST]', error)
    return new NextResponse("Internal error", {status: 500})
 }
}