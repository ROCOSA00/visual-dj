"use client";

import { ArrowLeft, Laptop, MonitorPlay } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import type { Project } from "@/domain/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/**
 * The editor is built for big screens. Phones get a friendly explanation and
 * a working Show Mode; tablets can choose to continue anyway.
 */
export function EditorGate({ project, children }: { project: Project; children: React.ReactNode }) {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const tablet = useMediaQuery("(min-width: 768px)");
  const [force, setForce] = useState(false);

  if (desktop === null) return <EditorLoading />;
  if (desktop || force) return <>{children}</>;

  const scene = project.scenes[0];
  return (
    <div className="flex min-h-dvh flex-col bg-bg px-5 py-6">
      <Logo href="/dashboard" size="sm" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 py-10 text-center">
        {scene && (
          <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-black shadow-pop">
            <div className="aspect-video">
              <VisualCanvas scene={scene} artistName={project.artistName} bpm={project.bpm} maxWidth={720} />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent-soft">
            <Laptop className="h-5 w-5" />
          </div>
          <h1 className="font-display text-xl font-semibold text-ink">The studio shines on a bigger screen</h1>
          <p className="text-sm leading-relaxed text-muted">
            Editing “{project.name}” works best on a laptop or desktop. You can still play your set right here in Show Mode.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <ButtonLink href={`/show/${project.id}`} variant="primary" size="lg" icon={<MonitorPlay className="h-4 w-4" />}>
            Open in Show Mode
          </ButtonLink>
          {tablet && (
            <Button variant="secondary" size="lg" onClick={() => setForce(true)}>
              Continue to the editor anyway
            </Button>
          )}
          <ButtonLink href="/dashboard" variant="ghost" icon={<ArrowLeft className="h-4 w-4" />}>
            Back to dashboard
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

export function EditorLoading({ label = "Loading your studio…" }: { label?: string }) {
  return (
    <div className="flex h-dvh flex-col bg-bg">
      <div className="flex h-14 items-center gap-3 border-b border-line px-4">
        <div className="h-7 w-7 animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="h-3 w-40 animate-pulse rounded bg-white/[0.06]" />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-ping rounded-2xl bg-accent/30" />
            <div className="relative h-12 w-12 rounded-2xl bg-brand-strong" />
          </div>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}
