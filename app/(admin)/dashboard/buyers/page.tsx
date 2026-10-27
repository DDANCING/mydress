import { db } from "@/lib/db";
import { BuyerClient } from "./_components/client";
import { BuyerColumn } from "./_components/columns";
import { formatDateForDisplay } from "@/lib/date-utils";

const BuyersPage = async () => {
  const buyers = await db.buyer.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const formatedBuyers: BuyerColumn[] = buyers.map((item) => {
    return {
      id: item.id,
      fullName: item.fullName,
      email: item.email ?? "",
      phone: item.phone ?? "",
      createdAt: formatDateForDisplay(item.createdAt),
    };
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BuyerClient data={formatedBuyers} />
      </div>
    </div>
  );
};

export default BuyersPage;
