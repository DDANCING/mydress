
import { ProfileOptions } from "@/components/auth/user-button";
import { MainNav } from "@/app/(admin)/_components/main-nav";
import StoreSwitcher from "@/app/(admin)/_components/store-switcher";
import { MobileSidebar } from "@/app/(admin)/_components/mobile-sidebar";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";


const NavBar = async () => {
  const user = await auth();
  const userId = user?.user.id; 

  if(!userId) {
    redirect("/auth/login")
  }

  const stores = await db.store.findMany({
    
  })

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">

        {/* Store Switcher - sempre visível */}
        <StoreSwitcher items={stores} />
        
        {/* Main Navigation - oculta em dispositivos móveis */}
        <MainNav userRole={user.user.role} className="mx-6 hidden md:flex" />

        <div className="hidden md:flex ml-auto items-center space-x-4">
          <ProfileOptions />
        </div>
          <div className="md:hidden mr-2 flex justify-end w-full">
          <MobileSidebar userRole={user.user.role} stores={stores} />
        </div>
        
      </div>
    </nav>
  );
}

export default NavBar;