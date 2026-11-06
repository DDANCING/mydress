import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { looksFor, occasions } from "@/lib/site-content";
import { Kicker, Title } from "../_components/site-ui";

export const metadata: Metadata = {
  title: "Ocasiões",
  description: "Vestidos de festa para madrinhas, formandas, convidadas, casamento civil, pré wedding e chá revelação em Florianópolis.",
  alternates: { canonical: "/ocasioes" },
};

export default function OccasionsPage() {
  return (
    <>
      <section className="bg-night text-sand">
        <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-36 sm:px-8 lg:px-12">
          <Kicker dark>Ocasiões</Kicker>
          <Title as="h1" className="mt-6 lg:text-7xl">Qual é o seu <em className="text-gold">momento</em>?</Title>
        </div>
      </section>

      <ul className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
        {occasions.map((occasion) => {
          const count = looksFor(occasion.slug).length;
          return (
            <li key={occasion.slug} className="site-reveal border-b border-border last:border-none">
              <Link href={`/ocasioes/${occasion.slug}`} className="group grid grid-cols-[6.5rem_1fr] items-center gap-5 py-6 sm:grid-cols-[10rem_1fr_auto] sm:gap-10">
                <span className="relative block aspect-[4/5] overflow-hidden bg-muted">
                  <Image src={occasion.cover.src} alt="" fill sizes="160px" className="object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                </span>
                <span>
                  <span className="block font-display text-4xl transition-colors group-hover:text-terracotta sm:text-5xl">{occasion.name}</span>
                  <span className="mt-2 block max-w-md text-muted-foreground">{occasion.summary}</span>
                </span>
                <span className="col-span-2 text-[11px] font-normal uppercase tracking-[0.22em] text-muted-foreground sm:col-span-1">
                  {count > 0 ? `${count} vestidos` : `${occasion.photos.length + 1} fotos`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
