"use client";

import * as React from "react";
import { motion, useAnimation } from "framer-motion";
import useCart from "@/hooks/use-cart";

export interface AnimatedCartIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  stroke?: string;
  strokeWidth?: number | string;
}

export const AnimatedCartIcon = React.forwardRef<
  SVGSVGElement,
  AnimatedCartIconProps
>(({ size = 24, stroke = "currentColor", strokeWidth = 2, className, ...props }, ref) => {
  const controls = useAnimation();
  const cart = useCart();

  // Caixinhas caindo
  const fallingBoxVariants = {
    initial: { y: -10, opacity: 0 },
    animate: (i: number) => ({
      y: [ -10, 0, 2 ],
      opacity: [ 0, 1, 0 ],
      transition: {
        delay: i * 0.2,
        duration: 1,
        repeat: Infinity,
        repeatDelay: 2,
        ease: "easeOut"
      },
    }),
  };

  return (
    <div className="relative inline-block">
      {/* SVG animado */}
      <motion.svg
        ref={ref}
        onMouseEnter={() => controls.start("hover")}
        onMouseLeave={() => controls.start("initial")}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...Object.fromEntries(
          Object.entries(props).filter(([key]) => !key.startsWith("on"))
        )}
      >
        {/* Caixinhas caindo */}
        {cart.items.length > 0 &&
          Array.from({ length: Math.min(cart.items.length, 3) }).map((_, i) => (
            <motion.rect
  key={i}
  x={6 + i * 4}
  y={2}
  width={3}
  height={3}
  rx={0.5}
  fill={stroke}
  initial={{ y: -10, opacity: 0 }}
  animate={{
    y: [ -10, 0, 2 ],
    opacity: [ 0, 1, 0 ],
  }}
  transition={{
    delay: i * 0.2,
    duration: 1,
    repeat: Infinity,
    repeatDelay: 2,
    ease: "easeOut",
  }}
/>
          ))}

        {/* Carrinho completo (grupo animado) */}
        <motion.g
          variants={{
            initial: { x: 0 },
            hover: {
              x: [0, -2, 2, -2, 2, 0],
              transition: { duration: 0.5 },
            },
          }}
          animate={controls}
          initial="initial"
        >
          {/* Rodas */}
          <motion.circle
            cx="8"
            cy="21"
            r="1"
            variants={{
              initial: { scale: 1 },
              hover: {
                scale: [1, 1.2, 1],
                transition: { repeat: Infinity, duration: 1 },
              },
            }}
            animate={controls}
          />
          <motion.circle
            cx="19"
            cy="21"
            r="1"
            variants={{
              initial: { scale: 1 },
              hover: {
                scale: [1, 1.2, 1],
                transition: { repeat: Infinity, duration: 1 },
              },
            }}
            animate={controls}
          />

          {/* Estrutura do carrinho */}
          <motion.path
            d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            variants={{
              initial: { pathLength: 1 },
              hover: {
                pathLength: [1, 0.95, 1],
                transition: { duration: 0.4, repeat: Infinity },
              },
            }}
            animate={controls}
          />
        </motion.g>
      </motion.svg>

      {/* Badge com número de itens */}
      {cart.items.length > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold px-1 py-[1px] rounded-full shadow-md">
          {cart.items.length}
        </span>
      )}
    </div>
  );
});

AnimatedCartIcon.displayName = "AnimatedCartIcon";
