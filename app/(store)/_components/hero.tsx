import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { siteConfig } from "@/lib/site-config";

export interface HeroCategory {
  id: string;
  name: string;
  image?: string;
}

// Mesmo rosa do fundo de /Billboard.png: o cartão continua a foto sem emenda
const HERO_PINK = "#fdc4d9";

// Esfuma as bordas da foto para ela se misturar ao fundo do cartão
const photoFade: React.CSSProperties = {
  maskImage:
    "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent), linear-gradient(to bottom, transparent, #000 8%, #000 96%, transparent)",
  maskComposite: "intersect",
  WebkitMaskImage:
    "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent), linear-gradient(to bottom, transparent, #000 8%, #000 96%, transparent)",
  WebkitMaskComposite: "source-in",
};

const label = "font-mono text-[11px] uppercase tracking-[0.14em] sm:text-[12px]";

export const Hero = ({ categories }: { categories: HeroCategory[] }) => {
  const press = siteConfig.press[0];

  return (
    <section aria-label="Destaque" className="px-3 pt-[92px] sm:px-5">
      <div
        className="relative flex flex-col overflow-hidden rounded-[24px] text-plum lg:block lg:h-[calc(100svh-104px)] lg:min-h-[640px] lg:max-h-[960px]"
        style={{ backgroundColor: HERO_PINK }}
      >
        <div className="relative z-10 p-6 sm:p-8 lg:absolute lg:left-10 lg:top-8 lg:p-0">
          <p className="font-display text-[clamp(4.5rem,13vw,10.5rem)] font-normal leading-[0.84] tracking-[-0.045em]">
            My
            <br />
            Dress
          </p>
          <p className={`${label} mt-4`}>Aluguel de vestidos de festa · {siteConfig.city}</p>
        </div>

        <div className="relative -mt-4 aspect-square w-full lg:absolute lg:inset-y-0 lg:left-1/2 lg:mt-0 lg:h-full lg:w-auto lg:-translate-x-1/2">
          <Image
            src="/Billboard.png"
            alt="Modelo usando vestido longo preto de tule em camadas com fenda, sobre fundo rosa"
            fill
            priority
            sizes="(min-width: 1024px) 960px, 100vw"
            className="object-cover"
            style={photoFade}
          />
        </div>

        <div className="relative z-10 px-6 pb-8 sm:px-8 lg:absolute lg:bottom-10 lg:left-10 lg:max-w-[26rem] lg:p-0">
          <h1 className="font-display text-[2.4rem] leading-[1] tracking-[-0.03em] text-balance sm:text-5xl">
            Vestidos de festa para alugar em Floripa
          </h1>
          <p className="mt-4 text-base leading-relaxed text-plum/75 sm:text-lg">
            Nova coleção exclusiva com a estilista Cris Mazzonetto: bordados, pedrarias e acabamento de alta-costura.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/products"
              className={`${label} inline-flex h-11 items-center gap-2 rounded-full bg-plum px-5 text-primary-foreground transition-colors hover:bg-primary`}
            >
              Ver vestidos
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#como-funciona"
              className={`${label} inline-flex h-11 items-center rounded-full bg-card px-5 transition-colors hover:bg-secondary`}
            >
              Como funciona
            </Link>
          </div>
        </div>

        {press && (
          <a
            href={press.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group absolute right-6 top-6 z-10 hidden w-[230px] rounded-2xl bg-card/90 p-4 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5 sm:block lg:right-10 lg:top-10"
          >
            <span className={`${label} text-primary`}>Na mídia</span>
            <span className="mt-2 block font-display text-lg leading-tight">{press.outlet}</span>
            <span className="mt-1 line-clamp-3 block text-sm leading-snug text-plum/70">{press.title}</span>
            <span className={`${label} mt-3 inline-flex h-7 items-center gap-1 rounded-full bg-secondary px-3`}>
              Ler matéria
              <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </a>
        )}

        {categories.length > 0 && (
          <ul className="absolute bottom-10 right-10 z-10 hidden gap-4 lg:flex">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={`/category/${category.id}`} className="group block w-[150px] xl:w-[170px]">
                  <span className={`${label} block truncate`}>{category.name}</span>
                  <span className="relative mt-2 block aspect-[4/5] overflow-hidden rounded-xl bg-card">
                    {category.image && (
                      <Image
                        src={category.image}
                        alt=""
                        fill
                        sizes="170px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
