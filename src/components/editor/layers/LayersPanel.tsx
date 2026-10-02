"use client";

import { ArrowDown, ArrowUp, ChevronsDown, ChevronsUp, Copy, Eye, EyeOff, GripVertical, Lock, MoreHorizontal, Plus, Trash2, Unlock } from "lucide-react";
import { useRef, useState } from "react";
import { InlineEdit } from "@/components/ui/controls";
import { IconButton } from "@/components/ui/misc";
import { MenuList, Popover } from "@/components/ui/Popover";
import type { Layer } from "@/domain/types";
import { useEditorStore } from "@/store/editor";
import { editorActions } from "@/store/editorActions";
import { cn } from "@/lib/utils";
import { useActiveScene } from "../hooks";
import { LAYER_ICONS } from "../icons";

export function LayersPanel() {
  const scene = useActiveScene();
  const selectedId = useEditorStore((s) => s.selectedLayerId);
  const select = useEditorStore((s) => s.select);
  const setTab = useEditorStore((s) => s.setLibraryTab);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  if (!scene) return null;

  // Displayed top → bottom; stored bottom → top.
  const rows = [...scene.layers].reverse();
  const total = scene.layers.length;

  const onDrop = () => {
    if (dragId !== null && dropIndex !== null) {
      // dropIndex is a display position (0 = top). Convert to storage index.
      const from = scene.layers.findIndex((l) => l.id === dragId);
      let to = total - dropIndex;
      if (from < to) to -= 1;
      if (to !== from) editorActions.moveLayer(dragId, to);
    }
    setDragId(null);
    setDropIndex(null);
  };

  return (
    <div className={cn("flex shrink-0 flex-col border-b border-line", collapsed ? "" : "max-h-[38%] min-h-[150px]")} data-tour="layers">
      <div className="flex h-10 shrink-0 items-center justify-between px-4">
        <button type="button" onClick={() => setCollapsed((c) => !c)} className="flex items-center gap-2 text-xs font-semibold text-ink/90 hover:text-ink">
          Layers <span className="rounded-full bg-white/[0.07] px-1.5 text-[10px] font-medium text-muted">{total}</span>
        </button>
        <IconButton size="sm" label="Add element" onClick={() => setTab("effects")}>
          <Plus />
        </IconButton>
      </div>
      {!collapsed && (
        <div
          className="min-h-0 flex-1 overflow-y-auto px-2 pb-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          {rows.length === 0 && (
            <p className="px-2 py-6 text-center text-2xs text-subtle">This scene is empty. Add elements from the left panel.</p>
          )}
          {rows.map((layer, displayIndex) => (
            <div key={layer.id} className="relative">
              {dropIndex === displayIndex && dragId !== layer.id && (
                <div className="absolute -top-px left-2 right-2 z-10 h-0.5 rounded-full bg-accent-soft shadow-[0_0_8px_rgb(167_139_250)]" />
              )}
              <LayerRow
                layer={layer}
                selected={layer.id === selectedId}
                dragging={dragId === layer.id}
                isTop={displayIndex === 0}
                isBottom={displayIndex === rows.length - 1}
                onSelect={() => select(layer.id)}
                onDragStart={() => setDragId(layer.id)}
                onDragOverRow={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const after = e.clientY > rect.top + rect.height / 2;
                  setDropIndex(after ? displayIndex + 1 : displayIndex);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setDropIndex(null);
                }}
                storageIndex={total - 1 - displayIndex}
              />
              {dropIndex === rows.length && displayIndex === rows.length - 1 && (
                <div className="absolute -bottom-px left-2 right-2 h-0.5 rounded-full bg-accent-soft" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LayerRow({
  layer,
  selected,
  dragging,
  isTop,
  isBottom,
  storageIndex,
  onSelect,
  onDragStart,
  onDragOverRow,
  onDragEnd,
}: {
  layer: Layer;
  selected: boolean;
  dragging: boolean;
  isTop: boolean;
  isBottom: boolean;
  storageIndex: number;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOverRow: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  const Icon = LAYER_ICONS[layer.kind];
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const total = useActiveScene()?.layers.length ?? 0;

  return (
    <div
      draggable={!renaming}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", layer.id);
        onDragStart();
      }}
      onDragOver={onDragOverRow}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onDoubleClick={() => setRenaming(true)}
      className={cn(
        "group relative flex h-9 cursor-pointer items-center gap-2 rounded-lg pl-1 pr-1 text-xs transition-all",
        selected ? "bg-accent/[0.14] text-ink shadow-[inset_0_0_0_1px_rgb(139_92_246/0.35)]" : "text-ink/80 hover:bg-white/[0.04]",
        dragging && "opacity-40",
        !layer.visible && "text-subtle",
      )}
    >
      {selected && <span className="absolute -left-2 top-2 bottom-2 w-0.5 rounded-full bg-accent-soft" />}
      <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-subtle/50 opacity-0 group-hover:opacity-100" />
      <Icon className={cn("h-3.5 w-3.5 shrink-0", selected ? "text-accent-soft" : "text-subtle")} />
      <div className="min-w-0 flex-1" onClick={(e) => renaming && e.stopPropagation()}>
        <InlineEdit
          value={layer.name}
          editing={renaming}
          onEditingChange={setRenaming}
          onCommit={(name) => editorActions.renameLayer(layer.id, name)}
          className={cn("block w-full", !layer.visible && "line-through decoration-white/20")}
          inputClassName="h-6 w-full text-xs"
          ariaLabel="Layer name"
        />
      </div>
      <div className={cn("flex items-center", !selected && "opacity-0 group-hover:opacity-100", (layer.locked || !layer.visible) && "opacity-100")}>
        <IconButton
          size="xs"
          label={layer.locked ? "Unlock" : "Lock"}
          onClick={(e) => {
            e.stopPropagation();
            editorActions.toggleLocked(layer.id);
          }}
          className={cn(layer.locked && "text-warning")}
        >
          {layer.locked ? <Lock /> : <Unlock />}
        </IconButton>
        <IconButton
          size="xs"
          label={layer.visible ? "Hide" : "Show"}
          onClick={(e) => {
            e.stopPropagation();
            editorActions.toggleVisible(layer.id);
          }}
        >
          {layer.visible ? <Eye /> : <EyeOff />}
        </IconButton>
        <IconButton
          ref={menuBtn}
          size="xs"
          label="More"
          onClick={(e) => {
            e.stopPropagation();
            setMenu((m) => !m);
          }}
        >
          <MoreHorizontal />
        </IconButton>
      </div>
      <Popover open={menu} onClose={() => setMenu(false)} anchor={menuBtn} align="end">
        <MenuList
          onClose={() => setMenu(false)}
          items={[
            { label: "Rename", icon: <span className="text-[10px]">Aa</span>, onSelect: () => setRenaming(true) },
            { label: "Duplicate", icon: <Copy />, onSelect: () => editorActions.duplicateLayer(layer.id) },
            "divider",
            { label: "Bring to front", icon: <ChevronsUp />, disabled: isTop, onSelect: () => editorActions.moveLayer(layer.id, total - 1) },
            { label: "Move up", icon: <ArrowUp />, disabled: isTop, onSelect: () => editorActions.moveLayer(layer.id, storageIndex + 1) },
            { label: "Move down", icon: <ArrowDown />, disabled: isBottom, onSelect: () => editorActions.moveLayer(layer.id, storageIndex - 1) },
            { label: "Send to back", icon: <ChevronsDown />, disabled: isBottom, onSelect: () => editorActions.moveLayer(layer.id, 0) },
            "divider",
            { label: "Delete", icon: <Trash2 />, danger: true, shortcut: "Del", onSelect: () => editorActions.removeLayer(layer.id) },
          ]}
        />
      </Popover>
    </div>
  );
}
