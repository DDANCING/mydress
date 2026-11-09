import { IBM_Plex_Mono, Instrument_Serif, Jost } from "next/font/google";

// Serifada editorial para títulos + Jost leve para textos (identidade do site institucional)
export const displayFont = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display-face",
  display: "swap",
});

export const bodyFont = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body-face",
  display: "swap",
});

export const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-face",
  display: "swap",
  preload: false,
});

export const storeFontVariables = `${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`;
