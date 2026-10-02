"use client";

import { FileQuestion } from "lucide-react";
import { useParams } from "next/navigation";
import { EditorLoading } from "@/components/editor/EditorGate";
import { ShowMode } from "@/components/show/ShowMode";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/misc";
import { useProjectsStore } from "@/store/projects";

export default function ShowPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const hydrated = useProjectsStore((s) => s.hydrated);
  const project = useProjectsStore((s) => s.projects[projectId]);

  if (!hydrated) return <EditorLoading label="Warming up the stage…" />;
  if (!project) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg p-6">
        <EmptyState
          icon={<FileQuestion />}
          title="This show isn't here"
          description="The project may have been deleted or lives in another browser."
          action={<ButtonLink href="/dashboard" variant="primary">Back to dashboard</ButtonLink>}
        />
      </div>
    );
  }
  return <ShowMode project={project} />;
}
