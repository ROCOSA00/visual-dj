"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cloneElement, isValidElement, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSettingsStore } from "@/store/settings";

type Side = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: React.ReactNode;
  shortcut?: string;
  side?: Side;
  delay?: number;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  disabled?: boolean;
}

/**
 * Portal-based tooltip so it is never clipped by scrolling panels.
 * Respects the "Show tooltips" setting.
 */
export function Tooltip({ content, shortcut, side = "top", delay = 350, children, disabled }: TooltipProps) {
  const enabled = useSettingsStore((s) => s.showTooltips);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (el: HTMLElement) => {
      anchor.current = el;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const r = el.getBoundingClientRect();
        const gap = 8;
        const p =
          side === "top"
            ? { x: r.left + r.width / 2, y: r.top - gap }
            : side === "bottom"
              ? { x: r.left + r.width / 2, y: r.bottom + gap }
              : side === "left"
                ? { x: r.left - gap, y: r.top + r.height / 2 }
                : { x: r.right + gap, y: r.top + r.height / 2 };
        setPos(p);
        setOpen(true);
      }, delay);
    },
    [delay, side],
  );

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (!isValidElement(children)) return children;
  if (disabled || !enabled || !content) return children;

  const childProps = children.props;
  const trigger = cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseEnter?.(e);
      show(e.currentTarget);
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      childProps.onFocus?.(e);
      let keyboardFocus = true;
      try {
        keyboardFocus = e.currentTarget.matches(":focus-visible");
      } catch {
        // Older Safari does not know :focus-visible; show the tooltip anyway.
      }
      if (keyboardFocus) show(e.currentTarget);
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      childProps.onBlur?.(e);
      hide();
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      childProps.onPointerDown?.(e);
      hide();
    },
  });

  const translate =
    side === "top"
      ? "translate(-50%, -100%)"
      : side === "bottom"
        ? "translate(-50%, 0)"
        : side === "left"
          ? "translate(-100%, -50%)"
          : "translate(0, -50%)";

  return (
    <>
      {trigger}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                role="tooltip"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                style={{ left: pos.x, top: pos.y }}
                className="pointer-events-none fixed z-[200]"
              >
                <div
                  style={{ transform: translate }}
                  className="flex max-w-[260px] items-center gap-2 rounded-lg border border-line-strong bg-[#1b1b24]/95 px-2.5 py-1.5 text-xs text-ink shadow-pop backdrop-blur"
                >
                  <span className="leading-snug">{content}</span>
                  {shortcut && <span className="kbd">{shortcut}</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
