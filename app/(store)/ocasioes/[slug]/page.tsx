import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getOccasion, looksFor, occasions } from "@/lib/site-content";
import { whatsappLink } from "@/lib/site-config";
import type { LightboxItem } from "../../_components/lightbox";
import { BookingBand, ButtonLink, DiaDaMadrinha, HowItWorks, Kicker, LookGrid, PageHero, PhotoWall, TextLink, Title } from "../../_components/site-ui";

export const dynamicParams = false;
export const generateStaticParams = () => occasions.map(({ slug }) => ({ slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const occasion = getOccasion((await params).slug);
  if (!occasion) return {};
  return {
    title: `Vestidos para ${occasion.name.toLowerCase()}`,
    description: occasion.text,
    alternates: { canonical: `/ocasioes/${occasion.slug}` },
    openGraph: { images: [occasion.cover.src] },
  };
}

export default async function OccasionPage({ params }: Props) {
  const occasion = getOccasion((await params).slug);
  if (!occasion) notFound();

  const occasionLooks = looksFor(occasion.slug);
  const others = occasions.filter(({ slug }) => slug !== occasion.slug);
  const zoom: LightboxItem = {
    title: occasion.name,
    detail: occasion.summary,
    message: occasion.message,
    images: [occasion.cover, ...occasion.photos],
  };

  return (
    <>
      <PageHero kicker={occasion.name} title={occasion.title} text={occasion.text} photo={occasion.cover} zoom={zoom}>
        <ButtonLink href={whatsappLink(occasion.message)}>{occasion.cta}</ButtonLink>
      </PageHero>

      {occasion.photos.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 lg:px-12 lg:py-24">
          <PhotoWall photos={occasion.photos} item={zoom} offset={1} />
        </section>
      )}

      {occasion.slug === "madrinhas" && <DiaDaMadrinha />}

      {occasionLooks.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Title>Vestidos para {occasion.name.toLowerCase()}</Title>
            <TextLink href={`/acervo?ocasiao=${occasion.slug}`}>Filtrar por cor</TextLink>
          </div>
          <div className="mt-12">
            <LookGrid looks={occasionLooks} />
          </div>
        </section>
      )}

      <HowItWorks />

      <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 lg:px-12">
        <Kicker>Outras ocasiões</Kicker>
        <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
          {others.map(({ slug, name }) => (
            <li key={slug}>
              <Link href={`/ocasioes/${slug}`} className="font-display text-3xl transition-colors hover:text-terracotta">{name}</Link>
            </li>
          ))}
        </ul>
      </section>

      <BookingBand
        title={<>Agora só falta encontrar <em className="text-gold">o seu</em>.</>}
        text="Agende seu horário e venha descobrir o vestido perfeito para o seu momento."
        message={occasion.message}
        cta={occasion.cta}
      />
    </>
  );
}
