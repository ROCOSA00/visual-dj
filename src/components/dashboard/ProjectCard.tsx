"use client";

import { Copy, MonitorPlay, MoreHorizontal, Pencil, PenLine, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { InlineEdit } from "@/components/ui/controls";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MenuList, Popover } from "@/components/ui/Popover";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import type { Project } from "@/domain/types";
import { formatRelativeTime } from "@/lib/utils";
import { useProjectsStore } from "@/store/projects";
import { toast } from "@/store/toasts";

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const { renameProject, duplicateProject, deleteProject } = useProjectsStore.getState();
  const scene = project.scenes[0];

  return (
    <article className="group/card">
      <Link
        href={`/editor/${project.id}`}
        className="relative block aspect-video overflow-hidden rounded-2xl border border-line bg-black transition-all duration-300 group-hover/card:-translate-y-1 group-hover/card:border-white/20 group-hover/card:shadow-[0_24px_60px_-24px_rgb(139_92_246/0.6)]"
        aria-label={`Open ${project.name}`}
      >
        {scene && <VisualCanvas scene={scene} artistName={project.artistName} bpm={project.bpm} fps={24} maxWidth={560} thumbnail quality={0.55} timeOffset={index * 2.1} />}
        <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/85 backdrop-blur">
          {project.scenes.length} scenes
        </span>
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover/card:opacity-100">
          <span className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-black">
            <PenLine className="h-3.5 w-3.5" /> Open editor
          </span>
        </span>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-2 px-0.5">
        <div className="min-w-0 flex-1">
          <InlineEdit
            value={project.name}
            editing={renaming}
            onEditingChange={setRenaming}
            onCommit={(name) => renameProject(project.id, name)}
            className="block w-full text-sm font-semibold text-ink"
            inputClassName="h-7 w-full text-sm"
            ariaLabel="Project name"
          />
          <p className="mt-0.5 truncate text-xs text-muted">
            {project.artistName} · edited {formatRelativeTime(project.updatedAt)}
          </p>
        </div>
        <button
          ref={menuBtn}
          type="button"
          onClick={() => setMenu((m) => !m)}
          aria-label={`${project.name} options`}
          className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-white/[0.06] hover:text-ink"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <Popover open={menu} onClose={() => setMenu(false)} anchor={menuBtn} align="end">
          <MenuList
            onClose={() => setMenu(false)}
            items={[
              { label: "Open editor", icon: <PenLine />, onSelect: () => router.push(`/editor/${project.id}`) },
              { label: "Launch Show Mode", icon: <MonitorPlay />, onSelect: () => router.push(`/show/${project.id}`) },
              "divider",
              { label: "Rename", icon: <Pencil />, onSelect: () => setRenaming(true) },
              {
                label: "Duplicate",
                icon: <Copy />,
                onSelect: () => {
                  const copy = duplicateProject(project.id);
                  if (copy) toast({ title: "Visual duplicated", description: copy.name });
                },
              },
              "divider",
              { label: "Delete", icon: <Trash2 />, danger: true, onSelect: () => setConfirm(true) },
            ]}
          />
        </Popover>
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete this visual?"
        description={`“${project.name}” and its ${project.scenes.length} scenes will be removed from this browser. This can't be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => {
                setConfirm(false);
                void deleteProject(project.id);
                toast({ title: "Visual deleted", tone: "info" });
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        {null}
      </Modal>
    </article>
  );
}
