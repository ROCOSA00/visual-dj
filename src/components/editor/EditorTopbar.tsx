"use client";

import { ChevronLeft, CircleHelp, Download, GraduationCap, Keyboard, Play, Redo2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { InlineEdit } from "@/components/ui/controls";
import { Badge, IconButton } from "@/components/ui/misc";
import { MenuList, Popover } from "@/components/ui/Popover";
import { Tooltip } from "@/components/ui/Tooltip";
import { getTemplate } from "@/data/templates";
import { shortcut } from "@/lib/keys";
import { useEditorStore } from "@/store/editor";
import { editorActions } from "@/store/editorActions";
import { useActiveProject } from "./hooks";
import { SaveIndicator } from "./SaveIndicator";

export function EditorTopbar() {
  const project = useActiveProject();
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const setModal = useEditorStore((s) => s.setModal);
  const startTour = useEditorStore((s) => s.startTour);
  const router = useRouter();
  const [help, setHelp] = useState(false);
  const helpBtn = useRef<HTMLButtonElement>(null);
  if (!project) return null;
  const template = getTemplate(project.templateId);

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface-1 px-3">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="flex min-w-0 items-center gap-2">
        <Tooltip content="Back to dashboard" side="bottom">
          <Link href="/dashboard" className="group flex items-center gap-1 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-white/[0.05]" aria-label="Back to dashboard">
            <ChevronLeft className="h-4 w-4 text-subtle transition-transform group-hover:-translate-x-0.5 group-hover:text-ink" />
            <LogoMark className="h-7 w-7" />
          </Link>
        </Tooltip>
        <div className="mx-1 h-6 w-px bg-line" />
        <div className="min-w-0">
          <Tooltip content="Double-click to rename" side="bottom">
            <div>
              <InlineEdit
                value={project.name}
                onCommit={(name) => editorActions.renameProject(name)}
                className="max-w-[260px] rounded-md px-1.5 py-0.5 text-[13px] font-semibold text-ink hover:bg-white/[0.05]"
                inputClassName="h-7 w-[260px] text-[13px] font-semibold"
                ariaLabel="Project name"
              />
            </div>
          </Tooltip>
          <div className="flex items-center gap-2 px-1.5">
            {template && <span className="truncate text-[10px] text-subtle">Based on {template.name}</span>}
          </div>
        </div>
        <div className="ml-1 hidden lg:block">
          <SaveIndicator />
        </div>
      </div>

      <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 xl:flex">
        <IconButton label="Undo" shortcut={shortcut("mod", "Z")} disabled={!canUndo} onClick={() => editorActions.undo()} tooltipSide="bottom">
          <Undo2 />
        </IconButton>
        <IconButton label="Redo" shortcut={shortcut("mod", "⇧", "Z")} disabled={!canRedo} onClick={() => editorActions.redo()} tooltipSide="bottom">
          <Redo2 />
        </IconButton>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <div className="flex items-center xl:hidden">
          <IconButton label="Undo" disabled={!canUndo} onClick={() => editorActions.undo()} tooltipSide="bottom">
            <Undo2 />
          </IconButton>
          <IconButton label="Redo" disabled={!canRedo} onClick={() => editorActions.redo()} tooltipSide="bottom">
            <Redo2 />
          </IconButton>
        </div>
        <IconButton ref={helpBtn} label="Help" tooltipSide="bottom" onClick={() => setHelp((h) => !h)}>
          <CircleHelp />
        </IconButton>
        <Popover open={help} onClose={() => setHelp(false)} anchor={helpBtn} align="end">
          <MenuList
            onClose={() => setHelp(false)}
            items={[
              { label: "Restart tutorial", icon: <GraduationCap />, onSelect: startTour },
              { label: "Keyboard shortcuts", icon: <Keyboard />, shortcut: "?", onSelect: () => setModal("shortcuts") },
            ]}
          />
        </Popover>
        <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => setModal("export")}>
          Export
        </Button>
        <Tooltip content="Play your scenes fullscreen, ready for the stage" side="bottom">
          <Button
            variant="primary"
            size="sm"
            data-tour="show-mode"
            icon={<Play className="h-3.5 w-3.5" fill="currentColor" />}
            onClick={() => router.push(`/show/${project.id}`)}
            className="pl-3 pr-3.5"
          >
            Show Mode
            <Badge tone="live" className="ml-0.5 h-4 border-white/20 bg-white/15 px-1.5 text-[9px] text-white">
              LIVE
            </Badge>
          </Button>
        </Tooltip>
      </div>
    </header>
  );
}
