import { db } from "@/lib/db";
import { BillboardForm } from "./_components/billboard-form";

interface BillboardIdPageProps {
  params: Promise<{ billboardId: string }>
}

const BillboardIdPage = async (
   { params }:  BillboardIdPageProps 
) => {
  const { billboardId } = await params;
  const billboard = await db.billboard.findUnique({
    where: {
        id: billboardId
    },
    include: {
        callToAction: true
    }
  });


  return (
    <div className="flex-col">
        <div className="flex-1 space-y-4 p-8">
            <BillboardForm initialData={billboard}/>
        </div>
     
    </div>
  );
}

export default BillboardIdPage;