"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy, Eye, EyeOff, Lock, Trash2, Unlock, X } from "lucide-react";
import { InlineEdit } from "@/components/ui/controls";
import { IconButton, Section } from "@/components/ui/misc";
import { LAYER_KIND_LABELS } from "@/domain/catalog";
import type { Layer } from "@/domain/types";
import { useEditorStore } from "@/store/editor";
import { editorActions } from "@/store/editorActions";
import { useSelectedLayer } from "../hooks";
import { LAYER_ICONS } from "../icons";
import { FieldRenderer } from "./fields";
import { SCHEMAS } from "./layerSchemas";
import { ScenePanel } from "./ScenePanel";

export function PropertiesPanel() {
  const layer = useSelectedLayer();
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-tour="properties">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={layer ? `${layer.kind}:${layer.id}` : "scene"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.14 }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {layer ? <LayerProperties layer={layer} /> : <ScenePanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function LayerProperties({ layer }: { layer: Layer }) {
  const select = useEditorStore((s) => s.select);
  const Icon = LAYER_ICONS[layer.kind];
  const sections = SCHEMAS[layer.kind];
  const update = (patch: Partial<Layer>, key?: string) => editorActions.updateLayer(layer.id, patch, key);

  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/15 text-accent-soft">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <InlineEdit
            value={layer.name}
            onCommit={(name) => editorActions.renameLayer(layer.id, name)}
            className="block w-full text-[13px] font-semibold text-ink"
            inputClassName="h-6 w-full text-[13px]"
            ariaLabel="Layer name"
          />
          <p className="text-2xs text-subtle">{layer.kind === "text" && layer.role === "artist" ? "Artist name" : LAYER_KIND_LABELS[layer.kind]}</p>
        </div>
        <div className="flex items-center">
          <IconButton size="sm" label={layer.visible ? "Hide" : "Show"} onClick={() => editorActions.toggleVisible(layer.id)}>
            {layer.visible ? <Eye /> : <EyeOff />}
          </IconButton>
          <IconButton size="sm" label={layer.locked ? "Unlock" : "Lock"} onClick={() => editorActions.toggleLocked(layer.id)}>
            {layer.locked ? <Lock /> : <Unlock />}
          </IconButton>
          <IconButton size="sm" label="Duplicate layer" onClick={() => editorActions.duplicateLayer(layer.id)}>
            <Copy />
          </IconButton>
          <IconButton size="sm" label="Delete layer" shortcut="Del" onClick={() => editorActions.removeLayer(layer.id)} className="hover:!text-danger">
            <Trash2 />
          </IconButton>
          <IconButton size="sm" label="Close (back to scene)" shortcut="Esc" onClick={() => select(null)}>
            <X />
          </IconButton>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {layer.locked && (
          <p className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-2xs text-muted">
            <Lock className="h-3 w-3" /> This layer is locked on the canvas. You can still edit it here.
          </p>
        )}
        {sections.map((section) => (
          <Section key={`${layer.kind}-${section.id}`} title={section.title} defaultOpen={section.defaultOpen ?? true}>
            {section.fields.map((field, i) => (
              <FieldRenderer key={`${section.id}-${i}`} field={field} layer={layer} update={update} />
            ))}
          </Section>
        ))}
      </div>
    </>
  );
}
