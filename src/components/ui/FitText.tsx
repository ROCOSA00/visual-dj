"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Shrinks its text until it fits on one line inside its parent. */
export function FitText({
  children,
  max = 18,
  min = 8,
  className,
  style,
}: {
  children: React.ReactNode;
  max?: number;
  min?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const fit = () => {
      let size = max;
      el.style.fontSize = `${size}px`;
      const available = parent.clientWidth - 16;
      while (el.scrollWidth > available && size > min) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    let alive = true;
    void document.fonts?.ready.then(() => alive && fit());
    return () => {
      alive = false;
    };
  });
  return (
    <span ref={ref} className={cn("inline-block whitespace-nowrap", className)} style={style}>
      {children}
    </span>
  );
}
