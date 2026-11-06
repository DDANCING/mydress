import type { Metadata } from "next";

import { backdrops, occasions, openingHours } from "@/lib/site-content";
import { siteConfig, whatsappLink } from "@/lib/site-config";
import { ButtonLink, Kicker, PageHero, Title } from "../_components/site-ui";

export const metadata: Metadata = {
  title: "Agendar",
  description: "Agende sua prova de vestido de festa na My Dress Floripa, em Coqueiros, Florianópolis. Segunda a sábado, com hora marcada.",
  alternates: { canonical: "/agendar" },
};

const directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=R.+Sen.+Milton+Campos%2C+265%2C+Coqueiros%2C+Florian%C3%B3polis%2C+SC";

export default function BookingPage() {
  const { address, whatsapp, instagram } = siteConfig;

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

      <section className="mx-auto grid max-w-[1440px] gap-16 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-28">
        <div>
          <Kicker>Vou provar para</Kicker>
          <ul className="mt-6 border-t border-border">
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
        </div>

        <div>
          <Kicker>O espaço</Kicker>
          <Title className="mt-6 sm:text-5xl">{address.street}, {address.district}</Title>
          <p className="mt-4 text-lg text-muted-foreground">{address.city}, {address.state} · {address.zip}</p>
          <dl className="mt-8 space-y-5 border-t border-border pt-6">
            <div>
              <dt className="text-[11px] font-normal uppercase tracking-[0.22em] text-muted-foreground">Horário</dt>
              <dd className="mt-1 text-lg">{openingHours}, com hora marcada</dd>
            </div>
            <div>
              <dt className="text-[11px] font-normal uppercase tracking-[0.22em] text-muted-foreground">Telefone</dt>
              <dd className="mt-1 text-lg"><a href={`tel:+${whatsapp.number}`} className="hover:text-terracotta">{whatsapp.display}</a></dd>
            </div>
            <div>
              <dt className="text-[11px] font-normal uppercase tracking-[0.22em] text-muted-foreground">Instagram</dt>
              <dd className="mt-1 text-lg"><a href={instagram.url} target="_blank" rel="noopener noreferrer" className="hover:text-terracotta">{instagram.handle}</a></dd>
            </div>
          </dl>
          <ButtonLink href={directionsUrl} variant="ink" className="mt-9">Como chegar</ButtonLink>
        </div>
      </section>
    </>
  );
}
