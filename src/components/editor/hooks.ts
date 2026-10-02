"use client";

import type { Layer, Project, Scene } from "@/domain/types";
import { useEditorStore } from "@/store/editor";
import { useProjectsStore } from "@/store/projects";

export function useActiveProject(): Project | undefined {
  const id = useEditorStore((s) => s.projectId);
  return useProjectsStore((s) => (id ? s.projects[id] : undefined));
}

export function useActiveScene(): Scene | undefined {
  const project = useActiveProject();
  const sceneId = useEditorStore((s) => s.sceneId);
  return project?.scenes.find((s) => s.id === sceneId) ?? project?.scenes[0];
}

export function useSelectedLayer(): Layer | undefined {
  const scene = useActiveScene();
  const selected = useEditorStore((s) => s.selectedLayerId);
  return selected ? scene?.layers.find((l) => l.id === selected) : undefined;
}
