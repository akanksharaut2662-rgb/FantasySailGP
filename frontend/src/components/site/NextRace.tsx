"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { fetchRaces, fetchRecommendations } from "@/lib/api";
import { Reveal } from "./motion-primitives";

const FLAG: Record<string, string> = {
  AUS: "🇦🇺", BRA: "🇧🇷", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", ITA: "🇮🇹", NZL: "🇳🇿",
  SUI: "🇨🇭", SWE: "🇸🇪", USA: "🇺🇸",
};

const FULL_NAME: Record<string, string> = {
  AUS: "Australia",   BRA: "Brazil",      CAN: "Canada",
  DEN: "Denmark",     ESP: "Spain",       FRA: "France",
  GBR: "Great Britain", GER: "Germany",   ITA: "Italy",
  NZL: "New Zealand", SUI: "Switzerland", SWE: "Sweden", USA: "United States",
};

const RANK_LABEL = ["I", "II", "III"];

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

export function NextRace() {
  const [recs, setRecs] = useState<any[]>([]);
  const [race, setRace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Season 6 opener — our "next race" target
  const RACE_START = new Date("2026-09-12T10:00:00Z");
  const { d, h, m, s } = useCountdown(RACE_START);

  useEffect(() => {
    // Use Bermuda Race_1 wind conditions as a proxy for the next race forecast
    fetchRaces()
      .then((races: any[]) => {
        const r = races.find((x: any) => x.event === "Bermuda" && x.race_label === "Race_1");
        if (!r) return;
        setRace(r);
        return fetchRecommendations(r.event, r.race_label);
      })
      .then((data: any) => {
        if (data?.recommendations) setRecs(data.recommendations.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || recs.length === 0) return null;

  const windKmh = race?.avg_tws_km_h ?? "—";
  const windDeg  = race?.avg_twd_deg  ?? "—";

  return (
    <section className="py-24 px-6 md:px-10 border-t border-border">
      <div className="mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-start">

          {/* Left — header + countdown */}
          <div>
            <Reveal>
              <p className="eyebrow">Season 6 · Cape Town 2026</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 font-display text-5xl md:text-7xl leading-[0.9] text-ink">
                AI picks are<br />
                <span className="italic text-gold">ready.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 text-sm text-ink/65 max-w-sm leading-relaxed">
                The model has already read the forecast. Based on{" "}
                <span className="text-ink">{windKmh} km/h</span> winds at{" "}
                <span className="text-ink">{windDeg}°</span>, Ridge Regression
                surfaces the highest expected-value lineup before the first gun fires.
              </p>
            </Reveal>

            {/* Countdown */}
            <Reveal delay={0.24}>
              <div className="mt-10 rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-soft)] inline-block">
                <p className="eyebrow !text-[8px] mb-4">Race starts in</p>
                <div className="flex items-end gap-4">
                  {[{ v: d, l: "D" }, { v: h, l: "H" }, { v: m, l: "M" }, { v: s, l: "S" }].map(c => (
                    <div key={c.l} className="text-center">
                      <div className="font-display text-4xl text-ink tabular leading-none">
                        {String(c.v).padStart(2, "0")}
                      </div>
                      <div className="eyebrow !text-[7px] mt-1.5">{c.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <a
                href="/app"
                className="mt-8 group inline-flex items-center gap-4 bg-ink text-cream pl-7 pr-2 py-2 rounded-full text-sm"
              >
                Build your lineup
                <span className="h-11 w-11 rounded-full bg-gold text-ink grid place-items-center group-hover:bg-gold/80 transition-colors">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </a>
            </Reveal>
          </div>

          {/* Right — AI pick cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-6">
              <p className="eyebrow">AI Pre-Race Picks</p>
              <span className="eyebrow !text-[8px] border border-gold/30 text-gold rounded-full px-3 py-1.5 bg-gold/5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                Model ready
              </span>
            </div>

            {recs.map((rec, i) => (
              <motion.div
                key={rec.team}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-sm border bg-card p-5 shadow-[var(--shadow-soft)] flex items-center justify-between ${
                  i === 0 ? "border-gold/30" : "border-border"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`font-display text-3xl leading-none ${
                    i === 0 ? "text-gold" : i === 1 ? "text-teal" : "text-muted-foreground"
                  }`}>
                    {RANK_LABEL[i]}
                  </span>
                  <div className="h-8 w-px bg-border" />
                  <span className="text-2xl">{FLAG[rec.team] ?? "🏴"}</span>
                  <div>
                    <div className="font-display text-lg text-ink leading-tight">
                      {FULL_NAME[rec.team] ?? rec.team}
                    </div>
                    <div className="eyebrow !text-[7px] text-muted-foreground mt-0.5">{rec.team}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl text-ink tabular leading-none">
                    {Math.round(rec.predicted_score)}
                  </div>
                  <div className="eyebrow !text-[7px] text-muted-foreground mt-0.5">predicted pts</div>
                </div>
              </motion.div>
            ))}

            <p className="text-[10px] text-ink/40 text-right pt-2">
              Ridge Regression · {windKmh} km/h · {windDeg}° · Bermuda conditions
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
