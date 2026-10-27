import { db } from "@/lib/db";
import { SizeForm } from "./_components/size-form";


interface SizeIdPageProps {
  params: Promise<{ sizeId: string }>
}

const BillboardIdPage = async (
   { params }:  SizeIdPageProps 
) => {
  const { sizeId } = await params;
  const size = await db.size.findUnique({
    where: {
        id: sizeId
    }
  });


  return (
    <div className="flex-col">
        <div className="flex-1 space-y-4 p-8">
            <SizeForm initialData={size}/>
        </div>
     
    </div>
  );
}

export default BillboardIdPage;