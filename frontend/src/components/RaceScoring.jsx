import { useState, useEffect } from "react";

const FLAG = {
  AUS: "🇦🇺", BRA: "🇧🇷", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", ITA: "🇮🇹", NZL: "🇳🇿",
  SUI: "🇨🇭", SWE: "🇸🇪", USA: "🇺🇸",
};

const FULL_NAME = {
  AUS: "Australia", BRA: "Brazil", CAN: "Canada", DEN: "Denmark",
  ESP: "Spain", FRA: "France", GBR: "Great Britain", GER: "Germany",
  ITA: "Italy", NZL: "New Zealand", SUI: "Switzerland", SWE: "Sweden", USA: "United States",
};

const BARS = [
  { key: "position_pts",     label: "Position",  max: 50, color: "#00d4ff" },
  { key: "speed_pts",        label: "Speed",     max: 20, color: "#f59e0b" },
  { key: "overtake_pts",     label: "Overtakes", max: 25, color: "#22c55e" },
  { key: "clean_sailing_pts",label: "Clean",     max: 15, color: "#94a3b8" },
  { key: "vmg_pts",          label: "VMG",       max: 15, color: "#f97316" },
];

function useCountUp(target, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const frame = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  if (!rank)      return <span className="text-sm font-bold text-slate-400">DNF</span>;
  return <span className="text-sm font-bold text-slate-400">#{rank}</span>;
}

function TeamCard({ row, cardIndex, animate }) {
  const animatedTotal = useCountUp(row.total_pts, 1200, cardIndex * 200);

  return (
    <div className="rounded-2xl border border-white/10 p-6 space-y-4" style={{ background: "#111827" }}>
      {/* Team header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{FLAG[row.team] ?? "🏴"}</span>
          <div>
            <div className="font-black text-white text-lg">{row.team}</div>
            <div className="text-xs text-slate-400">{FULL_NAME[row.team] ?? row.team}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RankBadge rank={row.final_rank} />
          <div className="text-right">
            <div className="text-4xl font-black tabular-nums" style={{ color: "#00d4ff" }}>
              {animatedTotal}
            </div>
            <div className="text-xs text-slate-400 tracking-widest">PTS</div>
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-2.5">
        {BARS.map((bar, i) => {
          const pct = animate ? (row[bar.key] / bar.max) * 100 : 0;
          return (
            <div key={bar.key} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-16 shrink-0">{bar.label}</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: bar.color,
                    transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${cardIndex * 200 + i * 100}ms`,
                    boxShadow: animate ? `0 0 8px ${bar.color}80` : "none",
                  }}
                />
              </div>
              <span className="text-xs font-bold text-white w-6 text-right">{row[bar.key]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnimatedTotal({ value }) {
  const counted = useCountUp(value, 1500, 400);
  return (
    <div
      className="text-8xl font-black tabular-nums"
      style={{ color: "#00d4ff", textShadow: "0 0 60px rgba(0,212,255,0.6)" }}
    >
      {counted}
    </div>
  );
}

export default function RaceScoring({ result, onViewLeaderboard }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!result) return null;

  const userRows = result.leaderboard.filter(r => r.is_user_pick);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs tracking-widest text-slate-500 uppercase">Live Results</p>
        <h2 className="text-4xl font-black text-white">Your lineup is racing</h2>
      </div>

      {/* Team cards */}
      <div className="space-y-4">
        {userRows.map((row, i) => (
          <TeamCard key={row.team} row={row} cardIndex={i} animate={animate} />
        ))}
      </div>

      {/* Combined score */}
      <div className="text-center space-y-2 pt-4">
        <p className="text-xs tracking-widest text-slate-500 uppercase">Combined Lineup Score</p>
        <AnimatedTotal value={result.user_total_score} />
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onViewLeaderboard}
          className="px-10 py-4 rounded-full font-black text-slate-900 text-sm tracking-widest transition-all hover:scale-105"
          style={{ background: "#00d4ff" }}>
          SEE LEADERBOARD →
        </button>
      </div>
    </div>
  );
}
