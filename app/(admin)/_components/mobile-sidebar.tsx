"use client"

import { useState } from "react"
import { Menu, Home, Calendar, FileText, ShoppingCart, Users, DollarSign, Package, ImageIcon, Grid3x3, Palette, Ruler, Settings } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ProfileOptions } from "@/components/auth/user-button"
import { Separator } from "@/components/ui/separator"

type Route = {
  href: string
  label: string
  active: boolean
  icon: React.ReactNode
}

interface MobileSidebarProps {
  stores: any[]
}

type props = {
  userRole: 'ADMIN' | 'OWNER' | 'SELLER' | 'USER';
}

export function MobileSidebar({ userRole }: MobileSidebarProps & props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const params = useParams()

  let routes: Route[] = []
  

  if (pathname?.startsWith("/dashboard/store")) {
    routes = [
      {
        href: `/dashboard/store/${params.storeId}/products`,
        label: "Produtos",
        active: pathname === `/dashboard/store/${params.storeId}/products`,
        icon: <Package className="h-4 w-4" />
      },
      {
        href: `/dashboard/store/${params.storeId}/billboards`,
        label: "Outdoors",
        active: pathname === `/dashboard/store/${params.storeId}/billboards`,
        icon: <ImageIcon className="h-4 w-4" />
      },
      {
        href: `/dashboard/store/${params.storeId}/categories`,
        label: "Categorias",
        active: pathname === `/dashboard/store/${params.storeId}/categories`,
        icon: <Grid3x3 className="h-4 w-4" />
      },
      {
        href: `/dashboard/store/${params.storeId}/sizes`,
        label: "Tamanhos",
        active: pathname === `/dashboard/store/${params.storeId}/sizes`,
        icon: <Ruler className="h-4 w-4" />
      },
      {
        href: `/dashboard/store/${params.storeId}/colors`,
        label: "Cores",
        active: pathname === `/dashboard/store/${params.storeId}/colors`,
        icon: <Palette className="h-4 w-4" />
      },
      {
        href: `/dashboard/store/${params.storeId}/settings`,
        label: "Configurações",
        active: pathname === `/dashboard/store/${params.storeId}/settings`,
        icon: <Settings className="h-4 w-4" />
      },
    ]
  } else if (pathname?.startsWith("/dashboard")) {
    routes = [
       ...(userRole === 'ADMIN' || userRole === 'OWNER' ? [
      {
        href: "/dashboard",
        label: "Dashboard",
        active: pathname === "/dashboard",
        icon: <Home className="h-4 w-4" />
      },
      {
        href: "/dashboard/overview",
        label: "Overview",
        active: pathname === "/dashboard/overview",
        icon: <Home className="h-4 w-4" />
      },
      ] : []),
      {
        href: "/dashboard/calendar",
        label: "Calendário",
        active: pathname === "/dashboard/calendar",
        icon: <Calendar className="h-4 w-4" />
      },
      {
        href: "/dashboard/contracts",
        label: "Contratos",
        active: pathname === "/dashboard/contracts",
        icon: <FileText className="h-4 w-4" />
      },
      {
        href: "/dashboard/orders",
        label: "Pedidos",
        active: pathname === "/dashboard/orders",
        icon: <ShoppingCart className="h-4 w-4" />
      },
      {
        href: "/dashboard/buyers",
        label: "Clientes",
        active: pathname === "/dashboard/buyers",
        icon: <Users className="h-4 w-4" />
      },
      {
        href: "/dashboard/finance",
        label: "Financeiro",
        active: pathname === "/dashboard/finance",
        icon: <DollarSign className="h-4 w-4" />
      }
    ]
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="h-8 w-8"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menu</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[300px]">
        <SheetHeader>
          <SheetTitle className="text-left">Menu de Navegação</SheetTitle>
        </SheetHeader>
        <nav className="mt-6">
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  route.active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {route.icon}
                {route.label}
              </Link>
            ))}
          </div>
          <Separator/>
          <div className="flex items-center m-2">
            <ProfileOptions />
            <h1 className=" m-2 text-muted-foreground hover:text-foreground hover:bg-accent">Perfil</h1>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
