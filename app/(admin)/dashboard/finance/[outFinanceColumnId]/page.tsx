import { db } from "@/lib/db";

import { Card } from "@/components/ui/card";
import { OutFinanceForm } from "./_components/out-finance-form";

interface  BuyerIdPageProps {
  params: Promise<{ outFinanceColumnId: string }>
}

const OrderIdPage = async ({ params }: BuyerIdPageProps) => {
  const { outFinanceColumnId } = await params;

  const outFinanceColumnRaw = await db.outFinanceColumn.findUnique({
    where: { id: outFinanceColumnId },
  });

  const outFinanceColumn = outFinanceColumnRaw
    ? {
        ...outFinanceColumnRaw,
        value: typeof outFinanceColumnRaw.value === "object" && "toNumber" in outFinanceColumnRaw.value
          ? outFinanceColumnRaw.value.toNumber()
          : Number(outFinanceColumnRaw.value),
      }
    : null;

  return (
    <div className="flex-col">
      <Card className="flex-1 space-y-4 p-8 m-4">
        <OutFinanceForm initialData={outFinanceColumn} isModal={false}/>
      </Card>
    </div>
  );
};

export default OrderIdPage;
