"use client"

import {
  NavigationMenu,
  NavigationMenuItem,
 NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"

type Route = {
  href: string
  label: string
  active: boolean
}
type props = {
  userRole: 'ADMIN' | 'OWNER' | 'SELLER' | 'USER';
}

export function MainNav({ className, userRole }: React.HTMLAttributes<HTMLElement> & props) {
  const pathname = usePathname();
  const params = useParams();

  let routes: Route[] = [];

  if (pathname?.startsWith("/dashboard/store")) {
    routes = [
     
      {
        href: `/dashboard/store/${params.storeId}/products`,
        label: "Produtos",
        active: pathname === `/dashboard/store/${params.storeId}/products`
      },
       {
        href: `/dashboard/store/${params.storeId}/raw-materials`,
        label: "Matérias-Primas",
        active: pathname === `/dashboard/store/${params.storeId}/raw-materials`
      },
      {
        href: `/dashboard/store/${params.storeId}/billboards`,
        label: "Outdoors",
        active: pathname === `/dashboard/store/${params.storeId}/billboards`
      },
      {
        href: `/dashboard/store/${params.storeId}/categories`,
        label: "Categorias",
        active: pathname === `/dashboard/store/${params.storeId}/categories`
      },
      {
        href: `/dashboard/store/${params.storeId}/sizes`,
        label: "Tamanhos",
        active: pathname === `/dashboard/store/${params.storeId}/sizes`
      },
      {
        href: `/dashboard/store/${params.storeId}/colors`,
        label: "Cores",
        active: pathname === `/dashboard/store/${params.storeId}/colors`
      },
      {
        href: `/dashboard/store/${params.storeId}/settings`,
        label: "Configurações",
        active: pathname === `/dashboard/store/${params.storeId}/settings`
      },
      
    ];
  } else if (pathname?.startsWith("/dashboard")) {
    const allRoutes = [
      // Rotas para ADMIN e OWNER apenas
      ...(userRole === 'ADMIN' || userRole === 'OWNER' ? [
        {
          href: "/dashboard",
          label: "Dashboard",
          active: pathname === "/dashboard"
        },
          {
        href: "/dashboard/overview",
        label: "Overview",
        active: pathname === "/dashboard/overview"
      },
      ] : []),
      
      
      {
        href: "/dashboard/calendar",
        label: "Calendário",
        active: pathname === "/dashboard/calendar"
      },
      
      // Contratos - apenas para ADMIN, OWNER e SELLER
      ...(userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'SELLER' ? [
        {
          href: "/dashboard/contracts",
          label: "Contratos",
          active: pathname === "/dashboard/contracts"
        }
      ] : []),
      
      {
        href: "/dashboard/orders",
        label: "Pedidos",
        active: pathname === "/dashboard/orders"
      },
      {
        href: "/dashboard/buyers",
        label: "Clientes",
        active: pathname === "/dashboard/buyers"
      },
      
     
        {
          href: "/dashboard/finance",
          label: "Financeiro",
          active: pathname === "/dashboard/finance"
        },
       
    ];
    
    routes = allRoutes;
  }

  return (
    <NavigationMenu className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      <NavigationMenuList>
        {routes.map((route) => (
          <NavigationMenuItem key={route.href}>
            <NavigationMenuLink asChild>
              <Link
                href={route.href}
                className={cn(
                  navigationMenuTriggerStyle(),
                  route.active ? "font-bold text-primary" : "text-muted-foreground"
                )}
              >
                {route.label}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
