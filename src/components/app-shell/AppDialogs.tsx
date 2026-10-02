"use client";

import { ArrowRight, Check, MonitorPlay, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShortcutList } from "@/components/shortcuts/ShortcutList";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TextInput, Toggle } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/misc";
import { Modal } from "@/components/ui/Modal";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import { EDITOR_SHORTCUTS, SHOW_SHORTCUTS } from "@/data/shortcuts";
import { DEFAULT_TEMPLATE_ID, TEMPLATE_MAP, TEMPLATES } from "@/data/templates";
import { templatePreviewScene } from "@/domain/templates";
import { cn, formatRelativeTime } from "@/lib/utils";
import { sortedProjects, useProjectsStore } from "@/store/projects";
import { useSettingsStore } from "@/store/settings";
import { useAppUi } from "./appUi";

const QUICK_LOOKS = ["signature", "neon-district", "warehouse-pulse", "sunset-boulevard", "main-stage", "outrun-86"];

export function CreateVisualDialog() {
  const open = useAppUi((s) => s.createOpen);
  const preset = useAppUi((s) => s.createTemplateId);
  const close = useAppUi((s) => s.closeCreate);
  const defaultArtist = useSettingsStore((s) => s.defaultArtistName);
  const updateSettings = useSettingsStore((s) => s.update);
  const createFromTemplate = useProjectsStore((s) => s.createFromTemplate);
  const router = useRouter();
  const [artist, setArtist] = useState("");
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setArtist(defaultArtist);
    setName("");
    setTemplateId(preset ?? DEFAULT_TEMPLATE_ID);
    setBusy(false);
  }, [open, preset, defaultArtist]);

  const looks = preset && !QUICK_LOOKS.includes(preset) ? [preset, ...QUICK_LOOKS.slice(0, 5)] : QUICK_LOOKS;
  const template = TEMPLATE_MAP[templateId] ?? TEMPLATES[0]!;

  const create = () => {
    setBusy(true);
    if (remember && artist.trim()) updateSettings({ defaultArtistName: artist.trim() });
    const project = createFromTemplate(template, { artistName: artist || "Your Name", name });
    router.push(`/editor/${project.id}`);
    setTimeout(close, 150);
  };

  return (
    <Modal open={open} onClose={close} title="Create a new visual" description="Every visual starts as a ready-to-play, five-scene show set." size="lg">
      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted" htmlFor="create-artist">
              Artist name
            </label>
            <TextInput value={artist} onChange={setArtist} placeholder="e.g. NOVA KAI" maxLength={40} ariaLabel="Artist name" autoFocus onEnter={create} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Project name <span className="text-subtle">(optional)</span></label>
            <TextInput value={name} onChange={setName} placeholder={`${template.name} Set`} maxLength={60} ariaLabel="Project name" onEnter={create} />
          </div>
          <Toggle checked={remember} onChange={setRemember} label="Use this name for new projects" description="You can change it any time in Settings." />
          <div className="overflow-hidden rounded-xl border border-line-strong bg-black">
            <div className="aspect-video">
              <VisualCanvas scene={templatePreviewScene(template)} artistName={artist || "YOUR NAME"} bpm={template.bpm} maxWidth={720} />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <p className="mb-2 text-xs font-medium text-muted">Pick a starting look</p>
          <div className="grid grid-cols-2 gap-2.5">
            {looks.map((id) => {
              const t = TEMPLATE_MAP[id];
              if (!t) return null;
              const active = id === templateId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTemplateId(id)}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border text-left transition-all",
                    active ? "border-transparent shadow-[0_0_0_2px_rgb(167_139_250),0_0_20px_-4px_rgb(139_92_246/0.8)]" : "border-line hover:border-white/25",
                  )}
                >
                  <div className="aspect-video bg-black">
                    <VisualCanvas scene={templatePreviewScene(t)} artistName={artist || "YOUR NAME"} bpm={t.bpm} fps={24} maxWidth={320} thumbnail quality={0.5} />
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-2">
                    <span className="truncate text-xs font-medium text-ink">{t.name}</span>
                    {active && <Check className="h-3.5 w-3.5 text-accent-soft" />}
                  </div>
                </button>
              );
            })}
          </div>
          <Link href="/templates" onClick={close} className="mt-3 flex items-center gap-1 text-xs font-medium text-accent-soft hover:underline">
            Browse all {TEMPLATES.length} templates <ArrowRight className="h-3 w-3" />
          </Link>
          <div className="mt-auto flex justify-end gap-2 pt-6">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" loading={busy} icon={!busy ? <Sparkles className="h-4 w-4" /> : undefined} onClick={create}>
              Create visual
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function ShowPickerDialog() {
  const open = useAppUi((s) => s.showPickerOpen);
  const close = useAppUi((s) => s.closeShowPicker);
  const openCreate = useAppUi((s) => s.openCreate);
  const projects = useProjectsStore((s) => s.projects);
  const router = useRouter();
  const list = sortedProjects(projects);

  return (
    <Modal open={open} onClose={close} title="Go live" description="Pick a show to open in fullscreen Show Mode." size="md">
      {list.length === 0 ? (
        <EmptyState
          compact
          icon={<MonitorPlay />}
          title="No shows yet"
          description="Create a visual first. It comes with five scenes, ready to perform."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                close();
                openCreate();
              }}
            >
              Create visual
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {list.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  close();
                  router.push(`/show/${p.id}`);
                }}
                className="group flex w-full items-center gap-3 rounded-xl border border-line p-2 text-left transition-all hover:border-white/25 hover:bg-white/[0.03]"
              >
                <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-black">
                  {p.scenes[0] && <VisualCanvas scene={p.scenes[0]} artistName={p.artistName} bpm={p.bpm} fps={20} maxWidth={200} thumbnail quality={0.4} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-muted">
                    {p.scenes.length} scenes · edited {formatRelativeTime(p.updatedAt)}
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-live/15 text-live transition-all group-hover:bg-live group-hover:text-white">
                  <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export function AppShortcutsDialog() {
  const open = useAppUi((s) => s.shortcutsOpen);
  const close = useAppUi((s) => s.closeShortcuts);
  return (
    <Modal open={open} onClose={close} title="Keyboard shortcuts" size="lg">
      <ShortcutList groups={[...EDITOR_SHORTCUTS, ...SHOW_SHORTCUTS]} />
      <div className="mt-6 flex justify-end">
        <ButtonLink href="/settings" variant="ghost" size="sm" onClick={close}>
          Open settings
        </ButtonLink>
      </div>
    </Modal>
  );
}
