"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchor: React.RefObject<HTMLElement | null>;
  align?: "start" | "end" | "center";
  side?: "bottom" | "top";
  width?: number | "anchor";
  className?: string;
  children: React.ReactNode;
}

/** Floating panel anchored to an element, rendered in a portal. */
export function Popover({ open, onClose, anchor, align = "start", side = "bottom", width, className, children }: PopoverProps) {
  const panel = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const place = useCallback(() => {
    const el = anchor.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = width === "anchor" ? r.width : (width ?? panel.current?.offsetWidth ?? 240);
    let left = align === "start" ? r.left : align === "end" ? r.right - w : r.left + r.width / 2 - w / 2;
    left = Math.max(8, Math.min(window.innerWidth - w - 8, left));
    const panelH = panel.current?.offsetHeight ?? 0;
    let top = side === "bottom" ? r.bottom + 6 : r.top - 6 - panelH;
    if (side === "bottom" && top + panelH > window.innerHeight - 8) top = Math.max(8, r.top - 6 - panelH);
    if (side === "top" && top < 8) top = r.bottom + 6;
    setStyle({ left, top, width: width === undefined ? undefined : w });
  }, [anchor, align, side, width]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const id = requestAnimationFrame(place);
    return () => cancelAnimationFrame(id);
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    const onScroll = () => place();
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onScroll);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open, onClose, anchor, place]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panel}
          initial={{ opacity: 0, y: side === "bottom" ? -4 : 4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: side === "bottom" ? -4 : 4, scale: 0.98 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
          style={style}
          className={cn(
            "fixed z-[150] rounded-xl border border-line-strong bg-[#14141c]/98 p-1.5 shadow-pop backdrop-blur-xl",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function MenuList({ items, onClose }: { items: Array<MenuItem | "divider">; onClose: () => void }) {
  return (
    <div role="menu" className="flex min-w-[180px] flex-col">
      {items.map((item, i) =>
        item === "divider" ? (
          <div key={`d${i}`} className="my-1 h-px bg-line" />
        ) : (
          <button
            key={item.label}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
            className={cn(
              "flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition-colors disabled:opacity-40",
              item.danger ? "text-danger hover:bg-danger/10" : "text-ink/90 hover:bg-white/[0.07]",
            )}
          >
            <span className="flex w-4 justify-center text-muted [&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.shortcut && <span className="text-2xs text-subtle">{item.shortcut}</span>}
          </button>
        ),
      )}
    </div>
  );
}
