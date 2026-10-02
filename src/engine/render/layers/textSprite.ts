import type { TextLayer, TextMaterial } from "@/domain/types";
import { createCanvas, mixHex, rgba } from "../utils";

/**
 * Pre-rendered text "sprites". Big display text with gradients, cracked-ice
 * textures and strokes is expensive to rasterise, and 3D extrusion needs the
 * same glyphs dozens of times per frame. We render each look once into an
 * offscreen canvas and then blit it, which keeps 3D names smooth at 60 fps.
 */

export interface TextSprite {
  /** Lit front face. */
  front: HTMLCanvasElement;
  /** Darker silhouette used for the extruded sides. */
  side: HTMLCanvasElement;
  /** Bright outline drawn at the back of the extrusion. */
  rim: HTMLCanvasElement;
  /** Device pixels per text-local unit. */
  scale: number;
  /** Sprite rectangle relative to the text anchor, in text-local units. */
  x: number;
  y: number;
  w: number;
  h: number;
  tints: Map<string, HTMLCanvasElement>;
}

export interface TextLayout {
  lines: string[];
  widths: number[];
  blockW: number;
  lineH: number;
  ox: number;
  oy: number;
  font: string;
}

const cache = new Map<string, TextSprite>();
const MAX_SPRITES = 32;
const MAX_SIDE = 2600;

export function spriteScaleBucket(px: number): number {
  const clamped = Math.min(3, Math.max(0.08, px));
  return Math.pow(2, Math.round(Math.log2(clamped) * 4) / 4);
}

export function getTextSprite(l: TextLayer, text: string, layout: TextLayout, scale: number, fontGen: number): TextSprite {
  const key = [
    l.id,
    text,
    layout.font,
    l.letterSpacing,
    l.align,
    l.material,
    l.color,
    l.outline,
    l.gradient.enabled ? `${l.gradient.from}${l.gradient.to}` : "",
    scale.toFixed(3),
    fontGen,
  ].join("|");
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const sprite = buildSprite(l, layout, scale);
  cache.set(key, sprite);
  if (cache.size > MAX_SPRITES) cache.delete(cache.keys().next().value!);
  return sprite;
}

function buildSprite(l: TextLayer, layout: TextLayout, requestedScale: number): TextSprite {
  const pad = l.size * 0.22;
  const localW = layout.blockW + pad * 2;
  const localH = layout.lines.length * layout.lineH + pad * 2;
  const scale = Math.min(requestedScale, MAX_SIDE / localW, MAX_SIDE / localH);
  const front = createCanvas(localW * scale, localH * scale);
  const side = createCanvas(localW * scale, localH * scale);
  const rim = createCanvas(localW * scale, localH * scale);

  const paint = (canvas: HTMLCanvasElement, which: "front" | "side" | "rim") => {
    const g = canvas.getContext("2d");
    if (!g) return;
    g.setTransform(scale, 0, 0, scale, pad * scale, pad * scale);
    g.font = layout.font;
    if ("letterSpacing" in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${l.letterSpacing}px`;
    g.textBaseline = "middle";
    g.textAlign = "left";
    g.lineJoin = "round";
    const lines = layout.lines.map((line, i) => {
      const lw = layout.widths[i]!;
      const x = l.align === "left" ? 0 : l.align === "right" ? layout.blockW - lw : (layout.blockW - lw) / 2;
      return { line, x, y: layout.lineH * (i + 0.5), w: lw };
    });
    if (which === "front") paintFront(g, l, lines, layout);
    else if (which === "side") paintSide(g, l, lines);
    else paintRim(g, l, lines);
  };
  paint(front, "front");
  paint(side, "side");
  paint(rim, "rim");

  return {
    front,
    side,
    rim,
    scale,
    x: layout.ox - pad,
    y: layout.oy - pad,
    w: localW,
    h: localH,
    tints: new Map(),
  };
}

type Line = { line: string; x: number; y: number; w: number };

function verticalGradient(g: CanvasRenderingContext2D, ln: Line, size: number, stops: Array<[number, string]>) {
  const grad = g.createLinearGradient(0, ln.y - size * 0.45, 0, ln.y + size * 0.45);
  stops.forEach(([o, c]) => grad.addColorStop(o, c));
  return grad;
}

const CHROME = (tint: string): Array<[number, string]> => [
  [0, "#1b1b1f"],
  [0.16, mixHex(tint, "#ffffff", 0.85)],
  [0.44, mixHex(tint, "#7a7a82", 0.6)],
  [0.5, "#121216"],
  [0.57, mixHex(tint, "#34343c", 0.7)],
  [0.82, mixHex(tint, "#ffffff", 0.55)],
  [1, "#fbfbfd"],
];

const GOLD: Array<[number, string]> = [
  [0, "#3b2804"],
  [0.18, "#fff1c2"],
  [0.45, "#c79a2a"],
  [0.5, "#4a3206"],
  [0.58, "#8a6312"],
  [0.82, "#ffe08a"],
  [1, "#fff8de"],
];

const FIRE: Array<[number, string]> = [
  [0, "#fff7c9"],
  [0.32, "#ffc400"],
  [0.66, "#ff5200"],
  [1, "#8f0a00"],
];

function paintFront(g: CanvasRenderingContext2D, l: TextLayer, lines: Line[], layout: TextLayout) {
  const size = l.size;
  const material: TextMaterial = l.outline && l.material === "solid" ? "neon" : l.material;
  const fill = (style: string | CanvasGradient | ((ln: Line) => string | CanvasGradient)) => {
    for (const ln of lines) {
      g.fillStyle = typeof style === "function" ? style(ln) : style;
      g.fillText(ln.line, ln.x, ln.y);
    }
  };
  const stroke = (width: number, style: string | ((ln: Line) => string | CanvasGradient)) => {
    g.lineWidth = width;
    for (const ln of lines) {
      g.strokeStyle = typeof style === "function" ? style(ln) : style;
      g.strokeText(ln.line, ln.x, ln.y);
    }
  };

  switch (material) {
    case "solid": {
      if (l.outline) {
        stroke(Math.max(2, size * 0.035), l.color);
        break;
      }
      if (l.gradient.enabled) {
        const grad = g.createLinearGradient(0, 0, layout.blockW, 0);
        grad.addColorStop(0, l.gradient.from);
        grad.addColorStop(1, l.gradient.to);
        fill(grad);
      } else {
        fill(l.color);
      }
      break;
    }
    case "ice": {
      const light = mixHex(l.color, "#ffffff", 0.78);
      const deep = mixHex(l.color, "#000000", 0.55);
      fill((ln) =>
        verticalGradient(g, ln, size, [
          [0, rgba(light, 0.5)],
          [0.45, rgba(l.color, 0.22)],
          [1, rgba(deep, 0.75)],
        ]),
      );
      // Cracked-crystal texture, only inside the glyphs.
      const tile = crackTile(mixHex(l.color, "#ffffff", 0.6));
      const pattern = g.createPattern(tile, "repeat");
      if (pattern) {
        g.save();
        g.globalCompositeOperation = "source-atop";
        g.globalAlpha = 0.9;
        g.fillStyle = pattern;
        g.fillRect(-size, -size, layout.blockW + size * 2, lines.length * layout.lineH + size * 2);
        g.restore();
      }
      stroke(size * 0.05, l.color);
      stroke(size * 0.014, "rgba(255,255,255,0.85)");
      break;
    }
    case "chrome":
      fill((ln) => verticalGradient(g, ln, size, CHROME(l.color)));
      stroke(size * 0.012, "rgba(255,255,255,0.9)");
      break;
    case "gold":
      fill((ln) => verticalGradient(g, ln, size, GOLD));
      stroke(size * 0.012, "rgba(255,248,222,0.9)");
      break;
    case "fire":
      fill((ln) => verticalGradient(g, ln, size, FIRE));
      stroke(size * 0.016, "rgba(255,221,102,0.65)");
      break;
    case "neon":
      fill(rgba(l.color, 0.08));
      stroke(size * 0.07, l.color);
      stroke(size * 0.024, mixHex(l.color, "#ffffff", 0.75));
      break;
  }
}

function sideColors(l: TextLayer): { base: string; rim: string } {
  switch (l.material) {
    case "gold":
      return { base: "#241803", rim: "#c79a2a" };
    case "fire":
      return { base: "#2e0500", rim: "#ff5a00" };
    case "chrome":
      return { base: mixHex(l.color, "#0a0a0d", 0.86), rim: mixHex(l.color, "#9a9aa4", 0.5) };
    case "ice":
      return { base: mixHex(l.color, "#000000", 0.58), rim: l.color };
    default:
      return { base: mixHex(l.color, "#000000", 0.62), rim: l.color };
  }
}

function paintSide(g: CanvasRenderingContext2D, l: TextLayer, lines: Line[]) {
  const size = l.size;
  const { base } = sideColors(l);
  for (const ln of lines) {
    if (l.material === "neon" || (l.outline && l.material === "solid")) {
      g.lineWidth = size * 0.05;
      g.strokeStyle = rgba(l.color, 0.4);
      g.strokeText(ln.line, ln.x, ln.y);
      continue;
    }
    g.fillStyle = base;
    g.fillText(ln.line, ln.x, ln.y);
  }
}

function paintRim(g: CanvasRenderingContext2D, l: TextLayer, lines: Line[]) {
  const { rim } = sideColors(l);
  g.lineWidth = l.size * 0.03;
  g.strokeStyle = rgba(rim, l.material === "ice" ? 0.95 : 0.7);
  for (const ln of lines) g.strokeText(ln.line, ln.x, ln.y);
}

/** Silhouette of the sprite in a single colour (chromatic ghosts). */
export function tintedSprite(sprite: TextSprite, color: string): HTMLCanvasElement {
  const cached = sprite.tints.get(color);
  if (cached) return cached;
  const c = createCanvas(sprite.front.width, sprite.front.height);
  const g = c.getContext("2d")!;
  g.drawImage(sprite.front, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  sprite.tints.set(color, c);
  return c;
}

/* ---------------------------- cracked ice tile ---------------------------- */

let crackMask: HTMLCanvasElement | null = null;
const crackTints = new Map<string, HTMLCanvasElement>();

function buildCrackMask(): HTMLCanvasElement {
  const size = 256;
  const c = createCanvas(size, size);
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  // Deterministic Voronoi seeds, wrapped so the tile repeats seamlessly.
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 18; i++) pts.push([rand() * size, rand() * size]);
  const all: Array<[number, number]> = [];
  for (const [x, y] of pts) for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) all.push([x + ox * size, y + oy * size]);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let d1 = Infinity;
      let d2 = Infinity;
      for (const [px, py] of all) {
        const d = (px - x) * (px - x) + (py - y) * (py - y);
        if (d < d1) {
          d2 = d1;
          d1 = d;
        } else if (d < d2) d2 = d;
      }
      const edge = Math.sqrt(d2) - Math.sqrt(d1);
      const a = edge < 2.4 ? 1 - edge / 2.4 : 0;
      const i = (y * size + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

function crackTile(color: string): HTMLCanvasElement {
  const cached = crackTints.get(color);
  if (cached) return cached;
  crackMask ??= buildCrackMask();
  const c = createCanvas(crackMask.width, crackMask.height);
  const g = c.getContext("2d")!;
  g.drawImage(crackMask, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  crackTints.set(color, c);
  return c;
}
