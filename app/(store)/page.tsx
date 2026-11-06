import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { registerVisitor } from "@/actions/register-visitor";
import { crisLooks, experiencePhotos, googleReviewsUrl, heroPhotos, looks, occasions, reviews } from "@/lib/site-content";
import { siteConfig, whatsappLink } from "@/lib/site-config";
import { BookingBand, ButtonLink, HowItWorks, Kicker, LookGrid, TextLink, Title } from "./_components/site-ui";

export const metadata: Metadata = {
  title: { absolute: "My Dress Floripa | Aluguel de vestidos de festa em Florianópolis" },
  description: "Aluguel de vestidos de festa para madrinhas, formandas e convidadas em Coqueiros, Florianópolis. Atendimento individual, com hora marcada.",
  alternates: { canonical: "/" },
};

// Dados estruturados para o Google mostrar a loja (endereço, telefone, redes) na busca e no Maps
const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: siteConfig.fullName,
  legalName: siteConfig.legalName,
  description: siteConfig.tagline,
  url: siteConfig.url,
  logo: `${siteConfig.url}/icons/icon-512.png`,
  image: `${siteConfig.url}/og-image.png`,
  telephone: `+${siteConfig.whatsapp.number}`,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.address.street,
    addressLocality: siteConfig.address.city,
    addressRegion: siteConfig.address.state,
    postalCode: siteConfig.address.zip,
    addressCountry: "BR",
  },
  areaServed: siteConfig.address.city,
  sameAs: [siteConfig.instagram.url],
};

const bookingMessage = "Olá! Gostaria de agendar uma prova na My Dress Floripa.";
const marquee = ["Madrinhas", "Formandas", "Convidadas", "Bordados exclusivos", "Casamento civil", "Pré wedding", "Chá revelação"];

export default async function Home() {
  await registerVisitor();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Hero */}
      <section className="bg-night text-sand">
        <div className="mx-auto grid max-w-[1440px] lg:min-h-[100svh] lg:grid-cols-[1fr_1.05fr]">
          <div className="flex flex-col justify-center px-4 pb-12 pt-32 sm:px-8 lg:px-12 lg:pt-28">
            <Kicker dark>Aluguel de vestidos de festa · Florianópolis</Kicker>
            <h1 className="mt-7 max-w-2xl font-display text-5xl font-normal leading-[1.03] tracking-[-0.01em] sm:text-7xl">
              Nossa missão é oferecer a melhor <em className="text-gold">experiência imaginável</em> em alugar um vestido.
            </h1>
            <p className="mt-6 text-lg text-sand/75">Vestidos de festa para madrinhas, formandas e convidadas.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href={whatsappLink(bookingMessage)}>Agendar para provar</ButtonLink>
              <ButtonLink href="/ocasioes" variant="outlineDark">Ver por ocasião</ButtonLink>
            </div>
            <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="mt-10 w-fit border-t border-sand/15 pt-5 text-sm text-sand/75 transition-colors hover:text-gold">
              <span aria-hidden className="tracking-[0.2em] text-gold">★★★★★ </span>
              5,0 no Google · +1.400 avaliações
            </a>
          </div>

          <div className="grid grid-cols-[0.62fr_1fr] gap-2 lg:gap-3">
            <div className="relative mt-16 h-[62%] min-h-64 lg:mt-36">
              <Image src={heroPhotos.detail.src} alt={heroPhotos.detail.alt} fill preload sizes="(min-width: 1024px) 22vw, 38vw" className="object-cover" />
            </div>
            <div className="relative aspect-[3/4] lg:aspect-auto">
              <Image src={heroPhotos.body.src} alt={heroPhotos.body.alt} fill preload sizes="(min-width: 1024px) 34vw, 62vw" className="object-cover object-top" />
            </div>
          </div>
        </div>
      </section>

      {/* Faixa */}
      <div aria-hidden className="overflow-hidden border-b border-border py-6">
        <div className="store-marquee flex w-max">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((item, index) => (
            <span key={index} className="flex items-center font-display text-3xl italic">
              {item}<span className="mx-7 text-gold">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Ocasiões: a primeira decisão de quem chega */}
      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
        <Kicker>Ocasiões</Kicker>
        <Title className="mt-6">Para cada ocasião, o vestido <em className="text-terracotta">certo</em>.</Title>
        <ul className="mt-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {occasions.map((occasion) => (
            <li key={occasion.slug} className="site-reveal">
              <Link href={`/ocasioes/${occasion.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-night text-sand sm:aspect-[5/6]">
                <Image src={occasion.cover.src} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-6">
                  <span className="block font-display text-4xl">{occasion.name}</span>
                  <span className="mt-1 block max-w-xs text-sand/85">{occasion.summary}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Coleção Cris Mazzonetto */}
      <section className="bg-night text-sand">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:px-12 lg:py-28">
          <div className="lg:col-span-5 lg:pr-8">
            <Kicker dark>Coleção exclusiva</Kicker>
            <Title className="mt-6">Bordados de <em className="text-gold">Cris Mazzonetto</em>, para alugar.</Title>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-sand/75">
              Em parceria com a estilista, a My Dress lança 15 modelos com bordados, pedrarias e acabamento sofisticado, disponíveis apenas para locação.
            </p>
            <ButtonLink href="/colecao-cris-mazzonetto" className="mt-9">Conhecer a coleção</ButtonLink>
          </div>
          <ul className="grid grid-cols-3 gap-2 lg:col-span-7 lg:gap-3">
            {crisLooks.slice(0, 3).map((look) => (
              <li key={look.id} className="site-reveal relative aspect-[9/16]">
                <Image src={look.photo.src} alt={look.photo.alt} fill sizes="(min-width: 1024px) 18vw, 33vw" className="object-cover" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Acervo */}
      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>O acervo</Kicker>
            <Title className="mt-6">Encontre o <em className="text-terracotta">seu</em>.</Title>
          </div>
          <TextLink href="/acervo">Ver acervo completo</TextLink>
        </div>
        <div className="mt-12">
          <LookGrid looks={looks.filter((look) => !look.exclusive).slice(0, 8)} />
        </div>
      </section>

      {/* Experiência */}
      <section className="bg-night text-sand">
        <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <div>
              <Kicker dark>A experiência</Kicker>
              <Title className="mt-6 lg:text-7xl">Uma hora <em className="text-gold">só sua</em>.</Title>
            </div>
            <div>
              <p className="max-w-lg text-lg leading-relaxed text-sand/75">
                Atendimento com hora marcada, café passado na hora, provador reservado e alguém do lado para dizer a verdade sobre cada vestido.
              </p>
              <TextLink href="/experiencia" className="mt-6 text-gold">Conhecer o espaço</TextLink>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
            <div className="site-reveal relative col-span-2 aspect-[3/2]">
              <Image src={experiencePhotos.salon.src} alt={experiencePhotos.salon.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="site-reveal relative aspect-square lg:aspect-auto">
              <Image src={experiencePhotos.coffee.src} alt={experiencePhotos.coffee.alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            </div>
            <div className="site-reveal relative aspect-square lg:aspect-auto">
              <Image src={experiencePhotos.dog.src} alt={experiencePhotos.dog.alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Avaliações */}
      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>Avaliações</Kicker>
            <Title className="mt-6">Quem viveu a experiência, <em className="text-terracotta">recomenda</em>.</Title>
          </div>
          <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="border-b border-current pb-1 text-[11px] font-normal uppercase tracking-[0.22em] transition-opacity hover:opacity-70">
            Ver +1.400 avaliações no Google
          </a>
        </div>
        <ul className="mt-12 grid gap-10 md:grid-cols-3">
          {reviews.map((review) => (
            <li key={review} className="site-reveal border-t border-ink/20 pt-6">
              <p aria-label="5 estrelas" className="tracking-[0.2em] text-terracotta">★★★★★</p>
              <blockquote className="mt-4 font-display text-[1.75rem] leading-[1.2]">“{review}”</blockquote>
              <p className="mt-4 text-sm text-muted-foreground">Avaliação no Google</p>
            </li>
          ))}
        </ul>
      </section>

      <HowItWorks />

      <BookingBand
        title={<>Seu vestido está <em className="text-gold">esperando por você</em>.</>}
        text="Chame no WhatsApp para agendar seu horário e experimentar os modelos."
        message={bookingMessage}
      />
    </>
  );
}
