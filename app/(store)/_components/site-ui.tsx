import Image from "next/image";
import Link from "next/link";

import {
  backdrops,
  directionsUrl,
  experiencePhotos,
  founderQuote,
  mapEmbedUrl,
  openingHours,
  steps,
  team,
  type Look,
  type Photo,
} from "@/lib/site-content";
import { siteConfig, whatsappLink } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { Zoom, type LightboxItem } from "./lightbox";

export const Kicker = ({ children, dark }: { children: React.ReactNode; dark?: boolean }) => (
  <p className={cn("flex items-center gap-4 text-[11px] uppercase tracking-[0.25em]", dark ? "text-gold" : "text-muted-foreground")}>
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
    "inline-flex min-h-12 items-center justify-center px-8 py-4 text-center text-[11px] uppercase tracking-[0.22em] transition-colors",
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
  <Link href={href} className={cn("inline-block border-b border-current pb-1 text-[11px] uppercase tracking-[0.22em] transition-opacity hover:opacity-70", className)}>
    {children}
  </Link>
);

// Cabeçalho das páginas internas: fundo escuro, texto à esquerda e foto à direita, como no hero da home
export const PageHero = ({ kicker, title, text, photo, zoom, children }: { kicker: string; title: React.ReactNode; text: string; photo?: Photo; zoom?: LightboxItem; children?: React.ReactNode }) => {
  const image = photo && <Image src={photo.src} alt={photo.alt} fill preload sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-top" />;
  return (
    <section className="bg-night text-sand">
      <div className="mx-auto grid max-w-[1440px] lg:min-h-[640px] lg:grid-cols-2">
        <div className="flex flex-col justify-end px-4 pb-14 pt-32 sm:px-8 lg:px-12 lg:pb-20">
          <Kicker dark>{kicker}</Kicker>
          <Title as="h1" className="mt-6 lg:text-7xl">{title}</Title>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-sand/75">{text}</p>
          {children && <div className="mt-9 flex flex-wrap gap-3">{children}</div>}
        </div>
        {photo && (zoom ? (
          <Zoom item={zoom} label={photo.alt} className="aspect-[4/5] lg:aspect-auto">{image}</Zoom>
        ) : (
          <div className="relative aspect-[4/5] lg:aspect-auto">{image}</div>
        ))}
      </div>
    </section>
  );
};

export const LookCard = ({ look, preload }: { look: Look; preload?: boolean }) => {
  const message = `Olá! Gostaria de experimentar o vestido "${look.name}".`;
  const item: LightboxItem = {
    title: look.name,
    detail: look.detail,
    message,
    images: look.back ? [look.photo, look.back] : [look.photo],
  };
  return (
    <article className="group site-reveal">
      <Zoom item={item} label={look.name} className="aspect-[3/4] bg-muted">
        <Image src={look.photo.src} alt={look.photo.alt} fill preload={preload} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover object-top" />
        {look.back && (
          <Image src={look.back.src} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover object-top opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        )}
        {look.exclusive && (
          <span className="absolute left-0 top-3 bg-night px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-gold">Bordado exclusivo</span>
        )}
      </Zoom>
      <h3 className="mt-4 font-display text-[1.625rem] leading-[1.1]">{look.name}</h3>
      <p className="mt-1.5 text-[15px] leading-snug text-muted-foreground">{look.detail}</p>
      <a
        href={whatsappLink(message)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block border-b border-current pb-0.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-terracotta"
      >
        Quero provar
      </a>
    </article>
  );
};

export const LookGrid = ({ looks }: { looks: Look[] }) => (
  <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-y-14">
    {looks.map((look, index) => <LookCard key={look.id} look={look} preload={index < 2} />)}
  </div>
);

// Fotos de proporções variadas ficam inteiras: colunas em vez de recortar tudo em um formato só
export const PhotoWall = ({ photos, item, offset = 0 }: { photos: Photo[]; item: LightboxItem; offset?: number }) => (
  <div className="columns-2 gap-3 sm:gap-5 lg:columns-3">
    {photos.map((photo, index) => (
      <Zoom key={photo.src} item={item} index={index + offset} label={photo.alt} className="site-reveal mb-3 break-inside-avoid sm:mb-5">
        <Image {...photo} sizes="(min-width: 1024px) 33vw, 50vw" className="w-full" />
      </Zoom>
    ))}
  </div>
);

const experienceItem: LightboxItem = {
  title: "A experiência",
  detail: "Atendimento com hora marcada, café e provador reservado.",
  message: "Olá! Gostaria de agendar uma prova na My Dress Floripa.",
  images: [experiencePhotos.salon, experiencePhotos.coffee, experiencePhotos.service, experiencePhotos.dog, experiencePhotos.cake],
};

// Mosaico do espaço: o salão em destaque e os detalhes do atendimento ao redor
export const ExperienceMosaic = () => (
  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
    {experienceItem.images.map((photo, index) => (
      <Zoom
        key={photo.src}
        item={experienceItem}
        index={index}
        label={photo.alt}
        className={cn("site-reveal", index === 0 ? "col-span-2 aspect-[3/2] lg:row-span-2 lg:aspect-auto" : "aspect-square")}
      >
        <Image src={photo.src} alt={photo.alt} fill sizes={index === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"} className="object-cover" />
      </Zoom>
    ))}
  </div>
);

const madrinhaItem: LightboxItem = {
  title: "Dia da Madrinha",
  detail: "A escolha do vestido também pode se transformar em uma lembrança inesquecível.",
  message: "Olá! Gostaria de reservar o Dia da Madrinha para a noiva e as madrinhas.",
  images: [experiencePhotos.board, experiencePhotos.coffee, experiencePhotos.cake, experiencePhotos.cart],
};

export const DiaDaMadrinha = () => (
  <section id="dia-da-madrinha" className="scroll-mt-20 bg-night text-sand">
    <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-28">
      <div>
        <Kicker dark>Experiência em grupo</Kicker>
        <Title className="mt-6">Dia da <em className="text-gold">Madrinha</em></Title>
        <p className="mt-6 max-w-lg font-display text-2xl leading-snug">A escolha do vestido também pode se transformar em uma lembrança inesquecível.</p>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-sand/75">
          Um horário reservado para a noiva e as madrinhas conhecerem a coleção juntas, provarem os modelos e fecharem a paleta do casamento.
        </p>
        <p className="mt-4 max-w-lg leading-relaxed text-sand/75">
          Com recepção de boas-vindas, café e bolo, e a opção de incluir tábua de frios, espumante e outros itens combinados antes.
        </p>
        <ButtonLink href={whatsappLink(madrinhaItem.message)} className="mt-9">Reservar o Dia da Madrinha</ButtonLink>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:gap-3">
        {madrinhaItem.images.map((photo, index) => (
          <Zoom key={photo.src} item={madrinhaItem} index={index} label={photo.alt} className="site-reveal aspect-[3/4]">
            <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
          </Zoom>
        ))}
      </div>
    </div>
  </section>
);

export const HowItWorks = () => (
  <section className="relative isolate overflow-hidden bg-deep text-sand">
    <Image src={backdrops.terracotta.src} alt="" fill sizes="100vw" className="-z-10 object-cover object-[50%_25%] opacity-15" />
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

export const TeamSection = () => (
  <section id="a-dani" className="mx-auto max-w-[1440px] scroll-mt-20 px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
    <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
      <div className="relative aspect-[4/3] bg-night">
        <Image src={team.founder.src} alt={team.founder.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain" />
      </div>
      <div>
        <Kicker>Fundadora</Kicker>
        <Title className="mt-6">Quem vai te <em className="text-terracotta">receber</em>.</Title>
        <p className="mt-6 font-display text-3xl">Dani Scott Garcia</p>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Quem chega na My Dress é recebido pela Dani. Ela escuta a ocasião, entende o que você procura, separa as opções e acompanha cada prova até você encontrar o vestido certo.
        </p>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">É por isso que o nome dela aparece tanto nas avaliações.</p>
        <blockquote className="mt-8 border-l border-gold pl-5">
          <p className="font-display text-2xl leading-snug">“{founderQuote}”</p>
          <footer className="mt-2 text-sm text-muted-foreground"><span aria-hidden className="text-terracotta">★★★★★ </span>Avaliação no Google</footer>
        </blockquote>
      </div>
    </div>
    <div className="mt-20 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
      <div className="lg:order-2">
        <div className="relative aspect-[4/3]">
          <Image src={team.consultant.src} alt={team.consultant.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[50%_25%]" />
        </div>
      </div>
      <div>
        <Kicker>Consultora</Kicker>
        <Title className="mt-6">Atendimento em <em className="text-terracotta">cada detalhe</em>.</Title>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Ao lado da Dani, nossa consultora organiza a agenda, anota cada preferência e prepara o provador com as opções certas, para a sua hora com a gente render do começo ao fim.
        </p>
      </div>
    </div>
  </section>
);

// Endereço, contatos e mapa: aparece na home e na página de agendamento
export const VisitSection = () => {
  const { address, whatsapp, instagram } = siteConfig;
  const labelClass = "text-[11px] uppercase tracking-[0.22em] text-muted-foreground";
  return (
    <section id="agendar" className="mx-auto grid max-w-[1440px] scroll-mt-20 gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-28">
      <div>
        <Kicker>O espaço</Kicker>
        <Title className="mt-6 sm:text-5xl">R. Sen. Milton Campos, 265, {address.district}</Title>
        <p className="mt-4 text-lg text-muted-foreground">{address.city}, {address.state} · {address.zip}</p>
        <dl className="mt-8 space-y-5 border-t border-border pt-6">
          <div>
            <dt className={labelClass}>Horário</dt>
            <dd className="mt-1 text-lg">{openingHours} · Atendimento com hora marcada</dd>
          </div>
          <div>
            <dt className={labelClass}>Telefone</dt>
            <dd className="mt-1 font-display text-3xl"><a href={`tel:+${whatsapp.number}`} className="transition-colors hover:text-terracotta">{whatsapp.display}</a></dd>
          </div>
          <div>
            <dt className={labelClass}>Instagram</dt>
            <dd className="mt-1 font-display text-3xl"><a href={instagram.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-terracotta">{instagram.handle}</a></dd>
          </div>
        </dl>
      </div>
      <div>
        <div className="aspect-[4/3] bg-muted">
          <iframe title="Mapa da My Dress Floripa em Coqueiros, Florianópolis" src={mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="size-full border-0" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href={directionsUrl} variant="ink">Como chegar</ButtonLink>
          <ButtonLink href={whatsappLink("Olá! Gostaria de agendar uma prova na My Dress Floripa.")} variant="outline">Falar no WhatsApp</ButtonLink>
        </div>
      </div>
    </section>
  );
};

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
