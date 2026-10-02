import { brand } from "@/config/brand";
import type { Project } from "@/domain/types";
import { migrateProject } from "@/domain/migrations";

/**
 * Persistence boundary for projects. The app only talks to this interface,
 * so the localStorage implementation can be replaced by a cloud API (with
 * auth, sync and collaboration) without touching UI code.
 */
export interface ProjectRepository {
  list(): Promise<Project[]>;
  get(id: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  remove(id: string): Promise<void>;
}

export class StorageQuotaError extends Error {
  constructor() {
    super("Local storage is full");
    this.name = "StorageQuotaError";
  }
}

const ns = brand.storageNamespace;
const INDEX_KEY = `${ns}:projects:index`;
const projectKey = (id: string) => `${ns}:project:${id}`;

function readIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    if (error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22)) {
      throw new StorageQuotaError();
    }
    throw error;
  }
}

export const localProjectRepository: ProjectRepository = {
  async list() {
    const projects: Project[] = [];
    for (const id of readIndex()) {
      const project = await this.get(id);
      if (project) projects.push(project);
    }
    return projects;
  },
  async get(id) {
    try {
      const raw = localStorage.getItem(projectKey(id));
      return raw ? migrateProject(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  },
  async save(project) {
    safeSet(projectKey(project.id), JSON.stringify(project));
    const index = readIndex();
    if (!index.includes(project.id)) writeIndex([project.id, ...index]);
  },
  async remove(id) {
    localStorage.removeItem(projectKey(id));
    writeIndex(readIndex().filter((v) => v !== id));
  },
};

export const projectRepository: ProjectRepository = localProjectRepository;
