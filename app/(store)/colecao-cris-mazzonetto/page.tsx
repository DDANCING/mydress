import type { Metadata } from "next";

import { crisLooks, crisPortrait } from "@/lib/site-content";
import { siteConfig, whatsappLink } from "@/lib/site-config";
import { BookingBand, ButtonLink, Kicker, LookGrid, PageHero, Title } from "../_components/site-ui";

const message = "Olá! Gostaria de provar os vestidos da coleção Cris Mazzonetto.";
const press = siteConfig.press[0];

export const metadata: Metadata = {
  title: "Coleção Cris Mazzonetto",
  description: "Vestidos com bordados e pedrarias exclusivos de Cris Mazzonetto, para alugar na My Dress Floripa, em Florianópolis.",
  alternates: { canonical: "/colecao-cris-mazzonetto" },
  openGraph: { images: [crisLooks[0].photo.src] },
};

export default function CrisCollectionPage() {
  return (
    <>
      <PageHero
        kicker="Coleção exclusiva · Cris Mazzonetto"
        title={<>Bordados exclusivos, <em className="text-gold">para alugar</em>.</>}
        text="A estilista Cris Mazzonetto e a My Dress criaram uma coleção de 15 modelos com bordados, pedrarias e acabamento sofisticado. Eles não estão à venda: são exclusivos para locação."
        photo={crisPortrait}
      >
        <ButtonLink href={whatsappLink(message)}>Quero provar a coleção</ButtonLink>
      </PageHero>

      <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 lg:px-12 lg:py-24">
        <Kicker>Os vestidos</Kicker>
        <Title className="mt-6">Pedraria, franjas e <em className="text-terracotta">brilho</em>.</Title>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Alguns dos modelos da coleção. Agende um horário para conhecer os vestidos na loja.
        </p>
        <div className="mt-12">
          <LookGrid looks={crisLooks} />
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          Imagens: <a href="https://www.instagram.com/crismazzonetto/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">@crismazzonetto</a> e{" "}
          <a href={siteConfig.instagram.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{siteConfig.instagram.handle}</a>.
        </p>
      </section>

      <section className="bg-deep text-sand">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:items-end lg:px-12 lg:py-28">
          <div>
            <Kicker dark>Na imprensa · {press.outlet}</Kicker>
            <blockquote className="mt-6 font-display text-4xl leading-[1.1] sm:text-5xl">“{press.quote}”</blockquote>
          </div>
          <div>
            <p className="max-w-lg text-lg leading-relaxed text-sand/75">{press.lead}</p>
            <ButtonLink href={press.url} variant="outlineDark" className="mt-9">Ler a matéria</ButtonLink>
          </div>
        </div>
      </section>

      <BookingBand
        title={<>Prove um bordado <em className="text-gold">exclusivo</em>.</>}
        text="Agende seu horário para conhecer os modelos da coleção com a nossa equipe."
        message={message}
      />
    </>
  );
}
