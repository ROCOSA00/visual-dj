import {
  AudioLines,
  Blend,
  Film,
  Image as ImageIcon,
  LayoutTemplate,
  Mic2,
  PaintBucket,
  Shapes,
  Sparkle,
  Sparkles,
  Type,
  Wand2,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import type { LayerKind } from "@/domain/types";
import type { LibraryTab } from "@/store/editor";

export const LAYER_ICONS: Record<LayerKind, LucideIcon> = {
  background: PaintBucket,
  text: Type,
  logo: BadgeCheck,
  image: ImageIcon,
  video: Film,
  shape: Shapes,
  effect: Wand2,
  overlay: Blend,
  particles: Sparkles,
  audio: AudioLines,
};

export interface LibraryCategory {
  id: LibraryTab;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const LIBRARY: LibraryCategory[] = [
  { id: "text", label: "Text", icon: Type, description: "Headlines, labels and messages" },
  { id: "artist", label: "Artist", icon: Mic2, description: "Artist name: your name, styled your way" },
  { id: "logo", label: "Logo", icon: BadgeCheck, description: "Upload your logo or generate one" },
  { id: "image", label: "Image", icon: ImageIcon, description: "Photos, artwork and PNGs" },
  { id: "video", label: "Video", icon: Film, description: "Video loops and clips" },
  { id: "shapes", label: "Shapes", icon: Shapes, description: "Rings, polygons and lines" },
  { id: "backgrounds", label: "Backgrounds", icon: PaintBucket, description: "Gradients, colours and patterns" },
  { id: "effects", label: "Effects", icon: Wand2, description: "Tunnels, lasers, waves and more" },
  { id: "overlays", label: "Overlays", icon: Blend, description: "Texture and finishing passes" },
  { id: "particles", label: "Particles", icon: Sparkle, description: "Dust, sparks, stars and bokeh" },
  { id: "audio", label: "Audio", icon: AudioLines, description: "Audio Reactive: make visuals react to music" },
  { id: "templates", label: "Templates", icon: LayoutTemplate, description: "Start a scene from a ready-made look" },
];
