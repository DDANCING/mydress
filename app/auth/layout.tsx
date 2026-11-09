import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FaInstagram } from "react-icons/fa";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/lib/site-config";
import { storeFontVariables } from "@/app/(store)/_components/brand/fonts";
import { StoreThemeBody } from "@/app/(store)/_components/brand/store-theme-body";
import { Logo, LogoMark } from "@/app/(store)/_components/brand/logo";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={cn("theme-store min-h-screen lg:grid lg:grid-cols-12", storeFontVariables)}>
      <StoreThemeBody />

      {/* Painel da marca (desktop) */}
      <aside className="relative hidden overflow-hidden bg-plum text-primary-foreground lg:col-span-5 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <LogoMark className="pointer-events-none absolute -bottom-24 -right-24 w-[34rem] text-primary-foreground/[0.06]" />

        <Link
          href="/"
          className="relative inline-flex w-fit items-center gap-2 text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar para o site
        </Link>

        <div className="relative">
          <h2 className="max-w-md font-display text-5xl leading-[1.05] tracking-[-0.02em] text-balance xl:text-6xl">
            Área da equipe My Dress
          </h2>
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-primary-foreground/75">
            Agenda, contratos e financeiro da loja em um só lugar.
          </p>
        </div>

        <a
          href={siteConfig.instagram.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-flex w-fit items-center gap-2 text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
        >
          <FaInstagram className="size-4" />
          {siteConfig.instagram.handle}
        </a>
      </aside>

      {/* Formulário */}
      <main className="flex min-h-screen flex-col px-4 py-6 sm:px-6 lg:col-span-7 lg:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="My Dress Floripa, página inicial" className="-my-2">
            <Logo size={72} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="size-4" />
            Voltar para o site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            {/* Os formulários leem a URL (useSearchParams): o resto da página sai estático e o formulário entra em seguida */}
            <Suspense fallback={<FormSkeleton />}>{children}</Suspense>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.fullName}
        </p>
      </main>
    </div>
  );
};

const FormSkeleton = () => (
  <div aria-busy="true" aria-label="Carregando" className="space-y-4">
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

export default AuthLayout;
