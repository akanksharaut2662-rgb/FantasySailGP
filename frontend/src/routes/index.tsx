import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Countdown } from "@/components/site/Countdown";
import { HowItWorks } from "@/components/site/HowItWorks";
import { AIEngine } from "@/components/site/AIEngine";
import { LiveSim } from "@/components/site/LiveSim";
import { CTA } from "@/components/site/CTA";
import { ScrollProgress } from "@/components/site/ScrollProgress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SailGP Fantasy Predictor — Build Your Team. Race the Data." },
      { name: "description", content: "Step into race control. Draft sailors, read the wind, and follow every maneuver across the world's fastest sail racing circuit." },
      { property: "og:title", content: "SailGP Fantasy Predictor" },
      { property: "og:description", content: "Build your team. Follow every move. Experience SailGP like never before." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <ScrollProgress />
      <Nav />
      <Hero />
      <Countdown />
      <HowItWorks />
      <AIEngine />
      <LiveSim />
      <CTA />
    </main>
  );
}
