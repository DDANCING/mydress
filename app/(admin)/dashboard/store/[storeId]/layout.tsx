import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ModalProvider } from "@/providers/modal-provider";
import { redirect } from "next/navigation";
import React from "react";

interface DashboardType {
    children: React.ReactNode;
    params: Promise<{ storeId: string }>
}

export const dynamic = 'force-dynamic';

export default async function Dashboard({children, params}: DashboardType) {
    const user = await auth();
    const userId = user?.user?.id;
    const { storeId } = await params;

    if (!userId) {
        redirect('/auth/login')
    }

    const store = await db.store.findFirst({
        where: {
            id: storeId,
        }
    })

    if (!store) {
        redirect('/dashboard');
    }

    return (
        <>
        <ModalProvider/>
            {children}
        </>
    )
}