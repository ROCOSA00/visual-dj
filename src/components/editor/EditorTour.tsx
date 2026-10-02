"use client";

import { useEffect, useMemo } from "react";
import { EDITOR_TOUR_ICONS, Tour, WELCOME_COPY, type TourStep } from "@/components/tutorial/Tour";
import { useEditorStore } from "@/store/editor";
import { useSettingsStore } from "@/store/settings";

export function EditorTour() {
  const open = useEditorStore((s) => s.tourOpen);
  const step = useEditorStore((s) => s.tourStep);
  const setStep = useEditorStore((s) => s.setTourStep);
  const endTour = useEditorStore((s) => s.endTour);
  const startTour = useEditorStore((s) => s.startTour);
  const completed = useSettingsStore((s) => s.tutorialCompleted);
  const update = useSettingsStore((s) => s.update);

  // First visit: start automatically once the editor has settled.
  useEffect(() => {
    if (completed) return;
    const id = setTimeout(() => startTour(), 700);
    return () => clearTimeout(id);
  }, [completed, startTour]);

  const steps = useMemo<TourStep[]>(
    () => [
      { title: WELCOME_COPY.title, body: WELCOME_COPY.body },
      {
        title: "Add elements from here",
        body: "Text, your artist name, logos, images, video loops, effects, particles and audio-reactive magic. Click anything to drop it into the scene.",
        target: '[data-tour="library"]',
        placement: "right",
        icon: EDITOR_TOUR_ICONS.library,
        prepare: () => {
          const s = useEditorStore.getState();
          if (!s.libraryTab) s.setLibraryTab("artist");
        },
      },
      {
        title: "Customize everything",
        body: "Select an element on the canvas or in Layers, then tweak colours, fonts, animation, glow and more here. Every change shows up instantly.",
        target: '[data-tour="inspector"]',
        placement: "left",
        icon: EDITOR_TOUR_ICONS.properties,
      },
      {
        title: "Create different scenes",
        body: "Your show is a set of scenes: Intro, Build Up, Drop, Break, Outro. Add, duplicate, rename and reorder them, then switch with keys 1–9.",
        target: '[data-tour="scenes"]',
        placement: "top",
        icon: EDITOR_TOUR_ICONS.scenes,
      },
      {
        title: "Launch your show",
        body: "When you're ready, hit Show Mode. Your visuals go fullscreen with a minimal controller, ready for the LED wall or projector.",
        target: '[data-tour="show-mode"]',
        placement: "bottom",
        icon: EDITOR_TOUR_ICONS.show,
      },
    ],
    [],
  );

  return (
    <Tour
      open={open}
      step={step}
      steps={steps}
      onStep={setStep}
      onClose={() => {
        endTour();
        update({ tutorialCompleted: true });
      }}
    />
  );
}
