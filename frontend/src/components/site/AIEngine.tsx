"use client";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useEffect, useState } from "react";
import sailor from "@/assets/scene-sailor.jpg";
import { Reveal, Stagger, StaggerItem } from "./motion-primitives";

const FLAG: Record<string, string> = {
  AUS: "🇦🇺", BRA: "🇧🇷", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", ITA: "🇮🇹", NZL: "🇳🇿",
  SUI: "🇨🇭", SWE: "🇸🇪", USA: "🇺🇸",
};

const FULL_NAME: Record<string, string> = {
  AUS: "Australia", BRA: "Brazil", CAN: "Canada", DEN: "Denmark",
  ESP: "Spain", FRA: "France", GBR: "Great Britain", GER: "Germany",
  ITA: "Italy", NZL: "New Zealand", SUI: "Switzerland", SWE: "Sweden", USA: "United States",
};

const TAGS = ["Top pick", "Value", "Wind-favored", "Differential"];

const FALLBACK: { team: string; predicted_score: number; tag: string }[] = [
  { team: "AUS", predicted_score: 187, tag: "Top pick" },
  { team: "NZL", predicted_score: 172, tag: "Value" },
  { team: "GBR", predicted_score: 161, tag: "Wind-favored" },
  { team: "FRA", predicted_score: 149, tag: "Differential" },
];

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000/api";

export function AIEngine() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  const [picks, setPicks] = useState(FALLBACK);
  const [live, setLive] = useState(false);
  const [raceLabel, setRaceLabel] = useState("Halifax · Race 1");

  useEffect(() => {
    fetch(`${API_BASE}/races/Halifax/Race_1/recommend`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (data?.recommendations?.length >= 3) {
          const top4 = data.recommendations.slice(0, 4).map((r: any, i: number) => ({
            team: r.team,
            predicted_score: r.predicted_score ?? r.predicted_pts ?? 0,
            tag: TAGS[i] ?? "Pick",
          }));
          setPicks(top4);
          setLive(true);
          setRaceLabel(`${data.event} · ${data.race_label.replace("_", " ")}`);
        }
      })
      .catch(() => {});
  }, []);

  const maxScore = Math.max(...picks.map(p => p.predicted_score));

  return (
    <section id="ai" className="relative py-28 md:py-40 px-6 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-16">
          <div className="lg:sticky lg:top-32 self-start">
            <Reveal as="p" className="eyebrow">Race Intelligence</Reveal>
            <Reveal as="h2" delay={0.1} className="mt-6 font-display text-5xl md:text-7xl leading-[0.95]">
              What the<br /><span className="italic text-teal">eye misses</span>.
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-8 max-w-md text-ink/70 leading-relaxed">
                Real SailGP telemetry — GPS tracks, wind speed, direction, boat speed and VMG
                — fed into a Ridge Regression model trained on Halifax 2024 and validated on
                Bermuda 2026.
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
                alt="SailGP sailor"
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
              <Reveal as="p" className="eyebrow">AI Picks · {raceLabel}</Reveal>
              <Reveal as="span" delay={0.15} className="font-mono text-[10px] text-ink/50 flex items-center gap-2">
                {live ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse inline-block" />
                    live from model
                  </>
                ) : "loading…"}
              </Reveal>
            </div>

            <Stagger as="ol" className="divide-y divide-border">
              {picks.map((p, i) => (
                <StaggerItem
                  key={p.team}
                  as="li"
                  className="py-7 grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1.4fr_1fr_auto] items-center gap-6 group"
                >
                  <span className="font-display text-3xl text-gold tabular w-10 transition-transform duration-500 group-hover:translate-x-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="font-display text-2xl text-ink flex items-center gap-2">
                      <span>{FLAG[p.team] ?? "🏴"}</span>
                      {FULL_NAME[p.team] ?? p.team}
                    </div>
                    <div className="text-xs text-ink/60 mt-0.5">{p.team} · SailGP Team</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="eyebrow !text-[9px]">Predicted Score</div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-px w-20 bg-border relative overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(p.predicted_score / maxScore) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute left-0 bg-gold"
                          style={{ height: 3, top: -1 }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="eyebrow !text-[9px]">Proj.</div>
                    <div className="font-display text-3xl text-ink tabular">{Math.round(p.predicted_score)}</div>
                    <div className="text-[10px] uppercase tracking-widest text-teal mt-1">{p.tag}</div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal delay={0.4}>
              <div className="mt-8 flex items-center justify-between text-xs text-ink/60">
                <span className="font-mono">Ocean of Data Challenge · Halifax 2024 · Bermuda 2026</span>
                <a href="/app" className="text-ink hover:text-gold transition-colors">Build your lineup →</a>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
