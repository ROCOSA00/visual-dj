"use client";

import { create } from "zustand";
import type { Project } from "@/domain/types";
import { PlaybackClock } from "@/engine/clock";
import { setVideosPlaying } from "@/engine/assets";

export type LibraryTab =
  | "text"
  | "artist"
  | "logo"
  | "image"
  | "video"
  | "shapes"
  | "backgrounds"
  | "effects"
  | "overlays"
  | "particles"
  | "audio"
  | "templates";

export type ZoomLevel = "fit" | 0.5 | 0.75 | 1;
export type EditorModal = "export" | "shortcuts" | null;

interface EditorState {
  projectId: string | null;
  sceneId: string | null;
  selectedLayerId: string | null;
  libraryTab: LibraryTab | null;
  zoom: ZoomLevel;
  playing: boolean;
  modal: EditorModal;
  tourOpen: boolean;
  tourStep: number;
  past: Project[];
  future: Project[];
  lastHistoryKey: string | null;
  lastHistoryAt: number;

  open: (project: Project) => void;
  setScene: (sceneId: string) => void;
  select: (layerId: string | null) => void;
  setLibraryTab: (tab: LibraryTab | null) => void;
  setZoom: (zoom: ZoomLevel) => void;
  setModal: (modal: EditorModal) => void;
  startTour: () => void;
  setTourStep: (step: number) => void;
  endTour: () => void;
}

/** The editor's timeline. Shared by the stage, scene thumbnails and playhead. */
export const editorClock = new PlaybackClock(true);

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: null,
  sceneId: null,
  selectedLayerId: null,
  libraryTab: "artist",
  zoom: "fit",
  playing: true,
  modal: null,
  tourOpen: false,
  tourStep: 0,
  past: [],
  future: [],
  lastHistoryKey: null,
  lastHistoryAt: 0,

  open(project) {
    if (get().projectId === project.id) {
      // Keep selection when re-entering the same project; just validate it.
      const scene = project.scenes.find((s) => s.id === get().sceneId) ?? project.scenes[0];
      set({ sceneId: scene?.id ?? null });
      return;
    }
    set({
      projectId: project.id,
      sceneId: project.scenes[0]?.id ?? null,
      selectedLayerId: null,
      past: [],
      future: [],
      lastHistoryKey: null,
      modal: null,
    });
  },
  setScene(sceneId) {
    if (sceneId === get().sceneId) return;
    set({ sceneId, selectedLayerId: null });
  },
  select(layerId) {
    set({ selectedLayerId: layerId });
  },
  setLibraryTab(tab) {
    set({ libraryTab: tab });
  },
  setZoom(zoom) {
    set({ zoom });
  },
  setModal(modal) {
    set({ modal });
  },
  startTour() {
    set({ tourOpen: true, tourStep: 0, modal: null });
  },
  setTourStep(step) {
    set({ tourStep: step });
  },
  endTour() {
    set({ tourOpen: false, tourStep: 0 });
  },
}));

editorClock.subscribe(() => {
  useEditorStore.setState({ playing: editorClock.playing });
  setVideosPlaying(editorClock.playing);
});
