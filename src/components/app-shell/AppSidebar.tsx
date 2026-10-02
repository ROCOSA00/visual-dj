"use client";

import { Cloud, Keyboard, LayoutDashboard, LayoutTemplate, Menu, MonitorPlay, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import { sortedProjects, useProjectsStore } from "@/store/projects";
import { useAppUi } from "./appUi";

const NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const openShow = useAppUi((s) => s.openShowPicker);
  return (
    <nav className="space-y-0.5" aria-label="Main">
      {NAV.slice(0, 2).map((item) => (
        <NavItem key={item.href} {...item} active={pathname.startsWith(item.href)} onClick={onNavigate} />
      ))}
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          openShow();
        }}
        className="group flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted transition-all hover:bg-white/[0.04] hover:text-ink"
      >
        <MonitorPlay className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
        Show Mode
        <span className="ml-auto rounded-full bg-live/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-live">LIVE</span>
      </button>
      <NavItem {...NAV[2]!} active={pathname.startsWith("/settings")} onClick={onNavigate} />
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all",
        active ? "bg-white/[0.07] text-ink" : "text-muted hover:bg-white/[0.04] hover:text-ink",
      )}
    >
      {active && <span className="absolute -left-3 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-brand" />}
      <Icon className={cn("h-[18px] w-[18px] transition-transform group-hover:scale-110", active && "text-accent-soft")} />
      {label}
    </Link>
  );
}

function RecentList({ onNavigate }: { onNavigate?: () => void }) {
  const projects = useProjectsStore((s) => s.projects);
  const hydrated = useProjectsStore((s) => s.hydrated);
  const recent = sortedProjects(projects).slice(0, 5);
  if (!hydrated || recent.length === 0) return null;
  return (
    <div className="mt-8">
      <p className="label mb-2 px-3">Recent visuals</p>
      <ul className="space-y-0.5">
        {recent.map((p) => (
          <li key={p.id}>
            <Link
              href={`/editor/${p.id}`}
              onClick={onNavigate}
              className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] text-muted transition-colors hover:bg-white/[0.04] hover:text-ink"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-[4px]" style={{ background: `linear-gradient(135deg, ${p.palette[0] ?? "#8b5cf6"}, ${p.palette[1] ?? "#22d3ee"})` }} />
              <span className="truncate">{p.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SidebarFooter() {
  const openShortcuts = useAppUi((s) => s.openShortcuts);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-line bg-gradient-to-br from-accent/10 via-transparent to-accent-cyan/5 p-3.5">
        <p className="flex items-center gap-2 text-xs font-semibold text-ink">
          <Cloud className="h-3.5 w-3.5 text-accent-cyan" /> Local workspace
        </p>
        <p className="mt-1 text-2xs leading-relaxed text-muted">Your visuals are saved in this browser. Accounts and cloud sync are on the way.</p>
      </div>
      <div className="flex items-center justify-between px-1">
        <button type="button" onClick={openShortcuts} className="flex items-center gap-1.5 text-2xs text-subtle transition-colors hover:text-ink">
          <Keyboard className="h-3.5 w-3.5" /> Shortcuts
        </button>
        <span className="text-2xs text-subtle">v{brand.version}</span>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line bg-surface-1/60 px-3 py-5 lg:flex">
        <div className="mb-8 px-3">
          <Logo href="/" />
        </div>
        <NavLinks />
        <RecentList />
        <div className="mt-auto">
          <SidebarFooter />
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-bg/85 px-4 backdrop-blur-xl lg:hidden">
        <Logo href="/" size="sm" />
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-muted hover:text-ink" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-line bg-surface-1 px-3 py-5">
            <div className="mb-8 flex items-center justify-between px-3">
              <Logo href="/" size="sm" />
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <RecentList onNavigate={() => setOpen(false)} />
            <div className="mt-auto">
              <SidebarFooter />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
