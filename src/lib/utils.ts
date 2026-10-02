export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < 45_000) return "just now";
  if (diff < hour) return `${Math.round(diff / minute)} min ago`;
  if (diff < day) return `${Math.round(diff / hour)} h ago`;
  if (diff < 7 * day) {
    const days = Math.round(diff / day);
    return days === 1 ? "yesterday" : `${days} days ago`;
  }
  return new Date(timestamp).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function getGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Late night session";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Reads a nested value with a dot path, e.g. "transform.x". */
export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

/**
 * Returns a shallow patch for `obj` that sets the nested `path` to `value`,
 * copying intermediate objects so state stays immutable.
 */
export function patchForPath<T extends object>(obj: T, path: string, value: unknown): Partial<T> {
  const keys = path.split(".");
  const [head, ...rest] = keys as [string, ...string[]];
  if (rest.length === 0) return { [head]: value } as Partial<T>;
  const current = (obj as Record<string, unknown>)[head];
  const base = Array.isArray(current) ? [...current] : { ...(current as object) };
  let cursor: Record<string, unknown> = base as Record<string, unknown>;
  for (let i = 0; i < rest.length - 1; i++) {
    const key = rest[i]!;
    const next = cursor[key];
    const copy = Array.isArray(next) ? [...next] : { ...(next as object) };
    cursor[key] = copy;
    cursor = copy as Record<string, unknown>;
  }
  cursor[rest[rest.length - 1]!] = value;
  return { [head]: base } as Partial<T>;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "visual"
  );
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export const isMac = (): boolean =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
