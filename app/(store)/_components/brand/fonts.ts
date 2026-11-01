import { Figtree, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";

// Grotesca grande para títulos + mono em caixa alta para rótulos (estilo editorial de boutique)
export const displayFont = Instrument_Sans({
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

export const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-face",
  display: "swap",
});

export const storeFontVariables = `${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`;
