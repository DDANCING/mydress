"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import Image from "next/image";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { whatsappLink } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export type LightboxItem = {
  title: string;
  detail?: string;
  message: string;
  images: { src: string; alt: string }[];
};

type View = { item: LightboxItem; index: number };

const OpenContext = createContext<(item: LightboxItem, index: number) => void>(() => {});

const arrowClass =
  "absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-sand/90 text-lg text-ink transition-colors hover:bg-gold";

export const LightboxProvider = ({ children }: { children: React.ReactNode }) => {
  const [view, setView] = useState<View | null>(null);
  const open = useCallback((item: LightboxItem, index: number) => setView({ item, index }), []);
  const step = (delta: number) =>
    setView((current) =>
      current && { ...current, index: (current.index + delta + current.item.images.length) % current.item.images.length },
    );

  const total = view?.item.images.length ?? 0;
  const image = view?.item.images[view.index];

  return (
    <OpenContext.Provider value={open}>
      {children}
      <Dialog open={Boolean(view)} onOpenChange={(isOpen) => !isOpen && setView(null)}>
        <DialogContent
          showCloseButton={false}
          {...(view?.item.detail ? {} : { "aria-describedby": undefined })}
          onClick={(event) => event.target === event.currentTarget && setView(null)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") step(1);
            if (event.key === "ArrowLeft") step(-1);
          }}
          className="left-0 top-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 items-center justify-center overflow-y-auto rounded-none border-0 bg-night/95 p-4 font-light text-sand shadow-none sm:max-w-none sm:p-8"
        >
          {view && image && (
            <div className="grid w-full max-w-[1100px] grid-cols-[minmax(0,1fr)] items-center gap-6 pt-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12 lg:pt-0">
              <div className="relative h-[62dvh] w-full lg:h-[86dvh]">
                <Image key={image.src} src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-contain" />
                {total > 1 && (
                  <>
                    <button type="button" aria-label="Imagem anterior" onClick={() => step(-1)} className={cn(arrowClass, "left-3")}>←</button>
                    <button type="button" aria-label="Próxima imagem" onClick={() => step(1)} className={cn(arrowClass, "right-3")}>→</button>
                  </>
                )}
              </div>
              <div>
                <DialogTitle className="font-display text-4xl font-normal leading-[1.1]">{view.item.title}</DialogTitle>
                {view.item.detail && <DialogDescription className="mt-2 text-base text-sand/75">{view.item.detail}</DialogDescription>}
                <p aria-live="polite" className="mt-3 text-sm tabular-nums text-gold">{view.index + 1} / {total}</p>
                <a
                  href={whatsappLink(view.item.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex min-h-12 items-center justify-center bg-gold px-8 py-4 text-[11px] uppercase tracking-[0.22em] text-ink transition-colors hover:bg-sand"
                >
                  Quero experimentar
                </a>
              </div>
            </div>
          )}
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setView(null)}
            className="fixed right-4 top-4 flex size-12 items-center justify-center border border-sand/40 text-lg transition-colors hover:bg-sand hover:text-ink"
          >
            ✕
          </button>
        </DialogContent>
      </Dialog>
    </OpenContext.Provider>
  );
};

// Envolve a foto num botão que abre a visualização ampliada, com o véu "Ver" no hover
export const Zoom = ({ item, index = 0, label, className, children }: { item: LightboxItem; index?: number; label: string; className?: string; children: React.ReactNode }) => {
  const open = useContext(OpenContext);
  return (
    <button
      type="button"
      onClick={() => open(item, index)}
      aria-label={`Ampliar foto: ${label}`}
      className={cn("group/zoom relative block w-full cursor-zoom-in overflow-hidden text-left", className)}
    >
      {children}
      <span aria-hidden className="absolute inset-0 flex items-end justify-center bg-night/0 pb-5 text-[11px] uppercase tracking-[0.22em] text-sand opacity-0 transition duration-300 group-hover/zoom:bg-night/25 group-hover/zoom:opacity-100">
        Ver
      </span>
    </button>
  );
};

// Faixa horizontal de fotos com setas, como as galerias do site antigo
export const PhotoRail = ({ item, sizes = "(min-width: 1024px) 24vw, 62vw" }: { item: LightboxItem; sizes?: string }) => {
  const rail = useRef<HTMLUListElement>(null);
  const scroll = (direction: number) => {
    const element = rail.current;
    if (element) element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-5 flex justify-end gap-2">
        <button type="button" aria-label="Fotos anteriores" onClick={() => scroll(-1)} className="flex size-11 items-center justify-center border border-input transition-colors hover:border-ink">←</button>
        <button type="button" aria-label="Próximas fotos" onClick={() => scroll(1)} className="flex size-11 items-center justify-center border border-input transition-colors hover:border-ink">→</button>
      </div>
      <ul ref={rail} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:gap-3">
        {item.images.map((image, index) => (
          <li key={image.src} className="w-[62vw] shrink-0 snap-start sm:w-[34vw] lg:w-[23vw]">
            <Zoom item={item} index={index} label={image.alt} className="aspect-[3/4] bg-muted">
              <Image src={image.src} alt={image.alt} fill sizes={sizes} className="object-cover object-top" />
            </Zoom>
          </li>
        ))}
      </ul>
    </div>
  );
};
