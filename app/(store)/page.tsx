import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { registerVisitor } from "@/actions/register-visitor";
import {
  crisLooks,
  experiencePhotos,
  experienceQuote,
  galleryPhotos,
  googleReviewsUrl,
  heroPhotos,
  looks,
  occasions,
  reviews,
} from "@/lib/site-content";
import { siteConfig, whatsappLink } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { PhotoRail, Zoom, type LightboxItem } from "./_components/lightbox";
import {
  BookingBand,
  ButtonLink,
  DiaDaMadrinha,
  ExperienceMosaic,
  HowItWorks,
  Kicker,
  LookGrid,
  TeamSection,
  TextLink,
  Title,
  VisitSection,
} from "./_components/site-ui";

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
const marquee = ["Madrinhas", "Formandas", "Convidadas", "Bordados exclusivos", "Vestidos de festa"];

// 7 cartões em 3 colunas: o primeiro e o último ocupam duas para fechar a grade sem buraco
const occasionCards = [
  { href: "/experiencia", name: "Experiência", summary: "Atendimento com hora marcada, café e provador reservado.", cover: experiencePhotos.salon.src, cell: "sm:col-span-2", tile: "sm:aspect-[5/3] lg:aspect-auto lg:h-full" },
  ...occasions.map((occasion) => ({
    href: `/ocasioes/${occasion.slug}`,
    name: occasion.name,
    summary: occasion.summary,
    cover: occasion.cover.src,
    cell: occasion.slug === "cha-revelacao" ? "lg:col-span-2" : "",
    tile: occasion.slug === "cha-revelacao" ? "lg:aspect-auto lg:h-full" : "",
  })),
];

const galleryItem: LightboxItem = {
  title: "Novidades que chegaram",
  detail: "Uma seleção de modelos do acervo.",
  message: "Olá! Vi as novidades no site e gostaria de provar um modelo.",
  images: galleryPhotos,
};

export default async function Home() {
  await registerVisitor();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Hero */}
      <section className="site-hero">
        <div aria-hidden className="site-hero-topfade" />
        <div className="site-hero-text">
          <p className="site-hero-kicker">Aluguel de vestidos de festa · Florianópolis</p>
          <h1 className="site-hero-title">
            Nossa missão é oferecer a melhor <em>experiência imaginável</em> em alugar um vestido.
          </h1>
          <p className="site-hero-lead">Vestidos de festa para madrinhas, formandas e convidadas.</p>
          <div className="site-hero-cta">
            <a href={whatsappLink(bookingMessage)} target="_blank" rel="noopener noreferrer">Agendar para Provar</a>
          </div>
          <div className="site-hero-stats">
            <span aria-hidden className="site-hero-stars">★★★★★</span>
            <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="site-hero-rating">5,0 no Google · +1.400 avaliações</a>
            <span aria-hidden className="site-hero-divider" />
            <a href={`tel:+${siteConfig.whatsapp.number}`}>{siteConfig.whatsapp.display}</a>
            <span aria-hidden className="site-hero-divider" />
            <a href={siteConfig.instagram.url} target="_blank" rel="noopener noreferrer">{siteConfig.instagram.handle}</a>
          </div>
        </div>

        <div className="site-hero-media">
          <div className="site-hero-detail">
            <Image src={heroPhotos.detail.src} alt={heroPhotos.detail.alt} fill sizes="(max-width: 900px) 40vw, 20vw" className="object-cover object-[50%_26%]" />
          </div>
          <div className="site-hero-body">
            <Image src={heroPhotos.body.src} alt={heroPhotos.body.alt} fill preload sizes="(max-width: 560px) 100vw, (max-width: 900px) 60vw, 30vw" className="object-cover object-[50%_8%]" />
          </div>
          <div aria-hidden className="site-hero-fade" />
        </div>

        <div aria-hidden className="site-hero-cue">Role</div>
      </section>

      {/* Números */}
      <dl className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 px-4 py-10 sm:px-8 md:grid-cols-3 lg:px-12">
        <div>
          <dt className="sr-only">Nota no Google</dt>
          <dd className="font-display text-5xl">5,0 <span aria-hidden className="align-middle text-base tracking-[0.2em] text-terracotta">★★★★★</span></dd>
          <dd className="mt-1 text-sm text-muted-foreground">no Google</dd>
        </div>
        <div>
          <dt className="sr-only">Avaliações</dt>
          <dd className="font-display text-5xl">+1.400</dd>
          <dd className="mt-1 text-sm text-muted-foreground">avaliações</dd>
        </div>
        <div className="col-span-2 md:col-span-1">
          <dt className="sr-only">Endereço</dt>
          <dd className="font-display text-4xl leading-tight md:text-5xl">{siteConfig.address.district}</dd>
          <dd className="mt-1 text-sm text-muted-foreground">{siteConfig.address.city}</dd>
        </div>
      </dl>

      {/* Faixa */}
      <div aria-hidden className="overflow-hidden border-y border-border py-6">
        <div className="store-marquee flex w-max">
          {[...marquee, ...marquee, ...marquee, ...marquee, ...marquee, ...marquee].map((item, index) => (
            <span key={index} className="flex items-center font-display text-3xl italic">
              {item}<span className="mx-7 text-gold">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Ocasiões: a primeira decisão de quem chega */}
      <section id="ocasioes" className="mx-auto max-w-[1440px] scroll-mt-20 px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
        <Kicker>Ocasiões</Kicker>
        <Title className="mt-6">Para cada ocasião, o vestido <em className="text-terracotta">certo</em>.</Title>
        <ul className="mt-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {occasionCards.map((card) => (
            <li key={card.href} className={cn("site-reveal", card.cell)}>
              <Link href={card.href} className={cn("group relative block aspect-[4/5] overflow-hidden bg-night text-sand sm:aspect-[5/6]", card.tile)}>
                <Image src={card.cover} alt="" fill sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw" className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-6">
                  <span className="block font-display text-4xl">{card.name}</span>
                  <span className="mt-1 block max-w-xs text-sand/85">{card.summary}</span>
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
            {crisLooks.slice(0, 3).map((look, index) => (
              <li key={look.id} className="site-reveal">
                <Zoom
                  item={{ title: "Coleção Cris Mazzonetto", detail: "Bordados e pedrarias exclusivos, para alugar.", message: "Olá! Gostaria de provar os vestidos da coleção Cris Mazzonetto.", images: crisLooks.map((item) => item.photo) }}
                  index={index}
                  label={look.name}
                  className="aspect-[9/16]"
                >
                  <Image src={look.photo.src} alt={look.photo.alt} fill sizes="(min-width: 1024px) 18vw, 33vw" className="object-cover" />
                </Zoom>
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
            <p className="mt-4 text-lg text-muted-foreground">Alguns dos modelos disponíveis.</p>
          </div>
          <TextLink href="/acervo">Ver acervo completo</TextLink>
        </div>
        <div className="mt-12">
          <LookGrid looks={looks.filter((look) => !look.exclusive).slice(0, 8)} />
        </div>
      </section>

      {/* Experiência */}
      <section id="experiencia" className="scroll-mt-20 bg-night text-sand">
        <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <Kicker dark>A experiência</Kicker>
              <Title className="mt-6 lg:text-7xl">Uma hora <em className="text-gold">só sua</em>.</Title>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-sand/75">
                Atendimento com hora marcada, café passado na hora, provador reservado e alguém do lado para dizer a verdade sobre cada vestido. É assim que a maioria das +1.400 avaliações começa.
              </p>
              <TextLink href="/experiencia" className="mt-6 text-gold">Conhecer o espaço</TextLink>
            </div>
            <figure className="border border-sand/15 p-6">
              <p className="font-display text-5xl">5,0 <span aria-hidden className="align-middle text-sm tracking-[0.2em] text-gold">★★★★★</span></p>
              <blockquote className="mt-4 font-display text-2xl leading-snug">“{experienceQuote}”</blockquote>
              <a href="#avaliacoes" className="mt-5 inline-block text-[11px] uppercase tracking-[0.22em] text-gold underline-offset-4 hover:underline">Ler as avaliações</a>
            </figure>
          </div>
          <div className="mt-12">
            <ExperienceMosaic />
          </div>
        </div>
      </section>

      {/* Avaliações */}
      <section id="avaliacoes" className="mx-auto max-w-[1440px] scroll-mt-20 px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
        <Kicker>Avaliações</Kicker>
        <Title className="mt-6">Quem viveu a experiência, <em className="text-terracotta">recomenda</em>.</Title>
        <ul className="mt-12 grid gap-10 md:grid-cols-2">
          {reviews.map((review) => (
            <li key={review} className="site-reveal border-t border-ink/20 pt-6">
              <p aria-label="5 estrelas" className="tracking-[0.2em] text-terracotta">★★★★★</p>
              <blockquote className="mt-4 font-display text-[1.75rem] leading-[1.2]">“{review}”</blockquote>
              <p className="mt-4 text-sm text-muted-foreground">Avaliação no Google</p>
            </li>
          ))}
        </ul>
        <ButtonLink href={googleReviewsUrl} variant="ink" className="mt-12">Ver todas as +1.400 avaliações no Google</ButtonLink>
      </section>

      <DiaDaMadrinha />

      {/* Galeria */}
      <section id="galeria" className="mx-auto max-w-[1440px] scroll-mt-20 px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
        <Kicker>Galeria · {galleryPhotos.length} fotos</Kicker>
        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-end">
          <Title>Novidades que <em className="text-terracotta">chegaram</em>.</Title>
          <div>
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
              Uma seleção de modelos do acervo: cores, brilhos e modelagens para todas as ocasiões. Prove o seu favorito no atendimento.
            </p>
            <ButtonLink href={whatsappLink(galleryItem.message)} variant="ink" className="mt-6">Quero provar um modelo</ButtonLink>
          </div>
        </div>
        <div className="mt-10">
          <PhotoRail item={galleryItem} />
        </div>
      </section>

      <HowItWorks />

      <TeamSection />

      <section className="bg-deep text-sand">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 lg:px-12">
          <Kicker dark>Agende sua prova</Kicker>
          <Title className="mt-6">Seu vestido está <em className="text-gold">esperando por você</em>.</Title>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-sand/75">Chame no WhatsApp para agendar seu horário e experimentar os modelos.</p>
          <ButtonLink href={whatsappLink(bookingMessage)} className="mt-8">Agendar pelo WhatsApp</ButtonLink>
        </div>
      </section>

      <VisitSection />

      <BookingBand
        title={<>Agora só falta encontrar <em className="text-gold">o seu</em>.</>}
        text="Agende seu horário e venha descobrir o vestido perfeito para o seu momento."
        message={bookingMessage}
        cta="Agendar para provar"
      />
    </>
  );
}
