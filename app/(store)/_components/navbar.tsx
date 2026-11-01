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
import { siteConfig, whatsappLink } from "@/lib/site-config";

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
      {/* Faixa de avisos: duas cópias idênticas para o loop não ter emenda */}
      <div className="h-7 overflow-hidden bg-plum text-primary-foreground">
        <div className="store-marquee flex w-max">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0">
              {[...siteConfig.announcements, ...siteConfig.announcements].map((text, index) => (
                <li
                  key={index}
                  className="flex items-center gap-8 pr-8 font-mono text-[11px] uppercase leading-7 tracking-[0.14em] whitespace-nowrap"
                >
                  <span aria-hidden className="text-blush">✦</span>
                  {text}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <nav className="mx-auto grid h-[52px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-5">
        <div className="flex items-center">
          <button
            type="button"
            className={cn(iconButton, "-ml-2 lg:hidden")}
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </button>

          <ul className="hidden items-center gap-1.5 lg:flex">
            {links.map((link) => {
              const active = link.href !== "/#como-funciona" && pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "inline-flex h-8 items-center rounded-full px-3.5 font-mono text-[12px] uppercase tracking-[0.08em] transition-colors",
                      active ? "bg-foreground text-background" : "bg-card hover:bg-secondary"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <Link href="/" aria-label="My Dress Floripa, página inicial">
          <Logo size={52} />
        </Link>

        <div className="flex items-center justify-end gap-0.5">
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
          <a
            href={whatsappLink("Olá! Gostaria de agendar uma prova de vestido.")}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 hidden h-8 items-center rounded-full bg-foreground px-4 font-mono text-[12px] uppercase tracking-[0.08em] text-background transition-colors hover:bg-primary lg:inline-flex"
          >
            Agendar prova
          </a>
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
