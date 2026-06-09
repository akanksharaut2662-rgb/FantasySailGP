import { useState } from "react";
import { fetchScore } from "../../lib/api";

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

function BoatIcon({ selected, recommended }) {
  return (
    <svg viewBox="0 0 60 60" className="w-12 h-12 mx-auto mb-3" fill="none">
      <polygon
        points="30,4 30,46 8,46"
        style={{ fill: "var(--teal)" }}
        opacity={selected ? "1" : recommended ? "0.45" : "0.15"}
      />
      <polygon
        points="30,12 30,42 50,42"
        style={{ fill: "var(--ink)" }}
        opacity={selected ? "0.6" : recommended ? "0.25" : "0.08"}
      />
      <ellipse
        cx="30" cy="50" rx="22" ry="6"
        style={{ fill: "var(--ink)" }}
        opacity={selected ? "0.8" : recommended ? "0.3" : "0.12"}
      />
    </svg>
  );
}

export default function TeamBuilder({ race, recommendations, onConfirm }) {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!race) return null;

  const recTeams = new Set(recommendations.map(r => r.team));

  function toggle(team) {
    if (selected.includes(team)) {
      setSelected(selected.filter(t => t !== team));
    } else if (selected.length < 3) {
      setSelected([...selected, team]);
    }
  }

  async function handleRunRace() {
    setLoading(true);
    const result = await fetchScore(race.event, race.race_label, selected);
    onConfirm(selected, result);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-16 space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">{race.event} · {race.race_label.replace("_", " ")}</p>
          <h2 className="mt-4 font-display text-5xl md:text-6xl text-ink leading-[0.92]">
            Build your<br />
            <span className="italic text-teal">lineup.</span>
          </h2>
        </div>

        <div className="border border-border rounded-full px-5 py-2.5 bg-card shadow-[var(--shadow-soft)] shrink-0">
          <span className="font-display text-2xl text-ink tabular">{selected.length}</span>
          <span className="font-display text-2xl text-ink/25 tabular"> / 3</span>
          <span className="eyebrow !text-[8px] ml-2 text-muted-foreground">selected</span>
        </div>
      </div>

      <div className="hairline" />

      {/* AI recommendation note */}
      {recTeams.size > 0 && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-teal shrink-0" />
          <span>Teams with a <span className="text-teal">teal border</span> are AI-recommended for this race.</span>
        </div>
      )}

      {/* Team grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {race.teams.map(team => {
          const isSelected = selected.includes(team);
          const isRec = recTeams.has(team);
          const isDisabled = !isSelected && selected.length === 3;

          return (
            <button
              key={team}
              onClick={() => toggle(team)}
              disabled={isDisabled}
              className={`relative p-5 rounded-sm border text-left transition-all duration-200 w-full bg-card
                ${isSelected
                  ? "border-gold shadow-[var(--shadow-soft)]"
                  : isRec
                  ? "border-teal/40 hover:border-teal/70"
                  : "border-border hover:border-teal/30"}
                ${isDisabled ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {isRec && (
                <span className="absolute top-2.5 right-2.5 eyebrow !text-[7px] border border-teal/40 text-teal rounded-full px-1.5 py-0.5">
                  AI
                </span>
              )}

              <BoatIcon selected={isSelected} recommended={isRec} />

              <div className="flex items-center gap-2">
                <span className="text-lg">{FLAG[team] ?? "🏴"}</span>
                <div>
                  <div className="font-display text-lg text-ink leading-tight">{team}</div>
                  <div className="eyebrow !text-[8px] text-muted-foreground mt-0.5">{FULL_NAME[team] ?? team}</div>
                </div>
              </div>

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gold" />
              )}
            </button>
          );
        })}
      </div>

      {/* CTA */}
      {selected.length === 3 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleRunRace}
            disabled={loading}
            className="group inline-flex items-center gap-4 bg-ink text-cream pl-7 pr-2 py-2 rounded-full text-sm disabled:opacity-60"
          >
            {loading ? "Scoring race…" : "Run the race"}
            <span className="h-11 w-11 rounded-full bg-gold text-ink grid place-items-center group-hover:bg-gold/80 transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
