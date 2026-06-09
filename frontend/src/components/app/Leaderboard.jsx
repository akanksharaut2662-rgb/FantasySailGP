import { useEffect, useState, useRef } from "react";
import { fetchOptimizerPerformance } from "../../lib/api";
import { Link } from "@tanstack/react-router";

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

const CREDIT_REWARDS = [2_000_000, 1_000_000, 500_000];

function rankReward(rank) {
  return CREDIT_REWARDS[rank - 1] ?? 0;
}

function formatCredits(n) { return n.toLocaleString(); }

function RankCell({ rank }) {
  if (!rank) return <span className="eyebrow text-muted-foreground">DNF</span>;
  if (rank <= 3) {
    const cls = rank === 1 ? "text-gold" : rank === 2 ? "text-teal" : "text-muted-foreground";
    return <span className={`font-display text-2xl leading-none ${cls}`}>{ROMAN[rank - 1]}</span>;
  }
  return <span className="font-display text-lg text-muted-foreground">{rank}</span>;
}

function useCountUp(target, duration = 1400, enabled = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target || !enabled) return;
    let current = 0;
    const step = 30;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      setValue(Math.round(current));
      if (current >= target) clearInterval(timer);
    }, step);
    return () => clearInterval(timer);
  }, [target, duration, enabled]);
  return value;
}

export default function Leaderboard({ result, recommendations = [], credits, onCreditsEarned, onReset }) {
  const [modelPerf, setModelPerf] = useState(null);
  const [rewardAwarded, setRewardAwarded] = useState(false);
  const [displayedReward, setDisplayedReward] = useState(0);
  const awardedRef = useRef(false);

  const displayScore = useCountUp(result?.user_total_score, 1400);

  useEffect(() => {
    fetchOptimizerPerformance().then(setModelPerf).catch(() => setModelPerf(null));
  }, []);

  if (!result) return null;

  const recTeams = new Set(recommendations.map(r => r.team));
  const sorted = [...result.leaderboard].sort((a, b) => b.total_pts - a.total_pts);

  const allScores = result.leaderboard.map(r => r.total_pts);
  const scoreAvg = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
  const scoreBest = Math.max(...allScores);
  const userRank = allScores.filter(s => s > result.user_total_score).length + 1;
  const totalTeams = allScores.length;

  const reward = rankReward(userRank);

  // Award credits once on mount
  useEffect(() => {
    if (awardedRef.current || reward === 0) return;
    awardedRef.current = true;
    const t = setTimeout(() => {
      setRewardAwarded(true);
      setDisplayedReward(reward);
      if (onCreditsEarned) onCreditsEarned(reward);
    }, 2000);
    return () => clearTimeout(t);
  }, [reward]);

  // AI vs You
  const leaderboardByTeam = Object.fromEntries(result.leaderboard.map(r => [r.team, r]));
  const aiRecs = recommendations.slice(0, 3);
  const aiActualScore = aiRecs.reduce((s, rec) => s + (leaderboardByTeam[rec.team]?.total_pts ?? 0), 0);
  const userPicks = result.leaderboard.filter(r => r.is_user_pick);
  const userScore = result.user_total_score;
  const optimal = [...result.leaderboard].sort((a, b) => b.total_pts - a.total_pts).slice(0, 3);
  const optimalScore = optimal.reduce((s, t) => s + t.total_pts, 0);
  const aiWins = aiActualScore > userScore;
  const tie = aiActualScore === userScore;
  const diff = Math.abs(aiActualScore - userScore);

  const animatedReward = useCountUp(displayedReward, 1200, rewardAwarded);

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-16 space-y-12">

      {/* Score hero */}
      <div>
        <p className="eyebrow">Your team scored</p>
        <div className="font-display text-[22vw] md:text-[14rem] text-ink tabular leading-none mt-2">
          {displayScore}
        </div>
        <p className="font-display text-2xl text-muted-foreground italic">points</p>

        <div className="flex items-center gap-8 mt-6 flex-wrap">
          <div>
            <div className="font-display text-2xl text-ink tabular">{scoreAvg}</div>
            <div className="eyebrow !text-[8px] text-muted-foreground mt-0.5">Race avg</div>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <div className="font-display text-2xl text-ink tabular">{scoreBest}</div>
            <div className="eyebrow !text-[8px] text-muted-foreground mt-0.5">Race best</div>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <div className={`font-display text-2xl tabular ${userRank <= 3 ? "text-gold" : "text-teal"}`}>
              #{userRank}
            </div>
            <div className="eyebrow !text-[8px] text-muted-foreground mt-0.5">of {totalTeams}</div>
          </div>
        </div>
      </div>

      <div className="hairline" />

      {/* ── Credit Reward Banner ── */}
      <div className={`rounded-sm border overflow-hidden transition-all duration-700 ${
        userRank === 1
          ? "border-gold/60 bg-gold/5"
          : userRank <= 3
          ? "border-teal/40 bg-teal/5"
          : "border-border bg-card"
      }`}>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="eyebrow">
                {userRank === 1 ? "🥇 1st Place" : userRank === 2 ? "🥈 2nd Place" : userRank === 3 ? "🥉 3rd Place" : `#${userRank} Place`}
              </p>
              <h3 className="mt-2 font-display text-3xl text-ink">
                {reward > 0 ? "Credits Earned" : "Race Complete"}
              </h3>
            </div>
            {reward > 0 && (
              <div className="text-right">
                <div className={`font-display text-4xl tabular ${userRank === 1 ? "text-gold" : "text-teal"}`}>
                  +{rewardAwarded ? formatCredits(animatedReward) : "—"}
                </div>
                <div className="eyebrow !text-[8px] text-muted-foreground mt-0.5">credits won</div>
              </div>
            )}
          </div>

          {reward > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-6 flex-wrap text-sm">
                <div>
                  <span className="text-muted-foreground">Credits before: </span>
                  <span className="font-display text-base text-ink tabular">
                    {formatCredits(credits - (rewardAwarded ? reward : 0))}
                  </span>
                </div>
                <div className="text-teal">+{formatCredits(reward)}</div>
                <div>
                  <span className="text-muted-foreground">New balance: </span>
                  <span className={`font-display text-base tabular ${userRank <= 3 ? "text-gold" : "text-ink"}`}>
                    {rewardAwarded ? formatCredits(credits) : "…"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {reward === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Top 3 finishes earn credits: 1st +2M · 2nd +1M · 3rd +500K
            </p>
          )}
        </div>
      </div>

      {/* ── AI vs You showdown ── */}
      {aiRecs.length >= 3 && (
        <div className="rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <p className="eyebrow">Model vs Your Picks</p>
              <p className="text-xs text-ink/50 mt-0.5">Did Ridge Regression beat you?</p>
            </div>
            <span className={`eyebrow !text-[9px] border rounded-full px-3 py-1.5 ${
              tie  ? "text-muted-foreground border-border" :
              aiWins ? "text-teal border-teal/30 bg-teal/5" :
                       "text-gold border-gold/30 bg-gold/5"
            }`}>
              {tie ? "Dead heat" : aiWins ? "AI wins" : "You win"}
            </span>
          </div>

          <div className="grid grid-cols-2 divide-x divide-border">
            {/* AI column */}
            <div className="p-6 space-y-4">
              <p className="eyebrow !text-[8px] text-teal">AI Lineup</p>
              <div className="space-y-3">
                {aiRecs.map(rec => {
                  const actual = leaderboardByTeam[rec.team];
                  return (
                    <div key={rec.team} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-base">{FLAG[rec.team] ?? "🏴"}</span>
                        <span className="font-display text-sm text-ink">{rec.team}</span>
                      </span>
                      <span className="font-display text-lg text-ink tabular">{actual?.total_pts ?? "—"}</span>
                    </div>
                  );
                })}
              </div>
              <div className="hairline" />
              <div className="flex items-baseline justify-between">
                <span className="eyebrow !text-[8px] text-muted-foreground">Total</span>
                <span className={`font-display text-4xl tabular ${aiWins ? "text-teal" : "text-ink/60"}`}>{aiActualScore}</span>
              </div>
            </div>

            {/* User column */}
            <div className="p-6 space-y-4">
              <p className="eyebrow !text-[8px] text-gold">Your Lineup</p>
              <div className="space-y-3">
                {userPicks.map(pick => (
                  <div key={pick.team} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-base">{FLAG[pick.team] ?? "🏴"}</span>
                      <span className="font-display text-sm text-ink">{pick.team}</span>
                    </span>
                    <span className="font-display text-lg text-ink tabular">{pick.total_pts}</span>
                  </div>
                ))}
              </div>
              <div className="hairline" />
              <div className="flex items-baseline justify-between">
                <span className="eyebrow !text-[8px] text-muted-foreground">Total</span>
                <span className={`font-display text-4xl tabular ${!aiWins && !tie ? "text-gold" : "text-ink/60"}`}>{userScore}</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 border-t border-border bg-secondary/20 space-y-1.5">
            {tie ? (
              <p className="text-sm text-ink/80">Dead heat — you matched the AI exactly.</p>
            ) : aiWins ? (
              <p className="text-sm text-ink/80">
                The AI outscored your lineup by <span className="font-display text-gold text-base">{diff} pts</span>. Ridge Regression called it.
              </p>
            ) : (
              <p className="text-sm text-ink/80">
                You outscored the AI by <span className="font-display text-gold text-base">{diff} pts</span>. Nice picks.
              </p>
            )}
            {optimalScore > Math.max(aiActualScore, userScore) && (
              <p className="text-xs text-ink/45 font-mono">
                Best possible: {optimal.map(t => FLAG[t.team] ?? "").join("")} {optimalScore} pts
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex gap-8 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-px bg-gold" />
          <span className="eyebrow !text-[9px] text-muted-foreground">Your pick</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="eyebrow !text-[8px] border border-teal/40 text-teal rounded-full px-1.5 py-0.5">AI</span>
          <span className="eyebrow !text-[9px] text-muted-foreground">AI recommendation</span>
        </div>
      </div>

      {/* ── Desktop leaderboard table ── */}
      <div className="hidden sm:block rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="grid grid-cols-[48px_1fr_40px_40px_40px_52px_40px_60px] px-6 py-4 border-b border-border">
          {["Rank","Team","Pos","Spd","OT","Clean","VMG","Total"].map(h => (
            <span key={h} className="eyebrow !text-[8px] text-muted-foreground">{h}</span>
          ))}
        </div>
        {sorted.map((row, i) => (
          <div
            key={row.team}
            className={`grid grid-cols-[48px_1fr_40px_40px_40px_52px_40px_60px] px-6 py-4 border-b border-border/50 last:border-0 items-center transition-colors
              ${row.is_user_pick ? "bg-gold/[0.04]" : "hover:bg-secondary/40"}`}
          >
            <div className="flex items-center">
              {row.is_user_pick && <div className="w-0.5 h-6 bg-gold rounded-full mr-2 -ml-1 shrink-0" />}
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
            <span className="font-display text-lg text-ink tabular">{row.total_pts}</span>
          </div>
        ))}
      </div>

      {/* ── Mobile leaderboard ── */}
      <div className="sm:hidden rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden divide-y divide-border/50">
        {sorted.map((row, i) => (
          <div
            key={row.team}
            className={`flex items-center gap-4 px-5 py-4 ${row.is_user_pick ? "bg-gold/[0.04]" : ""}`}
          >
            {row.is_user_pick && <div className="w-0.5 h-8 bg-gold rounded-full shrink-0" />}
            <div className="w-8 shrink-0"><RankCell rank={i + 1} /></div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-lg shrink-0">{FLAG[row.team] ?? "🏴"}</span>
              <div className="min-w-0">
                <div className="font-display text-base text-ink leading-tight truncate flex items-center gap-1.5">
                  {row.team}
                  {recTeams.has(row.team) && (
                    <span className="eyebrow !text-[7px] border border-teal/40 text-teal rounded-full px-1.5 py-0.5 shrink-0">AI</span>
                  )}
                </div>
                <div className="text-[10px] text-ink/50 font-mono mt-0.5">
                  Pos {row.position_pts} · Spd {row.speed_pts} · OT {row.overtake_pts}
                </div>
              </div>
            </div>
            <span className="font-display text-xl text-ink tabular shrink-0">{row.total_pts}</span>
          </div>
        ))}
      </div>

      {/* ── Model performance ── */}
      {modelPerf && (
        <div className="rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="eyebrow">Model Performance</p>
              <h3 className="mt-3 font-display text-3xl text-ink">Race Intelligence</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Trained on Halifax 2024 · Tested on Bermuda 2026
              </p>
            </div>
            <Link
              to="/model"
              className="eyebrow !text-[9px] text-teal border border-teal/30 rounded-full px-3 py-1.5 hover:bg-teal/5 transition-colors"
            >
              Full explainer →
            </Link>
          </div>
          <div className="hairline" />
          <div className="flex items-baseline gap-3">
            <span className="eyebrow !text-[9px] text-muted-foreground">Bermuda RMSE</span>
            <span className="font-display text-3xl text-ink tabular">{modelPerf.bermuda_rmse.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">pts avg error</span>
          </div>
          <div className="space-y-0 divide-y divide-border/50">
            {modelPerf.races.map(r => (
              <div key={`${r.event}-${r.race_label}`} className="flex items-center gap-4 py-3 text-xs">
                <span className="text-muted-foreground w-28 shrink-0 eyebrow !text-[8px]">
                  {r.event} {r.race_label.replace("_", " ")}
                </span>
                <span className={`font-display text-base tabular w-10 shrink-0 ${
                  r.hits >= 2 ? "text-teal" : r.hits === 1 ? "text-gold" : "text-destructive"
                }`}>
                  {r.hits}/3
                </span>
                <span className="text-muted-foreground truncate font-mono text-[10px]">
                  {r.predicted_top3.join(", ")} → {r.actual_top3.join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA ── */}
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
