import Link from "next/link";

import { occasions, openingHours } from "@/lib/site-content";
import { formatAddress, siteConfig, whatsappLink } from "@/lib/site-config";
import { LogoMark } from "./brand/logo";

const headingClass = "text-[11px] font-normal uppercase tracking-[0.25em] text-gold";
const linkClass = "transition-colors hover:text-gold";

export const Footer = () => (
  <footer className="bg-night text-sand/75">
    <div className="mx-auto grid max-w-[1440px] gap-12 px-4 pb-24 pt-16 sm:px-8 md:grid-cols-2 lg:grid-cols-12 lg:px-12">
      <div className="lg:col-span-4">
        <LogoMark className="size-20 text-sand" />
        <p className="mt-4 font-display text-3xl text-sand">{siteConfig.fullName}</p>
        <p className="mt-2 max-w-xs">{siteConfig.tagline}</p>
      </div>

      <div className="lg:col-span-2">
        <h2 className={headingClass}>Ocasiões</h2>
        <ul className="mt-5 space-y-2.5">
          {occasions.map((occasion) => (
            <li key={occasion.slug}>
              <Link href={`/ocasioes/${occasion.slug}`} className={linkClass}>{occasion.name}</Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-2">
        <h2 className={headingClass}>O site</h2>
        <ul className="mt-5 space-y-2.5">
          <li><Link href="/colecao-cris-mazzonetto" className={linkClass}>Coleção Cris Mazzonetto</Link></li>
          <li><Link href="/acervo" className={linkClass}>Acervo</Link></li>
          <li><Link href="/experiencia" className={linkClass}>Experiência</Link></li>
          <li><Link href="/agendar" className={linkClass}>Agendar</Link></li>
          <li><Link href="/policies" className={linkClass}>Privacidade e termos</Link></li>
        </ul>
      </div>

      <div className="lg:col-span-4">
        <h2 className={headingClass}>Visite</h2>
        <address className="mt-5 space-y-2.5 not-italic">
          <p><a href={siteConfig.address.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>{formatAddress()}</a></p>
          <p>{openingHours}</p>
          <p><a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className={linkClass}>{siteConfig.whatsapp.display}</a></p>
          <p><a href={siteConfig.instagram.url} target="_blank" rel="noopener noreferrer" className={linkClass}>{siteConfig.instagram.handle}</a></p>
        </address>
      </div>
    </div>

    <div className="border-t border-sand/10">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-6 pr-36 text-sm text-sand/60 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:pr-40 lg:px-12 lg:pr-40">
        <p>© {new Date().getFullYear()} {siteConfig.legalName} · CNPJ {siteConfig.cnpj}</p>
        {/* Sem sessão, o /dashboard leva ao login e volta para o painel */}
        <Link href="/dashboard" prefetch={false} className={linkClass}>Área da equipe</Link>
      </div>
    </div>
  </footer>
);
