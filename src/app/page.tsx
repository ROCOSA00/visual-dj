import { FinalCta, Footer } from "@/components/landing/Closing";
import { Features, Roadmap, UseCases } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks, Marquee } from "@/components/landing/HowItWorks";
import { LandingNav } from "@/components/landing/LandingNav";
import { Examples, PopularTemplates } from "@/components/landing/Showcase";

export default function LandingPage() {
  return (
    <div className="relative overflow-x-clip">
      <LandingNav />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <Examples />
        <PopularTemplates />
        <Features />
        <UseCases />
        <Roadmap />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
