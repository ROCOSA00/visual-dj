import { PROJECT_SCHEMA_VERSION, type Project } from "./types";

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
  // v1 is the first public schema; future migrations go here, e.g.
  // if (version < 2) migrated = migrateV1toV2(migrated);
  migrated.schemaVersion = Math.max(version, PROJECT_SCHEMA_VERSION);
  migrated.palette = Array.isArray(migrated.palette) ? migrated.palette : [];
  migrated.bpm = typeof migrated.bpm === "number" ? migrated.bpm : 124;
  return migrated;
}
