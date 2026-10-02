"use client";

import { useEffect } from "react";
import type { Project } from "@/domain/types";
import { editorClock, useEditorStore } from "@/store/editor";
import { CanvasStage } from "./canvas/CanvasStage";
import { PlaybackBar } from "./canvas/PlaybackBar";
import { EditorTopbar } from "./EditorTopbar";
import { EditorTour } from "./EditorTour";
import { ExportModal } from "./ExportModal";
import { LayersPanel } from "./layers/LayersPanel";
import { PropertiesPanel } from "./properties/PropertiesPanel";
import { SceneStrip } from "./scenes/SceneStrip";
import { ShortcutsModal } from "./ShortcutsModal";
import { ElementSidebar } from "./sidebar/ElementSidebar";
import { useEditorShortcuts } from "./useEditorShortcuts";

export function EditorShell({ project }: { project: Project }) {
  const open = useEditorStore((s) => s.open);
  const ready = useEditorStore((s) => s.projectId === project.id);

  useEffect(() => {
    open(project);
    if (!editorClock.playing) editorClock.play();
    // Only re-run when switching to a different project.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, open]);

  useEditorShortcuts();

  if (!ready) return null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg">
      <EditorTopbar />
      <div className="flex min-h-0 flex-1">
        <ElementSidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <CanvasStage />
          <PlaybackBar />
          <SceneStrip />
        </main>
        <aside
          className="flex w-[288px] shrink-0 flex-col border-l border-line bg-surface-1 xl:w-[320px]"
          data-tour="inspector"
          aria-label="Layers and properties"
        >
          <LayersPanel />
          <PropertiesPanel />
        </aside>
      </div>
      <ExportModal />
      <ShortcutsModal />
      <EditorTour />
    </div>
  );
}
