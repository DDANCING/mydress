"use client";

import {
  LogOut,
  Headphones,
  ShoppingBag,
  MapPin,
  Sun,
  Moon,
} from "lucide-react";
import clsx from "clsx";
import { logout } from "@/actions/logout";
import { User } from "@/public/animated/icons/User";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";

interface SidebarProps {
  name: string;
  email: string;
}

const navLinks = [
  {
    name: "Perfil",
    icon: User,
    href: "/profile",
  },
  {
    name: "Meus pedidos",
    icon: ShoppingBag,
    href: "/profile/orders",
  },
  {
    name: "meu endereço",
    icon: MapPin,
    href: "/profile/address",
  },
];

const onClick = () => {
  logout();
};

export function Sidebar({ name }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita hidration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return null;
  }

  return (
    <nav
      className={
        clsx(
          "bg-background rounded-xl shadow-sm py-8 flex flex-col border -mr-9 -mx-6 sm:mr-0 sm:mx-4",
          "w-20 md:w-64"
        )
      }
      style={{
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* Só mostra nome e título em telas médias para cima */}
      <div className="mb-8 hidden md:block ml-4">
        <h2 className="text-2xl font-semibold">Sua Conta</h2>
        <div className="mt-1 text-muted-foreground text-sm">
          {name && <span>{name}</span>}
        </div>
      </div>
      <ul className="flex flex-col gap-1 mb-6 flex-1 items-center md:items-stretch">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.name}>
              <button
                onClick={() => router.push(link.href)}
                className={clsx(
                  "flex items-center justify-center md:justify-start gap-0 md:gap-3 w-12 h-12 md:w-full md:h-auto px-0 md:px-3 py-0 md:py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-foreground text-background font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                )}
                tabIndex={0}
                type="button"
                aria-label={link.name}
              >
                <link.icon size={24} />
                {/* Só mostra texto em telas médias para cima */}
                <span className="hidden md:inline">{link.name}</span>
              </button>
            </li>
          );
        })}
        
        {/* Botão de Toggle de Tema */}
        <li>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center md:justify-start gap-0 md:gap-3 w-12 h-12 md:w-full md:h-auto px-0 md:px-3 py-0 md:py-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-700"
            tabIndex={0}
            type="button"
            aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
            <span className="hidden md:inline">
              {theme === "dark" ? "Modo claro" : "Modo escuro"}
            </span>
          </button>
        </li>
      </ul>
      <div className="flex flex-col gap-1 pt-2 border-t items-center md:items-stretch">
        <Link href="/profile/support">
          <button
            className="flex items-center justify-center md:justify-start gap-0 md:gap-3 w-12 h-12 md:w-full md:h-auto px-0 md:px-3 py-0 md:py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            tabIndex={0}
            type="button"
            aria-label="Suporte ao cliente"
        >
          <Headphones size={24} />
          <span className="hidden md:inline">Suporte</span>
        </button>
        </Link>
        <button
          className="flex items-center justify-center md:justify-start gap-0 md:gap-3 w-12 h-12 md:w-full md:h-auto px-0 md:px-3 py-0 md:py-2 rounded-lg hover:bg-gray-100 text-gray-700"
          tabIndex={0}
          type="button"
          aria-label="Sair"
        >
          <LogOut size={24} />
          <span className="hidden md:inline" onClick={onClick}>Sair</span>
        </button>
      </div>
    </nav>
  );
}