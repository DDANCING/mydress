import { db } from "@/lib/db";
import { ColorsClient } from "./_components/client";
import { ColorColumn } from "./_components/columns";
import { formatDateForDisplay } from "@/lib/date-utils";


interface ColorsPageProps {
  params: Promise<{ storeId: string }>;
}

const ColorsPage = async ({ params }: ColorsPageProps) => {
  
  const { storeId } = await params;

  const colors = await db.color.findMany({
    where: {
      storeId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formatedColors: ColorColumn[] = colors.map((item) => {
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
        <ColorsClient data={formatedColors} />
      </div>
    </div>
  );
};

export default ColorsPage;