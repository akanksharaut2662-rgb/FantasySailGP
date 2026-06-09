"use client";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useEffect, useState } from "react";
import scene from "@/assets/scene-boat.jpg";
import { Reveal, Stagger, StaggerItem } from "./motion-primitives";

const FLAG: Record<string, string> = {
  AUS: "🇦🇺", BRA: "🇧🇷", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", ITA: "🇮🇹", NZL: "🇳🇿",
  SUI: "🇨🇭", SWE: "🇸🇪", USA: "🇺🇸",
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000/api";

interface TeamScore {
  team: string;
  final_rank: number;
  total_pts: number;
  position_pts: number;
  speed_pts: number;
  overtake_pts: number;
  clean_sailing_pts: number;
  vmg_pts: number;
}

function buildEvents(lb: TeamScore[]) {
  const sorted = [...lb].sort((a, b) => a.final_rank - b.final_rank);
  const topSpeed = [...lb].sort((a, b) => b.speed_pts - a.speed_pts)[0];
  const topOvertake = [...lb].sort((a, b) => b.overtake_pts - a.overtake_pts)[0];
  const worstClean = [...lb].sort((a, b) => a.clean_sailing_pts - b.clean_sailing_pts)[0];
  const podium = sorted.slice(0, 3).map(t => `${FLAG[t.team] ?? ""} ${t.team}`).join(" · ");

  return [
    { t: "+00:00", label: "Start", detail: `${sorted.length} boats on the line. ${sorted[0]?.team ?? "—"} takes early advantage.`, delta: `+${sorted[0]?.position_pts ?? 0}` },
    { t: "+02:30", label: "Speed Highlight", detail: `${topSpeed?.team ?? "—"} reaches top recorded speed — best wind-normalised pace in the fleet.`, delta: `+${topSpeed?.speed_pts ?? 0}` },
    { t: "+04:45", label: "Overtake", detail: `${topOvertake?.team ?? "—"} logs the most rank improvements — ${topOvertake?.overtake_pts ?? 0} overtake points.`, delta: `+${topOvertake?.overtake_pts ?? 0}` },
    { t: "+07:10", label: "Penalty", detail: `${worstClean?.team ?? "—"} receives a sailing infringement — lowest clean-sailing score.`, delta: `-${Math.max(0, 15 - (worstClean?.clean_sailing_pts ?? 0))}` },
    { t: "+11:30", label: "Podium", detail: `Final order: ${podium}`, delta: `+${sorted[0]?.total_pts ?? 0}` },
  ];
}

export function LiveSim() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sceneRef, offset: ["start end", "end start"] });
  const sceneY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  const [leaderboard, setLeaderboard] = useState<TeamScore[]>([]);
  const [events, setEvents] = useState(() => buildEvents([]));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/races/Halifax/Race_1/leaderboard`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: TeamScore[] | null) => {
        if (data?.length) {
          setLeaderboard(data);
          setEvents(buildEvents(data));
          setLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  const topBoard = leaderboard.length
    ? [...leaderboard].sort((a, b) => a.final_rank - b.final_rank).slice(0, 4)
    : [];

  return (
    <section id="live" className="relative py-28 md:py-40 px-6 md:px-10 bg-secondary/40 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="grid md:grid-cols-[1fr_auto] gap-10 items-end mb-20">
          <Reveal as="h2" className="font-display text-5xl md:text-7xl leading-[0.95] max-w-3xl">
            Every maneuver,<br /><span className="italic text-teal">scored from telemetry</span>.
          </Reveal>
          <Reveal as="p" delay={0.2} className="eyebrow">
            {loaded ? "Halifax · Race 1 · Replay" : "Race Replay"}
          </Reveal>
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-px bg-border/60">
          <Reveal className="bg-background p-8 md:p-12">
            <div className="flex items-center justify-between mb-8">
              <p className="eyebrow">Halifax 2024 · Race 1 · Highlights</p>
              <span className="font-mono text-[10px] tabular text-ink/50 flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${loaded ? "bg-teal" : "bg-border"} animate-pulse`} />
                {loaded ? "real data" : "loading…"}
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
                  <span className={`font-display text-xl tabular pt-1 ${e.delta.startsWith("-") ? "text-destructive" : "text-teal"}`}>
                    {e.delta}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>

          <Reveal delay={0.1} className="bg-background p-8 md:p-12">
            <div className="flex items-center justify-between mb-8">
              <p className="eyebrow">Race Leaderboard</p>
              <span className="font-mono text-[10px] text-gold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                {loaded ? "Halifax Race 1" : "live"}
              </span>
            </div>
            {topBoard.length > 0 ? (
              <Stagger as="ol" className="divide-y divide-border">
                {topBoard.map((r) => (
                  <StaggerItem key={r.team} as="li" className="py-5 grid grid-cols-[auto_1fr_auto] gap-4 items-baseline">
                    <span className="font-mono text-xs text-ink/50 tabular">{String(r.final_rank).padStart(2, "0")}</span>
                    <span className="font-display text-2xl text-ink flex items-center gap-2">
                      {FLAG[r.team] ?? "🏴"} {r.team}
                    </span>
                    <span className="font-display text-lg tabular text-ink">{r.total_pts} pts</span>
                  </StaggerItem>
                ))}
              </Stagger>
            ) : (
              <div className="py-8 text-center">
                <p className="eyebrow animate-pulse">Loading race data…</p>
              </div>
            )}
            {loaded && leaderboard.length > 0 && (
              <div className="mt-10">
                <div className="flex items-baseline justify-between text-xs text-ink/60">
                  <span className="eyebrow !text-[9px]">Race winner points</span>
                  <span className="font-display text-teal tabular text-lg">
                    {Math.max(...leaderboard.map(r => r.total_pts))}
                  </span>
                </div>
                <div className="mt-3 h-px bg-border relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 bg-gold"
                    style={{ height: 3, top: -1 }}
                  />
                </div>
              </div>
            )}
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
