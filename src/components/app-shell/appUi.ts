"use client";

import { create } from "zustand";

/** App-level dialogs reachable from anywhere in the app shell. */
interface AppUiState {
  createOpen: boolean;
  createTemplateId: string | null;
  showPickerOpen: boolean;
  shortcutsOpen: boolean;
  openCreate: (templateId?: string) => void;
  closeCreate: () => void;
  openShowPicker: () => void;
  closeShowPicker: () => void;
  openShortcuts: () => void;
  closeShortcuts: () => void;
}

export const useAppUi = create<AppUiState>((set) => ({
  createOpen: false,
  createTemplateId: null,
  showPickerOpen: false,
  shortcutsOpen: false,
  openCreate: (templateId) => set({ createOpen: true, createTemplateId: templateId ?? null }),
  closeCreate: () => set({ createOpen: false }),
  openShowPicker: () => set({ showPickerOpen: true }),
  closeShowPicker: () => set({ showPickerOpen: false }),
  openShortcuts: () => set({ shortcutsOpen: true }),
  closeShortcuts: () => set({ shortcutsOpen: false }),
}));
