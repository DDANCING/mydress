"use client";

import * as React from "react";
import { motion, useAnimation } from "framer-motion";

export interface SwatchBookProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number | string;
  stroke?: string;
}

const mainSwatchVariants = {
  normal: {
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
  animate: {
    x: 4,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

const mergingVariants = {
  normal: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
  animate: {
    x: -8,
    opacity: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

export const SwatchBook = React.forwardRef<SVGSVGElement, SwatchBookProps>(
  ({ size = 28, strokeWidth = 2, stroke = "currentColor", className, ...props }, ref) => {
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
        <motion.path
          d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z"
          variants={mainSwatchVariants}
          animate={controls}
        />
        <motion.path
          d="M7 17h.01"
          variants={mainSwatchVariants}
          animate={controls}
        />
        <motion.path
          d="M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7"
          variants={mergingVariants}
          animate={controls}
        />
        <motion.path
          d="m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8"
          variants={mergingVariants}
          animate={controls}
        />
      </svg>
    );
  }
);

SwatchBook.displayName = "SwatchBook";
