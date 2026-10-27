import { db } from "@/lib/db";
import { SizesClient } from "./_components/client";
import { SizeColumn } from "./_components/columns";
import { formatDateForDisplay } from "@/lib/date-utils";


interface SizesPageProps {
  params: Promise<{ storeId: string }>;
}

const SizesPage = async ({ params }: SizesPageProps) => {
  
  const { storeId } = await params;

  const sizes = await db.size.findMany({
    where: {
      storeId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formatedSizes: SizeColumn[] = sizes.map((item) => {
    return {
      id: item.id,
      name: item.name,
      value: item.value,
      createdAt: formatDateForDisplay(item.createdAt),
    };
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SizesClient data={formatedSizes} />
      </div>
    </div>
  );
};

export default SizesPage;