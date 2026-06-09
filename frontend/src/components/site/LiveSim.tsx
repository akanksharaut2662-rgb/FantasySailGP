"use client";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import scene from "@/assets/scene-boat.jpg";
import { Reveal, Stagger, StaggerItem } from "./motion-primitives";

const events = [
  { t: "+00:42", label: "Start", detail: "Clean line, AUS port end advantage", delta: "+12" },
  { t: "+02:18", label: "Mark 1", detail: "NZ rounds inside, gains 2 boats", delta: "+18" },
  { t: "+04:05", label: "Foiling gybe", detail: "FRA holds foils, top speed 49.1 kts", delta: "+9" },
  { t: "+06:30", label: "Penalty", detail: "GBR called for windward infringement", delta: "−14" },
  { t: "+09:12", label: "Podium", detail: "AUS · NZL · FRA across the line", delta: "+24" },
];

const board = [
  { rank: 1, name: "You", pts: 1284, move: "▲ 3" },
  { rank: 2, name: "M. Hayes", pts: 1271, move: "▼ 1" },
  { rank: 3, name: "Reef Riders", pts: 1255, move: "—" },
  { rank: 4, name: "Foil Co.", pts: 1240, move: "▲ 2" },
];

export function LiveSim() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sceneRef, offset: ["start end", "end start"] });
  const sceneY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section id="live" className="relative py-28 md:py-40 px-6 md:px-10 bg-secondary/40 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="grid md:grid-cols-[1fr_auto] gap-10 items-end mb-20">
          <Reveal as="h2" className="font-display text-5xl md:text-7xl leading-[0.95] max-w-3xl">
            Every maneuver,<br/><span className="italic text-teal">scored in real time</span>.
          </Reveal>
          <Reveal as="p" delay={0.2} className="eyebrow">Live Feed</Reveal>
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-px bg-border/60">
          <Reveal className="bg-background p-8 md:p-12">
            <div className="flex items-center justify-between mb-8">
              <p className="eyebrow">Race · 2 of 3 · Leg 4</p>
              <span className="font-mono text-[10px] tabular text-ink/50 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />09:42
              </span>
            </div>
            <Stagger as="ol" className="relative">
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-[5.5rem] top-2 bottom-2 w-px bg-border origin-top"
              />
              {events.map((e, i) => (
                <StaggerItem
                  key={i}
                  as="li"
                  className="grid grid-cols-[5rem_1fr_auto] items-start gap-5 py-5"
                >
                  <span className="font-mono text-xs text-ink/50 tabular pt-1">{e.t}</span>
                  <div className="relative pl-7">
                    <motion.span
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
                      className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-gold ring-4 ring-gold/15"
                    />
                    <div className="font-display text-2xl text-ink">{e.label}</div>
                    <div className="text-sm text-ink/60 mt-0.5">{e.detail}</div>
                  </div>
                  <span className={`font-display text-xl tabular pt-1 ${e.delta.startsWith("−") ? "text-destructive" : "text-teal"}`}>
                    {e.delta}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>

          <Reveal delay={0.1} className="bg-background p-8 md:p-12">
            <div className="flex items-center justify-between mb-8">
              <p className="eyebrow">Leaderboard</p>
              <span className="font-mono text-[10px] text-gold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />live
              </span>
            </div>
            <Stagger as="ol" className="divide-y divide-border">
              {board.map((r) => (
                <StaggerItem key={r.rank} as="li" className="py-5 grid grid-cols-[auto_1fr_auto_auto] gap-4 items-baseline">
                  <span className="font-mono text-xs text-ink/50 tabular">{String(r.rank).padStart(2, "0")}</span>
                  <span className="font-display text-2xl text-ink flex items-center gap-3">
                    {r.name}
                    {r.name === "You" && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.6 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                        className="text-[9px] uppercase tracking-[0.2em] text-gold border border-gold/50 rounded-sm px-1.5 py-0.5"
                      >
                        You
                      </motion.span>
                    )}
                  </span>
                  <span className="font-display text-lg tabular text-ink">{r.pts.toLocaleString()}</span>
                  <span className={`font-mono text-xs tabular ${r.move.startsWith("▲") ? "text-teal" : r.move.startsWith("▼") ? "text-destructive" : "text-ink/40"}`}>
                    {r.move}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
            <div className="mt-10">
              <div className="flex items-baseline justify-between text-xs text-ink/60">
                <span className="eyebrow !text-[9px]">Your momentum</span>
                <span className="font-display text-teal tabular text-lg">+87</span>
              </div>
              <div className="mt-3 h-px bg-border relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "72%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 bg-gold"
                  style={{ height: 3, top: -1 }}
                />
              </div>
            </div>
          </Reveal>
        </div>

        <div ref={sceneRef} className="mt-24 max-w-5xl mx-auto opacity-90 overflow-hidden rounded-sm">
          <motion.img
            src={scene}
            alt=""
            loading="lazy"
            width={1600}
            height={1080}
            style={{ y: sceneY, scale: 1.12 }}
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}
