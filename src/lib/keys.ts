import { isMac } from "./utils";

/** "⌘" on Apple platforms, "Ctrl" elsewhere. Safe to call during render on the client. */
export function modKey(): string {
  return typeof navigator !== "undefined" && isMac() ? "⌘" : "Ctrl";
}

export function shortcut(...keys: string[]): string {
  const mod = modKey();
  return keys.map((k) => (k === "mod" ? mod : k)).join(mod === "⌘" ? "" : "+");
}
