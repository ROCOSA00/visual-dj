"use client";

import { cloneLayer, cloneScene, createScene } from "@/domain/factories";
import { applyPalette, insertionIndex, mapLayer, mapScene } from "@/domain/projectOps";
import type { Layer, Project, Scene } from "@/domain/types";
import { useEditorStore } from "./editor";
import { useProjectsStore } from "./projects";
import { toast } from "./toasts";

/**
 * Every edit made in the editor goes through here: it snapshots history for
 * undo/redo, writes to the projects store (which autosaves) and keeps the
 * selection valid.
 */

const HISTORY_LIMIT = 80;
const COALESCE_MS = 900;

function currentProject(): Project | undefined {
  const { projectId } = useEditorStore.getState();
  return projectId ? useProjectsStore.getState().projects[projectId] : undefined;
}

function currentSceneId(): string | null {
  return useEditorStore.getState().sceneId;
}

/**
 * @param historyKey consecutive edits with the same key (e.g. dragging a
 * slider) collapse into a single undo step.
 */
function commit(recipe: (project: Project) => Project, historyKey?: string): void {
  const project = currentProject();
  if (!project) return;
  const editor = useEditorStore.getState();
  const now = Date.now();
  const coalesce = historyKey && editor.lastHistoryKey === historyKey && now - editor.lastHistoryAt < COALESCE_MS;
  useEditorStore.setState({
    ...(coalesce ? {} : { past: [...editor.past.slice(-(HISTORY_LIMIT - 1)), project], future: [] }),
    lastHistoryKey: historyKey ?? null,
    lastHistoryAt: now,
  });
  useProjectsStore.getState().updateProject(project.id, recipe);
}

function withScene(fn: (scene: Scene) => Scene, key?: string): void {
  const sceneId = currentSceneId();
  if (!sceneId) return;
  commit((p) => mapScene(p, sceneId, fn), key);
}

export function getActiveScene(): Scene | undefined {
  const project = currentProject();
  const sceneId = currentSceneId();
  return project?.scenes.find((s) => s.id === sceneId);
}

export const editorActions = {
  /* --------------------------------- layers -------------------------------- */

  updateLayer(layerId: string, patch: Partial<Layer>, historyKey?: string) {
    withScene(
      (scene) => mapLayer(scene, layerId, (l) => ({ ...l, ...patch }) as Layer),
      historyKey ?? `layer:${layerId}:${Object.keys(patch).join(",")}`,
    );
  },

  addLayer(layer: Layer, opts: { select?: boolean } = {}) {
    withScene((scene) => {
      const index = insertionIndex(scene.layers, layer);
      const layers = [...scene.layers];
      layers.splice(index, 0, layer);
      return { ...scene, layers };
    });
    if (opts.select !== false) useEditorStore.getState().select(layer.id);
  },

  /** Replaces the scene background, or adds one if the scene has none. */
  setBackground(patch: Partial<Layer> & { kind?: "background" }, create: () => Layer) {
    const scene = getActiveScene();
    const existing = scene?.layers.find((l) => l.kind === "background");
    if (existing) {
      editorActions.updateLayer(existing.id, patch, `bg-preset:${existing.id}`);
      useEditorStore.getState().select(existing.id);
    } else {
      editorActions.addLayer(create());
    }
  },

  removeLayer(layerId: string) {
    const scene = getActiveScene();
    const layer = scene?.layers.find((l) => l.id === layerId);
    if (!layer) return;
    withScene((s) => ({ ...s, layers: s.layers.filter((l) => l.id !== layerId) }));
    if (useEditorStore.getState().selectedLayerId === layerId) useEditorStore.getState().select(null);
    toast({
      title: `${layer.name} deleted`,
      tone: "info",
      action: { label: "Undo", onClick: () => editorActions.undo() },
    });
  },

  duplicateLayer(layerId: string) {
    const scene = getActiveScene();
    const index = scene?.layers.findIndex((l) => l.id === layerId) ?? -1;
    if (!scene || index < 0) return;
    const source = scene.layers[index]!;
    const copy = cloneLayer(source);
    copy.name = `${source.name} copy`;
    if ("transform" in copy) {
      copy.transform = { ...copy.transform, x: Math.min(0.95, copy.transform.x + 0.03), y: Math.min(0.95, copy.transform.y + 0.03) };
    }
    withScene((s) => {
      const layers = [...s.layers];
      layers.splice(index + 1, 0, copy);
      return { ...s, layers };
    });
    useEditorStore.getState().select(copy.id);
  },

  /** Moves a layer to a new index (bottom = 0). */
  moveLayer(layerId: string, toIndex: number) {
    withScene((s) => {
      const from = s.layers.findIndex((l) => l.id === layerId);
      if (from < 0) return s;
      const layers = [...s.layers];
      const [moved] = layers.splice(from, 1);
      layers.splice(Math.max(0, Math.min(layers.length, toIndex)), 0, moved!);
      return { ...s, layers };
    });
  },

  toggleVisible(layerId: string) {
    const layer = getActiveScene()?.layers.find((l) => l.id === layerId);
    if (layer) editorActions.updateLayer(layerId, { visible: !layer.visible }, `vis:${layerId}:${Date.now()}`);
  },

  toggleLocked(layerId: string) {
    const layer = getActiveScene()?.layers.find((l) => l.id === layerId);
    if (layer) editorActions.updateLayer(layerId, { locked: !layer.locked }, `lock:${layerId}:${Date.now()}`);
  },

  renameLayer(layerId: string, name: string) {
    if (name.trim()) editorActions.updateLayer(layerId, { name: name.trim() }, `name:${layerId}`);
  },

  /* -------------------------------- project -------------------------------- */

  /** Restyles the artist-name layer in every scene of the show. */
  styleArtistEverywhere(patch: Partial<Layer>) {
    commit((p) => ({
      ...p,
      scenes: p.scenes.map((s) => ({
        ...s,
        layers: s.layers.map((l) => (l.kind === "text" && l.role === "artist" ? ({ ...l, ...patch } as Layer) : l)),
      })),
    }));
  },

  setArtistName(name: string) {
    commit((p) => ({ ...p, artistName: name }), "artistName");
  },

  setBpm(bpm: number) {
    commit((p) => ({ ...p, bpm: Math.round(Math.min(200, Math.max(60, bpm)) * 10) / 10 }), "bpm");
  },

  renameProject(name: string) {
    if (name.trim()) commit((p) => ({ ...p, name: name.trim() }), "projectName");
  },

  applyPalette(colors: string[], historyKey?: string) {
    commit((p) => applyPalette(p, colors), historyKey);
  },

  /* --------------------------------- scenes -------------------------------- */

  addScene(mode: "duplicate" | "blank" = "duplicate", layers?: Layer[], name?: string) {
    const project = currentProject();
    const active = getActiveScene();
    if (!project) return;
    let scene: Scene;
    if (layers) scene = createScene(name ?? `Scene ${project.scenes.length + 1}`, layers.map((l) => cloneLayer(l)));
    else if (mode === "duplicate" && active) scene = cloneScene(active, name ?? `Scene ${project.scenes.length + 1}`);
    else scene = createScene(name ?? `Scene ${project.scenes.length + 1}`, active?.layers.filter((l) => l.kind === "background").map((l) => cloneLayer(l)) ?? []);
    const activeIndex = project.scenes.findIndex((s) => s.id === active?.id);
    commit((p) => {
      const scenes = [...p.scenes];
      scenes.splice(activeIndex >= 0 ? activeIndex + 1 : scenes.length, 0, scene);
      return { ...p, scenes };
    });
    useEditorStore.getState().setScene(scene.id);
    return scene;
  },

  duplicateScene(sceneId?: string) {
    const project = currentProject();
    const id = sceneId ?? currentSceneId();
    const index = project?.scenes.findIndex((s) => s.id === id) ?? -1;
    if (!project || index < 0) return;
    const source = project.scenes[index]!;
    const copy = cloneScene(source, `${source.name} copy`);
    commit((p) => {
      const scenes = [...p.scenes];
      scenes.splice(index + 1, 0, copy);
      return { ...p, scenes };
    });
    useEditorStore.getState().setScene(copy.id);
    toast({ title: `Scene duplicated`, description: copy.name, tone: "success" });
  },

  deleteScene(sceneId: string) {
    const project = currentProject();
    if (!project) return;
    if (project.scenes.length <= 1) {
      toast({ title: "A show needs at least one scene", tone: "info" });
      return;
    }
    const index = project.scenes.findIndex((s) => s.id === sceneId);
    const scene = project.scenes[index];
    commit((p) => ({ ...p, scenes: p.scenes.filter((s) => s.id !== sceneId) }));
    if (currentSceneId() === sceneId) {
      const next = project.scenes[index + 1] ?? project.scenes[index - 1];
      if (next) useEditorStore.getState().setScene(next.id);
    }
    toast({
      title: `"${scene?.name}" deleted`,
      tone: "info",
      action: { label: "Undo", onClick: () => editorActions.undo() },
    });
  },

  renameScene(sceneId: string, name: string) {
    if (!name.trim()) return;
    commit((p) => mapScene(p, sceneId, (s) => ({ ...s, name: name.trim() })), `sceneName:${sceneId}`);
  },

  moveScene(sceneId: string, toIndex: number) {
    commit((p) => {
      const from = p.scenes.findIndex((s) => s.id === sceneId);
      if (from < 0) return p;
      const scenes = [...p.scenes];
      const [moved] = scenes.splice(from, 1);
      scenes.splice(Math.max(0, Math.min(scenes.length, toIndex)), 0, moved!);
      return { ...p, scenes };
    });
  },

  setLoopBars(bars: number) {
    withScene((s) => ({ ...s, loopBars: bars }));
  },

  replaceSceneLayers(layers: Layer[]) {
    withScene((s) => ({ ...s, layers: layers.map((l) => cloneLayer(l)) }));
    useEditorStore.getState().select(null);
  },

  /* -------------------------------- history -------------------------------- */

  undo() {
    const editor = useEditorStore.getState();
    const project = currentProject();
    const previous = editor.past[editor.past.length - 1];
    if (!project || !previous) return;
    useEditorStore.setState({
      past: editor.past.slice(0, -1),
      future: [project, ...editor.future],
      lastHistoryKey: null,
    });
    useProjectsStore.getState().replaceProject(previous);
    ensureValidSelection(previous);
  },

  redo() {
    const editor = useEditorStore.getState();
    const project = currentProject();
    const next = editor.future[0];
    if (!project || !next) return;
    useEditorStore.setState({
      past: [...editor.past, project],
      future: editor.future.slice(1),
      lastHistoryKey: null,
    });
    useProjectsStore.getState().replaceProject(next);
    ensureValidSelection(next);
  },
};

function ensureValidSelection(project: Project) {
  const editor = useEditorStore.getState();
  const scene = project.scenes.find((s) => s.id === editor.sceneId) ?? project.scenes[0];
  if (!scene) return;
  const layerOk = scene.layers.some((l) => l.id === editor.selectedLayerId);
  useEditorStore.setState({ sceneId: scene.id, selectedLayerId: layerOk ? editor.selectedLayerId : null });
}
