"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#templates", label: "Templates" },
  { href: "#features", label: "Features" },
  { href: "#use-cases", label: "Use cases" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-line bg-bg/75 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo href="/" />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Landing">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="/templates" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Templates
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="primary" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
            Open studio
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
