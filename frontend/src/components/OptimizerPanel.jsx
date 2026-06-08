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

const RANK_STYLE = {
  1: { color: "#f59e0b", border: "border-yellow-500/60" },
  2: { color: "#9ca3af", border: "border-white/20" },
  3: { color: "#f97316", border: "border-orange-500/60" },
};

function BigCompass({ deg, speed }) {
  return (
    <div className="relative w-52 h-52 mx-auto">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.03) 60%, transparent 100%)" }} />

      {/* Circle */}
      <div className="absolute inset-2 rounded-full border border-white/10 flex items-center justify-center"
        style={{ background: "radial-gradient(circle at 40% 40%, #1a2535, #0d1220)" }}>

        {/* Cardinal labels */}
        <span className="absolute top-3 left-1/2 -translate-x-1/2 text-xs text-white/50 font-bold">N</span>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/50 font-bold">S</span>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/50 font-bold">W</span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50 font-bold">E</span>

        {/* Rotating needle */}
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${deg}deg)` }}>
          <svg width="60" height="80" viewBox="0 0 60 80" className="absolute"
            style={{ top: "50%", left: "50%", transform: `rotate(${deg}deg) translate(-50%, -80%)`, transformOrigin: "0 80%" }}>
            <polygon points="30,0 10,80 30,65 50,80" fill="#00d4ff" opacity="0.9" />
          </svg>
        </div>

        {/* Center speed */}
        <div className="text-center z-10">
          <div className="text-3xl font-black text-white">{speed}</div>
          <div className="text-xs text-slate-400 tracking-widest">KM/H</div>
        </div>
      </div>
    </div>
  );
}

export default function OptimizerPanel({ race, recommendations, onProceed }) {
  if (!race) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Main info card */}
      <div className="rounded-2xl border border-white/10 p-8 space-y-6" style={{ background: "#111827" }}>
        <BigCompass deg={race.avg_twd_deg} speed={race.avg_tws_km_h} />

        <div className="space-y-2">
          <p className="text-xs tracking-widest text-slate-500 uppercase">
            AI OPTIMIZER • {race.event.toUpperCase()} RACE
          </p>
          <h2 className="text-4xl font-black text-white">{race.event} • {race.race_label}</h2>
          <p className="text-slate-400 text-sm max-w-lg">
            Conditions analysed against historical race data. Our model surfaced the three
            highest expected-value picks for this wind profile.
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {[
            `${race.avg_tws_km_h} KM/H`,
            `${race.avg_twd_deg}° BEARING`,
            `${race.num_boats} BOATS`,
          ].map(tag => (
            <span key={tag} className="px-3 py-1 rounded-full border border-white/15 text-xs text-slate-300"
              style={{ background: "#1e2a3a" }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Recommendation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {recommendations.slice(0, 3).map((rec, i) => {
          const rank = i + 1;
          const style = RANK_STYLE[rank];
          return (
            <div key={rec.team}
              className={`rounded-2xl border p-5 space-y-4 ${style.border}`}
              style={{ background: "#111827" }}>
              {/* Rank + badge */}
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black" style={{ color: style.color }}>#{rank}</span>
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(0,212,255,0.15)", color: "#00d4ff" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  AI REC
                </span>
              </div>

              {/* Team */}
              <div className="flex items-center gap-2">
                <span className="text-2xl">{FLAG[rec.team] ?? "🏴"}</span>
                <span className="font-bold text-white">{FULL_NAME[rec.team] ?? rec.team}</span>
              </div>

              <div className="border-t border-white/10 pt-3">
                <p className="text-xs tracking-widest text-slate-500 mb-1">PREDICTED SCORE</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black" style={{ color: "#00d4ff" }}>
                    {Math.round(rec.predicted_score)}
                  </span>
                  <span className="text-slate-400 text-sm">pts</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="text-center pt-2">
        <button
          onClick={onProceed}
          className="px-10 py-4 rounded-full font-black text-slate-900 text-sm tracking-widest transition-all hover:scale-105"
          style={{ background: "#00d4ff" }}>
          BUILD MY TEAM →
        </button>
      </div>
    </div>
  );
}
