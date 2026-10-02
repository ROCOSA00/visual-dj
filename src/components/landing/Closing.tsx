"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import { brand } from "@/config/brand";
import { TEMPLATE_MAP } from "@/data/templates";
import { templatePreviewScene } from "@/domain/templates";
import { Reveal } from "./shared";

export function FinalCta() {
  const scene = useMemo(() => {
    const base = templatePreviewScene(TEMPLATE_MAP["hyperdrive"]!);
    return { ...base, layers: base.layers.filter((l) => l.kind !== "text") };
  }, []);
  return (
    <section className="px-5 pb-24 pt-10 sm:px-8">
      <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-line-strong bg-black">
        <div className="absolute inset-0 opacity-60">
          <VisualCanvas scene={scene} artistName="" bpm={130} maxWidth={1400} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(0_0_0/0.35),rgb(0_0_0/0.85))]" />
        <div className="relative px-6 py-20 text-center sm:py-28">
          <h2 className="mx-auto max-w-3xl font-display text-3xl font-semibold leading-tight text-white sm:text-5xl">
            Your next set deserves visuals this good
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/70 sm:text-lg">
            Create your first show in minutes. Free while we&apos;re in beta.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/dashboard" variant="primary" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
              Create your visuals
            </ButtonLink>
            <ButtonLink href="/templates" variant="secondary" size="lg" className="bg-white/10 backdrop-blur">
              Explore templates
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:justify-between">
        <div className="max-w-xs">
          <Logo href="/" />
          <p className="mt-4 text-sm text-muted">{brand.tagline}. Visual tools for DJs and live artists.</p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <FooterCol
            title="Product"
            links={[
              ["Studio", "/dashboard"],
              ["Templates", "/templates"],
              ["Settings", "/settings"],
            ]}
          />
          <FooterCol
            title="Explore"
            links={[
              ["How it works", "/#how"],
              ["Features", "/#features"],
              ["Use cases", "/#use-cases"],
            ]}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">Coming soon</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>Pricing</li>
              <li>Marketplace</li>
              <li>Integrations</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-2 border-t border-line pt-6 text-xs text-subtle sm:flex-row">
        <span>© {new Date().getFullYear()} {brand.name}. Made for the booth.</span>
        <span>v{brand.version}</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-muted transition-colors hover:text-ink">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
