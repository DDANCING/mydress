import { Transition, Variants } from "framer-motion"

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5 }
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const cardHover = {
  whileHover: { scale: 1.05 },
  transition: { type: "spring", stiffness: 300 }
}

export const cardHoverSmall = {
  whileHover: { scale: 1.02 },
  transition: { type: "spring", stiffness: 300 }
}

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.5 }
}

export const slideInLeft = {
  initial: { x: -60, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.5 }
}

export const slideInRight = {
  initial: { x: 60, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.5 }
}

export const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.5 }
} 

export const transition: Transition = {
  delay: 0.1,
  type: "spring",
  bounce: 0,
  duration: 0.6,
};

export const containerVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.03,
    y: -8,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  },
}

export const favoriteVariants: Variants = {
  rest: { scale: 1, rotate: 0 },
  favorite: {
    scale: [1, 1.3, 1],
    rotate: [0, 10, -10, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut" as const,
    },
  },
};

export const overlayVariants: Variants = {
  rest: {
    y: "100%",
    opacity: 0,
    filter: "blur(4px)",
  },
  hover: {
    y: "0%",
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.1,
    },
  },
}

export const contentVariants: Variants = {
  rest: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  hover: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const, // ✅ ainda é necessário aqui!
      stiffness: 400,
      damping: 25,
      mass: 0.5,
    },
  },
}