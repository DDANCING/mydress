import { db } from "@/lib/db";

interface DashboardStorePageProps {
  params: Promise<{ storeId: string }>
}

const DashboardStorePage = async ({ params }: DashboardStorePageProps) => {
  const { storeId } = await params;

  const store = await db.store.findFirst({
    where: {
      id: storeId, 
    },
  });

  return <div>active store: {store?.name}</div>;
};

export default DashboardStorePage;
