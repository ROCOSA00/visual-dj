"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

/**
 * Friendly replacement for Next's bare "Application error" screen. Shows the
 * actual message so users can report it, plus a way to recover.
 */
export function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset?: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const outdated = typeof window !== "undefined" && (!("structuredClone" in window) || !CSS.supports?.("aspect-ratio", "1"));

  return (
    <div style={{ minHeight: "100vh", background: "#060609", color: "#f4f4f7", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, margin: "0 auto 20px", borderRadius: 16, background: "rgba(255,59,92,0.15)", color: "#ff3b5c", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AlertTriangle width={26} height={26} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: "#9a9aab", fontSize: 15, lineHeight: 1.6, marginTop: 10 }}>
          {outdated
            ? "Your browser looks out of date. Visual DJ works best on the latest Chrome, Edge, Firefox or Safari 16+."
            : "The studio hit an unexpected problem. Your saved projects are safe in this browser."}
        </p>
        <pre style={{ textAlign: "left", whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#12121a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14, fontSize: 12, color: "#c4c4d0", marginTop: 20, maxHeight: 160, overflow: "auto" }}>
          {error.message || "Unknown error"}
          {error.digest ? `\nRef: ${error.digest}` : ""}
        </pre>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => (reset ? reset() : window.location.reload())}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", borderRadius: 12, border: 0, cursor: "pointer", color: "white", fontWeight: 600, background: "linear-gradient(120deg,#7c3aed,#c026d3,#0891b2)" }}
          >
            <RotateCcw width={16} height={16} /> Try again
          </button>
          {/* A full page load on purpose: it resets whatever state crashed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ display: "inline-flex", alignItems: "center", height: 44, padding: "0 20px", borderRadius: 12, color: "#f4f4f7", border: "1px solid rgba(255,255,255,0.13)", textDecoration: "none", fontWeight: 600 }}>
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
