import { db } from "@/lib/db";
import { MaterialForm } from "./_components/material-form";
import { RoleGate } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";

interface MaterialIdPageProps {
  params: Promise<{ materialId: string; storeId: string }>;
}

const MaterialIdPage = async ({ params }: MaterialIdPageProps) => {
  const { materialId } = await params;

  // Verifica se é uma criação nova ("new") ou edição
  // O Prisma findUnique vai falhar se o ID for "new", então checamos antes ou tratamos o erro
  let material = null;

  if (materialId !== "new") {
    material = await db.rawMaterial.findUnique({
      where: {
        id: materialId,
      },
    });
  }

  const materialFormatted = material
    ? {
        ...material,
        pricePerUnit: Number(material.pricePerUnit),
        quantity: material.quantity,
        minStock: material.minStock,
      }
    : null;

  return (
    <RoleGate allowedRoles={[UserRole.ADMIN, UserRole.OWNER]}>
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8">
          <MaterialForm initialData={materialFormatted} />
        </div>
      </div>
    </RoleGate>
  );
};

export default MaterialIdPage;