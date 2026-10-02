"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "./Tooltip";

/* ------------------------------- IconButton ------------------------------- */

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  shortcut?: string;
  tooltipSide?: "top" | "bottom" | "left" | "right";
  active?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "ghost" | "solid";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, shortcut, tooltipSide = "top", active, size = "md", variant = "ghost", className, children, ...rest },
  ref,
) {
  const sizes = { xs: "h-6 w-6 rounded-md", sm: "h-7 w-7 rounded-lg", md: "h-8 w-8 rounded-lg", lg: "h-10 w-10 rounded-xl" };
  return (
    <Tooltip content={label} shortcut={shortcut} side={tooltipSide}>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-pressed={active}
        className={cn(
          "inline-flex shrink-0 items-center justify-center transition-all duration-150 disabled:pointer-events-none disabled:opacity-35 active:scale-95 [&>svg]:h-4 [&>svg]:w-4",
          sizes[size],
          variant === "solid" ? "border border-line-strong bg-surface-3 hover:bg-white/[0.1]" : "hover:bg-white/[0.07]",
          active ? "bg-accent/15 text-accent-soft hover:bg-accent/20" : "text-muted hover:text-ink",
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    </Tooltip>
  );
});

/* -------------------------------- Section --------------------------------- */

export function Section({
  title,
  defaultOpen = true,
  children,
  aside,
  badge,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  aside?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-line last:border-b-0">
      <div className="flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex h-11 flex-1 items-center gap-2 text-left text-xs font-semibold tracking-wide text-ink/90 hover:text-ink"
        >
          <ChevronRight className={cn("h-3.5 w-3.5 text-subtle transition-transform duration-200", open && "rotate-90")} />
          {title}
          {badge}
        </button>
        {aside}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-4 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* --------------------------------- Badges --------------------------------- */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "live" | "new" | "soon" | "pro";
  className?: string;
}) {
  const tones = {
    neutral: "border-line-strong bg-white/[0.05] text-muted",
    accent: "border-accent/30 bg-accent/15 text-accent-soft",
    live: "border-live/30 bg-live/15 text-live",
    new: "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan",
    soon: "border-warning/25 bg-warning/10 text-warning",
    pro: "border-transparent bg-brand text-black",
  };
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[10px] font-semibold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <kbd className={cn("kbd", className)}>{children}</kbd>;
}

/* -------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-white/[0.04]", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "gap-2 py-8" : "gap-3 py-16", className)}>
      {icon && (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-2xl border border-line-strong bg-surface-2 text-accent-soft",
            compact ? "h-11 w-11 [&>svg]:h-5 [&>svg]:w-5" : "mb-2 h-16 w-16 [&>svg]:h-7 [&>svg]:w-7",
          )}
        >
          <div className="absolute inset-0 -z-10 rounded-2xl bg-accent/30 blur-xl" />
          {icon}
        </div>
      )}
      <h3 className={cn("font-display font-semibold text-ink", compact ? "text-sm" : "text-xl")}>{title}</h3>
      {description && <p className={cn("max-w-sm text-muted", compact ? "text-xs" : "text-sm")}>{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
