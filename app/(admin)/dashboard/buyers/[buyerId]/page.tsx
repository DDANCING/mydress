import { db } from "@/lib/db";
import {BuyerForm } from "./_components/buyer-form";
import { Card } from "@/components/ui/card";

interface  BuyerIdPageProps {
  params: Promise<{ buyerId: string }>
}

const OrderIdPage = async ({ params }: BuyerIdPageProps) => {
  const { buyerId } = await params;

  const buyer = await db.buyer.findUnique({
    where: { id: buyerId },
  });

  return (
    <div className="flex-col">
      <Card className="flex-1 space-y-4 p-8 m-4">
        <BuyerForm initialData={buyer} buyerId={buyerId} isModal={false}/>
      </Card>
    </div>
  );
};

export default OrderIdPage;
