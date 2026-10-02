export type GenreId =
  | "techno"
  | "house"
  | "edm"
  | "minimal"
  | "psychedelic"
  | "cyberpunk"
  | "abstract"
  | "retro"
  | "industrial"
  | "ambient";

export interface Genre {
  id: GenreId;
  label: string;
  tagline: string;
  /** Two colours used for the category tile artwork. */
  colors: [string, string];
}

export const GENRES: Genre[] = [
  { id: "techno", label: "Techno", tagline: "Dark, driving, hypnotic", colors: ["#ff1f3d", "#3b0010"] },
  { id: "house", label: "House", tagline: "Warm grooves and golden hour", colors: ["#ff7a3d", "#ff3d81"] },
  { id: "edm", label: "EDM", tagline: "Main stage energy", colors: ["#00e5ff", "#ff2bd6"] },
  { id: "minimal", label: "Minimal", tagline: "Less noise, more presence", colors: ["#e5e5e5", "#3f3f46"] },
  { id: "psychedelic", label: "Psychedelic", tagline: "Colour, motion, mind-bend", colors: ["#ff00c8", "#00ffd5"] },
  { id: "cyberpunk", label: "Cyberpunk", tagline: "Neon cities after midnight", colors: ["#ff2bd6", "#00f0ff"] },
  { id: "abstract", label: "Abstract", tagline: "Shapes, light and texture", colors: ["#7c3aed", "#06b6d4"] },
  { id: "retro", label: "Retro", tagline: "Synthwave, VHS and chrome", colors: ["#ff2e88", "#ffd23f"] },
  { id: "industrial", label: "Industrial", tagline: "Steel, sparks and concrete", colors: ["#ff7a00", "#52525b"] },
  { id: "ambient", label: "Ambient", tagline: "Slow light for deep sets", colors: ["#4ade80", "#22d3ee"] },
];

export const GENRE_MAP: Record<GenreId, Genre> = Object.fromEntries(GENRES.map((g) => [g.id, g])) as Record<
  GenreId,
  Genre
>;
