"use client";

import { create } from "zustand";
import { createProjectFromTemplate, type TemplateDefinition } from "@/domain/templates";
import type { Project } from "@/domain/types";
import { deepClone } from "@/lib/clone";
import { createId } from "@/lib/id";
import { projectRepository, StorageQuotaError } from "@/services/projects/projectRepository";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ProjectsState {
  hydrated: boolean;
  projects: Record<string, Project>;
  saveStatus: SaveStatus;
  saveError: string | null;
  lastSavedAt: number | null;

  hydrate: () => Promise<void>;
  addProject: (project: Project) => Project;
  createFromTemplate: (template: TemplateDefinition, opts: { artistName: string; name?: string }) => Project;
  updateProject: (id: string, recipe: (project: Project) => Project) => void;
  /** Replaces a project without touching updatedAt (undo/redo). */
  replaceProject: (project: Project) => void;
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => Project | null;
  deleteProject: (id: string) => Promise<void>;
  saveNow: () => Promise<void>;
}

const AUTOSAVE_DELAY = 700;
const dirty = new Set<string>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useProjectsStore = create<ProjectsState>((set, get) => {
  const scheduleSave = (id: string) => {
    dirty.add(id);
    set({ saveStatus: "saving", saveError: null });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void get().saveNow(), AUTOSAVE_DELAY);
  };

  return {
    hydrated: false,
    projects: {},
    saveStatus: "idle",
    saveError: null,
    lastSavedAt: null,

    async hydrate() {
      if (get().hydrated) return;
      const list = await projectRepository.list();
      set({ projects: Object.fromEntries(list.map((p) => [p.id, p])), hydrated: true });
    },

    addProject(project) {
      set((s) => ({ projects: { ...s.projects, [project.id]: project } }));
      scheduleSave(project.id);
      return project;
    },

    createFromTemplate(template, opts) {
      return get().addProject(createProjectFromTemplate(template, opts));
    },

    updateProject(id, recipe) {
      const current = get().projects[id];
      if (!current) return;
      const next = { ...recipe(current), updatedAt: Date.now() };
      set((s) => ({ projects: { ...s.projects, [id]: next } }));
      scheduleSave(id);
    },

    replaceProject(project) {
      set((s) => ({ projects: { ...s.projects, [project.id]: project } }));
      scheduleSave(project.id);
    },

    renameProject(id, name) {
      get().updateProject(id, (p) => ({ ...p, name: name.trim() || p.name }));
    },

    duplicateProject(id) {
      const source = get().projects[id];
      if (!source) return null;
      const now = Date.now();
      const copy: Project = {
        ...deepClone(source),
        id: createId("p_"),
        name: `${source.name} (copy)`,
        createdAt: now,
        updatedAt: now,
      };
      return get().addProject(copy);
    },

    async deleteProject(id) {
      dirty.delete(id);
      set((s) => {
        const { [id]: _removed, ...rest } = s.projects;
        void _removed;
        return { projects: rest };
      });
      await projectRepository.remove(id);
    },

    async saveNow() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      const ids = [...dirty];
      dirty.clear();
      try {
        for (const id of ids) {
          const project = get().projects[id];
          if (project) await projectRepository.save(project);
        }
        set({ saveStatus: "saved", lastSavedAt: Date.now(), saveError: null });
      } catch (error) {
        ids.forEach((id) => dirty.add(id));
        set({
          saveStatus: "error",
          saveError:
            error instanceof StorageQuotaError
              ? "Browser storage is full. Delete old projects or large uploads."
              : "Could not save your changes.",
        });
      }
    },
  };
});

export function sortedProjects(projects: Record<string, Project>): Project[] {
  return Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt);
}

if (typeof window !== "undefined") {
  // Last-chance save when the tab closes mid-debounce.
  window.addEventListener("beforeunload", () => {
    if (dirty.size) void useProjectsStore.getState().saveNow();
  });
}
