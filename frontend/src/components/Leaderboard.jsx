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

function RankCell({ rank }) {
  if (rank === 1) return <span className="text-xl">🏆</span>;
  return <span className="text-sm font-bold text-slate-400">#{rank}</span>;
}

export default function Leaderboard({ result, onReset }) {
  if (!result) return null;

  const sorted = [...result.leaderboard].sort((a, b) => b.total_pts - a.total_pts);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Your score hero */}
      <div className="rounded-2xl border border-cyan-400/30 p-8 text-center"
        style={{ background: "#111827" }}>
        <p className="text-xs tracking-widest text-slate-500 uppercase mb-2">Your Team Scored</p>
        <div className="text-8xl font-black leading-none"
          style={{ color: "#00d4ff", textShadow: "0 0 60px rgba(0,212,255,0.6)" }}>
          {result.user_total_score}
        </div>
        <span className="text-2xl font-bold text-slate-400">pts</span>
      </div>

      {/* Leaderboard table */}
      <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "#111827" }}>
        {/* Table header */}
        <div className="grid grid-cols-[60px_1fr_48px_48px_48px_64px_48px_64px] px-5 py-3 border-b border-white/10">
          {["RANK", "TEAM", "POS", "SPD", "OT", "CLEAN", "VMG", "TOTAL"].map(h => (
            <span key={h} className="text-xs text-slate-500 font-semibold tracking-wider">{h}</span>
          ))}
        </div>

        {/* Rows */}
        {sorted.map((row, i) => (
          <div
            key={row.team}
            className={`grid grid-cols-[60px_1fr_48px_48px_48px_64px_48px_64px] px-5 py-4 border-b border-white/5 items-center
              ${row.is_user_pick ? "bg-cyan-400/5" : ""}`}
          >
            <div><RankCell rank={i + 1} /></div>

            <div className="flex items-center gap-2">
              <span className="text-lg">{FLAG[row.team] ?? "🏴"}</span>
              <div>
                <div className="font-black text-white text-sm">{row.team}</div>
                <div className="text-xs text-slate-500">{FULL_NAME[row.team] ?? row.team}</div>
              </div>
              {row.is_user_pick && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "rgba(0,212,255,0.15)", color: "#00d4ff" }}>
                  YOUR PICK
                </span>
              )}
            </div>

            <span className="text-sm text-slate-300">{row.position_pts}</span>
            <span className="text-sm text-slate-300">{row.speed_pts}</span>
            <span className="text-sm text-slate-300">{row.overtake_pts}</span>
            <span className="text-sm text-slate-300">{row.clean_sailing_pts}</span>
            <span className="text-sm text-slate-300">{row.vmg_pts}</span>
            <span className="text-sm font-black" style={{ color: "#00d4ff" }}>{row.total_pts}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="px-10 py-4 rounded-full font-black text-sm tracking-widest border border-white/20 text-white transition-all hover:border-cyan-400 hover:text-cyan-400"
          style={{ background: "transparent" }}>
          TRY ANOTHER RACE →
        </button>
      </div>
    </div>
  );
}
