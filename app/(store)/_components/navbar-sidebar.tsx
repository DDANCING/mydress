import Link from "next/link";
import { ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RoleGateNoMessage } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";
import { DashboardIcon, ExitIcon, PersonIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { logout } from "@/actions/logout";
import { siteConfig } from "@/lib/site-config";
import { Logo } from "./brand/logo";

interface NavbarItem {
  href: string;
  icon: ReactNode;
  children: ReactNode; // Corrigido de "Children" para "children" por padrão React
}

interface Props {
  items: NavbarItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
  } | null;
}

const handleLogout = () => {
  logout();
};

export const NavbarSidebar = ({ items, onOpenChange, open, user }: Props) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 transition-all">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center">
            <SheetTitle className="font-normal"><Logo size={72} className="-my-4" /></SheetTitle>
          </div>
        </SheetHeader>
        <ScrollArea className="flex flex-col overflow-y-auto h-full pb-2">
          {items.map((item) => (
            <Link
              onClick={() => onOpenChange(false)}
              key={item.href}
              href={item.href}
              className="w-full text-left p-4 hover:bg-secondary hover:text-secondary-foreground flex items-center gap-2 text-base font-medium"
            >
              {item.icon}
              {item.children}
            </Link>
          ))}
          <div className="border-t">
            {user ? (
              <RoleGateNoMessage allowedRoles={[UserRole.ADMIN, UserRole.SELLER, UserRole.OWNER]}>
                <Link
                  onClick={() => onOpenChange(false)}
                  href="/dashboard"
                  className="w-full gap-2 text-left p-4 hover:bg-secondary hover:text-secondary-foreground flex items-center text-base font-medium"
                >
                  <DashboardIcon /> <span>Dashboard</span>
                </Link>
              </RoleGateNoMessage>
            ) : (
              <div>
                <Link
                  onClick={() => onOpenChange(false)}
                  href="/auth/login"
                  className="w-full gap-2 text-left p-4 hover:bg-secondary hover:text-secondary-foreground flex items-center text-base font-medium"
                >
                  <PersonIcon /> <span>Entrar</span>
                </Link>
                <Link
                  onClick={() => onOpenChange(false)}
                  href="/auth/register"
                  className="w-full gap-2 text-left p-4 hover:bg-secondary hover:text-secondary-foreground flex items-center text-base font-medium"
                >
                  <PlusCircledIcon /> <span>Criar conta</span>
                </Link>
              </div>
            )}
          </div>
        </ScrollArea>
        {user && (
          <div>
            <button
              onClick={handleLogout}
              className="w-full gap-2 text-left p-4 hover:bg-secondary hover:text-secondary-foreground flex items-center text-base font-medium"
            >
              <ExitIcon /> <span>Sair</span>
            </button>
          </div>
        )}
        <div className="p-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.fullName}
        </div>
      </SheetContent>
    </Sheet>
  );
};