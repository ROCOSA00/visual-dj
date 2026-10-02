"use client";

import { motion } from "framer-motion";
import { ArrowRight, LayoutTemplate, MonitorPlay, PenLine, Play, Plus, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAppUi } from "@/components/app-shell/appUi";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { GenreTile } from "@/components/templates/GenreTile";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplatePreviewModal } from "@/components/templates/TemplatePreviewModal";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/misc";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import { GENRES } from "@/data/genres";
import { TEMPLATE_MAP, TEMPLATES } from "@/data/templates";
import { templatePreviewScene, type TemplateDefinition } from "@/domain/templates";
import { useMounted } from "@/hooks/useMounted";
import { formatRelativeTime, getGreeting } from "@/lib/utils";
import { createDemoProjects } from "@/services/projects/demo";
import { sortedProjects, useProjectsStore } from "@/store/projects";
import { useSettingsStore } from "@/store/settings";
import { toast } from "@/store/toasts";

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
});

export default function DashboardPage() {
  const mounted = useMounted();
  const hydrated = useProjectsStore((s) => s.hydrated);
  const projects = useProjectsStore((s) => s.projects);
  const artist = useSettingsStore((s) => s.defaultArtistName);
  const openCreate = useAppUi((s) => s.openCreate);
  const openShow = useAppUi((s) => s.openShowPicker);
  const router = useRouter();
  const [preview, setPreview] = useState<TemplateDefinition | null>(null);
  const list = useMemo(() => sortedProjects(projects), [projects]);
  const latest = list[0];
  const recommended = useMemo(() => TEMPLATES.filter((t) => t.featured).slice(0, 4), []);
  const displayArtist = (mounted && artist) || "YOUR NAME";

  const loadDemo = () => {
    const add = useProjectsStore.getState().addProject;
    createDemoProjects(artist || "NOVA KAI").forEach((p) => add(p));
    toast({ title: "Demo shows loaded", description: "Three complete sets are ready to explore." });
  };

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 pb-20 pt-8 sm:px-8 lg:pt-10">
      {/* Header */}
      <motion.header {...fadeUp(0)} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{mounted ? getGreeting() : "Welcome"}{mounted && artist ? `, ${artist}` : ""}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink sm:text-[34px]">
            Ready to light up <span className="text-gradient animate-gradient-pan">tonight&apos;s set?</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<MonitorPlay className="h-4 w-4" />} onClick={openShow}>
            Show Mode
          </Button>
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => openCreate()}>
            Create visual
          </Button>
        </div>
      </motion.header>

      {/* Hero: continue or empty stage */}
      <motion.section {...fadeUp(1)} className="mt-8">
        {!hydrated ? (
          <Skeleton className="h-[300px] rounded-3xl" />
        ) : latest ? (
          <ContinueCard projectId={latest.id} />
        ) : (
          <EmptyStage onCreate={() => openCreate()} onDemo={loadDemo} artist={displayArtist} />
        )}
      </motion.section>

      {/* Quick actions */}
      <motion.section {...fadeUp(2)} className="mt-6 grid gap-3 sm:grid-cols-3">
        <QuickAction
          icon={<Wand2 className="h-5 w-5" />}
          title="Quick start"
          description="Our signature look, ready in one click"
          onClick={() => router.push(`/new?template=signature`)}
        />
        <QuickAction
          icon={<LayoutTemplate className="h-5 w-5" />}
          title="Browse templates"
          description={`${TEMPLATES.length} looks across 10 genres`}
          onClick={() => router.push("/templates")}
        />
        <QuickAction icon={<MonitorPlay className="h-5 w-5" />} title="Go live" description="Open any show in fullscreen Show Mode" onClick={openShow} live />
      </motion.section>

      {/* Your visuals */}
      <motion.section {...fadeUp(3)} className="mt-14">
        <SectionHeader title="Your visuals" subtitle={hydrated && list.length ? `${list.length} ${list.length === 1 ? "show" : "shows"} saved in this browser` : undefined} />
        {!hydrated ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video rounded-2xl" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
            <p className="text-sm text-muted">Visuals you create will appear here.</p>
            <button type="button" onClick={loadDemo} className="mt-2 text-sm font-semibold text-accent-soft hover:underline">
              Load demo shows to explore
            </button>
          </div>
        ) : (
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
            <button
              type="button"
              onClick={() => openCreate()}
              className="group flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 text-muted transition-all hover:-translate-y-1 hover:border-accent/50 hover:bg-accent/[0.05] hover:text-ink"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] transition-colors group-hover:bg-accent/20 group-hover:text-accent-soft">
                <Plus className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold">New visual</span>
            </button>
          </div>
        )}
      </motion.section>

      {/* Recommended templates */}
      <motion.section {...fadeUp(4)} className="mt-16">
        <SectionHeader
          title="Recommended for you"
          subtitle="Crowd favourites from the library"
          action={
            <ButtonLink href="/templates" variant="ghost" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
              All templates
            </ButtonLink>
          }
        />
        <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
          {recommended.map((t, i) => (
            <TemplateCard
              key={t.id}
              template={t}
              index={i}
              artistName={displayArtist}
              onPreview={() => setPreview(t)}
              onUse={() => openCreate(t.id)}
            />
          ))}
        </div>
      </motion.section>

      {/* Genres */}
      <motion.section {...fadeUp(5)} className="mt-16">
        <SectionHeader title="Browse by genre" subtitle="Find a look that matches your sound" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {GENRES.map((g) => (
            <GenreTile key={g.id} genre={g} count={TEMPLATES.filter((t) => t.category === g.id).length} />
          ))}
        </div>
      </motion.section>

      <TemplatePreviewModal
        template={preview}
        artistName={displayArtist}
        onClose={() => setPreview(null)}
        onUse={(t) => {
          setPreview(null);
          openCreate(t.id);
        }}
      />
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onClick,
  live,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  live?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-line bg-surface-1/70 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-surface-2"
    >
      <span
        className={
          live
            ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-live/15 text-live transition-all group-hover:bg-live group-hover:text-white group-hover:shadow-[0_0_24px_rgb(255_59_92/0.6)]"
            : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-soft transition-all group-hover:bg-brand-strong group-hover:text-white group-hover:shadow-[0_0_24px_rgb(139_92_246/0.6)]"
        }
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block truncate text-xs text-muted">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-subtle transition-all group-hover:translate-x-0.5 group-hover:text-ink" />
    </button>
  );
}

function ContinueCard({ projectId }: { projectId: string }) {
  const project = useProjectsStore((s) => s.projects[projectId]);
  const [sceneIdx, setSceneIdx] = useState(0);
  if (!project) return null;
  const scene = project.scenes[sceneIdx] ?? project.scenes[0];
  const template = TEMPLATE_MAP[project.templateId ?? ""];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-surface-1">
      <div className="grid lg:grid-cols-[1.55fr_1fr]">
        <Link href={`/editor/${project.id}`} className="group relative block aspect-video overflow-hidden bg-black lg:aspect-auto lg:min-h-[320px]">
          {scene && <VisualCanvas scene={scene} artistName={project.artistName} bpm={project.bpm} maxWidth={1280} className="absolute inset-0" />}
          <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-2xs font-semibold text-white backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-live" /> {scene?.name}
          </span>
        </Link>
        <div className="relative flex flex-col p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl" style={{ background: `${project.palette[0] ?? "#8b5cf6"}33` }} />
          <p className="label">Continue where you left off</p>
          <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink">{project.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {project.artistName} · {project.scenes.length} scenes · {Math.round(project.bpm)} BPM · edited {formatRelativeTime(project.updatedAt)}
          </p>
          {template && <p className="mt-1 text-xs text-subtle">Based on {template.name}</p>}
          <div className="mt-5 flex flex-wrap gap-1.5">
            {project.scenes.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSceneIdx(i)}
                className={
                  i === sceneIdx
                    ? "rounded-full bg-white px-3 py-1 text-xs font-semibold text-black"
                    : "rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
                }
              >
                {i + 1} · {s.name}
              </button>
            ))}
          </div>
          <div className="mt-auto flex flex-wrap gap-2 pt-8">
            <ButtonLink href={`/editor/${project.id}`} variant="primary" icon={<PenLine className="h-4 w-4" />}>
              Open editor
            </ButtonLink>
            <ButtonLink href={`/show/${project.id}`} variant="secondary" icon={<Play className="h-4 w-4" fill="currentColor" />}>
              Launch show
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyStage({ onCreate, onDemo, artist }: { onCreate: () => void; onDemo: () => void; artist: string }) {
  const scene = useMemo(() => templatePreviewScene(TEMPLATE_MAP.signature!), []);
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-black">
      <div className="absolute inset-0 opacity-45">
        <VisualCanvas scene={scene} artistName={artist} bpm={124} maxWidth={1280} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
      <div className="relative flex min-h-[320px] max-w-xl flex-col justify-center gap-4 p-8 sm:p-12">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-accent-soft backdrop-blur">
          <Sparkles className="h-6 w-6" />
        </span>
        <h2 className="font-display text-3xl font-semibold text-white">Your stage is empty</h2>
        <p className="text-base text-white/70">Create your first visual and bring your show to life.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" icon={<Plus className="h-4 w-4" />} onClick={onCreate}>
            Create visual
          </Button>
          <button type="button" onClick={onDemo} className="text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline">
            or load demo shows
          </button>
        </div>
      </div>
    </div>
  );
}
