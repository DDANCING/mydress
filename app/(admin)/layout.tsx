import { auth } from "@/auth";
import { RoleGate } from "@/components/auth/role-gate";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import React from 'react';
import Script from 'next/script';
import NavBar from "@/app/(admin)/_components/admin-navbar";
import { ModalProvider } from "@/providers/modal-provider";
import { SettingsModalProvider } from "@/providers/profile-settings-provider";
import { BuyerModalProvider } from "@/providers/buyer-provider";

// Force dynamic rendering for admin layout
export const dynamic = 'force-dynamic';

interface LayoutComponentProps {
  children: React.ReactNode;
  // Add a prop for the current path
  pathname?: string;
}
export const metadata = {
  title: "Dashboard",
  description: "Dashboard de administração.",
};

export default async function DashboardLayout({
  children,
}: LayoutComponentProps) { 
  const user = await auth();
  const userId = user?.user.id;

  if (!userId) {
    redirect("/auth/login");
  }


  if (user.user.role === "USER") {
   return redirect(`/`);
  }


  return (
    <RoleGate allowedRoles={[UserRole.ADMIN, UserRole.SELLER, UserRole.OWNER]}>
      <NavBar />
      <BuyerModalProvider />
      <ModalProvider />
      <SettingsModalProvider />
      {children}
    </RoleGate>
  );
}