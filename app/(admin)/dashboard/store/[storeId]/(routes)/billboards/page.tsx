import { db } from "@/lib/db";
import { BillboardClient } from "./_components/client";
import { BillboardColumn } from "./_components/columns";
import { formatDateForDisplay } from "@/lib/date-utils";


interface BillboardsPageProps {
  params: Promise<{ storeId: string }>;
}

const BillboardsPage = async ({ params }: BillboardsPageProps) => {
  
  const { storeId } = await params;

  const billboards = await db.billboard.findMany({
    where: {
      storeId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formatedBillboards: BillboardColumn[] = billboards.map((item) => {
    return {
      id: item.id,
      label: item.label,
      createdAt: formatDateForDisplay(item.createdAt),
    };
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BillboardClient data={formatedBillboards} />
      </div>
    </div>
  );
};

export default BillboardsPage;