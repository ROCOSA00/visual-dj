import { TEMPLATE_MAP } from "@/data/templates";
import { createProjectFromTemplate } from "@/domain/templates";
import type { Project } from "@/domain/types";

/** Realistic sample shows so a first-time visitor can explore a full dashboard. */
export function createDemoProjects(artistName: string): Project[] {
  const now = Date.now();
  const demos: Array<[string, string, number]> = [
    ["ice-land", "Ice Land · Arena Tour 2025", 1000 * 60 * 25],
    ["chrome-perreo", "Viernes Perreo · Club Set", 1000 * 60 * 60 * 5],
    ["sunset-chrome", "Sunset Rooftop Session", 1000 * 60 * 60 * 30],
  ];
  return demos.flatMap(([templateId, name, age]) => {
    const template = TEMPLATE_MAP[templateId];
    if (!template) return [];
    const project = createProjectFromTemplate(template, { artistName, name });
    return [{ ...project, createdAt: now - age - 1000 * 60 * 60 * 24 * 3, updatedAt: now - age }];
  });
}
