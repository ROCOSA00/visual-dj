import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-bg px-6 text-center">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_92_246/0.3),transparent)] blur-2xl" />
      <div className="relative">
        <Logo href="/" />
        <p className="mt-12 font-display text-7xl font-bold text-gradient sm:text-8xl">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">This track isn&apos;t in the crate</h1>
        <p className="mt-2 text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/dashboard" variant="primary">
            Go to studio
          </ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Home
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
