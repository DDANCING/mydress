"use client";

import * as React from "react";
import { motion, useAnimation } from "framer-motion";
import type { Variants } from "framer-motion";

const pathVariant: Variants = {
  normal: { pathLength: 1, opacity: 1, pathOffset: 0 },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    pathOffset: [1, 0],
  },
};

const circleVariant: Variants = {
  normal: {
    pathLength: 1,
    pathOffset: 0,
    scale: 1,
  },
  animate: {
    pathLength: [0, 1],
    pathOffset: [1, 0],
    scale: [0.5, 1],
  },
};

export interface UserProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number | string;
  stroke?: string;
}

export const User = React.forwardRef<SVGSVGElement, UserProps>(
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
        <motion.circle
          cx="12"
          cy="8"
          r="5"
          initial="normal"
          animate={controls}
          variants={circleVariant}
        />
        <motion.path
          d="M20 21a8 8 0 0 0-16 0"
          initial="normal"
          animate={controls}
          variants={pathVariant}
          transition={{
            delay: 0.2,
            duration: 0.4,
          }}
        />
      </svg>
    );
  }
);

User.displayName = "User";
