import Image from "next/image";
import type { Metadata } from "next";

import { experiencePhotos, team } from "@/lib/site-content";
import { BookingBand, ButtonLink, HowItWorks, Kicker, PageHero, Title } from "../_components/site-ui";

export const metadata: Metadata = {
  title: "A experiência",
  description: "Atendimento individual com hora marcada, café passado na hora e provador reservado na My Dress Floripa, em Coqueiros.",
  alternates: { canonical: "/experiencia" },
};

const mosaic = [experiencePhotos.service, experiencePhotos.coffee, experiencePhotos.dog, experiencePhotos.cake];

export default function ExperiencePage() {
  return (
    <>
      <PageHero
        kicker="A experiência"
        title={<>Uma hora <em className="text-gold">só sua</em>.</>}
        text="Atendimento com hora marcada, café passado na hora, provador reservado e alguém do lado para dizer a verdade sobre cada vestido."
        photo={experiencePhotos.salon}
      />

      <section className="mx-auto grid max-w-[1440px] grid-cols-2 gap-2 px-4 py-16 sm:px-8 lg:grid-cols-4 lg:gap-3 lg:px-12 lg:py-24">
        {mosaic.map((photo) => (
          <div key={photo.src} className="site-reveal relative aspect-[3/4]">
            <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
          </div>
        ))}
      </section>

      <HowItWorks />

      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
        <Kicker>Quem vai te receber</Kicker>
        <div className="mt-10 grid gap-14 lg:grid-cols-2">
          <article>
            <div className="relative aspect-[4/3] bg-night">
              <Image src={team.founder.src} alt={team.founder.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain" />
            </div>
            <p className="mt-6 text-[11px] font-normal uppercase tracking-[0.22em] text-muted-foreground">Fundadora</p>
            <Title className="mt-2 sm:text-5xl">Dani Scott Garcia</Title>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Quem chega na My Dress é recebido pela Dani. Ela escuta a ocasião, entende o que você procura, separa as opções e acompanha cada prova até você encontrar o vestido certo.
            </p>
          </article>
          <article>
            <div className="relative aspect-[4/3]">
              <Image src={team.consultant.src} alt={team.consultant.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[50%_25%]" />
            </div>
            <p className="mt-6 text-[11px] font-normal uppercase tracking-[0.22em] text-muted-foreground">Consultora</p>
            <Title className="mt-2 sm:text-5xl">Atendimento em <em className="text-terracotta">cada detalhe</em>.</Title>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Ao lado da Dani, nossa consultora organiza a agenda, anota cada preferência e prepara o provador com as opções certas.
            </p>
          </article>
        </div>
      </section>

      <section className="bg-night text-sand">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-4 py-14 sm:px-8 lg:px-12">
          <p className="max-w-xl font-display text-4xl leading-[1.1]">Vem com a noiva e as madrinhas? Conheça o <em className="text-gold">Dia da Madrinha</em>.</p>
          <ButtonLink href="/ocasioes/madrinhas" variant="outlineDark">Ver como funciona</ButtonLink>
        </div>
      </section>

      <BookingBand
        title={<>Reserve a <em className="text-gold">sua hora</em>.</>}
        text="Chame no WhatsApp para agendar seu horário e experimentar os modelos."
        message="Olá! Gostaria de agendar uma prova na My Dress Floripa."
      />
    </>
  );
}
