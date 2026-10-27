import { db } from "@/lib/db";
import { ColorForm } from "./_components/color-form";


interface ColorIdPageProps {
  params: Promise<{ colorId: string }>
}

const ColorIdPage = async (
   { params }:  ColorIdPageProps 
) => {
  const { colorId } = await params;
  const color = await db.color.findUnique({
    where: {
        id: colorId
    }
  });


  return (
    <div className="flex-col">
        <div className="flex-1 space-y-4 p-8">
            <ColorForm initialData={color}/>
        </div>
     
    </div>
  );
}

export default ColorIdPage;