import { TAU, polygonPath } from "./render/utils";

/**
 * Built-in vector logo marks, for artists who do not have a logo yet.
 * Each draws centred at (0,0) inside a box of side `s` using the current
 * strokeStyle / fillStyle.
 */
export interface MarkDef {
  id: string;
  label: string;
  draw: (ctx: CanvasRenderingContext2D, s: number) => void;
}

export const MARKS: MarkDef[] = [
  {
    id: "orbit",
    label: "Orbit",
    draw(ctx, s) {
      ctx.lineWidth = s * 0.045;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.2, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.46, s * 0.17, -0.45, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.46, s * 0.17, 0.45, 0, TAU);
      ctx.stroke();
    },
  },
  {
    id: "prism",
    label: "Prism",
    draw(ctx, s) {
      ctx.lineWidth = s * 0.05;
      ctx.lineJoin = "round";
      polygonPath(ctx, 0, s * 0.06, s * 0.46, 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, s * 0.02);
      ctx.lineTo(-s * 0.08, s * 0.02);
      ctx.moveTo(s * 0.08, -s * 0.02);
      ctx.lineTo(s * 0.5, -s * 0.16);
      ctx.moveTo(s * 0.08, s * 0.05);
      ctx.lineTo(s * 0.5, s * 0.12);
      ctx.stroke();
    },
  },
  {
    id: "wave",
    label: "Wave",
    draw(ctx, s) {
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.46, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const x = -s * 0.32 + (i / 60) * s * 0.64;
        const env = Math.sin((i / 60) * Math.PI);
        const y = Math.sin((i / 60) * TAU * 2.5) * s * 0.18 * env;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
  },
  {
    id: "bolt",
    label: "Bolt",
    draw(ctx, s) {
      ctx.beginPath();
      ctx.moveTo(s * 0.08, -s * 0.5);
      ctx.lineTo(-s * 0.3, s * 0.06);
      ctx.lineTo(-s * 0.02, s * 0.06);
      ctx.lineTo(-s * 0.1, s * 0.5);
      ctx.lineTo(s * 0.3, -s * 0.08);
      ctx.lineTo(s * 0.02, -s * 0.08);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: "eye",
    label: "Eye",
    draw(ctx, s) {
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, 0);
      ctx.quadraticCurveTo(0, -s * 0.42, s * 0.5, 0);
      ctx.quadraticCurveTo(0, s * 0.42, -s * 0.5, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.14, 0, TAU);
      ctx.fill();
    },
  },
  {
    id: "hexcore",
    label: "Hexcore",
    draw(ctx, s) {
      ctx.lineWidth = s * 0.04;
      for (let i = 0; i < 3; i++) {
        polygonPath(ctx, 0, 0, s * (0.48 - i * 0.14), 6, Math.PI / 6);
        ctx.stroke();
      }
      polygonPath(ctx, 0, 0, s * 0.08, 6, Math.PI / 6);
      ctx.fill();
    },
  },
  {
    id: "sunburst",
    label: "Sunburst",
    draw(ctx, s) {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.18, 0, TAU);
      ctx.fill();
      ctx.lineWidth = s * 0.04;
      ctx.lineCap = "round";
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * s * 0.27, Math.sin(a) * s * 0.27);
        ctx.lineTo(Math.cos(a) * s * (i % 2 ? 0.4 : 0.48), Math.sin(a) * s * (i % 2 ? 0.4 : 0.48));
        ctx.stroke();
      }
    },
  },
  {
    id: "infinity",
    label: "Loop",
    draw(ctx, s) {
      ctx.lineWidth = s * 0.06;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const t = (i / 120) * TAU;
        const d = 1 + Math.sin(t) ** 2;
        const x = (Math.cos(t) / d) * s * 0.48;
        const y = ((Math.sin(t) * Math.cos(t)) / d) * s * 0.48;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    },
  },
];

export const MARK_MAP: Record<string, MarkDef> = Object.fromEntries(MARKS.map((m) => [m.id, m]));

/** "Nova Kai" → "NK", "MØRK" → "M", "Charlotte de Witte" → "CW". */
export function initialsOf(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !/^(de|del|la|le|van|von|the|dj|b2b|x|&)$/i.test(w));
  if (words.length === 0) return "VD";
  if (words.length === 1) return Array.from(words[0]!)[0]!.toUpperCase();
  return (Array.from(words[0]!)[0]! + Array.from(words[words.length - 1]!)[0]!).toUpperCase();
}
