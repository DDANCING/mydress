import React from "react";

import { Navbar } from "./_components/navbar";
import { Footer } from "./_components/footer";
import { StoreThemeBody } from "./_components/brand/store-theme-body";
import { storeFontVariables } from "./_components/brand/fonts";
import { whatsappLink } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <StoreThemeBody />
    <div className={cn("theme-store flex min-h-screen flex-col font-light", storeFontVariables)}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <a
        href={whatsappLink("Olá! Gostaria de agendar uma prova na My Dress Floripa.")}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-40 bg-gold px-5 py-3.5 text-[11px] font-normal uppercase tracking-[0.2em] text-ink shadow-lg transition-colors hover:bg-sand sm:bottom-6 sm:right-6"
      >
        WhatsApp
      </a>
    </div>
  </>
);

export default Layout;
