import { auth } from "@/auth";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SettingsForm } from "./_components/settings-form";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface SettingsPageProps {
  params: Promise<{ storeId: string }>
}

const SettingsPage = async ({ params }: SettingsPageProps) => {
  const { storeId } = await params;
  const user = await auth();
  const userId = user?.user.id;

  if(!userId) {
    redirect("/auth/login")
  }

  const store = await db.store.findFirst({
    where: {
      id: storeId,
    }
  })

  if(!store) {
    redirect("/dashboard")
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SettingsForm initialData={store}/>
      </div>
    </div>
  )
}

export default SettingsPage