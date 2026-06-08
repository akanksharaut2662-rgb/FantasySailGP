/**
 * RaceScoring.jsx
 * Step 4: Show scoring breakdown for user's selected teams.
 */

const CATEGORY_META = [
  { key: "position_pts",     label: "Finishing Position", icon: "🏆", max: 50,  color: "from-yellow-500 to-amber-400" },
  { key: "speed_pts",        label: "Wind-Norm Speed",    icon: "💨", max: 20,  color: "from-ocean-400 to-sail-teal" },
  { key: "overtake_pts",     label: "Overtakes",          icon: "⚡", max: 25,  color: "from-sail-coral to-orange-400" },
  { key: "clean_sailing_pts",label: "Clean Sailing",      icon: "✅", max: 15,  color: "from-sail-lime to-emerald-400" },
  { key: "vmg_pts",          label: "VMG Consistency",    icon: "🎯", max: 15,  color: "from-purple-400 to-violet-500" },
];

const STATUS_LABEL = { 2: "Racing", 3: "Finished", 4: "DNS", 5: "DNF", 6: "DSQ", 7: "OCS", 8: "DNC" };

const FLAG_EMOJIS = {
  AUS: "🇦🇺", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", NZL: "🇳🇿",
  SUI: "🇨🇭", USA: "🇺🇸", SWE: "🇸🇪", JPN: "🇯🇵",
};

function ScoreBar({ value, max, colorClass }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="progress-bar flex-1">
      <div
        className={`progress-fill bg-gradient-to-r ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function TeamScoreCard({ row }) {
  const statusLabel = STATUS_LABEL[row.status] ?? "Unknown";
  const isFinished = row.status === 3;

  return (
    <div className="card p-5 animate-fadeUp">
      {/* Team header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{FLAG_EMOJIS[row.team] ?? "🏳"}</span>
          <div>
            <p className="font-black text-xl">{row.team}</p>
            <span className={`badge mt-0.5 ${isFinished ? "badge-teal" : "badge-coral"}`}>
              {statusLabel}
              {row.final_rank && ` · P${row.final_rank}`}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black gradient-text">{row.total_pts}</p>
          <p className="text-xs text-white/40">total pts</p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="space-y-2.5">
        {CATEGORY_META.map(({ key, label, icon, max, color }) => (
          <div key={key} className="flex items-center gap-3 text-sm">
            <span className="w-5 text-center text-base">{icon}</span>
            <span className="w-32 text-white/50 text-xs truncate">{label}</span>
            <ScoreBar value={row[key]} max={max} colorClass={color} />
            <span className="w-10 text-right font-semibold text-white/80">{row[key]}</span>
            <span className="text-white/25 text-xs">/{max}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RaceScoring({ scoreResult, onContinue }) {
  if (!scoreResult) return null;

  const userRows = scoreResult.leaderboard.filter((r) => r.is_user_pick);

  return (
    <div className="animate-fadeUp max-w-2xl mx-auto">
      <p className="text-xs text-white/30 mb-6">
        {scoreResult.event} › {scoreResult.race_label.replace("_", " ")} › Results
      </p>

      {/* Total score banner */}
      <div className="card p-6 mb-6 text-center border-ocean-500/30 bg-ocean-500/10">
        <p className="text-white/50 text-sm mb-1">Your team scored</p>
        <p className="text-6xl font-black gradient-text">{scoreResult.user_total_score}</p>
        <p className="text-white/40 text-sm mt-1">combined fantasy points</p>
      </div>

      <h2 className="section-title mb-5">Score Breakdown</h2>

      <div className="space-y-4 mb-8">
        {userRows.map((row) => (
          <TeamScoreCard key={row.team} row={row} />
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={onContinue} className="btn-primary text-base px-7 py-3">
          View Full Leaderboard →
        </button>
      </div>
    </div>
  );
}
