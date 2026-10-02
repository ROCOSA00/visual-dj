"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useToastStore } from "@/store/toasts";
import { cn } from "@/lib/utils";

const icons = {
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  info: <Info className="h-4 w-4 text-accent-cyan" />,
  error: <AlertCircle className="h-4 w-4 text-danger" />,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[300] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full items-center gap-3 rounded-xl border border-line-strong bg-[#16161f]/95 px-3.5 py-2.5 shadow-pop backdrop-blur-xl",
            )}
          >
            {icons[t.tone]}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">{t.title}</p>
              {t.description && <p className="truncate text-xs text-muted">{t.description}</p>}
            </div>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
                className="rounded-md px-2 py-1 text-xs font-semibold text-accent-soft hover:bg-accent/15"
              >
                {t.action.label}
              </button>
            )}
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-subtle hover:text-ink">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
