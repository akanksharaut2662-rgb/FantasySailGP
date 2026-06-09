"use client";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import sailor from "@/assets/scene-sailor.jpg";
import { Reveal, Stagger, StaggerItem } from "./motion-primitives";

const picks = [
  { name: "T. Slingsby", team: "Australia", proj: 187, form: 92, tag: "Captain" },
  { name: "P. Burling", team: "New Zealand", proj: 172, form: 88, tag: "Value" },
  { name: "Q. Delapierre", team: "France", proj: 161, form: 84, tag: "Wind-favored" },
  { name: "D. Bundock", team: "Canada", proj: 149, form: 79, tag: "Differential" },
];

export function AIEngine() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section id="ai" className="relative py-28 md:py-40 px-6 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-16">
          <div className="lg:sticky lg:top-32 self-start">
            <Reveal as="p" className="eyebrow">Race Intelligence</Reveal>
            <Reveal as="h2" delay={0.1} className="mt-6 font-display text-5xl md:text-7xl leading-[0.95]">
              What the<br/><span className="italic text-teal">eye misses</span>.
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-8 max-w-md text-ink/70 leading-relaxed">
                Eight seasons of telemetry, crew rotations and weather routing — quietly distilled into projections you can act on.
              </p>
            </Reveal>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="hairline my-10 max-w-sm origin-left"
            />
            <div ref={ref} className="aspect-[3/4] max-w-sm overflow-hidden rounded-sm">
              <motion.img
                src={sailor}
                alt="Single sailboat illustration"
                loading="lazy"
                width={900}
                height={1200}
                style={{ y: imgY, scale: 1.15 }}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-8">
              <Reveal as="p" className="eyebrow">AI Picks · Sydney</Reveal>
              <Reveal as="span" delay={0.15} className="font-mono text-[10px] text-ink/50">updated 2m ago</Reveal>
            </div>
            <Stagger as="ol" className="divide-y divide-border">
              {picks.map((p, i) => (
                <StaggerItem
                  key={p.name}
                  as="li"
                  className="py-7 grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1.4fr_1fr_auto] items-center gap-6 group"
                >
                  <span className="font-display text-3xl text-gold tabular w-10 transition-transform duration-500 group-hover:translate-x-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="font-display text-2xl text-ink">{p.name}</div>
                    <div className="text-xs text-ink/60 mt-0.5">{p.team}</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="eyebrow !text-[9px]">Form</div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-px w-20 bg-border relative overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${p.form}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute left-0 bg-gold"
                          style={{ height: 3, top: -1 }}
                        />
                      </div>
                      <span className="text-sm tabular text-ink">{p.form}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="eyebrow !text-[9px]">Proj.</div>
                    <div className="font-display text-3xl text-ink tabular">{p.proj}</div>
                    <div className="text-[10px] uppercase tracking-widest text-teal mt-1">{p.tag}</div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal delay={0.4}>
              <div className="mt-8 flex items-center justify-between text-xs text-ink/60">
                <span className="font-mono">Trained on 8 seasons · 1.2M data points</span>
                <a href="#cta" className="text-ink hover:text-gold transition-colors">View full board →</a>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
