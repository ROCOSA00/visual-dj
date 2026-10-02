"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PanelLeftClose } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { useEditorStore, type LibraryTab } from "@/store/editor";
import { LIBRARY } from "../icons";
import { AudioPanel } from "./AudioPanel";
import { ImagePanel, LogoPanel, VideoPanel } from "./MediaPanels";
import { TemplatesPanel } from "./TemplatesPanel";
import { ArtistPanel, TextPanel } from "./TextPanels";
import { BackgroundsPanel, EffectsPanel, OverlaysPanel, ParticlesPanel, ShapesPanel } from "./VisualPanels";

const PANELS: Record<LibraryTab, () => React.ReactNode> = {
  text: () => <TextPanel />,
  artist: () => <ArtistPanel />,
  logo: () => <LogoPanel />,
  image: () => <ImagePanel />,
  video: () => <VideoPanel />,
  shapes: () => <ShapesPanel />,
  backgrounds: () => <BackgroundsPanel />,
  effects: () => <EffectsPanel />,
  overlays: () => <OverlaysPanel />,
  particles: () => <ParticlesPanel />,
  audio: () => <AudioPanel />,
  templates: () => <TemplatesPanel />,
};

export function ElementSidebar() {
  const tab = useEditorStore((s) => s.libraryTab);
  const setTab = useEditorStore((s) => s.setLibraryTab);
  const active = LIBRARY.find((c) => c.id === tab);

  return (
    <div className="flex h-full min-h-0" data-tour="library">
      <nav aria-label="Elements" className="no-scrollbar flex w-[68px] shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-r border-line bg-surface-1 py-2">
        {LIBRARY.map((cat) => {
          const Icon = cat.icon;
          const isActive = tab === cat.id;
          return (
            <Tooltip key={cat.id} content={cat.description} side="right">
              <button
                type="button"
                onClick={() => setTab(isActive ? null : cat.id)}
                aria-pressed={isActive}
                className={cn(
                  "group relative flex w-[58px] shrink-0 flex-col items-center gap-1 rounded-xl py-2 transition-all",
                  isActive ? "text-ink" : "text-subtle hover:bg-white/[0.04] hover:text-ink",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="rail-active"
                    className="absolute inset-0 rounded-xl border border-accent/30 bg-accent/[0.12] shadow-[0_0_18px_-6px_rgb(139_92_246/0.7)]"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon className={cn("relative h-[18px] w-[18px] transition-transform group-hover:scale-110", isActive && "text-accent-soft")} />
                <span className="relative text-[10px] font-medium leading-none">{cat.label}</span>
              </button>
            </Tooltip>
          );
        })}
      </nav>
      <AnimatePresence initial={false}>
        {active && (
          <motion.aside
            key="flyout"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
            className="h-full min-h-0 shrink-0 overflow-hidden border-r border-line bg-surface-1/80"
          >
            <div className="flex h-full w-[288px] flex-col">
              <div className="flex items-start justify-between gap-2 px-4 pb-3 pt-4">
                <div>
                  <h2 className="font-display text-[15px] font-semibold text-ink">{active.id === "artist" ? "Artist Name" : active.id === "audio" ? "Audio Reactive" : active.label}</h2>
                  <p className="mt-0.5 text-2xs text-subtle">{active.description.replace(/^.*?: /, "")}</p>
                </div>
                <Tooltip content="Collapse panel">
                  <button
                    type="button"
                    onClick={() => setTab(null)}
                    aria-label="Collapse panel"
                    className="rounded-md p-1 text-subtle hover:bg-white/[0.06] hover:text-ink"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.14 }}
                  className="min-h-0 flex-1 overflow-y-auto px-4 pb-6"
                >
                  {PANELS[active.id]()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
