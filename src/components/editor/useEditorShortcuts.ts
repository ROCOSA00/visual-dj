"use client";

import { useEffect } from "react";
import type { Layer } from "@/domain/types";
import { isTypingTarget } from "@/lib/utils";
import { editorClock, useEditorStore } from "@/store/editor";
import { editorActions, getActiveScene } from "@/store/editorActions";
import { useProjectsStore } from "@/store/projects";
import { toast } from "@/store/toasts";
import { stageFullscreen } from "./canvas/CanvasStage";

export function useEditorShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const editor = useEditorStore.getState();
      if (editor.tourOpen) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Save works everywhere, even while typing.
      if (mod && key === "s") {
        e.preventDefault();
        void useProjectsStore
          .getState()
          .saveNow()
          .then(() => toast({ title: "Project saved", description: "Stored safely in this browser", tone: "success", duration: 1800 }));
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (editor.modal) return;

      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) editorActions.redo();
        else editorActions.undo();
        return;
      }
      if (mod && key === "y") {
        e.preventDefault();
        editorActions.redo();
        return;
      }
      if (mod && key === "d") {
        e.preventDefault();
        editorActions.duplicateScene();
        return;
      }
      if (mod || e.altKey) return;

      if (e.code === "Space") {
        e.preventDefault();
        editorClock.toggle();
        return;
      }
      if (key === "f") {
        e.preventDefault();
        stageFullscreen.toggle();
        return;
      }
      if (key === "?" || (e.shiftKey && key === "/")) {
        editor.setModal("shortcuts");
        return;
      }
      if (/^[1-9]$/.test(e.key)) {
        const project = useProjectsStore.getState().projects[editor.projectId ?? ""];
        const scene = project?.scenes[Number(e.key) - 1];
        if (scene) editor.setScene(scene.id);
        return;
      }
      if (key === "escape") {
        editor.select(null);
        return;
      }

      const selected = getActiveScene()?.layers.find((l) => l.id === editor.selectedLayerId);
      if (!selected) return;
      if (key === "delete" || key === "backspace") {
        e.preventDefault();
        editorActions.removeLayer(selected.id);
        return;
      }
      if (key.startsWith("arrow") && "transform" in selected && !selected.locked) {
        e.preventDefault();
        const step = (e.shiftKey ? 10 : 1) / 1920;
        const t = selected.transform;
        const dx = key === "arrowleft" ? -step : key === "arrowright" ? step : 0;
        const dy = key === "arrowup" ? (-step * 16) / 9 : key === "arrowdown" ? (step * 16) / 9 : 0;
        editorActions.updateLayer(
          selected.id,
          { transform: { ...t, x: t.x + dx, y: t.y + dy } } as Partial<Layer>,
          `nudge:${selected.id}`,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
