"use client";

import * as React from "react";
import { motion, useAnimation } from "framer-motion";
import type { Variants } from "framer-motion";

const heartVariants: Variants = {
  normal: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  }),
  animate: (i: number) => ({
    scale: 1.20,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  }),
};

export interface HeartProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number | string;
  stroke?: string;
}

export const Heart = React.forwardRef<SVGSVGElement, HeartProps>(
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
        <motion.path
          d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
          variants={heartVariants}
          animate={controls}
          initial="normal"
          custom={0}
        />
      </svg>
    );
  }
);

Heart.displayName = "Heart";

