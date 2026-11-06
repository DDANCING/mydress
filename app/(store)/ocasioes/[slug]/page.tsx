import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { experiencePhotos, getOccasion, looksFor, occasions } from "@/lib/site-content";
import { whatsappLink } from "@/lib/site-config";
import { BookingBand, ButtonLink, HowItWorks, Kicker, LookGrid, PageHero, PhotoWall, TextLink, Title } from "../../_components/site-ui";

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

const DiaDaMadrinha = () => (
  <section className="bg-night text-sand">
    <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-28">
      <div>
        <Kicker dark>Experiência em grupo</Kicker>
        <Title className="mt-6">Dia da <em className="text-gold">Madrinha</em></Title>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-sand/75">
          Um horário reservado para a noiva e as madrinhas conhecerem a coleção juntas, provarem os modelos e fecharem a paleta do casamento.
        </p>
        <p className="mt-4 max-w-lg leading-relaxed text-sand/75">
          Com recepção de boas-vindas, café e bolo, e a opção de incluir tábua de frios, espumante e outros itens combinados antes.
        </p>
        <ButtonLink href={whatsappLink("Olá! Gostaria de reservar o Dia da Madrinha para a noiva e as madrinhas.")} className="mt-9">
          Reservar o Dia da Madrinha
        </ButtonLink>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:gap-3">
        {[experiencePhotos.board, experiencePhotos.cart].map((photo) => (
          <div key={photo.src} className="site-reveal relative aspect-[3/4]">
            <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default async function OccasionPage({ params }: Props) {
  const occasion = getOccasion((await params).slug);
  if (!occasion) notFound();

  const occasionLooks = looksFor(occasion.slug);
  const others = occasions.filter(({ slug }) => slug !== occasion.slug);

  return (
    <>
      <PageHero kicker={occasion.name} title={occasion.title} text={occasion.text} photo={occasion.cover}>
        <ButtonLink href={whatsappLink(occasion.message)}>{occasion.cta}</ButtonLink>
      </PageHero>

      {occasion.photos.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 lg:px-12 lg:py-24">
          <PhotoWall photos={occasion.photos} />
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
