import { Bodoni_Moda, Figtree } from "next/font/google";

export const displayFont = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display-face",
  display: "swap",
});

export const bodyFont = Figtree({
  subsets: ["latin"],
  variable: "--font-body-face",
  display: "swap",
});

export const storeFontVariables = `${displayFont.variable} ${bodyFont.variable}`;
