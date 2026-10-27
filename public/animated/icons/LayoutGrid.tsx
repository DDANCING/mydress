"use client";

import * as React from "react";
import { motion, useAnimation } from "framer-motion";
import type { Variants } from "framer-motion";

const boxVariants: Variants = {
  normal: (i: number) => ({
    x: 0,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  }),
  animate: (i: number) => {
    const positions = [
      { x: 11, y: 0 },
      { x: 0, y: 11 },
      { x: -11, y: 0 },
      { x: 0, y: -11 },
    ];
    return {
      ...positions[i],
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    };
  },
};

export interface LayoutGridProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number | string;
  stroke?: string;
}

export const LayoutGrid = React.forwardRef<SVGSVGElement, LayoutGridProps>(
  (
    {
      size = 28,
      strokeWidth = 2,
      stroke = "currentColor",
      className,
      ...props
    },
    ref
  ) => {
    const controls = useAnimation();

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        onMouseEnter={() => controls.start("animate")}
        onMouseLeave={() => controls.start("normal")}
        {...props}
      >
        {[0, 1, 2, 3].map((i) => {
          const positions = [
            { x: 3, y: 3 },
            { x: 14, y: 3 },
            { x: 14, y: 14 },
            { x: 3, y: 14 },
          ];
          return (
            <motion.rect
              key={i}
              width="7"
              height="7"
              rx="1"
              {...positions[i]}
              variants={boxVariants}
              animate={controls}
              initial="normal"
              custom={i}
            />
          );
        })}
      </svg>
    );
  }
);

LayoutGrid.displayName = "LayoutGrid";
