
import { db } from "@/lib/db";
import ColorGrid from "./_components/ColorGrid";


export const metadata = {
  title: "Cores",
  description: "Descubra a paleta de cores da My Dress Floripa. Envio rápido e atendimento personalizado.",
};

export default async function ColorsPage() {
  const color = await db.color.findMany({
    where: {
      products: {
        some: {
          isArchived: false,
          siteVisible: true,
        },
      },
    },
  });

  return <ColorGrid color={color} />;
}
