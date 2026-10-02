"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { EditorLoading } from "@/components/editor/EditorGate";
import { DEFAULT_TEMPLATE_ID, TEMPLATE_MAP } from "@/data/templates";
import { useProjectsStore } from "@/store/projects";
import { useSettingsStore } from "@/store/settings";

/**
 * /new?template=<id>&name=<project name>
 * Creates a project from a template and opens it in the editor. Used by
 * every "Use template" / "Create visual" entry point.
 */
function NewProject() {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useProjectsStore((s) => s.hydrated);
  const done = useRef(false);

  useEffect(() => {
    if (!hydrated || done.current) return;
    done.current = true;
    const template = TEMPLATE_MAP[params.get("template") ?? ""] ?? TEMPLATE_MAP[DEFAULT_TEMPLATE_ID]!;
    const settings = useSettingsStore.getState();
    const project = useProjectsStore.getState().createFromTemplate(template, {
      artistName: params.get("artist") || settings.defaultArtistName || "Your Name",
      name: params.get("name") ?? undefined,
    });
    router.replace(`/editor/${project.id}`);
  }, [hydrated, params, router]);

  return <EditorLoading label="Setting up your stage…" />;
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<EditorLoading label="Setting up your stage…" />}>
      <NewProject />
    </Suspense>
  );
}
