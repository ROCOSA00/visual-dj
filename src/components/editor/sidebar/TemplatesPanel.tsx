"use client";

import { Plus, Replace, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import { GENRE_MAP } from "@/data/genres";
import { TEMPLATES } from "@/data/templates";
import { templatePreviewScene, type TemplateDefinition } from "@/domain/templates";
import { editorClock } from "@/store/editor";
import { editorActions } from "@/store/editorActions";
import { toast } from "@/store/toasts";
import { useActiveProject } from "../hooks";

export function TemplatesPanel() {
  const project = useActiveProject();
  const [query, setQuery] = useState("");
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TEMPLATES;
    return TEMPLATES.filter((t) =>
      [t.name, t.category, t.style, t.motion, t.description].some((v) => v.toLowerCase().includes(q)),
    );
  }, [query]);

  const replace = (t: TemplateDefinition) => {
    editorActions.replaceSceneLayers(t.build());
    toast({ title: `Scene now uses ${t.name}`, tone: "success", action: { label: "Undo", onClick: () => editorActions.undo() } });
  };
  const addScene = (t: TemplateDefinition) => {
    editorActions.addScene("duplicate", t.build(), t.name);
    toast({ title: `Added "${t.name}" as a new scene`, tone: "success" });
  };

  return (
    <div className="space-y-3">
      <label className="flex h-9 items-center gap-2 rounded-lg border border-line bg-black/30 px-2.5 focus-within:border-accent/60">
        <Search className="h-3.5 w-3.5 text-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-subtle"
          aria-label="Search templates"
        />
      </label>
      {list.length === 0 && <p className="py-6 text-center text-xs text-subtle">No templates match “{query}”.</p>}
      <div className="space-y-3">
        {list.map((t) => (
          <div key={t.id} className="group/tpl">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-black transition-all group-hover/tpl:border-white/25">
              <VisualCanvas
                scene={templatePreviewScene(t)}
                artistName={project?.artistName || "YOUR NAME"}
                bpm={t.bpm}
                clock={editorClock}
                fps={24}
                maxWidth={320}
                thumbnail
                quality={0.6}
              />
              <div className="absolute inset-0 flex items-end gap-1.5 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-2 opacity-0 transition-opacity group-hover/tpl:opacity-100 group-focus-within/tpl:opacity-100">
                <button
                  type="button"
                  onClick={() => replace(t)}
                  className="flex h-7 flex-1 items-center justify-center gap-1 rounded-md bg-white text-[11px] font-semibold text-black hover:bg-white/90"
                >
                  <Replace className="h-3 w-3" /> Use in scene
                </button>
                <button
                  type="button"
                  onClick={() => addScene(t)}
                  className="flex h-7 flex-1 items-center justify-center gap-1 rounded-md bg-white/15 text-[11px] font-semibold text-white backdrop-blur hover:bg-white/25"
                >
                  <Plus className="h-3 w-3" /> New scene
                </button>
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between px-0.5">
              <span className="text-xs font-medium text-ink">{t.name}</span>
              <span className="text-2xs text-subtle">{GENRE_MAP[t.category].label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
