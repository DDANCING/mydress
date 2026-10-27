"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { StoreProduct } from "@/app/types";
import { Button } from "@/components/ui/button";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src?: string;
  stars?: number;
  product: StoreProduct;
};

const DEFAULT_USER_IMG = "/placeholder-user.jpg";

export const AnimatedTestimonials = ({
  testimonials,
  autoplay = false,
  className,
  activeIndex,
  onChange,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
  className?: string;
  activeIndex?: number;
  onChange?: (index: number) => void;
}) => {
  const isControlled = typeof activeIndex === 'number';
  const [internalActive, setInternalActive] = useState(0);
  const active = isControlled ? activeIndex! : internalActive;

  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];
  const hasTestimonials = safeTestimonials.length > 0;

  useEffect(() => {
    if (active >= safeTestimonials.length) {
      if (isControlled && onChange) {
        onChange(0);
      } else {
        setInternalActive(0);
      }
    }
  }, [safeTestimonials.length, active, isControlled, onChange]);

  const handleNext = useCallback(() => {
    if (hasTestimonials) {
      const next = (active + 1) % safeTestimonials.length;
      if (isControlled && onChange) {
        onChange(next);
      } else {
        setInternalActive(next);
      }
    }
  }, [active, safeTestimonials.length, hasTestimonials, isControlled, onChange]);

  const handlePrev = () => {
    if (hasTestimonials) {
      const prev = (active - 1 + safeTestimonials.length) % safeTestimonials.length;
      if (isControlled && onChange) {
        onChange(prev);
      } else {
        setInternalActive(prev);
      }
    }
  };

  useEffect(() => {
    if (autoplay && hasTestimonials) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay, handleNext, hasTestimonials]);

  const isActive = (index: number) => {
    return index === active;
  };

const rotations = useMemo(() => {
  return testimonials.map((t, index) => {
    const str = (t.name || '') + index;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (hash % 21) - 10; // valor entre -10 e 10
  });
}, [testimonials]);

  const renderStars = (stars: number = 0) => (
    <div className="flex gap-1 pt-2">
      {Array.from({ length: 5 }).map((_, idx) => (
        <svg
          key={idx}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill={idx < stars ? "#FFD700" : "#E5E7EB"}
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="10,1 12.5,7.5 19,7.5 13.5,12 15.5,18 10,14.5 4.5,18 6.5,12 1,7.5 7.5,7.5"
            stroke="#F59E42"
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </div>
  );

  if (!hasTestimonials) {
    return (
      <div
        className={cn(
          "max-w-sm md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-20 flex flex-col items-center justify-center",
          className
        )}
      >
        <Image
          src={DEFAULT_USER_IMG}
          alt="Usuário padrão"
          width={120}
          height={120}
          draggable={false}
          className="rounded-full object-cover object-center mb-4"
        />
        <span className="text-lg text-muted-foreground mb-2 text-center">
          Ainda não temos testemunhos por aqui!
        </span>
        <Link href="/profile/orders">
          <Button className="mt-4 px-6 py-2 rounded-full bg-primary">
            Veja seus pedidos e avalie!
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
    <div className={cn("mx-auto", className)}>
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-20">
        <div>
          <div className="relative h-80 w-full">
            <AnimatePresence>
              {safeTestimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.src || `img-${index}`}
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                    z: -100,
                    rotate: rotations[index],
                  }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.7,
                    scale: isActive(index) ? 1 : 0.95,
                    z: isActive(index) ? 0 : -100,
                    rotate: isActive(index) ? 0 : rotations[index],
                    zIndex: isActive(index) ? 999 : safeTestimonials.length + 2 - index,
                    y: isActive(index) ? [0, -80, 0] : 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    z: 100,
                    rotate: rotations[index],
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 origin-bottom"
                >
                  <Image
                    src={testimonial.src || DEFAULT_USER_IMG}
                    alt={testimonial.name}
                    width={500}
                    height={500}
                    draggable={false}
                    className="h-full w-full rounded-3xl object-cover object-center"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex flex-col py-4 items-start">
          <motion.div
            key={active}
            initial={{
              y: 20,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: -20,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            className="mb-6"
          >
            <p className="text-xl font-bold mb-1">{testimonials[active]?.name}</p>
            <p className="text-sm text-muted-foreground mb-1">{testimonials[active]?.designation}</p>
            {renderStars(testimonials[active]?.stars ?? 0)}
            <motion.p className="text-lg text-muted-foreground mt-4">
              &quot;
              {testimonials[active]?.quote.split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  initial={{
                    filter: "blur(10px)",
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    filter: "blur(0px)",
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                    delay: 0.02 * index,
                  }}
                  className="inline-block"
                >
                  {word}&nbsp;
                </motion.span>
              ))}
              &quot;
            </motion.p>
            
          </motion.div>
          <div className="w-full flex flex-col gap-4 items-center">
  
            <div className="flex gap-4 pt-2">
              <button
                onClick={handlePrev}
                disabled={safeTestimonials.length < 2}
                className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center group/button"
              >
                <IconArrowLeft className="h-5 w-5 text-foreground group-hover/button:rotate-12 transition-transform duration-300" />
              </button>
              <button
                onClick={handleNext}
                disabled={safeTestimonials.length < 2}
                className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center group/button"
              >
                <IconArrowRight className="h-5 w-5 text-foreground group-hover/button:-rotate-12 transition-transform duration-300" />
              </button>
            </div>
            
          </div>
        </div>
        
      </div>
      
    </div>
 
    </div>
  );
};