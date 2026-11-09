import type { Metadata } from "next";

import { experiencePhotos } from "@/lib/site-content";
import { BookingBand, ButtonLink, ExperienceMosaic, HowItWorks, PageHero, TeamSection } from "../_components/site-ui";

export const metadata: Metadata = {
  title: "A experiência",
  description: "Atendimento individual com hora marcada, café passado na hora e provador reservado na My Dress Floripa, em Coqueiros.",
  alternates: { canonical: "/experiencia" },
};

export default function ExperiencePage() {
  return (
    <>
      <PageHero
        kicker="A experiência"
        title={<>Uma hora <em className="text-gold">só sua</em>.</>}
        text="Atendimento com hora marcada, café passado na hora, provador reservado e alguém do lado para dizer a verdade sobre cada vestido."
        photo={experiencePhotos.salon}
      />

      <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 lg:px-12 lg:py-24">
        <ExperienceMosaic />
      </section>

      <HowItWorks />

      <TeamSection />

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
