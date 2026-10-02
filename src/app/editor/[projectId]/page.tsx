"use client";

import { FileQuestion } from "lucide-react";
import { useParams } from "next/navigation";
import { EditorGate, EditorLoading } from "@/components/editor/EditorGate";
import { EditorShell } from "@/components/editor/EditorShell";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/misc";
import { useProjectsStore } from "@/store/projects";

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const hydrated = useProjectsStore((s) => s.hydrated);
  const project = useProjectsStore((s) => s.projects[projectId]);

  if (!hydrated) return <EditorLoading />;
  if (!project) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg p-6">
        <EmptyState
          icon={<FileQuestion />}
          title="We couldn't find this visual"
          description="It may have been deleted, or it was created in another browser. Projects are stored locally for now."
          action={<ButtonLink href="/dashboard" variant="primary">Back to dashboard</ButtonLink>}
        />
      </div>
    );
  }
  return (
    <EditorGate project={project}>
      <EditorShell project={project} />
    </EditorGate>
  );
}
