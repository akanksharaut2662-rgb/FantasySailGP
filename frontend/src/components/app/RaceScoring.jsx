import { useState, useEffect } from "react";
import RaceScene from "./RaceScene";

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
  { key: "position_pts",      label: "Position",  max: 50, color: "var(--teal)"                   },
  { key: "speed_pts",         label: "Speed",     max: 20, color: "var(--gold)"                   },
  { key: "overtake_pts",      label: "Overtakes", max: 25, color: "oklch(0.55 0.14 145)"          },
  { key: "clean_sailing_pts", label: "Clean",     max: 15, color: "var(--ink)"                    },
  { key: "vmg_pts",           label: "VMG",       max: 15, color: "oklch(0.62 0.14 50)"           },
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
  if (rank === 1) return <span className="font-display text-3xl text-gold leading-none">I</span>;
  if (rank === 2) return <span className="font-display text-3xl text-teal leading-none">II</span>;
  if (rank === 3) return <span className="font-display text-2xl text-muted-foreground leading-none">III</span>;
  if (!rank)      return <span className="eyebrow text-muted-foreground">DNF</span>;
  return <span className="font-display text-xl text-muted-foreground">#{rank}</span>;
}

function TeamCard({ row, cardIndex, animate }) {
  const animatedTotal = useCountUp(row.total_pts, 1200, cardIndex * 200);

  return (
    <div className="rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{FLAG[row.team] ?? "🏴"}</span>
          <div>
            <div className="font-display text-2xl text-ink leading-tight">{FULL_NAME[row.team] ?? row.team}</div>
            <div className="eyebrow !text-[8px] text-muted-foreground mt-0.5">{row.team}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <RankBadge rank={row.final_rank} />
          <div className="text-right">
            <div className="font-display text-5xl text-ink tabular leading-none">{animatedTotal}</div>
            <div className="eyebrow !text-[8px] text-muted-foreground mt-1">pts</div>
          </div>
        </div>
      </div>

      <div className="hairline" />

      <div className="space-y-3">
        {BARS.map((bar, i) => {
          const pct = animate ? Math.min((row[bar.key] / bar.max) * 100, 100) : 0;
          return (
            <div key={bar.key} className="flex items-center gap-4">
              <span className="eyebrow !text-[8px] text-muted-foreground w-16 shrink-0">{bar.label}</span>
              <div className="flex-1 h-px bg-border relative overflow-visible">
                <div
                  className="absolute left-0 top-0 h-[2px] -translate-y-1/2 rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: bar.color,
                    transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${cardIndex * 200 + i * 80}ms`,
                  }}
                />
              </div>
              <span className="font-display text-base text-ink tabular w-5 text-right">{row[bar.key]}</span>
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
    <div className="font-display text-[20vw] md:text-[12rem] text-ink tabular leading-none">
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
  const userTeams = userRows.map(r => r.team);

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-16 space-y-10">
      {/* Header */}
      <div>
        <p className="eyebrow">Live Results</p>
        <h2 className="mt-4 font-display text-5xl md:text-6xl text-ink leading-[0.92]">
          Your lineup<br />
          <span className="italic text-teal">is racing.</span>
        </h2>
      </div>

      {/* Race animation — user's boats */}
      <RaceScene teams={userTeams} height={160} />

      <div className="hairline" />

      {/* Team cards */}
      <div className="space-y-4">
        {userRows.map((row, i) => (
          <TeamCard key={row.team} row={row} cardIndex={i} animate={animate} />
        ))}
      </div>

      {/* Combined score */}
      <div className="pt-8 text-center">
        <p className="eyebrow">Combined lineup score</p>
        <AnimatedTotal value={result.user_total_score} />
        <p className="font-display text-2xl text-muted-foreground italic mt-2">points</p>
      </div>

      <div className="hairline" />

      {/* CTA */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onViewLeaderboard}
          className="group inline-flex items-center gap-4 bg-ink text-cream pl-7 pr-2 py-2 rounded-full text-sm"
        >
          See leaderboard
          <span className="h-11 w-11 rounded-full bg-gold text-ink grid place-items-center group-hover:bg-gold/80 transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
