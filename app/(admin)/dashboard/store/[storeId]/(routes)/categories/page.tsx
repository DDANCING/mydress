import { formatDateForDisplay } from "@/lib/date-utils";
import { db } from "@/lib/db";
import { CategoryClient } from "./_components/client";
import { CategoriesColumn } from "./_components/columns";

interface CategoriesPageProps {
  params: Promise<{ storeId: string }>;
}

const categoriesPage = async ({ params }: CategoriesPageProps) => {

    const { storeId } = await params;

    const categories = await db.category.findMany({
        where: {
            storeId,
        },
        include: {
            billboard: true,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const formatedCategories: CategoriesColumn[] = categories.map((item) => {
    return {
      id: item.id,
      name: item.name,
      billboardLabel: item.billboard.label,
      createdAt: formatDateForDisplay(item.createdAt),
    };
  });

    return ( 
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CategoryClient data={formatedCategories} />
            </div>
        </div>
    )
}
export default categoriesPage