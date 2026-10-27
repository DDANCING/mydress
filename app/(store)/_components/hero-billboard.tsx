"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Pause, Play } from "lucide-react";

import { StoreProduct } from "@/app/types";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { LogoMark } from "./brand/logo";
import { getDisplayPrice } from "./product-price";
import { useSafeReducedMotion } from "./use-safe-reduced-motion";

const SLIDE_DURATION = 6500;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export interface BillboardItem {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  callToAction?: { text?: string; href?: string };
  highlightProduct?: (StoreProduct & { isInWishlist?: boolean }) | null;
}

interface HeroSlide {
  id: string;
  label: string;
  heading: string;
  description: string;
  imageUrl?: string;
  ctaText: string;
  ctaHref: string;
  product?: StoreProduct | null;
}

interface HeroBillboardProps {
  billboards: BillboardItem[];
  products: StoreProduct[];
}

const firstImage = (product?: StoreProduct | null) =>
  product?.images?.find((image) => !!image?.url)?.url;

// Billboards cadastrados no dashboard têm prioridade; sem eles, o hero usa os vestidos do catálogo
const buildSlides = (billboards: BillboardItem[], products: StoreProduct[]): HeroSlide[] => {
  const fromBillboards = billboards
    .filter((billboard) => !!billboard.imageUrl)
    .map((billboard, index) => ({
      id: billboard.id ?? `billboard-${index}`,
      label: billboard.title,
      heading: billboard.subtitle || billboard.title,
      description: billboard.description || siteConfig.mission,
      imageUrl: billboard.imageUrl,
      ctaText: billboard.callToAction?.text || "Ver vestidos",
      ctaHref: billboard.callToAction?.href || "/products",
      product: billboard.highlightProduct,
    }));

  if (fromBillboards.length > 0) return fromBillboards;

  const withImages = products.filter((product) => !!firstImage(product)).slice(0, 4);

  if (withImages.length > 0) {
    return withImages.map((product) => ({
      id: product.id,
      label: product.category?.name || product.name,
      heading: "Vestidos de festa para alugar em Floripa",
      description: siteConfig.mission,
      imageUrl: firstImage(product),
      ctaText: "Ver vestidos",
      ctaHref: "/products",
      product,
    }));
  }

  return [
    {
      id: "brand",
      label: siteConfig.fullName,
      heading: "Vestidos de festa para alugar em Floripa",
      description: siteConfig.mission,
      ctaText: "Ver vestidos",
      ctaHref: "/products",
    },
  ];
};

export const HeroBillboard = ({ billboards, products }: HeroBillboardProps) => {
  const slides = useMemo(() => buildSlides(billboards, products), [billboards, products]);
  const reduceMotion = useSafeReducedMotion();

  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const hasMany = slides.length > 1;
  const isRunning = hasMany && !isPaused && !isHovering;
  const slide = slides[active] ?? slides[0];

  const goTo = useCallback(
    (index: number) => setActive((index + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (!isRunning) return;
    const timer = setTimeout(() => goTo(active + 1), SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [active, isRunning, goTo]);

  const product = slide.product;
  const productImage = firstImage(product);
  const productPrice = product ? getDisplayPrice(product) : null;

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques da loja"
      className="relative overflow-hidden pt-20"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocusCapture={() => setIsHovering(true)}
      onBlurCapture={() => setIsHovering(false)}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-14 pt-6 sm:px-6 lg:min-h-[min(calc(100svh-5rem),54rem)] lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-8 lg:pb-16 lg:pt-8">
        {/* Imagem em moldura de arco */}
        <div className="relative order-1 lg:order-2 lg:col-span-6 lg:col-start-7">
          <div className="relative mx-auto aspect-[4/5] max-h-[52svh] w-full max-w-[520px] overflow-hidden rounded-t-[999px] rounded-b-2xl bg-blush lg:max-h-[calc(100svh-9rem)]">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={slide.id}
                className="absolute inset-0"
                initial={reduceMotion ? { opacity: 0 } : { clipPath: "inset(100% 0% 0% 0%)" }}
                animate={reduceMotion ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
                exit={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0.2 : 1.1, ease: EASE_OUT }}
              >
                {slide.imageUrl ? (
                  <motion.div
                    className="relative h-full w-full"
                    initial={reduceMotion ? false : { scale: 1.08 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.6, ease: EASE_OUT }}
                  >
                    <Image
                      src={slide.imageUrl}
                      alt={slide.label}
                      fill
                      priority={active === 0}
                      sizes="(min-width: 1024px) 520px, 100vw"
                      className="object-cover"
                    />
                  </motion.div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <LogoMark className="w-2/5 text-primary/80" />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Vestido em destaque */}
          <AnimatePresence mode="wait">
            {product && productPrice && (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.5, ease: EASE_OUT }}
                className="absolute bottom-4 left-4 right-4 mx-auto max-w-[360px] sm:left-6 sm:right-auto lg:-left-6 lg:bottom-10"
              >
                <Link
                  href={`/product/${product.id}`}
                  className="group flex items-center gap-3 rounded-2xl bg-card/95 p-2.5 pr-4 shadow-[0_18px_40px_-20px_oklch(0.23_0.035_350/0.45)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5"
                >
                  {productImage && (
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <Image src={productImage} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{product.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {productPrice.isRental ? "Aluguel " : ""}
                      <span className="font-semibold text-foreground tabular-nums">{productPrice.formatted}</span>
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-primary transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Texto */}
        <div className="order-2 flex flex-col lg:order-1 lg:col-span-6 lg:pr-6">
          <div className="lg:min-h-[22rem]" aria-live={isRunning ? "off" : "polite"}>
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
              >
                <h1 className="font-display text-[2.6rem] leading-[1.02] tracking-[-0.02em] text-balance text-foreground sm:text-6xl lg:text-[5.25rem]">
                  {slide.heading}
                </h1>
                <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={slide.ctaHref}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-primary/90"
            >
              {slide.ctaText}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#como-funciona"
              className="inline-flex h-12 items-center rounded-full px-5 text-[15px] font-medium text-foreground underline decoration-primary/40 underline-offset-[6px] transition-colors hover:decoration-primary"
            >
              Como funciona o aluguel
            </Link>
          </div>

          {hasMany && (
            <div className="mt-12 flex items-end gap-4">
              <div role="tablist" aria-label="Escolher destaque" className="flex min-w-0 flex-1 gap-3">
                {slides.map((item, index) => {
                  const isActive = index === active;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={item.label}
                      onClick={() => goTo(index)}
                      className="group min-w-0 flex-1 pt-3 text-left"
                    >
                      <span className="relative block h-0.5 overflow-hidden rounded-full bg-border">
                        {isActive && (
                          <motion.span
                            key={`${item.id}-${isRunning}`}
                            className="absolute inset-y-0 left-0 bg-primary"
                            initial={{ width: isRunning ? "0%" : "100%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: isRunning ? SLIDE_DURATION / 1000 : 0, ease: "linear" }}
                          />
                        )}
                      </span>
                      <span
                        className={cn(
                          "mt-3 hidden truncate text-sm transition-colors sm:block",
                          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setIsPaused((paused) => !paused)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
                aria-label={isPaused ? "Retomar destaques" : "Pausar destaques"}
              >
                {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
