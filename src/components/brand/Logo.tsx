import Link from "next/link";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/** Typographic logo: play mark + wordmark from the brand config ("VISUAL" + gradient "DJ"). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-brand-strong shadow-[0_0_0_1px_rgb(255_255_255/0.15)_inset,0_6px_20px_-6px_rgb(192_38_211/0.9)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-[62%] w-[62%]" fill="none">
        <circle cx="12" cy="12" r="9" stroke="white" strokeOpacity="0.95" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="5.6" stroke="white" strokeOpacity="0.45" strokeWidth="1.2" />
        <path d="M10.4 9.3v5.4l4.5-2.7-4.5-2.7Z" fill="white" />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  className,
  compact = false,
  size = "md",
}: {
  href?: string | null;
  className?: string;
  compact?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const text = { sm: "text-[15px]", md: "text-[17px]", lg: "text-xl" }[size];
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={size === "lg" ? "h-9 w-9" : size === "sm" ? "h-7 w-7" : undefined} />
      {!compact && (
        <span className={cn("font-display font-bold tracking-[0.02em] text-ink", text)}>
          {brand.wordmark.lead}
          <span className="text-gradient ml-[0.28em]">{brand.wordmark.accent}</span>
        </span>
      )}
      <span className="sr-only">{brand.name}</span>
    </span>
  );
  if (!href) return content;
  return (
    <Link href={href} className="rounded-lg outline-offset-4" aria-label={`${brand.name} home`}>
      {content}
    </Link>
  );
}
