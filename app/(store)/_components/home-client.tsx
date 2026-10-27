"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";

import { StoreProduct } from "@/app/types";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { siteConfig, whatsappLink, formatAddress } from "@/lib/site-config";
import { AnimatedTestimonials } from "./ui/testimonials";
import { ProductTile } from "./ui/product-tile";
import { BillboardItem, HeroBillboard } from "./hero-billboard";
import { LogoMark } from "./brand/logo";
import { useSafeReducedMotion } from "./use-safe-reduced-motion";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src?: string;
  stars?: number;
  product: StoreProduct;
};

interface HomeClientProps {
  billboardData: BillboardItem[];
  products: StoreProduct[];
  testimonials: Testimonial[];
  firstTestimonialProduct?: StoreProduct;
}

const steps = [
  {
    title: "Escolha o vestido",
    text: "Navegue pelo catálogo por ocasião, cor e tamanho. Cada vestido mostra o valor do aluguel.",
  },
  {
    title: "Reserve online",
    text: "Coloque na sacola, informe a data da sua festa e finalize o aluguel pelo site.",
  },
  {
    title: "Prove no provador",
    text: `Venha provar na nossa loja em ${siteConfig.address.district} para garantir o caimento.`,
  },
  {
    title: "Brilhe e devolva",
    text: "Aproveite a festa. Depois, é só devolver o vestido para a gente.",
  },
];

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const SectionHeading = ({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) => (
  <div className="mb-10 flex items-end justify-between gap-6">
    <h2 className="max-w-xl font-display text-4xl leading-[1.05] tracking-[-0.02em] text-balance sm:text-5xl">
      {title}
    </h2>
    {href && linkLabel && (
      <Link
        href={href}
        className="group hidden shrink-0 items-center gap-1.5 pb-1 text-[15px] font-medium text-foreground sm:inline-flex"
      >
        {linkLabel}
        <ArrowRight className="size-4 text-primary transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    )}
  </div>
);

export function HomeClient({ billboardData, products, testimonials }: HomeClientProps) {
  const reduceMotion = useSafeReducedMotion();

  const visibleProducts = useMemo(
    () => products.filter((product) => product.siteVisible !== false && !product.isArchived),
    [products]
  );

  const featured = useMemo(() => {
    const flagged = visibleProducts.filter((product) => product.isFeatured);
    return (flagged.length >= 4 ? flagged : visibleProducts).slice(0, 8);
  }, [visibleProducts]);

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    visibleProducts.forEach((product) => {
      if (!product.category?.id) return;
      const current = map.get(product.category.id);
      map.set(product.category.id, {
        id: product.category.id,
        name: product.category.name,
        count: (current?.count ?? 0) + 1,
      });
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [visibleProducts]);

  const colors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; value: string; count: number }>();
    visibleProducts.forEach((product) => {
      if (!product.color?.id) return;
      const current = map.get(product.color.id);
      map.set(product.color.id, {
        id: product.color.id,
        name: product.color.name,
        value: product.color.value,
        count: (current?.count ?? 0) + 1,
      });
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [visibleProducts]);

  const reveal = reduceMotion
    ? {}
    : {
        initial: { y: 24 },
        whileInView: { y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: { duration: 0.8, ease: EASE_OUT },
      };

  return (
    <div className="w-full bg-background text-foreground">
      <WhatsAppButton />

      <HeroBillboard billboards={billboardData} products={visibleProducts} />

      {/* Vestidos em destaque */}
      <section className="border-t border-border py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Vestidos que estão saindo para festa" href="/products" linkLabel="Ver todos os vestidos" />

          {featured.length === 0 ? (
            <div className="rounded-2xl bg-muted px-6 py-16 text-center">
              <p className="font-display text-2xl">A nova coleção está chegando.</p>
              <p className="mt-2 text-muted-foreground">
                Enquanto isso, veja as novidades no nosso{" "}
                <a href={siteConfig.instagram.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                  Instagram
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-x-6 sm:gap-y-12 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {featured.map((product, index) => (
                <ProductTile
                  key={product.id}
                  product={product}
                  priority={index < 2}
                  className="w-[68vw] shrink-0 snap-start sm:w-auto"
                />
              ))}
            </div>
          )}

          <Link
            href="/products"
            className="mt-10 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border text-[15px] font-medium sm:hidden"
          >
            Ver todos os vestidos
            <ArrowRight className="size-4 text-primary" />
          </Link>
        </div>
      </section>

      {/* Ocasiões e cores */}
      {(categories.length > 0 || colors.length > 0) && (
        <section className="bg-secondary/60 py-20 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
            {categories.length > 0 && (
              <motion.div {...reveal} className="lg:col-span-7">
                <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">
                  Para qual festa?
                </h2>
                <ul className="mt-10 border-t border-foreground/15">
                  {categories.map((category) => (
                    <li key={category.id} className="border-b border-foreground/15">
                      <Link
                        href={`/category/${category.id}`}
                        className="group flex items-center justify-between gap-6 py-5 sm:py-6"
                      >
                        <span className="font-display text-2xl tracking-[-0.01em] transition-colors group-hover:text-primary sm:text-3xl">
                          {category.name}
                        </span>
                        <span className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="tabular-nums">
                            {category.count} {category.count === 1 ? "vestido" : "vestidos"}
                          </span>
                          <ArrowUpRight className="size-5 text-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {colors.length > 0 && (
              <motion.div {...reveal} className="lg:col-span-5 lg:pl-8">
                <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">
                  Ou pela cor
                </h2>
                <p className="mt-4 max-w-sm text-muted-foreground">
                  Pretos, pinks, fúcsias, dourados: escolha o tom e veja todos os vestidos daquela cor.
                </p>
                <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5">
                  {colors.map((color) => (
                    <li key={color.id}>
                      <Link href={`/color/${color.id}`} className="group flex items-center gap-3">
                        <span
                          aria-hidden
                          className="size-10 shrink-0 rounded-full ring-1 ring-foreground/15 ring-offset-2 ring-offset-transparent transition-transform duration-300 group-hover:scale-110"
                          style={{ backgroundColor: color.value }}
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium group-hover:text-primary transition-colors">
                            {color.name}
                          </span>
                          <span className="block text-sm text-muted-foreground tabular-nums">
                            {color.count} {color.count === 1 ? "vestido" : "vestidos"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* Como funciona */}
      <section id="como-funciona" className="scroll-mt-24 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.02em] text-balance sm:text-5xl">
                Como funciona o aluguel
              </h2>
              <p className="mt-5 max-w-sm text-muted-foreground">
                Do catálogo à festa em quatro passos. Ficou com dúvida? A gente responde pelo WhatsApp.
              </p>
              <a
                href={whatsappLink("Olá! Tenho uma dúvida sobre o aluguel de vestidos.")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 text-[15px] font-medium text-foreground underline decoration-primary/40 underline-offset-[6px] transition-colors hover:decoration-primary"
              >
                Tirar uma dúvida
                <ArrowUpRight className="size-4 text-primary" />
              </a>
            </div>

            <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:col-span-8">
              {steps.map((step, index) => (
                <motion.li
                  key={step.title}
                  {...reveal}
                  transition={reduceMotion ? undefined : { duration: 0.8, delay: index * 0.08, ease: EASE_OUT }}
                  className="border-t border-foreground/15 pt-6"
                >
                  <span className="font-display text-5xl italic leading-none text-primary tabular-nums">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-xl font-medium">{step.title}</h3>
                  <p className="mt-2 max-w-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      {testimonials.length > 0 && (
        <section className="border-t border-border py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading title="Quem já foi de My Dress" />
            <AnimatedTestimonials testimonials={testimonials} autoplay />
          </div>
        </section>
      )}

      {/* Visite o provador */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <motion.div
          {...reveal}
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-plum px-6 py-14 text-primary-foreground sm:px-12 lg:px-16 lg:py-20"
        >
          <LogoMark className="pointer-events-none absolute -right-16 -top-10 w-[22rem] text-primary-foreground/[0.06] sm:w-[28rem]" />
          <div className="relative grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.02em] text-balance sm:text-5xl lg:text-6xl">
                Prove antes da festa, no nosso provador em {siteConfig.address.district}
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-primary-foreground/75">
                {siteConfig.mission}
              </p>
            </div>
            <div className="flex flex-col gap-5 lg:col-span-5 lg:items-end">
              <a
                href={whatsappLink("Olá! Gostaria de agendar uma prova de vestido.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary-foreground px-7 text-[15px] font-medium text-plum transition-transform duration-300 hover:-translate-y-0.5"
              >
                <FaWhatsapp className="size-5 text-[#1f9d55]" />
                Agendar prova pelo WhatsApp
              </a>
              <a
                href={siteConfig.address.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-primary-foreground/80 transition-colors hover:text-primary-foreground lg:text-right"
              >
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>{formatAddress()}</span>
              </a>
              <a
                href={siteConfig.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-foreground/80 transition-colors hover:text-primary-foreground"
              >
                <FaInstagram className="size-4" />
                {siteConfig.instagram.handle}
              </a>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
