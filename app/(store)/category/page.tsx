
import { db } from "@/lib/db";
import CategoryGrid from "./_components/CategoryGrid";

export const metadata = {
  title: "Categorias",
  description: "Encontre seu produto pela categoria. Envio rápido e atendimento personalizado.",
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
