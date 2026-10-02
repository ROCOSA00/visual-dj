"use client";

import { AlertTriangle, Database, Gauge, GraduationCap, Keyboard, Monitor, MonitorPlay, Palette, RotateCcw, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShortcutList } from "@/components/shortcuts/ShortcutList";
import { Button } from "@/components/ui/Button";
import { Segmented, Slider, TextInput, Toggle } from "@/components/ui/controls";
import { Badge } from "@/components/ui/misc";
import { Modal } from "@/components/ui/Modal";
import { brand } from "@/config/brand";
import { EDITOR_SHORTCUTS, SHOW_SHORTCUTS } from "@/data/shortcuts";
import { useMounted } from "@/hooks/useMounted";
import { mediaStore } from "@/services/media/mediaStore";
import { sortedProjects, useProjectsStore } from "@/store/projects";
import { useSettingsStore, type RenderQuality, type Resolution, type ShowTransition } from "@/store/settings";
import { toast } from "@/store/toasts";

const SECTIONS = [
  { id: "interface", label: "Interface", icon: Palette },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "resolution", label: "Default resolution", icon: Monitor },
  { id: "show", label: "Show controls", icon: MonitorPlay },
  { id: "shortcuts", label: "Keyboard shortcuts", icon: Keyboard },
  { id: "tutorial", label: "Tutorial", icon: GraduationCap },
  { id: "data", label: "Data & storage", icon: Database },
];

export default function SettingsPage() {
  const mounted = useMounted();
  const s = useSettingsStore();
  const projects = useProjectsStore((st) => st.projects);
  const router = useRouter();
  const [confirmWipe, setConfirmWipe] = useState(false);
  const latest = sortedProjects(projects)[0];

  const restartTutorial = () => {
    s.update({ tutorialCompleted: false });
    toast({
      title: "Tutorial reset",
      description: latest ? "It will start as soon as you open the editor." : "It will start the next time you open the editor.",
      tone: "success",
      action: latest ? { label: "Open editor", onClick: () => router.push(`/editor/${latest.id}`) } : undefined,
    });
  };

  const wipe = async () => {
    const ids = Object.keys(useProjectsStore.getState().projects);
    for (const id of ids) await useProjectsStore.getState().deleteProject(id);
    const assets = await mediaStore.list().catch(() => []);
    for (const a of assets) await mediaStore.remove(a.ref.assetId);
    s.reset();
    setConfirmWipe(false);
    toast({ title: "All local data deleted", tone: "info" });
  };

  if (!mounted) return <div className="min-h-dvh" />;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 pb-24 pt-8 sm:px-8 lg:pt-10">
      <header>
        <p className="label">Preferences</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1.5 text-sm text-muted">Tune the studio and Show Mode to your setup. Changes save instantly.</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[200px_1fr]">
        <nav className="hidden lg:block" aria-label="Settings sections">
          <ul className="sticky top-8 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <a href={`#${id}`} className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] text-muted transition-colors hover:bg-white/[0.04] hover:text-ink">
                  <Icon className="h-4 w-4" /> {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          <Card id="interface" title="Interface" icon={<Palette className="h-4 w-4" />}>
            <Row label="Default artist name" description="Pre-fills new projects. This is not an account, just a local preference.">
              <div className="w-full sm:w-64">
                <TextInput value={s.defaultArtistName} onChange={(v) => s.update({ defaultArtistName: v })} placeholder="e.g. NOVA KAI" maxLength={40} ariaLabel="Default artist name" />
              </div>
            </Row>
            <Row label="Show tooltips" description="Helpful hints when hovering buttons and controls.">
              <Toggle checked={s.showTooltips} onChange={(v) => s.update({ showTooltips: v })} />
            </Row>
            <Row label="Reduce interface motion" description="Calmer panel and page transitions. Your visuals are not affected.">
              <Toggle checked={s.reduceUiMotion} onChange={(v) => s.update({ reduceUiMotion: v })} />
            </Row>
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-white/10 p-3.5 text-xs text-subtle">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0" />
              Sign-in, DJ profiles and cloud sync are coming soon. Account settings will appear here.
            </div>
          </Card>

          <Card id="performance" title="Performance" icon={<Gauge className="h-4 w-4" />}>
            <Row label="Render quality" description="Lower quality renders fewer pixels and particles. Use it on older laptops.">
              <Segmented<RenderQuality>
                value={s.renderQuality}
                onChange={(v) => s.update({ renderQuality: v })}
                options={[
                  { value: "high", label: "High" },
                  { value: "balanced", label: "Balanced" },
                  { value: "performance", label: "Battery saver" },
                ]}
                ariaLabel="Render quality"
                className="w-full sm:w-[300px]"
              />
            </Row>
            <Row label="Frame rate limit" description="60 fps is smoothest. 30 fps halves GPU work.">
              <Segmented<number>
                value={s.maxFps}
                onChange={(v) => s.update({ maxFps: v as 30 | 60 })}
                options={[
                  { value: 30, label: "30 fps" },
                  { value: 60, label: "60 fps" },
                ]}
                ariaLabel="Frame rate"
                className="w-full sm:w-[180px]"
              />
            </Row>
            <Row label="Animated thumbnails" description="Template and scene previews play their animation.">
              <Toggle checked={s.animateThumbnails} onChange={(v) => s.update({ animateThumbnails: v })} />
            </Row>
          </Card>

          <Card id="resolution" title="Default resolution" icon={<Monitor className="h-4 w-4" />}>
            <Row label="Export resolution" description="Used for image and video exports. Show Mode always matches your screen.">
              <Segmented<Resolution>
                value={s.defaultResolution}
                onChange={(v) => s.update({ defaultResolution: v })}
                options={[
                  { value: "1280x720", label: "720p" },
                  { value: "1920x1080", label: "1080p" },
                  { value: "2560x1440", label: "1440p" },
                  { value: "3840x2160", label: "4K" },
                ]}
                ariaLabel="Default resolution"
                className="w-full sm:w-[300px]"
              />
            </Row>
          </Card>

          <Card id="show" title="Show controls" icon={<MonitorPlay className="h-4 w-4" />}>
            <Row label="Default transition" description="How scenes change when you switch during a show.">
              <Segmented<ShowTransition>
                value={s.showTransition}
                onChange={(v) => s.update({ showTransition: v })}
                options={[
                  { value: "cut", label: "Cut" },
                  { value: "fade", label: "Crossfade" },
                  { value: "flash", label: "Flash" },
                ]}
                ariaLabel="Default transition"
                className="w-full sm:w-[260px]"
              />
            </Row>
            <Row label="Transition length">
              <div className="w-full sm:w-64">
                <Slider label="Duration" value={s.showTransitionDuration} min={0.2} max={3} step={0.1} unit=" s" onChange={(v) => s.update({ showTransitionDuration: v })} defaultValue={0.6} decimals={1} />
              </div>
            </Row>
            <Row label="Auto-hide controls" description="Controls fade away after the mouse stops moving.">
              <div className="w-full sm:w-64">
                <Slider label="Hide after" value={s.showAutoHideDelay} min={1} max={10} step={0.5} unit=" s" onChange={(v) => s.update({ showAutoHideDelay: v })} defaultValue={3} decimals={1} />
              </div>
            </Row>
            <Row label="Scene name on switch" description="Briefly shows the scene name in the controller (never when controls are hidden).">
              <Toggle checked={s.showSceneLabel} onChange={(v) => s.update({ showSceneLabel: v })} />
            </Row>
            <Row
              label={
                <span className="flex items-center gap-2">
                  Reduce flashing <Badge tone="soon">Safety</Badge>
                </span>
              }
              description="Caps strobe, beat flash and flash transitions. Recommended for public events: strobes can trigger photosensitive epilepsy."
            >
              <Toggle checked={s.reduceFlashing} onChange={(v) => s.update({ reduceFlashing: v })} />
            </Row>
          </Card>

          <Card id="shortcuts" title="Keyboard shortcuts" icon={<Keyboard className="h-4 w-4" />}>
            <ShortcutList groups={[...EDITOR_SHORTCUTS, ...SHOW_SHORTCUTS]} />
          </Card>

          <Card id="tutorial" title="Tutorial" icon={<GraduationCap className="h-4 w-4" />}>
            <Row label="Restart tutorial" description="Walk through the studio again, step by step.">
              <Button variant="secondary" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={restartTutorial}>
                Restart tutorial
              </Button>
            </Row>
          </Card>

          <Card id="data" title="Data & storage" icon={<Database className="h-4 w-4" />}>
            <Row label="Local workspace" description={`${Object.keys(projects).length} projects saved in this browser. Uploads are stored separately on this device.`}>
              <Badge>{brand.name} {brand.version}</Badge>
            </Row>
            <Row label="Reset settings" description="Restore every preference on this page to its default.">
              <Button variant="ghost" size="sm" onClick={() => s.reset()}>
                Reset settings
              </Button>
            </Row>
            <Row label="Delete all local data" description="Removes every project, upload and preference from this browser.">
              <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setConfirmWipe(true)}>
                Delete everything
              </Button>
            </Row>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmWipe}
        onClose={() => setConfirmWipe(false)}
        title="Delete all local data?"
        description="This removes every project, uploaded logo, image and video, and all preferences from this browser. It can't be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmWipe(false)}>
              Cancel
            </Button>
            <Button variant="danger" icon={<AlertTriangle className="h-4 w-4" />} onClick={() => void wipe()}>
              Delete everything
            </Button>
          </>
        }
      >
        {null}
      </Modal>
    </div>
  );
}

function Card({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8 rounded-2xl border border-line bg-surface-1/70">
      <header className="flex items-center gap-2.5 border-b border-line px-5 py-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent-soft">{icon}</span>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </header>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

function Row({ label, description, children }: { label: React.ReactNode; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 max-w-md text-xs leading-relaxed text-muted">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
