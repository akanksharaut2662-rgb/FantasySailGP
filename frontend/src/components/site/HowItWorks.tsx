"use client";
import { motion } from "motion/react";
import { Reveal, Stagger, StaggerItem } from "./motion-primitives";

const steps = [
  {
    n: "I",
    t: "Pick Teams",
    d: "Choose three SailGP teams from the competing fleet. No budget caps, no sailor contracts — just nation vs nation at 50 knots.",
  },
  {
    n: "II",
    t: "Read the Wind",
    d: "Wind speed and direction feed a Ridge Regression model trained on Halifax 2024 telemetry. It predicts which teams thrive in those exact conditions.",
  },
  {
    n: "III",
    t: "Score",
    d: "Five categories from real GPS data: finishing position, wind-normalised speed, overtakes, clean sailing and VMG consistency. 125 points maximum per team.",
  },
  {
    n: "IV",
    t: "See Who Called It",
    d: "Compare your lineup against the AI's picks and the field. Track model accuracy race by race across Halifax and Bermuda — including out-of-sample validation.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-28 md:py-40 px-6 md:px-10 bg-secondary/40">
      <div className="mx-auto max-w-7xl">
        <div className="grid md:grid-cols-[1fr_auto] gap-10 items-end mb-20">
          <Reveal as="h2" className="font-display text-5xl md:text-7xl leading-[0.95] max-w-3xl">
            From spectator to <span className="italic text-teal">strategist</span>.
          </Reveal>
          <Reveal as="p" delay={0.2} className="eyebrow">The Playbook</Reveal>
        </div>

        <Stagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/60">
          {steps.map((s) => (
            <StaggerItem
              key={s.n}
              as="article"
              className="group bg-background p-10 min-h-[280px] flex flex-col relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-x-0 bottom-0 h-px bg-gold origin-left"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                whileInView={{ scaleX: 0.2 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.div
                className="font-display text-gold text-3xl"
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {s.n}
              </motion.div>
              <h3 className="mt-10 font-display text-3xl text-ink transition-colors duration-500 group-hover:text-teal">
                {s.t}
              </h3>
              <p className="mt-4 text-sm text-ink/70 leading-relaxed">{s.d}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
