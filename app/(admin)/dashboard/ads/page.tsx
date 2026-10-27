import { UserRole } from "@prisma/client";
import { RoleGate } from "@/components/auth/role-gate";
import { AdsListClient } from "./_components/ads-list-client";

export default async function AdsPage() {


  return (
    <RoleGate allowedRoles={[UserRole.ADMIN, UserRole.OWNER]}>
      <div className="bg-background">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <AdsListClient />
        </div>
      </div>
    </RoleGate>
  );
}
