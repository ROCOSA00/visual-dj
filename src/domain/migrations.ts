import { PROJECT_SCHEMA_VERSION, type Layer, type Project } from "./types";

/**
 * Upgrades persisted projects to the current schema. Add a step here every
 * time PROJECT_SCHEMA_VERSION is bumped; never mutate old data in place.
 */
export function migrateProject(raw: unknown): Project | null {
  if (!raw || typeof raw !== "object") return null;
  const project = raw as Partial<Project>;
  if (!project.id || !Array.isArray(project.scenes)) return null;

  const version = project.schemaVersion ?? 1;
  const migrated = { ...project } as Project;
  migrated.schemaVersion = Math.max(version, PROJECT_SCHEMA_VERSION);
  migrated.palette = Array.isArray(migrated.palette) ? migrated.palette : [];
  migrated.bpm = typeof migrated.bpm === "number" ? migrated.bpm : 124;
  migrated.scenes = migrated.scenes.map((scene) => ({ ...scene, layers: scene.layers.map(normalizeLayer) }));
  return migrated;
}

/** Fills in fields added after a project was saved (3D text, photo echo). */
function normalizeLayer(layer: Layer): Layer {
  if (layer.kind === "text") {
    return { ...layer, material: layer.material ?? "solid", depth: layer.depth ?? 0 };
  }
  if (layer.kind === "image") {
    return { ...layer, echo: layer.echo ?? 1, echoSpacing: layer.echoSpacing ?? 0.85, mirror: layer.mirror ?? false };
  }
  return layer;
}
