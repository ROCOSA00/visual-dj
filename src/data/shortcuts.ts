export interface ShortcutDef {
  keys: string[];
  label: string;
}

export interface ShortcutGroup {
  title: string;
  items: ShortcutDef[];
}

/** "mod" renders as ⌘ on macOS and Ctrl elsewhere. */
export const EDITOR_SHORTCUTS: ShortcutGroup[] = [
  {
    title: "Playback",
    items: [
      { keys: ["Space"], label: "Play / pause" },
      { keys: ["F"], label: "Fullscreen preview" },
    ],
  },
  {
    title: "Scenes",
    items: [
      { keys: ["1–9"], label: "Switch scene" },
      { keys: ["mod", "D"], label: "Duplicate scene" },
    ],
  },
  {
    title: "Editing",
    items: [
      { keys: ["mod", "S"], label: "Save" },
      { keys: ["mod", "Z"], label: "Undo" },
      { keys: ["mod", "⇧", "Z"], label: "Redo" },
      { keys: ["Delete"], label: "Delete selected element" },
      { keys: ["←", "→", "↑", "↓"], label: "Nudge element (hold ⇧ for 10×)" },
      { keys: ["Esc"], label: "Deselect" },
      { keys: ["?"], label: "Show shortcuts" },
    ],
  },
];

export const SHOW_SHORTCUTS: ShortcutGroup[] = [
  {
    title: "Show Mode",
    items: [
      { keys: ["1–9"], label: "Jump to scene" },
      { keys: ["←", "→"], label: "Previous / next scene" },
      { keys: ["F"], label: "Enter / exit fullscreen" },
      { keys: ["B"], label: "Blackout" },
      { keys: ["S"], label: "Hold for strobe" },
      { keys: ["T"], label: "Tap tempo" },
      { keys: ["H"], label: "Hide / show controls" },
      { keys: ["Space"], label: "Freeze / resume" },
      { keys: ["Esc"], label: "Exit Show Mode" },
    ],
  },
];
