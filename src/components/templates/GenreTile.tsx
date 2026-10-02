import Link from "next/link";
import type { Genre } from "@/data/genres";
import { cn } from "@/lib/utils";

export function GenreTile({ genre, count, className }: { genre: Genre; count: number; className?: string }) {
  const [a, b] = genre.colors;
  return (
    <Link
      href={`/templates?category=${genre.id}`}
      className={cn(
        "group relative flex h-24 flex-col justify-end overflow-hidden rounded-2xl border border-line p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20",
        className,
      )}
      style={{
        background: `radial-gradient(circle at 85% 15%, ${a}55, transparent 55%), radial-gradient(circle at 10% 110%, ${b}66, transparent 60%), #0c0c12`,
      }}
    >
      <span
        className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-40 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70"
        style={{ background: a }}
      />
      <span className="relative font-display text-[15px] font-semibold text-ink">{genre.label}</span>
      <span className="relative flex items-center justify-between text-2xs text-white/60">
        <span className="truncate">{genre.tagline}</span>
        <span className="ml-2 shrink-0 font-mono">{count}</span>
      </span>
    </Link>
  );
}
