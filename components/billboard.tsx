"use client";

import * as React from "react";
import Image from "next/image";
import { Billboard, StoreProduct } from "@/app/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import ProductCard from "@/app/(store)/_components/ui/product-card";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// Função utilitária para truncar texto e adicionar "..." se necessário
function truncateText(text: string, maxLength: number) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength - 1) + "…" : text;
}

interface BillboardCarouselProps {
  data: (Billboard & { highlightProduct?: (StoreProduct & { isInWishlist?: boolean }) | null })[];
}

// Componente de Texto Digitado Elegante
const TextoDigitadoElegante = ({ 
  texto, 
  className = "", 
  delay = 0,
  velocidade = 100 
}: { 
  texto: string; 
  className?: string; 
  delay?: number;
  velocidade?: number;
}) => {
  const [textoExibido, setTextoExibido] = useState("");
  const [estaCompleto, setEstaCompleto] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      let indiceAtual = 0;
      const intervaloDigitacao = setInterval(() => {
        if (indiceAtual <= texto.length) {
          setTextoExibido(texto.slice(0, indiceAtual));
          indiceAtual++;
        } else {
          clearInterval(intervaloDigitacao);
          setEstaCompleto(true);
        }
      }, velocidade);

      return () => clearInterval(intervaloDigitacao);
    }, delay);

    return () => clearTimeout(timer);
  }, [texto, delay, velocidade]);

  return (
    <span className={className}>
      {textoExibido}
      {!estaCompleto && <span className="animate-pulse opacity-70">|</span>}
    </span>
  );
};

const BillboardCarousel: React.FC<BillboardCarouselProps> = ({ data }) => {
  const [current, setCurrent] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const carouselApiRef = useRef<any>(null);

  // Para truncar a descrição conforme o tamanho da tela
  const [windowWidth, setWindowWidth] = useState<number | null>(null);

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Garante que as animações começem após o componente carregar
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSlideChange = (index: number) => {
    if (index !== current) {
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 800);
    }
  };

  // Avanço automático a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      let next = (current + 1) % data.length;
      setIsTransitioning(true);
      setCurrent(next);
      if (carouselApiRef.current && typeof carouselApiRef.current.scrollTo === 'function') {
        carouselApiRef.current.scrollTo(next);
      }
      setTimeout(() => setIsTransitioning(false), 800);
    }, 5000);
    return () => clearInterval(interval);
  }, [current, data.length]);

  // Função para decidir o tamanho máximo da descrição dependendo do tamanho da janela
  function getMaxDescriptionLength() {
    if (windowWidth === null) return 250;
    if (windowWidth <= 380) return 45;
    if (windowWidth <= 500) return 65;
    if (windowWidth <= 768) return 100;
    return 250;
  }

  return (
    <div className="relative w-full h-screen mt-20 bg-background text-foreground overflow-hidden">
      <Carousel
        opts={{ align: "center", loop: true }}
        className="relative h-full w-full"
        setApi={(api) => {
          if (!api) return;
          carouselApiRef.current = api;
          api.on("select", () => {
            handleSlideChange(api.selectedScrollSnap());
          });
        }}
      >
        <CarouselContent className="h-full w-full flex gap-4 items-center">
          {Array.isArray(data) && data.map((billboard, index) => (
            <CarouselItem
              key={billboard.id}
              className="relative w-full h-screen flex items-center justify-center"
            >
              {/* Container da Imagem com Overlay Sofisticado */}
              <div className="absolute inset-0 w-full h-screen">
                <motion.div
                  initial={false}
                  animate={{ 
                    scale: isTransitioning && index === current ? 1.05 : 1,
                    opacity: isTransitioning && index === current ? 0.8 : 1
                  }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={billboard.imageUrl}
                    alt={billboard.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 sm:bg-gradient-to-b sm:from-background/20 via-transparent sm:to-background/40" />
                  <div className="absolute inset-0 sm:bg-gradient-to-r sm:from-#000/30 via-transparent sm:to-transparent" />
                </motion.div>
              </div>

              {/* Conteúdo Principal */}
              <div className="relative z-10 w-full h-full flex items-center justify-between px-6 lg:px-16">
                
                {/* Seção de Texto à Esquerda */}
                {billboard.subtitle && (
                  <div className="flex-1 max-w-2xl">
                    <motion.div
                      initial={{ opacity: 0, x: -80 }}
                      animate={hasLoaded ? { opacity: 1, x: 0 } : { opacity: 0, x: -80 }}
                      transition={{ 
                        duration: 1.5, 
                        delay: 0.3,
                        ease: [0.25, 0.46, 0.45, 0.94] 
                      }}
                    >
                      <div className="space-y-6 flex flex-col -mb-50 lg:-mb-0">
                        {/* Título Principal com Animação de Digitação */}
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extralight tracking-wide leading-tight text-white">
                          <TextoDigitadoElegante
                            texto={billboard.subtitle}
                            delay={hasLoaded ? 500 : 0}
                            velocidade={80}
                            className="block"
                          />
                        </h1>

                        {/* Descrição com Fade In Atrasado */}
                        {billboard.description && (
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={hasLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 1, delay: 1.5 }}
                          >
                            <p className="text-lg md:text-xl text-white font-light tracking-wide leading-relaxed max-w-lg">
  {windowWidth !== null && windowWidth <= 768
    ? truncateText(billboard.description, getMaxDescriptionLength())
    : billboard.description}
</p>
                          </motion.div>
                        )}

                        {/* Botão Call-to-Action Sofisticado */}
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={hasLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                          transition={{ duration: 1, delay: 2 }}
                        >
                          <Link href={billboard.callToAction?.href || "/category"}>
                            <motion.button
                              whileHover={{ 
                                scale: 1.05,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                              }}
                              whileTap={{ scale: 0.95 }}
                              className="group relative px-8 py-4 bg-background/50 text-foreground backdrop-blur-sm rounded-full border border-background/20 hover:bg-background transition-all duration-500 overflow-hidden"
                            >
                              <span className="relative z-10 text-sm tracking-[0.15em] uppercase font-light">
                                {billboard.callToAction?.text || "Descobrir Coleção"}
                              </span>
                              {/* Efeito de Hover Underline */}
                              <motion.div
                                className="absolute bottom-2 left-1/2 h-px bg-foreground"
                                initial={{ width: 0, x: "-50%" }}
                                whileHover={{ width: "70%" }}
                                transition={{ duration: 0.4 }}
                              />
                            </motion.button>
                          </Link>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Produto em Destaque à Direita */}
                {billboard.highlightProduct && (
                  <div className="hidden lg:flex flex-1 justify-end items-center">
                    <motion.div
                      initial={{ opacity: 0, x: 80 }}
                      animate={hasLoaded ? { opacity: 1, x: 0 } : { opacity: 0, x: 80 }}
                      transition={{ 
                        duration: 1.5, 
                        delay: 0.8,
                        ease: [0.25, 0.46, 0.45, 0.94] 
                      }}
                    >
                      <motion.div
                        whileHover={{ 
                          scale: 1.02,
                          y: -10 
                        }}
                        transition={{ duration: 0.3 }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-background/10 backdrop-blur-sm rounded-2xl transform rotate-1" />
                        <div className="relative z-10 transform -rotate-1">
                          <ProductCard
                            initialInWishlist={billboard.highlightProduct.isInWishlist}
                            size={0.8}
                            product={billboard.highlightProduct}
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Indicadores de Navegação Minimalistas */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
                <div className="flex space-x-3">
                  {data.map((_, i) => (
                    <motion.button
                      key={i}
                      onClick={() => handleSlideChange(i)}
                      className={`w-3 h-3 rounded-full transition-all duration-500 ${
                        i === current 
                          ? 'bg-background scale-125 shadow-lg' 
                          : 'bg-background/40 hover:bg-background/70'
                      }`}
                      whileHover={{ scale: i === current ? 1.25 : 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              </div>

              {/* Elemento Decorativo - Linha de Separação */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={hasLoaded ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 2, delay: 1 }}
                className="absolute bottom-20 left-16 w-32 h-px bg-background/30 origin-left hidden lg:block"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default BillboardCarousel;