export interface Palette {
  id: string;
  name: string;
  /** primary, secondary, accent, base */
  colors: [string, string, string, string];
}

export const PALETTES: Palette[] = [
  { id: "ultraviolet", name: "Ultraviolet", colors: ["#8b5cf6", "#22d3ee", "#f472b6", "#07060d"] },
  { id: "neon-night", name: "Neon Night", colors: ["#ff2bd6", "#00f0ff", "#fffb00", "#08001a"] },
  { id: "red-room", name: "Red Room", colors: ["#ff1f3d", "#ffffff", "#ff6b6b", "#050505"] },
  { id: "acid", name: "Acid", colors: ["#b6ff00", "#00ff9c", "#f0ff4f", "#030a02"] },
  { id: "golden-hour", name: "Golden Hour", colors: ["#ff7a3d", "#ff3d81", "#ffd166", "#1a0610"] },
  { id: "ice", name: "Ice", colors: ["#7dd3fc", "#a5b4fc", "#f0f9ff", "#020617"] },
  { id: "mono", name: "Mono", colors: ["#f5f5f5", "#a3a3a3", "#ffffff", "#0a0a0a"] },
  { id: "vapor", name: "Vapor", colors: ["#ff9de2", "#8be9fd", "#b19cd9", "#1a1033"] },
  { id: "gold", name: "Gold", colors: ["#f5c542", "#fff1c1", "#b8860b", "#0a0804"] },
  { id: "toxic", name: "Toxic", colors: ["#22ff88", "#00b3ff", "#eafff2", "#000a05"] },
  { id: "inferno", name: "Inferno", colors: ["#ff4d00", "#ffb800", "#ff0055", "#0f0200"] },
  { id: "aurora", name: "Aurora", colors: ["#4ade80", "#22d3ee", "#a78bfa", "#020617"] },
];

/** Quick swatches shown in every colour picker. */
export const SWATCHES = [
  "#ffffff",
  "#000000",
  "#8b5cf6",
  "#a78bfa",
  "#22d3ee",
  "#00f0ff",
  "#ff2bd6",
  "#f472b6",
  "#ff1f3d",
  "#ff7a3d",
  "#ffd166",
  "#b6ff00",
  "#22ff88",
  "#38bdf8",
  "#e5e5e5",
  "#71717a",
];
