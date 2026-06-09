"use client";
import { motion } from "motion/react";
import { Reveal } from "./motion-primitives";

export function CTA() {
  return (
    <section id="cta" className="relative px-6 md:px-10 pt-28 md:pt-40 pb-12 overflow-hidden">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[60vh] w-[60vh] rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, oklch(0.92 0.06 80 / 0.7), transparent 60%)" }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-6xl text-center">
        <Reveal as="p" className="eyebrow">Next Race · 04 : 07 : 23</Reveal>
        <Reveal as="h2" delay={0.1} className="mt-8 font-display text-6xl md:text-9xl leading-[0.9]">
          Build your<br/><span className="italic text-teal">team</span>.
        </Reveal>
        <Reveal delay={0.25}>
          <p className="mt-10 max-w-xl mx-auto text-ink/70 leading-relaxed">
            Join 84,000 managers reading the wind, picking their captain, and racing the data.
          </p>
        </Reveal>
        <Reveal delay={0.4}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            <motion.a
              href="/app"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-4 bg-ink text-cream pl-7 pr-2 py-2 rounded-full text-sm"
            >
              Create fantasy team
              <motion.span
                whileHover={{ rotate: 45 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="h-11 w-11 rounded-full bg-gold text-ink grid place-items-center"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </motion.span>
            </motion.a>
            <a href="#race" className="text-sm text-ink underline underline-offset-4 decoration-ink/30 hover:decoration-ink transition">
              View next race
            </a>
          </div>
        </Reveal>
      </div>

      <footer className="mt-32 pt-10 border-t border-border">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4 text-xs text-ink/50">
          <div className="font-mono">© 2026 SailGP Fantasy · Independent fantasy platform</div>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-ink">Rules</a>
            <a href="#" className="hover:text-ink">Scoring</a>
            <a href="#" className="hover:text-ink">Privacy</a>
          </div>
        </div>
      </footer>
    </section>
  );
}
