
import { db } from "@/lib/db";
import CategoryGrid from "./_components/CategoryGrid";

export const metadata = {
  title: "Categorias",
  description: "Vestidos de festa para alugar em Florianópolis por categoria: madrinha, formatura, casamento e mais.",
  alternates: { canonical: "/category" },
};

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    where: {
      products: {
        some: {
          isArchived: false,
          siteVisible: true,
        },
      },
    },
    include: {
      billboard: {
        select: {
          imageUrl: true,
        },
      },
    },
  });

  return <CategoryGrid categories={categories} />;
}
