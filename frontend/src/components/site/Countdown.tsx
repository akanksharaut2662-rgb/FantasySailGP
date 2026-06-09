"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal } from "./motion-primitives";

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function FlipDigit({ value }: { value: number }) {
  const str = String(value).padStart(2, "0");
  return (
    <span className="inline-flex tabular">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={str}
          initial={{ y: "60%", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-60%", opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {str}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Countdown() {
  const target = new Date(Date.now() + 4 * 86400000 + 7 * 3600000 + 23 * 60000);
  const { d, h, m, s } = useCountdown(target);
  const cells = [
    { l: "Days", v: d }, { l: "Hours", v: h }, { l: "Minutes", v: m }, { l: "Seconds", v: s },
  ];

  return (
    <section id="race" className="relative py-28 md:py-40 px-6 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-16 lg:gap-24 items-start">
          <div>
            <Reveal as="p" className="eyebrow">Round Seven</Reveal>
            <Reveal as="h2" delay={0.1} className="mt-6 font-display text-6xl md:text-8xl leading-[0.9] text-ink">
              Sydney<br/><span className="italic text-teal">Harbour</span>
            </Reveal>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="hairline my-10 max-w-sm origin-left"
            />
            <dl className="grid grid-cols-2 gap-y-6 max-w-md text-sm">
              {[
                ["Date", "14 March"], ["Start", "14:00 AEDT"],
                ["Course", "Short, technical"], ["Fleet", "10 nations"],
              ].map(([k, v], i) => (
                <Reveal key={k} delay={0.35 + i * 0.08}>
                  <dt className="eyebrow !text-[10px]">{k}</dt>
                  <dd className="mt-1 font-display text-2xl text-ink">{v}</dd>
                </Reveal>
              ))}
            </dl>
            <Reveal delay={0.7}>
              <a href="#cta" className="mt-12 inline-flex items-center gap-3 text-sm text-ink group">
                <span className="h-px w-10 bg-ink transition-all duration-500 group-hover:w-20" />
                Lock in your team
              </a>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="rounded-sm bg-white/60 backdrop-blur-sm border border-border p-8 md:p-10 shadow-[var(--shadow-soft)]">
              <div className="flex items-baseline justify-between">
                <p className="eyebrow">Countdown</p>
                <span className="font-mono text-[10px] text-ink/50 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                  live
                </span>
              </div>
              <div className="mt-8 grid grid-cols-4 gap-2 md:gap-6">
                {cells.map((c) => (
                  <div key={c.l} className="text-center">
                    <div className="font-display text-5xl md:text-7xl text-ink leading-none overflow-hidden">
                      <FlipDigit value={c.v} />
                    </div>
                    <div className="mt-3 eyebrow !text-[9px]">{c.l}</div>
                  </div>
                ))}
              </div>
              <div className="hairline my-8" />
              <p className="eyebrow mb-5">Course Conditions</p>
              <ul className="space-y-4">
                {[
                  { k: "Wind", v: "16–22 kts SE" },
                  { k: "Swell", v: "0.8 m" },
                  { k: "Sky", v: "Partly cloudy · 22°" },
                  { k: "Current", v: "1.2 kts with course" },
                ].map((r, i) => (
                  <motion.li
                    key={r.k}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.4 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0"
                  >
                    <span className="text-sm text-ink/70">{r.k}</span>
                    <span className="font-display text-lg text-ink">{r.v}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
