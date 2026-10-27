import { db } from "@/lib/db";
import { RawMaterialClient } from "./_components/client";
import { RawMaterialColumn } from "./_components/columns";
import { formatter } from "@/lib/utils";
import { formatDateForDisplay } from "@/lib/date-utils";

interface RawMaterialsPageProps {
  params: Promise<{ storeId: string }>;
}

const RawMaterialsPage = async ({ params }: RawMaterialsPageProps) => {
  const { storeId } = await params;

  // Busca as matérias-primas do banco
  // Obs: Assumindo que você adicionou o campo storeId ao modelo RawMaterial
  const rawMaterials = await db.rawMaterial.findMany({
    where: {
      // storeId, // Descomente esta linha se o seu schema já tiver storeId
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedRawMaterials: RawMaterialColumn[] = rawMaterials.map((item) => {
    // Verifica se o estoque está abaixo do mínimo
    const isLowStock = item.quantity <= item.minStock;

    return {
      id: item.id,
      name: item.name,
      category: item.category, // Enum
      color: item.color,       // String
      
      // Formata: "10 KG", "500 UN"
      quantity: `${item.quantity} ${item.unit}`,
      
      // Passamos o boolean para poder colorir a célula na tabela se necessário (ex: vermelho se baixo)
      isLowStock: isLowStock,
      
      // Formata preço
      pricePerUnit: item.pricePerUnit ? formatter.format(item.pricePerUnit.toNumber()) : "Não informado",
      
      supplier: item.supplier || "Não informado",
      createdAt: formatDateForDisplay(item.createdAt),
    };
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <RawMaterialClient data={formattedRawMaterials} />
      </div>
    </div>
  );
};

export default RawMaterialsPage;