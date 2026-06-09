import { useState, useEffect } from "react";
import { fetchRaces, fetchOptimizerPerformance } from "../../lib/api";

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

const RANK_CONFIG = {
  1: { roman: "I",   rankClass: "text-gold",             borderClass: "border-gold/40"  },
  2: { roman: "II",  rankClass: "text-teal",             borderClass: "border-teal/30"  },
  3: { roman: "III", rankClass: "text-muted-foreground", borderClass: "border-border"   },
};

const BEARING_LABELS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];

function bearingLabel(deg) {
  return BEARING_LABELS[Math.round(deg / 22.5) % 16];
}

function windCategory(kmh) {
  if (kmh < 18) return "light";
  if (kmh < 28) return "moderate";
  return "heavy";
}

function confidence(recs, idx) {
  const thisScore  = recs[idx]?.predicted_score ?? 0;
  const nextScore  = recs[idx + 1]?.predicted_score ?? thisScore;
  const prevScore  = recs[idx - 1]?.predicted_score ?? thisScore;
  const topScore   = recs[0]?.predicted_score ?? 0;
  const bottomScore = recs[recs.length - 1]?.predicted_score ?? 0;
  const range      = topScore - bottomScore || 1;
  const gap        = thisScore - nextScore;
  // Normalise gap against total spread
  const normGap = gap / range;
  if (normGap >= 0.15) return "HIGH";
  if (normGap >= 0.06) return "MEDIUM";
  return "LOW";
}

const CONF_STYLE = {
  HIGH:   { label: "HIGH",   cls: "text-teal  border-teal/30  bg-teal/5"  },
  MEDIUM: { label: "MEDIUM", cls: "text-gold  border-gold/30  bg-gold/5"  },
  LOW:    { label: "LOW",    cls: "text-destructive border-destructive/30 bg-destructive/5" },
};

function BigCompass({ deg, speed }) {
  return (
    <div className="relative w-52 h-52 mx-auto">
      <div className="absolute inset-0 rounded-full border border-border bg-card flex items-center justify-center shadow-[var(--shadow-soft)]">
        <span className="absolute top-3 left-1/2 -translate-x-1/2 eyebrow !text-[8px]">N</span>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 eyebrow !text-[8px]">S</span>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 eyebrow !text-[8px]">W</span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 eyebrow !text-[8px]">E</span>

        {[0,45,90,135,180,225,270,315].map(t => (
          <div key={t} className="absolute inset-4" style={{ transform: `rotate(${t}deg)` }}>
            <div className="w-px h-2 bg-border mx-auto" />
          </div>
        ))}

        <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `rotate(${deg}deg)` }}>
          <div className="relative h-20 flex flex-col items-center">
            <div className="w-px flex-1 rounded-full" style={{ background: "var(--teal)" }} />
            <div className="w-2 h-2 rounded-full mt-0.5" style={{ background: "var(--teal)" }} />
          </div>
        </div>

        <div className="text-center z-10 pointer-events-none">
          <div className="font-display text-4xl text-ink leading-none tabular">{speed}</div>
          <div className="eyebrow !text-[8px] mt-1">KM/H</div>
        </div>
      </div>
    </div>
  );
}

export default function OptimizerPanel({ race, recommendations, onProceed }) {
  const [windHistory, setWindHistory] = useState({});

  useEffect(() => {
    if (!race || recommendations.length === 0) return;
    const currentCat = windCategory(race.avg_tws_km_h);
    const recTeams = recommendations.slice(0, 3).map(r => r.team);

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
        for (const team of recTeams) {
          let wins = 0, total = 0;
          for (const pr of perfData.races) {
            if (similarKeys.has(`${pr.event}-${pr.race_label}`)) {
              total++;
              if (pr.actual_top3.includes(team)) wins++;
            }
          }
          history[team] = { wins, total };
        }
        setWindHistory(history);
      })
      .catch(() => {});
  }, [race, recommendations]);

  if (!race) return null;

  const bearing  = bearingLabel(race.avg_twd_deg);
  const windCat  = windCategory(race.avg_tws_km_h);

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-16 space-y-12">
      {/* Conditions card */}
      <div className="rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] p-8 md:p-10 space-y-8">
        <BigCompass deg={race.avg_twd_deg} speed={race.avg_tws_km_h} />

        <div>
          <p className="eyebrow">AI Optimizer · {race.event}</p>
          <h2 className="mt-4 font-display text-5xl md:text-6xl text-ink leading-[0.92]">
            {race.event}<br />
            <span className="italic text-teal">{race.race_label.replace("_", " ")}</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-sm max-w-md leading-relaxed">
            Ridge Regression model reads {race.avg_tws_km_h} km/h {bearing} wind and surfaces the three
            highest expected-value picks from the team history in these conditions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            `${race.avg_tws_km_h} km/h`,
            `${bearing} · ${race.avg_twd_deg}°`,
            `${windCat} wind`,
            `${race.num_boats} boats`,
          ].map(tag => (
            <span key={tag} className="px-4 py-1.5 rounded-full border border-border bg-secondary text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div>
        <p className="eyebrow mb-6">Top Picks · {race.event}</p>
        <div className="hairline mb-8 origin-left" />
      </div>

      {/* Recommendation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {recommendations.slice(0, 3).map((rec, i) => {
          const rank = i + 1;
          const cfg  = RANK_CONFIG[rank];
          const conf = confidence(recommendations, i);
          const confStyle = CONF_STYLE[conf];

          return (
            <div
              key={rec.team}
              className={`rounded-sm border bg-card p-6 space-y-5 shadow-[var(--shadow-soft)] ${cfg.borderClass}`}
            >
              <div className="flex items-start justify-between">
                <span className={`font-display text-5xl leading-none ${cfg.rankClass}`}>
                  {cfg.roman}
                </span>
                <span className="eyebrow !text-[8px] border border-teal/30 text-teal rounded-full px-2 py-0.5">
                  AI pick
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xl">{FLAG[rec.team] ?? "🏴"}</span>
                <div>
                  <div className="font-display text-xl text-ink leading-tight">{FULL_NAME[rec.team] ?? rec.team}</div>
                  <div className="eyebrow !text-[8px] text-muted-foreground mt-0.5">{rec.team}</div>
                </div>
              </div>

              <div className="hairline" />

              <div>
                <p className="eyebrow !text-[8px] text-muted-foreground mb-1">Predicted score</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-4xl text-ink tabular">
                    {Math.round(rec.predicted_score)}
                  </span>
                  <span className="eyebrow !text-[8px] text-muted-foreground">pts</span>
                </div>
              </div>

              {/* Confidence */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="eyebrow !text-[8px] text-muted-foreground">Confidence</span>
                  <span className={`eyebrow !text-[8px] border rounded-full px-2 py-0.5 ${confStyle.cls}`}>
                    {confStyle.label}
                  </span>
                </div>
                <div className="h-px bg-border relative overflow-visible">
                  <div
                    className="absolute left-0 top-0 h-[2px] -translate-y-1/2 rounded-full"
                    style={{
                      background: conf === "HIGH" ? "var(--teal)" : conf === "MEDIUM" ? "var(--gold)" : "var(--destructive)",
                      width: conf === "HIGH" ? "90%" : conf === "MEDIUM" ? "55%" : "25%",
                      transition: "width 0.9s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  />
                </div>
              </div>

              {/* Why this pick — data-driven insight */}
              {(() => {
                const hist = windHistory[rec.team];
                const gapToNext = recommendations[i + 1]
                  ? Math.round(rec.predicted_score - recommendations[i + 1].predicted_score)
                  : null;
                if (hist?.total >= 2) {
                  return (
                    <p className="text-[10px] text-teal/70 leading-relaxed">
                      Top 3 in <span className="text-teal font-medium">{hist.wins}/{hist.total}</span> {windCat} wind races historically
                      {gapToNext > 0 && <span className="text-ink/40"> · +{gapToNext} pts vs field</span>}
                    </p>
                  );
                }
                if (hist?.total === 1) {
                  return (
                    <p className="text-[10px] text-ink/50 leading-relaxed">
                      {hist.wins > 0 ? "Top 3 in only similar race on record" : "Limited data in these conditions"}
                      {gapToNext > 0 && <span className="text-ink/40"> · +{gapToNext} pts vs field</span>}
                    </p>
                  );
                }
                return (
                  <p className="text-[10px] text-ink/50 leading-relaxed">
                    {gapToNext > 0
                      ? `${gapToNext} pts ahead of next team in ${windCat} conditions`
                      : `Model's #${i + 1} pick for ${race.avg_tws_km_h} km/h ${bearing} wind`}
                  </p>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onProceed}
          className="group inline-flex items-center gap-4 bg-ink text-cream pl-7 pr-2 py-2 rounded-full text-sm"
        >
          Adjust picks
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
