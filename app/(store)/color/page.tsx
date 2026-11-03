
import { db } from "@/lib/db";
import ColorGrid from "./_components/ColorGrid";


export const metadata = {
  title: "Cores",
  description: "Vestidos de festa para alugar em Florianópolis por cor. Escolha online e prove no provador em Coqueiros.",
  alternates: { canonical: "/color" },
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
