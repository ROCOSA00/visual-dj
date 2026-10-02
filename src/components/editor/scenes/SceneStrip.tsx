"use client";

import { ArrowLeft, ArrowRight, Copy, LayoutTemplate, MoreHorizontal, Pencil, Play, Plus, Square, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { InlineEdit } from "@/components/ui/controls";
import { MenuList, Popover } from "@/components/ui/Popover";
import { Tooltip } from "@/components/ui/Tooltip";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import type { Project, Scene } from "@/domain/types";
import { editorClock, useEditorStore } from "@/store/editor";
import { editorActions } from "@/store/editorActions";
import { cn } from "@/lib/utils";
import { useActiveProject } from "../hooks";

export function SceneStrip() {
  const project = useActiveProject();
  const sceneId = useEditorStore((s) => s.sceneId);
  const setScene = useEditorStore((s) => s.setScene);
  const setTab = useEditorStore((s) => s.setLibraryTab);
  const router = useRouter();
  const [addMenu, setAddMenu] = useState(false);
  const addBtn = useRef<HTMLButtonElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  if (!project) return null;

  return (
    <div className="shrink-0 border-t border-line bg-surface-1" data-tour="scenes">
      <div className="flex h-9 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold text-ink/90">Scenes</p>
          <span className="text-2xs text-subtle">
            Your show set · press <span className="kbd">1</span>–<span className="kbd">9</span> to switch
          </span>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/show/${project.id}`)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs font-semibold text-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
        >
          <Play className="h-3 w-3" fill="currentColor" /> Play set in Show Mode
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-3 pt-0.5">
        {project.scenes.map((scene, index) => (
          <div
            key={scene.id}
            className="relative"
            onDragOver={(e) => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              setOverIndex(e.clientX > rect.left + rect.width / 2 ? index + 1 : index);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId && overIndex !== null) {
                const from = project.scenes.findIndex((s) => s.id === dragId);
                const to = from < overIndex ? overIndex - 1 : overIndex;
                if (from !== to) editorActions.moveScene(dragId, to);
              }
              setDragId(null);
              setOverIndex(null);
            }}
          >
            {overIndex === index && dragId && dragId !== scene.id && (
              <span className="absolute -left-2 top-1 bottom-6 w-0.5 rounded-full bg-accent-soft shadow-[0_0_8px_rgb(167_139_250)]" />
            )}
            {overIndex === index + 1 && index === project.scenes.length - 1 && dragId && (
              <span className="absolute -right-2 top-1 bottom-6 w-0.5 rounded-full bg-accent-soft" />
            )}
            <SceneCard
              project={project}
              scene={scene}
              index={index}
              active={scene.id === sceneId}
              dragging={dragId === scene.id}
              onSelect={() => setScene(scene.id)}
              onDragStart={() => setDragId(scene.id)}
              onDragEnd={() => {
                setDragId(null);
                setOverIndex(null);
              }}
            />
          </div>
        ))}
        <button
          ref={addBtn}
          type="button"
          onClick={() => setAddMenu((m) => !m)}
          className="flex w-[148px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 text-muted transition-all hover:border-accent/50 hover:bg-accent/[0.06] hover:text-ink"
          style={{ height: 84 }}
        >
          <Plus className="h-5 w-5" />
          <span className="text-2xs font-semibold">Add scene</span>
        </button>
        <Popover open={addMenu} onClose={() => setAddMenu(false)} anchor={addBtn} side="top" align="start">
          <MenuList
            onClose={() => setAddMenu(false)}
            items={[
              { label: "Duplicate current scene", icon: <Copy />, onSelect: () => editorActions.addScene("duplicate") },
              { label: "Blank scene", icon: <Square />, onSelect: () => editorActions.addScene("blank") },
              { label: "From a template…", icon: <LayoutTemplate />, onSelect: () => setTab("templates") },
            ]}
          />
        </Popover>
      </div>
    </div>
  );
}

function SceneCard({
  project,
  scene,
  index,
  active,
  dragging,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  project: Project;
  scene: Scene;
  index: number;
  active: boolean;
  dragging: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const count = project.scenes.length;

  return (
    <div
      draggable={!renaming}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", scene.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn("group w-[148px] shrink-0 transition-opacity", dragging && "opacity-40")}
    >
      <Tooltip content={`Switch to ${scene.name}`} shortcut={index < 9 ? String(index + 1) : undefined} side="top" delay={600}>
        <button
          type="button"
          onClick={onSelect}
          onDoubleClick={() => setRenaming(true)}
          className={cn(
            "relative block w-full overflow-hidden rounded-xl border bg-black transition-all duration-200",
            active
              ? "border-transparent shadow-[0_0_0_2px_rgb(167_139_250),0_0_24px_-4px_rgb(139_92_246/0.8)]"
              : "border-line hover:-translate-y-0.5 hover:border-white/25",
          )}
          style={{ height: 84 }}
          aria-current={active}
        >
          <VisualCanvas scene={scene} artistName={project.artistName} bpm={project.bpm} clock={editorClock} fps={20} maxWidth={300} thumbnail quality={0.5} />
          <span
            className={cn(
              "absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-md px-1 font-mono text-[10px] font-bold",
              active ? "bg-accent-soft text-black" : "bg-black/70 text-white/80 backdrop-blur",
            )}
          >
            {index + 1}
          </span>
        </button>
      </Tooltip>
      <div className="mt-1.5 flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <InlineEdit
            value={scene.name}
            editing={renaming}
            onEditingChange={setRenaming}
            onCommit={(name) => editorActions.renameScene(scene.id, name)}
            className={cn("block w-full text-[11px] font-medium", active ? "text-ink" : "text-muted")}
            inputClassName="h-5 w-full text-[11px]"
            ariaLabel="Scene name"
          />
        </div>
        <button
          ref={menuBtn}
          type="button"
          aria-label={`${scene.name} options`}
          onClick={() => setMenu((m) => !m)}
          className="rounded p-0.5 text-subtle opacity-0 transition-opacity hover:bg-white/[0.08] hover:text-ink group-hover:opacity-100"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
      <Popover open={menu} onClose={() => setMenu(false)} anchor={menuBtn} side="top" align="end">
        <MenuList
          onClose={() => setMenu(false)}
          items={[
            { label: "Rename", icon: <Pencil />, onSelect: () => setRenaming(true) },
            { label: "Duplicate", icon: <Copy />, shortcut: "⌘D", onSelect: () => editorActions.duplicateScene(scene.id) },
            "divider",
            { label: "Move left", icon: <ArrowLeft />, disabled: index === 0, onSelect: () => editorActions.moveScene(scene.id, index - 1) },
            { label: "Move right", icon: <ArrowRight />, disabled: index === count - 1, onSelect: () => editorActions.moveScene(scene.id, index + 1) },
            "divider",
            { label: "Delete scene", icon: <Trash2 />, danger: true, disabled: count <= 1, onSelect: () => editorActions.deleteScene(scene.id) },
          ]}
        />
      </Popover>
    </div>
  );
}
