/**
 * Product identity lives here so the provisional name can be swapped in one
 * place. Every visible mention of the product name reads from this object.
 */
export const brand = {
  name: "Visual DJ",
  /** Split used by the typographic logo: "VISUAL" + gradient "DJ". */
  wordmark: { lead: "VISUAL", accent: "DJ" },
  tagline: "Create visuals that move with your sound",
  description:
    "Visual DJ lets DJs and live artists design custom visuals for their shows in minutes. Pick a template, make it yours, and take it to the stage.",
  domain: "visualdj.app",
  /** Prefix for every localStorage / IndexedDB key. */
  storageNamespace: "visualdj",
  version: "0.1 beta",
} as const;

export type Brand = typeof brand;
