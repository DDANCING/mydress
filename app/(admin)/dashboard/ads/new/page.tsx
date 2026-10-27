import { UserRole } from "@prisma/client";
import { RoleGate } from "@/components/auth/role-gate";
import { CreateAdsForm } from "../_components/create-ads-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewAdsPage() {

  return (
    <RoleGate allowedRoles={[UserRole.ADMIN, UserRole.OWNER]}>
      <div className="bg-background">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-6">
            <Link href="/dashboard/ads">
              <Button variant="ghost" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Voltar para Publicidades
              </Button>
            </Link>
          </div>
          <div className="max-w-2xl">
            <CreateAdsForm />
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
