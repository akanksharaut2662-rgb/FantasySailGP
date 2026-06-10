import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { fetchOptimizerPerformance, fetchRaces, fetchFeatureImportance } from "../lib/api";

export const Route = createFileRoute("/model")({
  head: () => ({
    meta: [{ title: "Model Intelligence — SailGP Fantasy Predictor" }],
  }),
  component: ModelPage,
});

const FLAG: Record<string, string> = {
  AUS: "🇦🇺", BRA: "🇧🇷", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", ITA: "🇮🇹", NZL: "🇳🇿",
  SUI: "🇨🇭", SWE: "🇸🇪", USA: "🇺🇸",
};

// Example wind directions to plot on the unit circle
const WIND_EXAMPLES = [
  { deg: 5,   label: "5°",  note: "Nearly North" },
  { deg: 180, label: "180°",note: "South"         },
  { deg: 355, label: "355°",note: "Almost North"  },
];

function UnitCircle() {
  const cx = 140, cy = 140, r = 100;
  const toXY = (deg: number) => {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  // sin/cos encoded positions for each example
  const examples = WIND_EXAMPLES.map(e => ({ ...e, ...toXY(e.deg) }));

  return (
    <div className="flex flex-col items-center gap-6">
      <svg viewBox="0 0 280 280" className="w-full max-w-[280px]">
        {/* Background */}
        <circle cx={cx} cy={cy} r={r + 20} fill="oklch(0.94 0.012 90)" />
        {/* Unit circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="1.5" />
        {/* Axis lines */}
        <line x1={cx - r - 16} y1={cy} x2={cx + r + 16} y2={cy} stroke="var(--border)" strokeWidth="0.8" />
        <line x1={cx} y1={cy - r - 16} x2={cx} y2={cy + r + 16} stroke="var(--border)" strokeWidth="0.8" />
        {/* Axis labels */}
        <text x={cx + r + 18} y={cy + 4} fontSize="9" fontFamily="Inter, sans-serif" fill="var(--muted-foreground)" letterSpacing="0.1em">cos θ</text>
        <text x={cx - 16} y={cy - r - 18} fontSize="9" fontFamily="Inter, sans-serif" fill="var(--muted-foreground)" letterSpacing="0.1em">sin θ</text>
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2} fill="var(--ink)" />

        {/* Wind direction points */}
        {examples.map((e, i) => {
          const colors = ["var(--gold)", "var(--teal)", "oklch(0.55 0.18 28)"];
          return (
            <g key={i}>
              {/* Line from center to point */}
              <line x1={cx} y1={cy} x2={e.x} y2={e.y} stroke={colors[i]} strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
              {/* Point */}
              <circle cx={e.x} cy={e.y} r="5" fill={colors[i]} opacity="0.9" />
              {/* Label */}
              <text
                x={e.x + (e.x > cx ? 8 : -8)}
                y={e.y + (e.y > cy ? 12 : -6)}
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fill={colors[i]}
                textAnchor={e.x > cx ? "start" : "end"}
              >
                {e.label}
              </text>
            </g>
          );
        })}

        {/* Highlight: 5° and 355° are close */}
        <path
          d={`M ${toXY(355).x} ${toXY(355).y} A ${r} ${r} 0 0 1 ${toXY(5).x} ${toXY(5).y}`}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
        />
        <text x={cx + r - 8} y={cy - r + 10} fontSize="9" fontFamily="Inter, sans-serif" fill="var(--gold)" opacity="0.8" textAnchor="middle">10° apart</text>
      </svg>
      <div className="text-center max-w-xs">
        <p className="text-xs text-ink/70 leading-relaxed">
          <span className="text-gold font-medium">355° and 5° are only 10° apart</span> — but raw degree subtraction gives 350°.
          Encoding as <span className="font-mono text-ink">sin(θ), cos(θ)</span> places both on the unit circle, correctly treating them as nearly identical conditions.
        </p>
      </div>
    </div>
  );
}

interface TeamWeight { team: string; coefficient: number; }
interface WindWeight  { name: string; label: string; coefficient: number; }
interface FeatureData { team_weights: TeamWeight[]; wind_weights: WindWeight[]; }

function FeatureChart({ data }: { data: FeatureData }) {
  const teams = data.team_weights;
  const maxCoef = Math.max(...teams.map(t => Math.abs(t.coefficient)));

  return (
    <div className="space-y-10">
      {/* Team base-skill weights */}
      <div className="rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <p className="eyebrow !text-[9px]">Team base-skill coefficients</p>
          <p className="text-xs text-ink/55 mt-1">
            Holding wind constant — higher coefficient means the model learned this team as historically stronger.
          </p>
        </div>
        <div className="divide-y divide-border/50">
          {teams.map((t, i) => {
            const pct = (Math.abs(t.coefficient) / maxCoef) * 100;
            const isPositive = t.coefficient >= 0;
            return (
              <div key={t.team} className="flex items-center gap-4 px-6 py-3">
                <span className="w-5 font-display text-sm text-ink/40 tabular shrink-0">{i + 1}</span>
                <span className="text-base shrink-0">{FLAG[t.team] ?? "🏴"}</span>
                <span className="eyebrow !text-[9px] w-8 shrink-0">{t.team}</span>
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: isPositive ? "var(--teal)" : "var(--destructive)",
                      transitionDelay: `${i * 40}ms`,
                    }}
                  />
                </div>
                <span className={`font-display text-sm tabular w-12 text-right shrink-0 ${isPositive ? "text-teal" : "text-destructive"}`}>
                  {t.coefficient > 0 ? "+" : ""}{t.coefficient}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wind feature weights */}
      <div className="rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] p-6 space-y-6">
        <div>
          <p className="eyebrow !text-[9px]">Wind feature coefficients</p>
          <p className="text-xs text-ink/55 mt-1">
            How much wind speed and direction shift the model's score prediction (per scaled unit).
          </p>
        </div>
        <div className="space-y-4">
          {data.wind_weights.map((w) => {
            const maxWind = Math.max(...data.wind_weights.map(x => Math.abs(x.coefficient)));
            const pct = maxWind > 0 ? (Math.abs(w.coefficient) / maxWind) * 100 : 0;
            const isPos = w.coefficient >= 0;
            return (
              <div key={w.name} className="flex items-center gap-4">
                <span className="font-mono text-[10px] text-ink/60 w-28 shrink-0">{w.label}</span>
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: "var(--gold)" }}
                  />
                </div>
                <span className={`font-display text-sm tabular w-12 text-right shrink-0 ${isPos ? "text-gold" : "text-ink/60"}`}>
                  {w.coefficient > 0 ? "+" : ""}{w.coefficient}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-ink/40 leading-relaxed">
          Coefficients are on scaled inputs (mean=0, std=1). Magnitude indicates predictive importance; sign indicates direction.
        </p>
      </div>
    </div>
  );
}

interface RacePerf {
  race_label: string;
  event: string;
  predicted_top3: string[];
  actual_top3: string[];
  hits: number;
}

interface PerfResponse {
  bermuda_rmse: number;
  races: RacePerf[];
}

function ModelPage() {
  const [perf, setPerf] = useState<PerfResponse | null>(null);
  const [races, setRaces] = useState<any[]>([]);
  const [perfLoading, setPerfLoading] = useState(true);
  const [perfError, setPerfError] = useState<string | null>(null);
  const [features, setFeatures] = useState<FeatureData | null>(null);

  useEffect(() => {
    fetchOptimizerPerformance()
      .then((d: PerfResponse) => { setPerf(d); setPerfLoading(false); })
      .catch(() => { setPerfError("Model not trained — run: cd backend && python train_model.py"); setPerfLoading(false); });

    fetchRaces()
      .then((d: any[]) => setRaces(d))
      .catch(() => {});

    fetchFeatureImportance()
      .then((d: FeatureData) => setFeatures(d))
      .catch(() => {});
  }, []);

  const bermudaRaces = perf?.races?.filter(r => r.event === "Bermuda") ?? [];
  const halifaxRaces = perf?.races?.filter(r => r.event === "Halifax") ?? [];
  const totalHits = perf?.races?.reduce((a, r) => a + r.hits, 0) ?? 0;
  const totalRaces = perf?.races?.length ?? 0;

  // Sample data for "The Data" section
  const sampleRaces = races.slice(0, 5).map(r => ({
    event: r.event,
    race: r.race_label,
    wind_kmh: r.avg_tws_km_h,
    wind_deg: r.avg_twd_deg,
    boats: r.num_boats,
  }));

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Race photo background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
        <img
          src="/race-bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.60 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(3,6,18,0.70) 0%, rgba(3,6,18,0.20) 40%, rgba(3,6,18,0.78) 100%)",
          }}
        />
      </div>
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-7xl px-6 md:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="font-display text-3xl leading-none text-ink italic">B</div>
            <div className="flex flex-col leading-none">
              <span className="eyebrow !text-[9px]">SailGP</span>
              <span className="font-display text-base text-ink">Fantasy</span>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/app" className="eyebrow !text-[10px] text-muted-foreground hover:text-ink transition-colors">
              Build Team
            </Link>
            <span className="eyebrow !text-[10px] text-gold">Model Intel</span>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-24 max-w-5xl mx-auto px-6 md:px-10 space-y-24">
        {/* Hero */}
        <div>
          <p className="eyebrow">ML Intelligence</p>
          <h1 className="mt-6 font-display text-6xl md:text-8xl text-ink leading-[0.9]">
            Inside the<br />
            <span className="italic text-teal">model.</span>
          </h1>
          <p className="mt-8 text-ink/70 max-w-lg leading-relaxed">
            Ridge Regression trained on real SailGP telemetry — GPS tracks, wind conditions, team performance.
            Trained on Halifax 2024, validated on Bermuda 2026 out-of-sample.
          </p>
        </div>

        {/* Section A — The Data */}
        <section className="space-y-8">
          <div>
            <p className="eyebrow">Section A</p>
            <h2 className="mt-4 font-display text-4xl text-ink">The Dataset</h2>
            <p className="mt-4 text-sm text-ink/70 max-w-lg leading-relaxed">
              Real SailGP telemetry ingested from Halifax 2024 (training) and Bermuda 2026 (test).
              Every row is one race with measured conditions and real scoring outcomes.
            </p>
          </div>
          {sampleRaces.length > 0 ? (
            <div className="rounded-sm border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 border-b border-border">
                  <tr>
                    {["Event", "Race", "Wind (km/h)", "Direction (°)", "Boats"].map(h => (
                      <th key={h} className="text-left px-5 py-3 eyebrow !text-[9px] text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sampleRaces.map((r, i) => (
                    <tr key={i} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-3 font-display text-ink">{r.event}</td>
                      <td className="px-5 py-3 font-mono text-xs text-ink/70">{r.race.replace("_", " ")}</td>
                      <td className="px-5 py-3 tabular text-ink">{r.wind_kmh}</td>
                      <td className="px-5 py-3 tabular text-ink">{r.wind_deg}°</td>
                      <td className="px-5 py-3 tabular text-ink">{r.boats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 bg-secondary/20 border-t border-border">
                <span className="eyebrow !text-[9px] text-muted-foreground">{races.length} total races in dataset</span>
              </div>
            </div>
          ) : (
            <div className="rounded-sm border border-border p-8 text-center">
              <p className="eyebrow animate-pulse">Loading race data…</p>
            </div>
          )}
        </section>

        <div className="hairline" />

        {/* Section B — Feature Importance */}
        {features && (
          <>
            <section className="space-y-8">
              <div>
                <p className="eyebrow">Section B</p>
                <h2 className="mt-4 font-display text-4xl text-ink">What the Model Learned</h2>
                <p className="mt-4 text-sm text-ink/70 max-w-lg leading-relaxed">
                  Live Ridge Regression coefficients extracted from the trained model.
                  Team weights show each team's learned base-skill; wind weights show how conditions shift predictions.
                </p>
              </div>
              <FeatureChart data={features} />
            </section>
            <div className="hairline" />
          </>
        )}

        {/* Section C — Feature Engineering */}
        <section className="space-y-8">
          <div>
            <p className="eyebrow">Section C</p>
            <h2 className="mt-4 font-display text-4xl text-ink">Circular Wind Encoding</h2>
            <p className="mt-4 text-sm text-ink/70 max-w-lg leading-relaxed">
              Wind direction is circular — 359° and 1° are only 2° apart, but their raw values differ by 358.
              We encode direction as <span className="font-mono text-ink">sin(θ)</span> and <span className="font-mono text-ink">cos(θ)</span>, placing all angles on the unit circle so the model learns correct proximity.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <UnitCircle />
            <div className="space-y-6">
              <div className="rounded-sm border border-border bg-card p-6 space-y-4">
                <p className="eyebrow !text-[9px]">Without encoding</p>
                <div className="font-mono text-sm text-ink/70 space-y-1">
                  <div>355° and 5°  →  <span className="text-destructive">350° apart</span></div>
                  <div>Model treats them as opposite conditions</div>
                </div>
              </div>
              <div className="rounded-sm border border-gold/30 bg-gold/5 p-6 space-y-4">
                <p className="eyebrow !text-[9px] text-gold">With sin/cos encoding</p>
                <div className="font-mono text-sm text-ink/70 space-y-1">
                  <div>sin(355°) ≈ sin(5°)  →  <span className="text-teal">10° apart</span></div>
                  <div>Model correctly treats them as near-identical</div>
                </div>
              </div>
              <div className="text-xs text-ink/60 leading-relaxed pt-2">
                This matters in a wind sport. A slight N vs NNE difference should have small prediction impact.
                Without circular encoding, the model would treat them as maximally different — a fundamental error.
              </div>
            </div>
          </div>
        </section>

        <div className="hairline" />

        {/* Section D — Model Performance */}
        <section className="space-y-8">
          <div>
            <p className="eyebrow">Section D</p>
            <h2 className="mt-4 font-display text-4xl text-ink">Model Performance</h2>
            <p className="mt-4 text-sm text-ink/70 max-w-lg leading-relaxed">
              The model was trained exclusively on Halifax 2024 and tested on Bermuda 2026 — a different event, different course, different conditions. All Bermuda results are out-of-sample.
            </p>
          </div>

          {perfLoading ? (
            <div className="rounded-sm border border-border p-8 text-center">
              <p className="eyebrow animate-pulse">Loading model performance…</p>
            </div>
          ) : perfError ? (
            <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="eyebrow text-destructive">{perfError}</p>
            </div>
          ) : perf ? (
            <>
              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-sm border border-border bg-card p-6 text-center shadow-[var(--shadow-soft)]">
                  <div className="font-display text-5xl text-ink tabular">{totalHits}</div>
                  <div className="eyebrow !text-[9px] text-muted-foreground mt-2">of {totalRaces * 3} top-3 picks correct</div>
                </div>
                <div className="rounded-sm border border-border bg-card p-6 text-center shadow-[var(--shadow-soft)]">
                  <div className="font-display text-5xl text-teal tabular">
                    {perf.bermuda_rmse ? perf.bermuda_rmse.toFixed(1) : "—"}
                  </div>
                  <div className="eyebrow !text-[9px] text-muted-foreground mt-2">Bermuda RMSE (pts)</div>
                </div>
                <div className="rounded-sm border border-gold/30 bg-gold/5 p-6 text-center shadow-[var(--shadow-soft)]">
                  <div className="font-display text-5xl text-gold tabular">
                    {totalRaces > 0 ? Math.round((totalHits / (totalRaces * 3)) * 100) : 0}%
                  </div>
                  <div className="eyebrow !text-[9px] text-muted-foreground mt-2">Top-3 accuracy</div>
                  {/* Baseline comparison — the proof the model beats chance */}
                  <div className="mt-3 pt-3 border-t border-border/60 space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="eyebrow !text-[7px] text-muted-foreground">Model</span>
                      <span className="font-display text-base text-gold tabular">
                        {totalRaces > 0 ? Math.round((totalHits / (totalRaces * 3)) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="eyebrow !text-[7px] text-muted-foreground">Random</span>
                      <span className="font-display text-base text-ink/40 tabular">~30%</span>
                    </div>
                    <p className="text-[9px] text-ink/40 leading-snug mt-1">
                      Picking 3 from 10 at random → 30% expected
                    </p>
                  </div>
                </div>
              </div>

              {/* Per-race hit/miss table */}
              {bermudaRaces.length > 0 && (
                <div className="space-y-4">
                  <p className="eyebrow !text-[9px] text-muted-foreground">Bermuda 2026 · Out-of-sample validation</p>
                  <div className="rounded-sm border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/40 border-b border-border">
                        <tr>
                          {["Race", "Predicted Top 3", "Actual Top 3", "Hits"].map(h => (
                            <th key={h} className="text-left px-5 py-3 eyebrow !text-[9px] text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {bermudaRaces.map((r, i) => (
                          <tr key={i} className={r.hits >= 2 ? "bg-teal/5" : ""}>
                            <td className="px-5 py-3 font-mono text-xs text-ink/70">{r.race_label.replace("_", " ")}</td>
                            <td className="px-5 py-3">
                              <div className="flex gap-2">
                                {r.predicted_top3.map(t => (
                                  <span key={t} className="font-mono text-xs text-ink/70">{FLAG[t] ?? ""} {t}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex gap-2">
                                {r.actual_top3.map(t => (
                                  <span key={t} className="font-mono text-xs text-ink/70">{FLAG[t] ?? ""} {t}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`font-display text-xl tabular ${r.hits >= 2 ? "text-teal" : r.hits === 1 ? "text-gold" : "text-destructive"}`}>
                                {r.hits}/3
                              </span>
                              {r.hits >= 2 && <span className="ml-2 eyebrow !text-[8px] text-teal">✓</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {halifaxRaces.length > 0 && (
                <div className="space-y-4">
                  <p className="eyebrow !text-[9px] text-muted-foreground">Halifax 2024 · Training data</p>
                  <div className="rounded-sm border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/40 border-b border-border">
                        <tr>
                          {["Race", "Predicted Top 3", "Actual Top 3", "Hits"].map(h => (
                            <th key={h} className="text-left px-5 py-3 eyebrow !text-[9px] text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {halifaxRaces.map((r, i) => (
                          <tr key={i} className={r.hits >= 2 ? "bg-teal/5" : ""}>
                            <td className="px-5 py-3 font-mono text-xs text-ink/70">{r.race_label.replace("_", " ")}</td>
                            <td className="px-5 py-3">
                              <div className="flex gap-2">
                                {r.predicted_top3.map(t => (
                                  <span key={t} className="font-mono text-xs text-ink/70">{FLAG[t] ?? ""} {t}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex gap-2">
                                {r.actual_top3.map(t => (
                                  <span key={t} className="font-mono text-xs text-ink/70">{FLAG[t] ?? ""} {t}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`font-display text-xl tabular ${r.hits >= 2 ? "text-teal" : r.hits === 1 ? "text-gold" : "text-destructive"}`}>
                                {r.hits}/3
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </section>

        <div className="hairline" />

        {/* Section E — Why Ridge */}
        <section className="space-y-8">
          <div>
            <p className="eyebrow">Section E</p>
            <h2 className="mt-4 font-display text-4xl text-ink">Why Ridge Regression?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Small dataset",
                body: "Halifax 2024 has ~60 data points across 6 races. On 60 rows, gradient-boosted trees overfit badly. Ridge handles this with L2 regularisation — preventing any single coefficient from dominating.",
              },
              {
                title: "Multicollinearity",
                body: "Team flags, wind speed and circular-encoded direction are correlated. Ridge shrinks coefficients towards zero rather than amplifying correlated predictors, giving more stable predictions.",
              },
              {
                title: "Interpretable",
                body: "Each coefficient has a direct physical meaning: how much a team's predicted score changes per km/h of wind, per unit of sin(θ). This makes the model auditable, not a black box.",
              },
              {
                title: "Out-of-sample honest",
                body: "We train on Halifax only, test on Bermuda — a completely different course, year and conditions. Any RMSE shown is genuine out-of-sample error, not train-set overfitting.",
              },
            ].map(item => (
              <div key={item.title} className="rounded-sm border border-border bg-card p-6 space-y-3 shadow-[var(--shadow-soft)]">
                <div className="font-display text-xl text-ink">{item.title}</div>
                <div className="hairline" />
                <p className="text-sm text-ink/70 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pt-8">
          <p className="eyebrow mb-8">Ready to build your lineup?</p>
          <Link
            to="/app"
            className="group inline-flex items-center gap-4 bg-ink text-cream pl-7 pr-2 py-2 rounded-full text-sm"
          >
            Open the app
            <span className="h-11 w-11 rounded-full bg-gold text-ink grid place-items-center group-hover:bg-gold/80 transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
