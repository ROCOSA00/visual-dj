"use client";

import { MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { BrowserNotice } from "@/components/app-shell/BrowserNotice";
import { Toaster } from "@/components/ui/Toaster";
import { preloadVisualFonts } from "@/engine/fontLoader";
import { useProjectsStore } from "@/store/projects";
import { syncEngineSettings, useSettingsStore } from "@/store/settings";

export function Providers({ children }: { children: React.ReactNode }) {
  const reduceUiMotion = useSettingsStore((s) => s.reduceUiMotion);

  useEffect(() => {
    void useProjectsStore.getState().hydrate();
    syncEngineSettings(useSettingsStore.getState());
    const unsub = useSettingsStore.subscribe((s) => syncEngineSettings(s));
    preloadVisualFonts();
    return unsub;
  }, []);

  return (
    <MotionConfig reducedMotion={reduceUiMotion ? "always" : "user"}>
      <BrowserNotice />
      {children}
      <Toaster />
    </MotionConfig>
  );
}
