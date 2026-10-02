"use client";

import { Fragment } from "react";
import type { ShortcutGroup } from "@/data/shortcuts";
import { modKey } from "@/lib/keys";

export function ShortcutList({ groups }: { groups: ShortcutGroup[] }) {
  const mod = modKey();
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="label mb-2">{group.title}</p>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white/[0.015]">
            {group.items.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-4 px-3 py-2.5">
                <span className="text-[13px] text-ink/85">{item.label}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {item.keys.map((k, i) => (
                    <Fragment key={k + i}>
                      <kbd className="kbd h-6 min-w-6 text-[11px]">{k === "mod" ? mod : k}</kbd>
                    </Fragment>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
