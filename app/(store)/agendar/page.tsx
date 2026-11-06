import type { Metadata } from "next";

import { backdrops, occasions } from "@/lib/site-content";
import { whatsappLink } from "@/lib/site-config";
import { ButtonLink, Kicker, PageHero, VisitSection } from "../_components/site-ui";

export const metadata: Metadata = {
  title: "Agendar",
  description: "Agende sua prova de vestido de festa na My Dress Floripa, em Coqueiros, Florianópolis. Segunda a sábado, com hora marcada.",
  alternates: { canonical: "/agendar" },
};

export default function BookingPage() {
  return (
    <>
      <PageHero
        kicker="Agende sua prova"
        title={<>Seu vestido está <em className="text-gold">esperando por você</em>.</>}
        text="O atendimento é individual e com hora marcada. Conte a ocasião pelo WhatsApp e a gente separa as opções antes de você chegar."
        photo={{ ...backdrops.blue, alt: "Modelo com vestido azul claro em tule" }}
      >
        <ButtonLink href={whatsappLink("Olá! Gostaria de agendar uma prova na My Dress Floripa.")}>Agendar pelo WhatsApp</ButtonLink>
      </PageHero>

      <section className="mx-auto max-w-[1440px] px-4 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <Kicker>Vou provar para</Kicker>
        <ul className="mt-6 grid border-t border-border sm:grid-cols-2 sm:gap-x-12">
          {occasions.map((occasion) => (
            <li key={occasion.slug} className="border-b border-border">
              <a
                href={whatsappLink(`${occasion.message} Quero agendar uma prova.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 py-4 font-display text-3xl transition-colors hover:text-terracotta"
              >
                {occasion.name}
                <span aria-hidden className="text-gold">→</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <VisitSection />
    </>
  );
}
