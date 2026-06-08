/**
 * Leaderboard.jsx
 * Step 5: Full leaderboard ranked by total_pts.
 * Highlights user picks (solid border) and optimizer picks (dashed border).
 */

const FLAG_EMOJIS = {
  AUS: "🇦🇺", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", NZL: "🇳🇿",
  SUI: "🇨🇭", USA: "🇺🇸", SWE: "🇸🇪", JPN: "🇯🇵",
};

const RANK_BG = ["bg-yellow-500/10 border-yellow-500/30", "bg-slate-400/10 border-slate-400/30", "bg-amber-700/10 border-amber-700/30"];

export default function Leaderboard({ scoreResult, recommendations, onReset }) {
  if (!scoreResult) return null;

  const userSet = new Set(scoreResult.user_teams);
  const recSet = new Set((recommendations?.recommendations ?? []).map((r) => r.team));
  const sorted = [...scoreResult.leaderboard].sort((a, b) => b.total_pts - a.total_pts);

  return (
    <div className="animate-fadeUp max-w-2xl mx-auto">
      <p className="text-xs text-white/30 mb-6">
        {scoreResult.event} › {scoreResult.race_label.replace("_", " ")} › Leaderboard
      </p>

      {/* Hero score */}
      <div className="card p-6 mb-6 text-center border-ocean-500/30 bg-ocean-500/10">
        <p className="text-white/50 text-sm mb-1">Your team scored</p>
        <p className="text-6xl font-black gradient-text mb-2">{scoreResult.user_total_score}</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {scoreResult.user_teams.map((t) => (
            <span key={t} className="badge badge-blue">
              {FLAG_EMOJIS[t] ?? "🏳"} {t}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-white/40 mb-4">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-ocean-400 bg-ocean-500/20" /> Your pick
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-dashed border-sail-teal" /> AI pick
        </span>
      </div>

      {/* Table */}
      <div className="space-y-2 mb-8">
        {sorted.map((row, idx) => {
          const isUser = userSet.has(row.team);
          const isRec = recSet.has(row.team);
          const rankBg = idx < 3 ? RANK_BG[idx] : "bg-white/3 border-white/8";

          return (
            <div
              key={row.team}
              className={`flex items-center gap-4 p-3 rounded-xl border transition-all
                ${rankBg}
                ${isUser ? "border-ocean-400 bg-ocean-500/15 shadow shadow-ocean-500/10" : ""}
                ${isRec && !isUser ? "border-dashed border-sail-teal/40" : ""}
              `}
            >
              {/* Rank */}
              <span className="w-6 text-center text-sm font-bold text-white/40">
                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
              </span>

              {/* Flag + team */}
              <span className="text-xl">{FLAG_EMOJIS[row.team] ?? "🏳"}</span>
              <span className="flex-1 font-semibold text-sm">
                {row.team}
                {isUser && <span className="ml-1.5 text-ocean-300 text-xs">● you</span>}
                {isRec && <span className="ml-1.5 text-sail-teal text-xs">⭐ AI</span>}
              </span>

              {/* Category breakdown (compact) */}
              <div className="hidden sm:flex gap-2 text-xs text-white/30">
                <span title="Position">🏆{row.position_pts}</span>
                <span title="Speed">💨{row.speed_pts}</span>
                <span title="Overtakes">⚡{row.overtake_pts}</span>
                <span title="Clean">✅{row.clean_sailing_pts}</span>
                <span title="VMG">🎯{row.vmg_pts}</span>
              </div>

              {/* Total */}
              <span className={`font-black text-lg ${isUser ? "text-ocean-300" : "text-white/70"}`}>
                {row.total_pts}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button onClick={onReset} className="btn-secondary text-base px-7 py-3">
          ← Try Another Race
        </button>
      </div>
    </div>
  );
}
