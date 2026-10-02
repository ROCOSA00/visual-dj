/**
 * Deep copy for plain JSON data (projects, scenes, layers).
 * Avoids structuredClone, which older Safari versions (< 15.4) lack.
 */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
