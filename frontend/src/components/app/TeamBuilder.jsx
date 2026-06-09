import { useState, useEffect } from "react";
import { fetchScore, fetchRaces, fetchOptimizerPerformance } from "../../lib/api";

function windCategory(kmh) {
  if (kmh < 18) return "light";
  if (kmh < 28) return "moderate";
  return "heavy";
}

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

export default function TeamBuilder({ race, recommendations, onConfirm, initialSelected = [] }) {
  const [selected, setSelected] = useState(() => initialSelected.slice(0, 3));
  const [loading, setLoading] = useState(false);
  const [scoreError, setScoreError] = useState(null);
  const [windHistory, setWindHistory] = useState({});

  useEffect(() => {
    if (!race || recommendations.length === 0) return;
    const currentCat = windCategory(race.avg_tws_km_h);
    const recTeamList = recommendations.map(r => r.team);

    Promise.all([fetchRaces(), fetchOptimizerPerformance()])
      .then(([allRaces, perfData]) => {
        const similarKeys = new Set(
          allRaces
            .filter(r =>
              windCategory(r.avg_tws_km_h) === currentCat &&
              !(r.event === race.event && r.race_label === race.race_label)
            )
            .map(r => `${r.event}-${r.race_label}`)
        );

        const history = {};
        for (const team of recTeamList) {
          let wins = 0, total = 0;
          for (const pr of perfData.races) {
            if (similarKeys.has(`${pr.event}-${pr.race_label}`)) {
              total++;
              if (pr.actual_top3.includes(team)) wins++;
            }
          }
          history[team] = { wins, total, category: currentCat };
        }
        setWindHistory(history);
      })
      .catch(() => {});
  }, [race, recommendations]);

  if (!race) return null;

  const recTeams = new Set(recommendations.map(r => r.team));
  const recByTeam = Object.fromEntries(recommendations.map(r => [r.team, r]));

  function toggle(team) {
    if (selected.includes(team)) {
      setSelected(selected.filter(t => t !== team));
    } else if (selected.length < 3) {
      setSelected([...selected, team]);
    }
  }

  async function handleRunRace() {
    setScoreError(null);
    setLoading(true);
    try {
      const result = await fetchScore(race.event, race.race_label, selected);
      onConfirm(selected, result);
    } catch (e) {
      setScoreError("Scoring failed — check the backend is running and try again.");
      setLoading(false);
    }
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
        <div className={`flex items-center gap-3 rounded-sm border px-4 py-3 ${
          selected.length === 3 && selected.every(t => recTeams.has(t))
            ? "border-teal/20 bg-teal/5"
            : "border-border bg-secondary/20"
        }`}>
          <span className="inline-block w-2 h-2 rounded-full bg-teal shrink-0" />
          <span className="text-sm text-ink/70">
            {selected.length === 3 && selected.every(t => recTeams.has(t))
              ? <>AI lineup pre-loaded — <span className="text-teal">run as-is</span>, or swap any pick below.</>
              : <>Teams with a <span className="text-teal">teal border</span> are AI-recommended.</>
            }
          </span>
        </div>
      )}

      {/* Team grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {race.teams.map(team => {
          const isSelected = selected.includes(team);
          const isRec = recTeams.has(team);
          const isDisabled = !isSelected && selected.length === 3;
          const rec = recByTeam[team];

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

              {rec && (
                <div className="mt-3 pt-2 border-t border-border/60 space-y-1.5">
                  <div className="flex items-baseline gap-1">
                    <span className="eyebrow !text-[7px] text-muted-foreground">Predicted</span>
                    <span className="font-display text-base text-teal tabular">{Math.round(rec.predicted_score ?? rec.predicted_pts ?? 0)}</span>
                    <span className="eyebrow !text-[7px] text-muted-foreground">pts</span>
                  </div>
                  {windHistory[team]?.total > 0 && (
                    <p className="text-[9px] text-ink/45 leading-snug">
                      Top 3 in <span className="text-ink/65">{windHistory[team].wins}/{windHistory[team].total}</span> {windHistory[team].category} wind races
                    </p>
                  )}
                </div>
              )}

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gold" />
              )}
            </button>
          );
        })}
      </div>

      {/* Score error */}
      {scoreError && (
        <div className="rounded-sm border border-destructive/30 bg-destructive/5 px-6 py-4 flex items-start gap-3">
          <span className="text-destructive mt-0.5">⚠</span>
          <div>
            <p className="eyebrow !text-[9px] text-destructive">Scoring Error</p>
            <p className="text-sm text-ink/70 mt-1">{scoreError}</p>
          </div>
        </div>
      )}

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
