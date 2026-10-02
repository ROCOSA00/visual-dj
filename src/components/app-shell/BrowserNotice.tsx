"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

/** Gentle heads-up for browsers missing features the studio relies on. */
export function BrowserNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const ok =
      typeof CSS !== "undefined" &&
      CSS.supports?.("aspect-ratio", "1") &&
      CSS.supports?.("height", "100dvh") &&
      typeof ResizeObserver !== "undefined";
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem("visualdj:browser-notice") === "1";
    } catch {
      /* private mode */
    }
    setShow(!ok && !dismissed);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[500] flex items-center justify-center gap-3 bg-warning px-4 py-2 text-center text-xs font-medium text-black">
      Your browser is out of date, so some things may look broken. For the best experience use the latest Chrome, Edge, Firefox or Safari.
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          setShow(false);
          try {
            sessionStorage.setItem("visualdj:browser-notice", "1");
          } catch {
            /* ignore */
          }
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
