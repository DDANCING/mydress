import Link from "next/link";
import type { Metadata } from "next";

import { colors, looks, occasions } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { ButtonLink, Kicker, LookGrid, Title } from "../_components/site-ui";
import { whatsappLink } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Acervo",
  description: "Veja os vestidos de festa da My Dress Floripa por ocasião e cor e agende sua prova em Coqueiros, Florianópolis.",
  alternates: { canonical: "/acervo" },
};

type Filters = { ocasiao?: string; cor?: string; colecao?: string };

// Os filtros ficam na URL: a página funciona sem JavaScript e o link filtrado pode ser enviado por WhatsApp
const hrefWith = (current: Filters, change: Filters) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...change })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/acervo?${query}` : "/acervo";
};

const Chip = ({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) => (
  <Link
    href={href}
    scroll={false}
    aria-current={active ? "true" : undefined}
    className={cn(
      "inline-flex min-h-10 shrink-0 items-center gap-2 border px-4 text-sm font-normal transition-colors",
      active ? "border-ink bg-ink text-sand" : "border-input hover:border-ink",
    )}
  >
    {children}
  </Link>
);

export default async function CollectionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  // Valor desconhecido na URL é ignorado, em vez de mostrar uma lista vazia
  const ocasiao = occasions.find(({ slug }) => slug === query.ocasiao)?.slug;
  const cor = colors.find(({ slug }) => slug === query.cor)?.slug;
  const colecao = query.colecao === "cris" ? "cris" : undefined;
  const filters: Filters = { ocasiao, cor, colecao };

  const results = looks.filter(
    (look) =>
      (!ocasiao || look.occasions.includes(ocasiao)) &&
      (!cor || look.color === cor) &&
      (!colecao || look.exclusive),
  );
  const hasFilter = Boolean(ocasiao || cor || colecao);

  return (
    <>
      <section className="bg-night text-sand">
        <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-36 sm:px-8 lg:px-12">
          <Kicker dark>O acervo</Kicker>
          <Title as="h1" className="mt-6 lg:text-7xl">Encontre o <em className="text-gold">seu</em>.</Title>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-sand/75">
            Alguns dos modelos disponíveis. Escolha os seus favoritos e prove com hora marcada.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="space-y-5">
          <div className="sm:flex sm:items-center sm:gap-5">
            <h2 className="mb-2 w-20 shrink-0 text-[11px] font-normal uppercase tracking-[0.22em] text-muted-foreground sm:mb-0">Ocasião</h2>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              <Chip href={hrefWith(filters, { ocasiao: undefined })} active={!ocasiao}>Todas</Chip>
              {occasions.filter(({ slug }) => looks.some((look) => look.occasions.includes(slug))).map(({ slug, name }) => (
                <Chip key={slug} href={hrefWith(filters, { ocasiao: slug })} active={ocasiao === slug}>{name}</Chip>
              ))}
              <Chip href={hrefWith(filters, { colecao: colecao ? undefined : "cris" })} active={Boolean(colecao)}>Coleção Cris</Chip>
            </div>
          </div>
          <div className="sm:flex sm:items-center sm:gap-5">
            <h2 className="mb-2 w-20 shrink-0 text-[11px] font-normal uppercase tracking-[0.22em] text-muted-foreground sm:mb-0">Cor</h2>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              <Chip href={hrefWith(filters, { cor: undefined })} active={!cor}>Todas</Chip>
              {colors.map(({ slug, name, swatch }) => (
                <Chip key={slug} href={hrefWith(filters, { cor: slug })} active={cor === slug}>
                  <span aria-hidden className="size-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: swatch }} />
                  {name}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        <p aria-live="polite" className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
          {results.length} {results.length === 1 ? "vestido" : "vestidos"}
          {hasFilter && (
            <Link href="/acervo" scroll={false} className="ml-4 underline underline-offset-4">Limpar filtros</Link>
          )}
        </p>

        <div className="mt-8">
          {results.length > 0 ? (
            <LookGrid looks={results} />
          ) : (
            <div className="bg-muted px-6 py-16 text-center">
              <p className="font-display text-3xl">Nenhum vestido nessa combinação por aqui.</p>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                O site mostra só parte do acervo. Conte o que você procura e a gente verifica na loja.
              </p>
              <ButtonLink href={whatsappLink("Olá! Estou procurando um vestido e não encontrei no site.")} variant="ink" className="mt-7">
                Perguntar no WhatsApp
              </ButtonLink>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
