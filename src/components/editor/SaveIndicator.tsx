"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatRelativeTime } from "@/lib/utils";
import { useProjectsStore } from "@/store/projects";

export function SaveIndicator() {
  const status = useProjectsStore((s) => s.saveStatus);
  const error = useProjectsStore((s) => s.saveError);
  const lastSavedAt = useProjectsStore((s) => s.lastSavedAt);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const tooltip =
    status === "error"
      ? error ?? "Could not save"
      : lastSavedAt
        ? `Saved in this browser · ${formatRelativeTime(lastSavedAt)}. Cloud sync is coming soon.`
        : "Your work is saved automatically in this browser.";

  return (
    <Tooltip content={tooltip} side="bottom">
      <div className="flex h-7 min-w-[86px] items-center" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {status === "saving" ? (
            <motion.span key="saving" {...fade} className="flex items-center gap-1.5 text-2xs font-medium text-muted">
              <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-accent-soft border-r-transparent" />
              Saving…
            </motion.span>
          ) : status === "error" ? (
            <motion.span key="error" {...fade} className="flex items-center gap-1.5 text-2xs font-medium text-danger">
              <AlertCircle className="h-3.5 w-3.5" /> Not saved
            </motion.span>
          ) : (
            <motion.span key="saved" {...fade} className="flex items-center gap-1.5 text-2xs font-medium text-subtle">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success/15">
                <Check className="h-2.5 w-2.5 text-success" strokeWidth={3} />
              </span>
              Saved
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </Tooltip>
  );
}

const fade = {
  initial: { opacity: 0, y: 3 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -3 },
  transition: { duration: 0.15 },
};
