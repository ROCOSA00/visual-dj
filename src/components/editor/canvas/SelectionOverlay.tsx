"use client";

import { Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Layer, PositionedLayer, Scene } from "@/domain/types";
import type { LayerBounds } from "@/engine/render/env";
import { STAGE_H, STAGE_W } from "@/engine/render/utils";
import { ticker } from "@/engine/ticker";
import { useEditorStore } from "@/store/editor";
import { editorActions } from "@/store/editorActions";
import { cn } from "@/lib/utils";

type DragMode = "move" | "scale" | "rotate";

interface DragState {
  mode: DragMode;
  layerId: string;
  session: number;
  startX: number;
  startY: number;
  transform: PositionedLayer["transform"];
  anchor: { x: number; y: number };
}

const SNAP = 12;

function hasTransform(l: Layer): l is PositionedLayer {
  return "transform" in l;
}

function hitTest(b: LayerBounds, px: number, py: number, pad = 10): boolean {
  const dx = px - b.x;
  const dy = py - b.y;
  const cos = Math.cos(-b.rotation);
  const sin = Math.sin(-b.rotation);
  const lx = (dx * cos - dy * sin) / b.scale;
  const ly = (dx * sin + dy * cos) / b.scale;
  return lx >= b.ox - pad && lx <= b.ox + b.w + pad && ly >= b.oy - pad && ly <= b.oy + b.h + pad;
}

function placeBox(el: HTMLElement | null, b: LayerBounds | undefined, k: number) {
  if (!el) return;
  if (!b) {
    el.style.display = "none";
    return;
  }
  el.style.display = "block";
  el.style.width = `${b.w * b.scale * k}px`;
  el.style.height = `${b.h * b.scale * k}px`;
  el.style.transform = `translate(${b.x * k}px, ${b.y * k}px) rotate(${b.rotation}rad) translate(${b.ox * b.scale * k}px, ${b.oy * b.scale * k}px)`;
}

/**
 * Interaction layer on top of the stage canvas: click to select, drag to
 * move, corner handle to scale, top handle to rotate. Snaps to the centre.
 */
export function SelectionOverlay({
  width,
  bounds,
  scene,
}: {
  width: number;
  bounds: Map<string, LayerBounds>;
  scene: Scene;
}) {
  const selectedId = useEditorStore((s) => s.selectedLayerId);
  const select = useEditorStore((s) => s.select);
  const surface = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const hoverBox = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const hoverId = useRef<string | null>(null);
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const [guides, setGuides] = useState({ x: false, y: false });
  const [dragging, setDragging] = useState(false);
  const k = width / STAGE_W;
  const kRef = useRef(k);
  kRef.current = k;

  const selected = scene.layers.find((l) => l.id === selectedId);
  const locked = selected?.locked ?? false;

  useEffect(
    () =>
      ticker.add(() => {
        const layers = sceneRef.current.layers;
        const isShown = (id: string | null) => !!id && layers.some((l) => l.id === id && l.visible);
        placeBox(box.current, isShown(selectedRef.current) ? bounds.get(selectedRef.current!) : undefined, kRef.current);
        const h = hoverId.current;
        placeBox(hoverBox.current, h && h !== selectedRef.current && isShown(h) ? bounds.get(h) : undefined, kRef.current);
      }, 60),
    [bounds],
  );

  const toStage = (e: React.PointerEvent | PointerEvent) => {
    const rect = surface.current!.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * STAGE_W, y: ((e.clientY - rect.top) / rect.height) * STAGE_H };
  };

  const pick = (x: number, y: number): Layer | undefined => {
    const layers = sceneRef.current.layers;
    const candidates = layers.filter((l) => l.visible && !l.locked && hasTransform(l) && bounds.has(l.id));
    const current = candidates.find((l) => l.id === selectedRef.current);
    if (current && hitTest(bounds.get(current.id)!, x, y)) return current;
    for (let i = candidates.length - 1; i >= 0; i--) {
      const l = candidates[i]!;
      if (hitTest(bounds.get(l.id)!, x, y)) return l;
    }
    return undefined;
  };

  const beginDrag = (e: React.PointerEvent, mode: DragMode, layer: Layer) => {
    if (!hasTransform(layer) || layer.locked) return;
    const p = toStage(e);
    const b = bounds.get(layer.id);
    drag.current = {
      mode,
      layerId: layer.id,
      session: Date.now(),
      startX: p.x,
      startY: p.y,
      transform: { ...layer.transform },
      anchor: b ? { x: b.x, y: b.y } : { x: layer.transform.x * STAGE_W, y: layer.transform.y * STAGE_H },
    };
    surface.current?.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const p = toStage(e);
    const layer = pick(p.x, p.y);
    if (!layer) {
      select(null);
      return;
    }
    select(layer.id);
    beginDrag(e, "move", layer);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = toStage(e);
    const d = drag.current;
    if (!d) {
      const hit = pick(p.x, p.y);
      hoverId.current = hit?.id ?? null;
      if (surface.current) surface.current.style.cursor = hit ? "move" : "default";
      return;
    }
    const key = `drag:${d.layerId}:${d.session}`;
    if (d.mode === "move") {
      let x = d.transform.x * STAGE_W + (p.x - d.startX);
      let y = d.transform.y * STAGE_H + (p.y - d.startY);
      const snapX = !e.altKey && Math.abs(x - STAGE_W / 2) < SNAP;
      const snapY = !e.altKey && Math.abs(y - STAGE_H / 2) < SNAP;
      if (snapX) x = STAGE_W / 2;
      if (snapY) y = STAGE_H / 2;
      setGuides((g) => (g.x === snapX && g.y === snapY ? g : { x: snapX, y: snapY }));
      editorActions.updateLayer(d.layerId, { transform: { ...d.transform, x: x / STAGE_W, y: y / STAGE_H } } as Partial<Layer>, key);
    } else if (d.mode === "scale") {
      const d0 = Math.hypot(d.startX - d.anchor.x, d.startY - d.anchor.y) || 1;
      const d1 = Math.hypot(p.x - d.anchor.x, p.y - d.anchor.y);
      const scale = Math.min(6, Math.max(0.1, d.transform.scale * (d1 / d0)));
      editorActions.updateLayer(d.layerId, { transform: { ...d.transform, scale: Math.round(scale * 100) / 100 } } as Partial<Layer>, key);
    } else {
      const a0 = Math.atan2(d.startY - d.anchor.y, d.startX - d.anchor.x);
      const a1 = Math.atan2(p.y - d.anchor.y, p.x - d.anchor.x);
      let deg = d.transform.rotation + ((a1 - a0) * 180) / Math.PI;
      deg = ((((deg + 180) % 360) + 360) % 360) - 180;
      if (e.shiftKey) deg = Math.round(deg / 15) * 15;
      else if (Math.abs(deg) < 3) deg = 0;
      editorActions.updateLayer(d.layerId, { transform: { ...d.transform, rotation: Math.round(deg) } } as Partial<Layer>, key);
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    if (drag.current) surface.current?.releasePointerCapture(e.pointerId);
    drag.current = null;
    setDragging(false);
    setGuides({ x: false, y: false });
  };

  const handleDown = (mode: DragMode) => (e: React.PointerEvent) => {
    e.stopPropagation();
    if (selected) beginDrag(e, mode, selected);
  };

  return (
    <div
      ref={surface}
      className="absolute inset-0 touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => {
        if (!drag.current) hoverId.current = null;
      }}
      onDoubleClick={() => {
        if (selected?.kind === "text") window.dispatchEvent(new CustomEvent("vd:edit-text"));
      }}
    >
      {guides.x && <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-accent-pink/80 shadow-[0_0_8px_rgb(244_114_182)]" />}
      {guides.y && <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-accent-pink/80 shadow-[0_0_8px_rgb(244_114_182)]" />}

      <div ref={hoverBox} className="pointer-events-none absolute left-0 top-0 hidden origin-top-left rounded-[3px] border border-white/40" />

      <div
        ref={box}
        className={cn(
          "pointer-events-none absolute left-0 top-0 hidden origin-top-left rounded-[3px] border",
          locked ? "border-white/40 border-dashed" : "border-accent-soft shadow-[0_0_0_1px_rgb(0_0_0/0.4),0_0_18px_rgb(139_92_246/0.45)]",
        )}
      >
        {selected && !locked && !dragging && (
          <span className="absolute -top-6 left-0 whitespace-nowrap rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
            {selected.name}
          </span>
        )}
        {locked && (
          <span className="absolute -top-6 left-0 flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] text-white">
            <Lock className="h-2.5 w-2.5" /> Locked
          </span>
        )}
        {!locked && selected && (
          <>
            {(["nw", "ne", "sw", "se"] as const).map((corner) => (
              <span
                key={corner}
                onPointerDown={handleDown("scale")}
                className={cn(
                  "pointer-events-auto absolute h-2.5 w-2.5 rounded-[2px] border border-accent-soft bg-white shadow",
                  corner === "nw" && "-left-[5px] -top-[5px] cursor-nwse-resize",
                  corner === "ne" && "-right-[5px] -top-[5px] cursor-nesw-resize",
                  corner === "sw" && "-bottom-[5px] -left-[5px] cursor-nesw-resize",
                  corner === "se" && "-bottom-[5px] -right-[5px] cursor-nwse-resize",
                )}
                title="Drag to resize"
              />
            ))}
            <span className="absolute -top-7 left-1/2 h-5 w-px -translate-x-1/2 bg-accent-soft/70" />
            <span
              onPointerDown={handleDown("rotate")}
              className="pointer-events-auto absolute -top-9 left-1/2 h-3 w-3 -translate-x-1/2 cursor-grab rounded-full border border-accent-soft bg-white shadow"
              title="Drag to rotate (Shift snaps to 15°)"
            />
          </>
        )}
      </div>
    </div>
  );
}
