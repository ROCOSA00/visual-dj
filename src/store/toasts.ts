"use client";

import { create } from "zustand";
import { createId } from "@/lib/id";

export type ToastTone = "success" | "info" | "error";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id" | "tone"> & { tone?: ToastTone; duration?: number }) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push({ duration = 3200, tone = "success", ...toast }) {
    const id = createId("t_");
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...toast, tone, id }] }));
    setTimeout(() => get().dismiss(id), duration);
    return id;
  },
  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = (input: Parameters<ToastState["push"]>[0]) => useToastStore.getState().push(input);
