"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  HomeIcon,
  Layers,
  LayoutDashboard,
  Menu,
  Palette,
  Search,
  Shirt,
  ShoppingBag,
  User,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import useCart from "@/hooks/use-cart";
import { GlobalSearch } from "@/components/ui/global-search";
import { NavbarSidebar } from "./navbar-sidebar";
import { Logo } from "./brand/logo";

interface UserProps {
  user: {
    id: string;
    role?: string;
  } | null;
}

// Perfis da equipe que acessam o painel administrativo
const DASHBOARD_ROLES = ["OWNER", "ADMIN", "SELLER"];

const links = [
  { href: "/products", label: "Vestidos" },
  { href: "/category", label: "Ocasiões" },
  { href: "/color", label: "Cores" },
  { href: "/#como-funciona", label: "Como funciona" },
];

const sidebarItems = [
  { href: "/", icon: <HomeIcon size={18} />, children: "Início" },
  { href: "/products", icon: <Shirt size={18} />, children: "Vestidos" },
  { href: "/category", icon: <Layers size={18} />, children: "Ocasiões" },
  { href: "/color", icon: <Palette size={18} />, children: "Cores" },
  { href: "/wishlist", icon: <Heart size={18} />, children: "Favoritos" },
  { href: "/cart", icon: <ShoppingBag size={18} />, children: "Sacola" },
  { href: "/profile", icon: <User size={18} />, children: "Minha conta" },
];

const iconButton =
  "relative inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary focus-visible:bg-secondary";

export const Navbar = ({ user }: UserProps) => {
  const pathname = usePathname();
  const cart = useCart();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsSearchOpen(false);
  }, [pathname]);

  const canAccessDashboard = !!user?.role && DASHBOARD_ROLES.includes(user.role);

  // O carrinho fica salvo no navegador, então só mostramos a contagem depois de montar
  const cartCount = isMounted ? cart.items.length : 0;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow] duration-300",
        isScrolled || isSearchOpen
          ? "border-border bg-background/90 shadow-[0_8px_24px_-18px_oklch(0.23_0.035_350/0.35)] backdrop-blur-md"
          : "border-transparent bg-background"
      )}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className={cn(iconButton, "-ml-2 lg:hidden")}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>

        <Link href="/" className="-my-2" aria-label="My Dress Floripa, página inicial">
          <Logo size={80} />
        </Link>

        <ul className="mx-auto hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active = link.href !== "/#como-funciona" && pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-[15px] transition-colors",
                    active
                      ? "text-primary"
                      : "text-foreground/80 hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
          {canAccessDashboard && (
            <Link
              href="/dashboard"
              className="mr-1.5 inline-flex h-10 items-center gap-2 rounded-full bg-plum px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-plum/90 sm:px-4"
              aria-label="Abrir dashboard"
            >
              <LayoutDashboard className="size-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}
          <button
            type="button"
            className={iconButton}
            onClick={() => setIsSearchOpen((open) => !open)}
            aria-label={isSearchOpen ? "Fechar busca" : "Buscar vestidos"}
            aria-expanded={isSearchOpen}
          >
            {isSearchOpen ? <X className="size-5" /> : <Search className="size-5" />}
          </button>
          <Link href="/wishlist" className={cn(iconButton, "hidden sm:inline-flex")} aria-label="Favoritos">
            <Heart className="size-5" />
          </Link>
          <Link
            href={user ? "/profile" : "/auth/login"}
            className={cn(iconButton, "hidden sm:inline-flex")}
            aria-label={user ? "Minha conta" : "Entrar"}
          >
            <User className="size-5" />
          </Link>
          <Link href="/cart" className={iconButton} aria-label={`Sacola, ${cartCount} ${cartCount === 1 ? "item" : "itens"}`}>
            <ShoppingBag className="size-5" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold leading-[18px] text-primary-foreground tabular-nums">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {isSearchOpen && (
        <div className="border-t border-border bg-background">
          <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
            <GlobalSearch />
          </div>
        </div>
      )}

      <NavbarSidebar
        user={user}
        open={isSidebarOpen}
        items={sidebarItems}
        onOpenChange={setIsSidebarOpen}
      />
    </header>
  );
};
