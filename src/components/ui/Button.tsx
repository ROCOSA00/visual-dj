"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "live";
type Size = "xs" | "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-brand-strong shadow-[0_0_0_1px_rgb(255_255_255/0.12)_inset,0_8px_24px_-8px_rgb(139_92_246/0.7)] hover:shadow-[0_0_0_1px_rgb(255_255_255/0.2)_inset,0_10px_32px_-6px_rgb(192_38_211/0.8)] hover:brightness-110",
  secondary: "bg-surface-3 text-ink border border-line-strong hover:bg-white/[0.09] hover:border-white/20",
  ghost: "text-muted hover:text-ink hover:bg-white/[0.06]",
  outline: "border border-line-strong text-ink hover:border-white/25 hover:bg-white/[0.04]",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
  live: "text-white bg-live shadow-[0_8px_28px_-8px_rgb(255_59_92/0.9)] hover:brightness-110",
};

const sizes: Record<Size, string> = {
  xs: "h-7 rounded-lg px-2.5 text-xs",
  sm: "h-8 rounded-lg px-3 text-[13px]",
  md: "h-10 rounded-xl px-4 text-sm",
  lg: "h-12 rounded-xl px-6 text-[15px]",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", icon, iconRight, loading, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {loading ? <Spinner /> : icon}
      {children}
      {iconRight}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  className,
  children,
  ...rest
}: Omit<ButtonProps, "loading"> & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...(rest as Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">)}
    >
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
    />
  );
}
