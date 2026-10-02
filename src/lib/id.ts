/**
 * Short, URL-safe ids. `crypto.randomUUID` is not available on insecure
 * origins (e.g. a LAN IP during a soundcheck), so we fall back gracefully.
 */
export function createId(prefix = ""): string {
  let core: string;
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(9);
    crypto.getRandomValues(bytes);
    core = Array.from(bytes, (b) => (b % 36).toString(36)).join("");
  } else {
    core = Math.random().toString(36).slice(2, 11);
  }
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}${time}${core}`;
}
