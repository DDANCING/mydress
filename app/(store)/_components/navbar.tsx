"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { LogoMark } from "./brand/logo";

const links = [
  { href: "/ocasioes", label: "Ocasiões" },
  { href: "/colecao-cris-mazzonetto", label: "Coleção Cris" },
  { href: "/acervo", label: "Acervo" },
  { href: "/experiencia", label: "Experiência" },
];

// Páginas que começam em fundo claro: o menu já nasce com fundo, sem transparência
const lightTopPages = ["/policies", "/bio"];

export const Navbar = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const solid = scrolled || lightTopPages.includes(pathname);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        // Sobre as fotos do topo, o gradiente garante a leitura do menu
        solid ? "border-b border-border bg-sand/95 text-ink backdrop-blur" : "bg-gradient-to-b from-night/80 to-transparent text-sand",
      )}
    >
      <nav aria-label="Principal" className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3" aria-label="My Dress Floripa, página inicial">
          <LogoMark className="size-12" />
          <span className="hidden text-[11px] font-normal uppercase tracking-[0.25em] sm:inline">My Dress Floripa</span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "py-2 text-[11px] font-normal uppercase tracking-[0.2em] underline-offset-8 transition-opacity hover:opacity-70",
                isActive(link.href) && "underline decoration-gold",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/agendar"
            className={cn(
              "border px-6 py-3.5 text-[11px] font-normal uppercase tracking-[0.2em] transition-colors",
              solid ? "border-ink bg-ink text-sand hover:bg-transparent hover:text-ink" : "border-sand/60 hover:bg-sand hover:text-ink",
            )}
          >
            Agendar
          </Link>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger aria-label="Abrir menu" className="-mr-2 flex size-11 items-center justify-center lg:hidden">
            <Menu className="size-6" strokeWidth={1.25} />
          </SheetTrigger>
          <SheetContent side="right" className="w-full border-none bg-night text-sand sm:max-w-sm">
            <SheetTitle className="px-6 pt-8 text-[11px] font-normal uppercase tracking-[0.25em] text-gold">Menu</SheetTitle>
            <ul className="flex flex-col gap-1 px-6 pt-4">
              {[{ href: "/", label: "Início" }, ...links, { href: "/agendar", label: "Agendar" }].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="block py-3 font-display text-4xl">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
};
