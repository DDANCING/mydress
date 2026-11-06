import Image from "next/image";
import Link from "next/link";

import { backdrops, steps, type Look, type Photo } from "@/lib/site-content";
import { whatsappLink } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const Kicker = ({ children, dark }: { children: React.ReactNode; dark?: boolean }) => (
  <p className={cn("flex items-center gap-4 text-[11px] font-normal uppercase tracking-[0.25em]", dark ? "text-gold" : "text-muted-foreground")}>
    <span aria-hidden className="h-px w-8 bg-current opacity-60" />
    {children}
  </p>
);

export const Title = ({ children, as: Tag = "h2", className }: { children: React.ReactNode; as?: "h1" | "h2"; className?: string }) => (
  <Tag className={cn("font-display text-[2.75rem] font-normal leading-[1.05] tracking-[-0.01em] text-balance sm:text-6xl", className)}>
    {children}
  </Tag>
);

const buttonClass = {
  gold: "bg-gold text-ink hover:bg-sand",
  ink: "bg-ink text-sand hover:bg-deep",
  outline: "border border-current hover:bg-ink hover:text-sand hover:border-ink",
  outlineDark: "border border-sand/50 text-sand hover:bg-sand hover:text-ink",
};

type ButtonProps = { children: React.ReactNode; href: string; variant?: keyof typeof buttonClass; className?: string };

export const ButtonLink = ({ children, href, variant = "gold", className }: ButtonProps) => {
  const classes = cn(
    "inline-flex min-h-12 items-center justify-center px-8 py-4 text-center text-[11px] font-normal uppercase tracking-[0.22em] transition-colors",
    buttonClass[variant],
    className,
  );
  return href.startsWith("/") ? (
    <Link href={href} className={classes}>{children}</Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>{children}</a>
  );
};

export const TextLink = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
  <Link href={href} className={cn("inline-block border-b border-current pb-1 text-[11px] font-normal uppercase tracking-[0.22em] transition-opacity hover:opacity-70", className)}>
    {children}
  </Link>
);

// Cabeçalho das páginas internas: fundo escuro, texto à esquerda e foto à direita, como no hero da home
export const PageHero = ({ kicker, title, text, photo, children }: { kicker: string; title: React.ReactNode; text: string; photo?: Photo; children?: React.ReactNode }) => (
  <section className="bg-night text-sand">
    <div className="mx-auto grid max-w-[1440px] lg:min-h-[640px] lg:grid-cols-2">
      <div className="flex flex-col justify-end px-4 pb-14 pt-32 sm:px-8 lg:px-12 lg:pb-20">
        <Kicker dark>{kicker}</Kicker>
        <Title as="h1" className="mt-6 lg:text-7xl">{title}</Title>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-sand/75">{text}</p>
        {children && <div className="mt-9 flex flex-wrap gap-3">{children}</div>}
      </div>
      {photo && (
        <div className="relative aspect-[4/5] lg:aspect-auto">
          <Image src={photo.src} alt={photo.alt} fill preload sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-top" />
        </div>
      )}
    </div>
  </section>
);

export const LookCard = ({ look, preload }: { look: Look; preload?: boolean }) => (
  <article className="group site-reveal">
    <div className="relative aspect-[3/4] overflow-hidden bg-muted">
      <Image src={look.photo.src} alt={look.photo.alt} fill preload={preload} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover object-top" />
      {look.back && (
        <Image src={look.back.src} alt={look.back.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover object-top opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      )}
      {look.exclusive && (
        <span className="absolute left-0 top-3 bg-night px-3 py-1.5 text-[10px] font-normal uppercase tracking-[0.18em] text-gold">Bordado exclusivo</span>
      )}
    </div>
    <h3 className="mt-4 font-display text-[1.625rem] leading-[1.1]">{look.name}</h3>
    <p className="mt-1.5 text-[15px] leading-snug text-muted-foreground">{look.detail}</p>
    <a
      href={whatsappLink(`Olá! Gostaria de provar o vestido "${look.name}" que vi no site.`)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-block border-b border-current pb-0.5 text-[11px] font-normal uppercase tracking-[0.2em] transition-colors hover:text-terracotta"
    >
      Quero provar
    </a>
  </article>
);

export const LookGrid = ({ looks }: { looks: Look[] }) => (
  <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-y-14">
    {looks.map((look, index) => <LookCard key={look.id} look={look} preload={index < 2} />)}
  </div>
);

// Fotos de proporções variadas ficam inteiras: colunas em vez de recortar tudo em um formato só
export const PhotoWall = ({ photos }: { photos: Photo[] }) => (
  <div className="columns-2 gap-3 sm:gap-5 lg:columns-3">
    {photos.map((photo) => (
      <Image key={photo.src} {...photo} sizes="(min-width: 1024px) 33vw, 50vw" className="site-reveal mb-3 w-full break-inside-avoid sm:mb-5" />
    ))}
  </div>
);

export const HowItWorks = () => (
  <section className="bg-deep text-sand">
    <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
      <Kicker dark>Como funciona</Kicker>
      <Title className="mt-6 max-w-2xl">Você não precisa escolher <em className="text-gold">sozinha</em>.</Title>
      <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title} className="border-t border-sand/25 pt-5">
            <span className="text-[11px] tracking-[0.25em] text-gold">0{index + 1}</span>
            <h3 className="mt-5 font-display text-3xl">{step.title}</h3>
            <p className="mt-2 max-w-xs leading-relaxed text-sand/75">{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export const BookingBand = ({ title, text, message, cta = "Agendar pelo WhatsApp" }: { title: React.ReactNode; text: string; message: string; cta?: string }) => (
  <section className="relative isolate overflow-hidden bg-night text-sand">
    <Image src={backdrops.black.src} alt="" fill sizes="100vw" className="-z-10 object-cover object-[50%_20%] opacity-35" />
    <div className="mx-auto max-w-[1440px] px-4 py-24 sm:px-8 lg:px-12 lg:py-32">
      <Title className="max-w-3xl lg:text-7xl">{title}</Title>
      <p className="mt-6 max-w-lg text-lg leading-relaxed text-sand/80">{text}</p>
      <ButtonLink href={whatsappLink(message)} className="mt-9">{cta}</ButtonLink>
    </div>
  </section>
);
