import {
  Anton,
  Archivo_Black,
  Audiowide,
  Bebas_Neue,
  Big_Shoulders,
  Chakra_Petch,
  Inter,
  Major_Mono_Display,
  Michroma,
  Monoton,
  Orbitron,
  Rubik_Mono_One,
  Space_Grotesk,
  Syncopate,
  Syne,
  Unbounded,
} from "next/font/google";
import type { FontId } from "@/domain/types";

/*
 * Fonts are self-hosted by next/font. The two UI fonts are preloaded; the
 * rest are only fetched when a visual actually uses them (see
 * engine/fontLoader.ts), so a big font library costs nothing up front.
 */

export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  display: "swap",
});

const syne = Syne({ subsets: ["latin"], display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", preload: false });
const orbitron = Orbitron({ subsets: ["latin"], display: "swap", preload: false });
const monoton = Monoton({ subsets: ["latin"], display: "swap", preload: false, weight: "400" });
const bebas = Bebas_Neue({ subsets: ["latin"], display: "swap", preload: false, weight: "400" });
const anton = Anton({ subsets: ["latin"], display: "swap", preload: false, weight: "400" });
const archivoBlack = Archivo_Black({ subsets: ["latin"], display: "swap", preload: false, weight: "400" });
const michroma = Michroma({ subsets: ["latin"], display: "swap", preload: false, weight: "400" });
const audiowide = Audiowide({ subsets: ["latin"], display: "swap", preload: false, weight: "400" });
const syncopate = Syncopate({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "700"] });
const majorMono = Major_Mono_Display({ subsets: ["latin"], display: "swap", preload: false, weight: "400" });
const rubikMono = Rubik_Mono_One({ subsets: ["latin"], display: "swap", preload: false, weight: "400" });
const bigShoulders = Big_Shoulders({ subsets: ["latin"], display: "swap", preload: false, adjustFontFallback: false });
const chakra = Chakra_Petch({ subsets: ["latin"], display: "swap", preload: false, weight: ["300", "400", "500", "600", "700"] });

/** CSS font-family strings (hashed by next/font) for canvas and previews. */
export const fontFamilies: Record<FontId, string> = {
  unbounded: unbounded.style.fontFamily,
  syne: syne.style.fontFamily,
  "space-grotesk": spaceGrotesk.style.fontFamily,
  inter: inter.style.fontFamily,
  orbitron: orbitron.style.fontFamily,
  monoton: monoton.style.fontFamily,
  bebas: bebas.style.fontFamily,
  anton: anton.style.fontFamily,
  "archivo-black": archivoBlack.style.fontFamily,
  michroma: michroma.style.fontFamily,
  audiowide: audiowide.style.fontFamily,
  syncopate: syncopate.style.fontFamily,
  "major-mono": majorMono.style.fontFamily,
  "rubik-mono": rubikMono.style.fontFamily,
  "big-shoulders": bigShoulders.style.fontFamily,
  chakra: chakra.style.fontFamily,
};

/**
 * Importing this module is enough to register every @font-face rule; only the
 * UI fonts are exposed as CSS variables on <html>.
 */
export const uiFontVariables = `${inter.variable} ${unbounded.variable}`;
