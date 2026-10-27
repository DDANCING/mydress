import { db } from "@/lib/db";
import { CategoryForm } from "./_components/category-form";

interface BillboardIdPageProps {
  params: Promise<{ categoryId: string, storeId: string, }>
}

const CategoryIdPage = async (
   { params }:  BillboardIdPageProps 
) => {
  const { categoryId } = await params;
  const { storeId } = await params;
  const category = await db.category.findUnique({
    where: {
        id: categoryId
    }
  });

  const billboards = await db.billboard.findMany({
    where: {
      storeId
    }
  })


  return (
    <div className="flex-col">
        <div className="flex-1 space-y-4 p-8">
            <CategoryForm billboards={billboards} initialData={category}/>
        </div>
    </div>
  );
}

export default CategoryIdPage;