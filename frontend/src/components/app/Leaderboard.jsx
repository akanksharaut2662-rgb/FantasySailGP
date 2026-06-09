import { useEffect, useState } from "react";
import { fetchOptimizerPerformance } from "../../lib/api";

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

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];

function RankCell({ rank }) {
  if (!rank) return <span className="eyebrow text-muted-foreground">DNF</span>;
  if (rank <= 3) {
    const cls = rank === 1 ? "text-gold" : rank === 2 ? "text-teal" : "text-muted-foreground";
    return <span className={`font-display text-2xl leading-none ${cls}`}>{ROMAN[rank - 1]}</span>;
  }
  return <span className="font-display text-lg text-muted-foreground">{rank}</span>;
}

export default function Leaderboard({ result, recommendations = [], onReset }) {
  const [modelPerf, setModelPerf] = useState(null);

  useEffect(() => {
    fetchOptimizerPerformance().then(setModelPerf).catch(() => setModelPerf(null));
  }, []);

  if (!result) return null;

  const recTeams = new Set(recommendations.map(r => r.team));
  const sorted = [...result.leaderboard].sort((a, b) => b.total_pts - a.total_pts);

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-16 space-y-12">
      {/* Score hero */}
      <div>
        <p className="eyebrow">Your team scored</p>
        <div className="font-display text-[22vw] md:text-[14rem] text-ink tabular leading-none mt-2">
          {result.user_total_score}
        </div>
        <p className="font-display text-2xl text-muted-foreground italic">points</p>
      </div>

      <div className="hairline" />

      {/* Legend */}
      <div className="flex gap-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-px bg-gold" />
          <span className="eyebrow !text-[9px] text-muted-foreground">Your pick</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="eyebrow !text-[8px] border border-teal/40 text-teal rounded-full px-1.5 py-0.5">AI</span>
          <span className="eyebrow !text-[9px] text-muted-foreground">AI recommendation</span>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[56px_1fr_44px_44px_44px_60px_44px_64px] px-6 py-4 border-b border-border">
          {["Rank", "Team", "Pos", "Spd", "OT", "Clean", "VMG", "Total"].map(h => (
            <span key={h} className="eyebrow !text-[8px] text-muted-foreground">{h}</span>
          ))}
        </div>

        {sorted.map((row, i) => (
          <div
            key={row.team}
            className={`grid grid-cols-[56px_1fr_44px_44px_44px_60px_44px_64px] px-6 py-4 border-b border-border/50 last:border-0 items-center transition-colors
              ${row.is_user_pick ? "bg-gold/[0.04]" : "hover:bg-secondary/40"}`}
          >
            <div className="flex items-center">
              {row.is_user_pick && (
                <div className="w-0.5 h-6 bg-gold rounded-full mr-2 -ml-1 shrink-0" />
              )}
              <RankCell rank={i + 1} />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">{FLAG[row.team] ?? "🏴"}</span>
              <div className="min-w-0">
                <div className="font-display text-base text-ink leading-tight flex items-center gap-1.5 flex-wrap">
                  {FULL_NAME[row.team] ?? row.team}
                  {recTeams.has(row.team) && (
                    <span className="eyebrow !text-[7px] border border-teal/40 text-teal rounded-full px-1.5 py-0.5 shrink-0">AI</span>
                  )}
                </div>
                <div className="eyebrow !text-[7px] text-muted-foreground mt-0.5">{row.team}</div>
              </div>
            </div>

            <span className="font-display text-base text-ink tabular">{row.position_pts}</span>
            <span className="font-display text-base text-ink tabular">{row.speed_pts}</span>
            <span className="font-display text-base text-ink tabular">{row.overtake_pts}</span>
            <span className="font-display text-base text-ink tabular">{row.clean_sailing_pts}</span>
            <span className="font-display text-base text-ink tabular">{row.vmg_pts}</span>
            <span className="font-display text-lg text-ink tabular font-normal">{row.total_pts}</span>
          </div>
        ))}
      </div>

      {/* Model performance */}
      {modelPerf && (
        <div className="rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] p-6 md:p-8 space-y-6">
          <div>
            <p className="eyebrow">Model Performance</p>
            <h3 className="mt-3 font-display text-3xl text-ink">Race Intelligence</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Trained on Halifax 2024 · Tested on Bermuda 2026
            </p>
          </div>

          <div className="hairline" />

          <div className="flex items-baseline gap-3">
            <span className="eyebrow !text-[9px] text-muted-foreground">Bermuda RMSE</span>
            <span className="font-display text-3xl text-ink tabular">{modelPerf.bermuda_rmse.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">pts avg error</span>
          </div>

          <div className="space-y-0 divide-y divide-border/50">
            {modelPerf.races.map(r => (
              <div
                key={`${r.event}-${r.race_label}`}
                className="flex items-center gap-4 py-3 text-xs"
              >
                <span className="text-muted-foreground w-28 shrink-0 eyebrow !text-[8px]">
                  {r.event} {r.race_label.replace("_", " ")}
                </span>
                <span className={`font-display text-base tabular w-12 shrink-0 ${
                  r.hits >= 2 ? "text-teal" : r.hits === 1 ? "text-gold" : "text-destructive"
                }`}>
                  {r.hits}/3
                </span>
                <span className="text-muted-foreground truncate font-mono text-[10px]">
                  pred: {r.predicted_top3.join(", ")} · actual: {r.actual_top3.join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onReset}
          className="group inline-flex items-center gap-3 text-sm text-ink border border-ink/20 rounded-full px-7 py-3 hover:border-ink transition-colors"
        >
          Try another race
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
