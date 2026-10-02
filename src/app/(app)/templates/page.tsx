"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useAppUi } from "@/components/app-shell/appUi";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplatePreviewModal } from "@/components/templates/TemplatePreviewModal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/misc";
import { GENRES, type GenreId } from "@/data/genres";
import { TEMPLATES } from "@/data/templates";
import type { TemplateColor, TemplateDefinition, TemplateEnergy, TemplateMotion, TemplateStyle } from "@/domain/templates";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settings";

type Sort = "popular" | "new" | "az";
const ALL = "all";

const STYLES: TemplateStyle[] = ["Neon", "Minimal", "Glitch", "Geometric", "Organic", "Retro", "Cinematic"];
const ENERGIES: TemplateEnergy[] = ["Chill", "Groove", "Peak"];
const COLORS: TemplateColor[] = ["Neon", "Warm", "Cool", "Mono", "Acid", "Pastel", "Red"];
const MOTIONS: TemplateMotion[] = ["Particles", "Tunnel", "Waves", "Grid", "Geometry", "Glitch", "Gradient", "Lasers"];
const COLOR_SWATCH: Record<TemplateColor, string> = {
  Neon: "linear-gradient(135deg,#ff2bd6,#00f0ff)",
  Warm: "linear-gradient(135deg,#ff7a3d,#ff3d81)",
  Cool: "linear-gradient(135deg,#38bdf8,#818cf8)",
  Mono: "linear-gradient(135deg,#f5f5f5,#525252)",
  Acid: "linear-gradient(135deg,#b6ff00,#00ff9c)",
  Pastel: "linear-gradient(135deg,#ff9de2,#b19cd9)",
  Red: "linear-gradient(135deg,#ff1f3d,#5a0010)",
};

function TemplatesLibrary() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const artist = useSettingsStore((s) => s.defaultArtistName);
  const openCreate = useAppUi((s) => s.openCreate);
  const searchRef = useRef<HTMLInputElement>(null);

  const category = (params.get("category") as GenreId | null) ?? ALL;
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<string>(ALL);
  const [energy, setEnergy] = useState<string>(ALL);
  const [color, setColor] = useState<string>(ALL);
  const [motionType, setMotionType] = useState<string>(ALL);
  const [sort, setSort] = useState<Sort>("popular");
  const [preview, setPreview] = useState<TemplateDefinition | null>(null);
  const displayArtist = (mounted && artist) || "YOUR NAME";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const setCategory = (id: string) => {
    const next = new URLSearchParams(params.toString());
    if (id === ALL) next.delete("category");
    else next.set("category", id);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = TEMPLATES.filter(
      (t) =>
        (category === ALL || t.category === category) &&
        (style === ALL || t.style === style) &&
        (energy === ALL || t.energy === energy) &&
        (color === ALL || t.color === color) &&
        (motionType === ALL || t.motion === motionType) &&
        (!q || [t.name, t.description, t.category, t.style, t.motion, t.color].some((v) => v.toLowerCase().includes(q))),
    );
    return [...list].sort((a, b) =>
      sort === "az" ? a.name.localeCompare(b.name) : sort === "new" ? Number(!!b.isNew) - Number(!!a.isNew) || b.popularity - a.popularity : b.popularity - a.popularity,
    );
  }, [category, style, energy, color, motionType, query, sort]);

  const activeFilters = [style, energy, color, motionType].filter((v) => v !== ALL).length + (query ? 1 : 0) + (category !== ALL ? 1 : 0);
  const clearAll = () => {
    setQuery("");
    setStyle(ALL);
    setEnergy(ALL);
    setColor(ALL);
    setMotionType(ALL);
    setCategory(ALL);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 pb-20 pt-8 sm:px-8 lg:pt-10">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="label">Template library</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-[34px]">Find your look</h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted">
            {TEMPLATES.length} looks crafted for real stages. Every template is a complete five-scene show set you can make yours in minutes.
          </p>
        </div>
        <label className="group flex h-11 w-full items-center gap-2.5 rounded-xl border border-line bg-surface-1 px-3.5 transition-colors focus-within:border-accent/60 lg:w-[360px]">
          <Search className="h-4 w-4 text-subtle group-focus-within:text-accent-soft" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, vibe or motion"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-subtle"
            aria-label="Search templates"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-subtle hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <span className="kbd">/</span>
          )}
        </label>
      </header>

      {/* Genre chips */}
      <div className="no-scrollbar -mx-5 mt-8 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
        {[{ id: ALL, label: "All genres" }, ...GENRES].map((g) => {
          const active = category === g.id;
          const count = g.id === ALL ? TEMPLATES.length : TEMPLATES.filter((t) => t.category === g.id).length;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setCategory(g.id)}
              className={cn(
                "relative flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-all",
                active ? "border-transparent text-black" : "border-line text-muted hover:border-white/20 hover:text-ink",
              )}
            >
              {active && <motion.span layoutId="genre-pill" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <span className="relative">{g.label}</span>
              <span className={cn("relative text-[11px]", active ? "text-black/50" : "text-subtle")}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-line bg-surface-1/60 p-2.5">
        <span className="hidden items-center gap-1.5 pl-1.5 pr-1 text-xs font-medium text-subtle sm:flex">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </span>
        <FilterSelect label="Style" value={style} onChange={setStyle} options={STYLES} />
        <FilterSelect label="Energy" value={energy} onChange={setEnergy} options={ENERGIES} />
        <FilterSelect label="Colour" value={color} onChange={setColor} options={COLORS} swatches={COLOR_SWATCH} />
        <FilterSelect label="Animation" value={motionType} onChange={setMotionType} options={MOTIONS} />
        <div className="ml-auto flex items-center gap-2.5">
          {activeFilters > 0 && (
            <button type="button" onClick={clearAll} className="text-xs font-medium text-accent-soft hover:underline">
              Clear all
            </button>
          )}
          <span className="text-xs text-subtle">{results.length} results</span>
          <div className="w-[136px]">
            <Select<Sort>
              value={sort}
              onChange={setSort}
              ariaLabel="Sort"
              options={[
                { value: "popular", label: "Most popular" },
                { value: "new", label: "Newest first" },
                { value: "az", label: "A → Z" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-8">
        <AnimatePresence mode="popLayout">
          {results.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState
                icon={<SearchX />}
                title="No templates match these filters"
                description="Try another genre or clear a filter. New looks drop every month."
                action={
                  <Button variant="secondary" onClick={clearAll}>
                    Clear filters
                  </Button>
                }
              />
            </motion.div>
          ) : (
            <motion.div key="grid" layout className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {results.map((t, i) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.025 }}
                >
                  <TemplateCard template={t} index={i} artistName={displayArtist} onPreview={() => setPreview(t)} onUse={() => openCreate(t.id)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TemplatePreviewModal
        template={preview}
        artistName={displayArtist}
        onClose={() => setPreview(null)}
        onUse={(t) => {
          setPreview(null);
          openCreate(t.id);
        }}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  swatches,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  swatches?: Record<string, string>;
}) {
  return (
    <div className={cn("w-[150px]", value !== ALL && "[&>button]:border-accent/50 [&>button]:bg-accent/10")}>
      <Select
        value={value}
        onChange={onChange}
        ariaLabel={label}
        renderValue={(o) => (
          <span className="flex items-center gap-1.5">
            <span className="text-subtle">{label}:</span>
            <span className="truncate">{o?.label ?? "Any"}</span>
          </span>
        )}
        options={[
          { value: ALL, label: "Any" },
          ...options.map((o) => ({
            value: o,
            label: o,
            preview: swatches ? <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: swatches[o] }} /> : undefined,
          })),
        ]}
      />
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense>
      <TemplatesLibrary />
    </Suspense>
  );
}
