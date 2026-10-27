import * as React from "react";
import { motion, useAnimation } from "framer-motion";
import type { Variants } from "framer-motion";

export interface BlocksProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number | string; // ← aqui
  stroke?: string;
}

const blockVariants: Variants = {
  normal: {
    scale: 1,
    rotate: 0,
  },
  animate: {
    scale: [1, 1.1, 1],
    rotate: [0, 5, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

const pathVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
  },
  animate: {
    pathLength: [0, 1],
    opacity: [0.3, 1],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
    },
  },
};

export const Blocks = React.forwardRef<SVGSVGElement, BlocksProps>(
  (
    {
      size = 28,
      strokeWidth = 2,
      stroke = "currentColor", 
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const controls = useAnimation();

    // Triggers animation on mouse events
    const handleMouseEnter = (e: React.MouseEvent<SVGSVGElement>) => {
      controls.start("animate");
      onMouseEnter?.(e);
    };
    const handleMouseLeave = (e: React.MouseEvent<SVGSVGElement>) => {
      controls.start("normal");
      onMouseLeave?.(e);
    };

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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.rect
          width="7"
          height="7"
          x="14"
          y="3"
          rx="1"
          variants={blockVariants}
          animate={controls}
          initial="normal"
        />
        <motion.path
          d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"
          variants={pathVariants}
          animate={controls}
          initial="normal"
        />
      </svg>
    );
  }
);

Blocks.displayName = "Blocks";