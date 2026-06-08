/**
 * TeamBuilder.jsx
 * Step 3: User selects up to 3 teams from available teams for this race.
 * Highlights optimizer-recommended teams with a star badge.
 */

const FLAG_EMOJIS = {
  AUS: "🇦🇺", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", NZL: "🇳🇿",
  SUI: "🇨🇭", USA: "🇺🇸", SWE: "🇸🇪", JPN: "🇯🇵",
};

const FULL_NAMES = {
  AUS: "Australia", CAN: "Canada",      DEN: "Denmark",      ESP: "Spain",
  FRA: "France",    GBR: "Great Britain", GER: "Germany",    NZL: "New Zealand",
  SUI: "Switzerland", USA: "United States", SWE: "Sweden",  JPN: "Japan",
};

const MAX_PICKS = 3;

export default function TeamBuilder({ race, recommendations, selected, onToggle, onRunRace }) {
  const teams = race.teams;
  const recTeams = new Set((recommendations?.recommendations ?? []).map((r) => r.team));

  const canSelect = (team) => selected.has(team) || selected.size < MAX_PICKS;

  return (
    <div className="animate-fadeUp max-w-3xl mx-auto">
      <p className="text-xs text-white/30 mb-6">
        {race.event} › {race.race_label.replace("_", " ")} › Team Builder
      </p>

      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="section-title mb-1">Pick Your Team</h2>
          <p className="section-sub">
            Select up to {MAX_PICKS} teams.{" "}
            <span className="text-sail-teal">⭐ Starred</span> = optimizer pick.
          </p>
        </div>
        <span
          className={`text-2xl font-black ${
            selected.size === MAX_PICKS ? "text-sail-lime" : "text-white/50"
          }`}
        >
          {selected.size} / {MAX_PICKS}
        </span>
      </div>

      {/* Team grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {teams.map((team) => {
          const isSelected = selected.has(team);
          const isRec = recTeams.has(team);
          const disabled = !canSelect(team);

          return (
            <button
              key={team}
              onClick={() => !disabled && onToggle(team)}
              disabled={disabled && !isSelected}
              className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-center
                ${isSelected
                  ? "border-ocean-400 bg-ocean-500/20 shadow-lg shadow-ocean-500/20 scale-[1.03]"
                  : disabled
                    ? "border-white/5 bg-white/3 opacity-40 cursor-not-allowed"
                    : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10 hover:scale-[1.02] cursor-pointer"
                }`}
            >
              {/* Rec star */}
              {isRec && (
                <span className="absolute top-2 right-2 text-sail-teal text-sm" title="Optimizer pick">⭐</span>
              )}
              {/* Selected check */}
              {isSelected && (
                <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-ocean-500 flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
              )}

              <div className="text-3xl mb-2">{FLAG_EMOJIS[team] ?? "🏳"}</div>
              <p className="font-bold text-sm">{team}</p>
              <p className="text-xs text-white/40 mt-0.5 leading-tight">
                {FULL_NAMES[team] ?? team}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selection summary */}
      {selected.size > 0 && (
        <div className="card p-4 mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-white/40 mr-2">Your picks:</span>
          {[...selected].map((t) => (
            <span key={t} className="badge badge-blue gap-1">
              {FLAG_EMOJIS[t] ?? "🏳"} {t}
              <button
                onClick={() => onToggle(t)}
                className="ml-1 text-white/40 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onRunRace}
          disabled={selected.size === 0}
          className={selected.size > 0 ? "btn-primary text-base px-7 py-3" : "btn-disabled text-base px-7 py-3"}
        >
          Run Race →
        </button>
      </div>
    </div>
  );
}
