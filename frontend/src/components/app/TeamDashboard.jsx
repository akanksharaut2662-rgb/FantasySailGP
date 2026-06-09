import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

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

const SAILORS = {
  AUS: ["Tom Slingsby", "Jason Waterhouse"],
  BRA: ["Jorge Zarif", "Samuel Albrecht"],
  CAN: ["Phil Robertson", "David Hussl"],
  DEN: ["Nicolai Sehested", "Rasmus Køstner"],
  ESP: ["Diego Botin", "Florian Trittel"],
  FRA: ["Quentin Delapierre", "Nicolas Hlad"],
  GBR: ["Ben Ainslie", "Neil Hunter"],
  GER: ["Erik Heil", "Tobias Schadewaldt"],
  ITA: ["Ruggero Tita", "Caterina Banti"],
  NZL: ["Peter Burling", "Blair Tuke"],
  SUI: ["Nathan Outteridge", "Steph Orcel"],
  SWE: ["Max Salminen", "Anton Dahlberg"],
  USA: ["Taylor Canfield", "Haylee Outteridge"],
};

const BEARING_LABELS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
function bearingLabel(deg) { return BEARING_LABELS[Math.round(deg / 22.5) % 16]; }

function windCategory(kmh) {
  if (kmh < 18) return "Light";
  if (kmh < 28) return "Moderate";
  return "Heavy";
}

function formatCost(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000).toFixed(0)}K`;
}

// ── Animated compass ─────────────────────────────────────────────────────────
function WindCompass({ deg, speed }) {
  const [liveDeg, setLiveDeg] = useState(deg);
  const frameRef = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    const animate = () => {
      tRef.current += 0.018;
      const osc = Math.sin(tRef.current * 1.1) * 4.5 + Math.cos(tRef.current * 0.65) * 2;
      setLiveDeg(deg + osc);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [deg]);

  const CARDINAL = [
    { label: "N", style: { top: "5px", left: "50%", transform: "translateX(-50%)" } },
    { label: "S", style: { bottom: "5px", left: "50%", transform: "translateX(-50%)" } },
    { label: "E", style: { right: "5px", top: "50%", transform: "translateY(-50%)" } },
    { label: "W", style: { left: "5px", top: "50%", transform: "translateY(-50%)" } },
  ];

  return (
    <div className="relative w-44 h-44 mx-auto flex-shrink-0">
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "oklch(0.70 0.14 200 / 0.06)",
          boxShadow: "0 0 24px oklch(0.70 0.14 200 / 0.20)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "oklch(0.10 0.04 235 / 0.90)",
          border: "1px solid oklch(0.28 0.06 230 / 0.60)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Degree ring marks */}
        {Array.from({ length: 36 }, (_, i) => i * 10).map(t => (
          <div
            key={t}
            className="absolute inset-0 flex items-start justify-center"
            style={{ transform: `rotate(${t}deg)` }}
          >
            <div
              className="mx-auto"
              style={{
                width: t % 90 === 0 ? "2px" : "1px",
                height: t % 90 === 0 ? "10px" : "5px",
                marginTop: "6px",
                background: t % 90 === 0
                  ? "oklch(0.70 0.14 200 / 0.70)"
                  : "oklch(0.40 0.04 220 / 0.40)",
              }}
            />
          </div>
        ))}

        {/* Cardinal labels */}
        {CARDINAL.map(({ label, style }) => (
          <span
            key={label}
            className="absolute"
            style={{
              ...style,
              fontFamily: "var(--font-mono)",
              fontSize: "8px",
              letterSpacing: "0.1em",
              color: label === "N" ? "oklch(0.70 0.14 200)" : "oklch(0.48 0.04 220)",
            }}
          >
            {label}
          </span>
        ))}

        {/* Rotating needle assembly */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${liveDeg}deg)` }}
        >
          {/* Needle body — two-part: north (teal) + south (dimmed) */}
          <div className="relative flex flex-col items-center" style={{ height: "120px" }}>
            {/* North tip */}
            <div
              style={{
                width: "2px",
                height: "48px",
                background: "linear-gradient(180deg, oklch(0.80 0.17 195), oklch(0.70 0.14 200))",
                borderRadius: "2px",
              }}
            />
            {/* Centre pivot */}
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "oklch(0.72 0.12 75)",
                border: "1.5px solid oklch(0.85 0.10 75)",
                boxShadow: "0 0 8px oklch(0.72 0.12 75 / 0.5)",
              }}
            />
            {/* South */}
            <div
              style={{
                width: "2px",
                height: "36px",
                background: "oklch(0.28 0.03 220 / 0.60)",
                borderRadius: "2px",
              }}
            />
          </div>
        </div>

        {/* Inner circle overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center" style={{ marginTop: "28px" }}>
            <div
              className="font-display text-xl text-ink leading-none tabular"
              style={{ textShadow: "0 0 12px oklch(0.70 0.14 200 / 0.4)" }}
            >
              {Math.round(speed)}
            </div>
            <div className="eyebrow !text-[6px] mt-0.5 text-teal">KM/H</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI Recommendation card ────────────────────────────────────────────────────
function AIPick({ label, labelColor, borderClass, rec, rank, teamValues }) {
  if (!rec) return null;
  const tv = teamValues[rec.team];
  return (
    <div className={`rounded-sm border bg-card p-5 space-y-3 shadow-[var(--shadow-soft)] ${borderClass}`}>
      <div className="flex items-start justify-between">
        <span className="eyebrow !text-[8px]" style={{ color: labelColor }}>{label}</span>
        <span className="eyebrow !text-[7px] border border-teal/30 text-teal rounded-full px-1.5 py-0.5">
          AI pick
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl">{FLAG[rec.team] ?? "🏴"}</span>
        <div>
          <div className="font-display text-lg text-ink leading-tight">{FULL_NAME[rec.team] ?? rec.team}</div>
          <div className="eyebrow !text-[7px] text-muted-foreground">{rec.team}</div>
        </div>
      </div>
      <div className="hairline" />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="eyebrow !text-[7px] text-muted-foreground">Predicted</div>
          <div className="font-display text-2xl text-ink tabular">{Math.round(rec.predicted_score ?? 0)}</div>
          <div className="eyebrow !text-[7px] text-muted-foreground">pts</div>
        </div>
        {tv && (
          <div>
            <div className="eyebrow !text-[7px] text-muted-foreground">Market cost</div>
            <div className="font-display text-lg text-ink tabular">{formatCost(tv.cost)}</div>
            <div className="eyebrow !text-[7px] text-muted-foreground">credits</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Team details modal ────────────────────────────────────────────────────────
function TeamModal({ team, tv, isSelected, canAfford, onSelect, onClose }) {
  if (!team) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative max-w-sm w-full rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] p-7 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 eyebrow !text-[8px] text-muted-foreground hover:text-ink transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="text-4xl">{FLAG[team] ?? "🏴"}</span>
          <div>
            <h3 className="font-display text-2xl text-ink">{FULL_NAME[team] ?? team}</h3>
            <p className="eyebrow !text-[8px] text-muted-foreground mt-0.5">{team}</p>
          </div>
        </div>

        <div className="hairline" />

        {/* Sailors */}
        {SAILORS[team] && (
          <div>
            <p className="eyebrow !text-[8px] text-muted-foreground mb-2">Sailors</p>
            <div className="space-y-1">
              {SAILORS[team].map(s => (
                <div key={s} className="text-sm text-ink">{s}</div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {tv && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-sm border border-border bg-secondary/30 p-3">
              <div className="font-display text-2xl text-gold tabular">{tv.wins}</div>
              <div className="eyebrow !text-[7px] text-muted-foreground mt-0.5">Wins</div>
            </div>
            <div className="rounded-sm border border-border bg-secondary/30 p-3">
              <div className="font-display text-2xl text-ink tabular">{tv.podiums}</div>
              <div className="eyebrow !text-[7px] text-muted-foreground mt-0.5">Podiums</div>
            </div>
            <div className="rounded-sm border border-border bg-secondary/30 p-3">
              <div className="font-display text-2xl text-ink tabular">{tv.win_rate}%</div>
              <div className="eyebrow !text-[7px] text-muted-foreground mt-0.5">Win Rate</div>
            </div>
          </div>
        )}

        {/* Market value */}
        {tv && (
          <div className="flex items-center justify-between rounded-sm border border-border bg-secondary/20 px-4 py-3">
            <span className="eyebrow !text-[8px] text-muted-foreground">Market value</span>
            <span className="font-display text-xl text-ink tabular">{formatCost(tv.cost)} credits</span>
          </div>
        )}

        <div className="hairline" />

        {/* Select / deselect */}
        {isSelected ? (
          <button
            onClick={() => { onSelect(team); onClose(); }}
            className="w-full eyebrow !text-[9px] border border-destructive/40 text-destructive rounded-full py-2.5 hover:bg-destructive/5 transition-colors"
          >
            Remove from lineup
          </button>
        ) : (
          <button
            onClick={() => { onSelect(team); onClose(); }}
            disabled={!canAfford}
            className={`w-full rounded-full py-2.5 eyebrow !text-[9px] transition-colors ${
              canAfford
                ? "bg-ink text-cream hover:bg-ink/90"
                : "border border-border text-muted-foreground cursor-not-allowed opacity-50"
            }`}
          >
            {canAfford ? "Select Team" : "Insufficient Credits"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TeamDashboard({ race, recommendations, teamValues, credits, onConfirm }) {
  const [selected, setSelected] = useState(() =>
    recommendations.slice(0, 3).map(r => r.team)
  );
  const [modalTeam, setModalTeam] = useState(null);

  if (!race) return null;

  const recByTeam = Object.fromEntries(recommendations.map(r => [r.team, r]));
  const recSet = new Set(recommendations.slice(0, 3).map(r => r.team));

  const totalCost = selected.reduce((s, t) => s + (teamValues[t]?.cost ?? 0), 0);
  const remaining = credits - totalCost;

  // Best Pick = highest predicted score
  const bestPick = recommendations[0];
  // Best Value = highest predicted_score / cost ratio among all recs
  const bestValue = [...recommendations].sort((a, b) => {
    const ra = (a.predicted_score ?? 0) / Math.max(teamValues[a.team]?.cost ?? 1, 1);
    const rb = (b.predicted_score ?? 0) / Math.max(teamValues[b.team]?.cost ?? 1, 1);
    return rb - ra;
  })[0];
  // Underdog = lowest cost recommended team
  const underdog = [...recommendations].sort((a, b) =>
    (teamValues[a.team]?.cost ?? 999_999_999) - (teamValues[b.team]?.cost ?? 999_999_999)
  )[0];

  function toggle(team) {
    if (selected.includes(team)) {
      setSelected(selected.filter(t => t !== team));
      return;
    }
    const teamCost = teamValues[team]?.cost ?? 0;
    if (selected.length >= 3) {
      toast.error("Maximum 3 teams", { description: "Remove a team before adding another." });
      return;
    }
    if (remaining < teamCost) {
      toast.error("Insufficient Credits", {
        description: `${FULL_NAME[team] ?? team} costs ${formatCost(teamCost)} but you only have ${formatCost(remaining)} left.`,
      });
      return;
    }
    setSelected([...selected, team]);
  }

  const canAffordTeam = (team) => {
    if (selected.includes(team)) return true;
    const cost = teamValues[team]?.cost ?? 0;
    return selected.length < 3 && remaining >= cost;
  };

  const bearing = bearingLabel(race.avg_twd_deg);
  const windCat = windCategory(race.avg_tws_km_h);

  return (
    <>
      {/* Team details modal */}
      {modalTeam && (
        <TeamModal
          team={modalTeam}
          tv={teamValues[modalTeam]}
          isSelected={selected.includes(modalTeam)}
          canAfford={canAffordTeam(modalTeam)}
          onSelect={toggle}
          onClose={() => setModalTeam(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-14 space-y-12">

        {/* ── Section 1: Wind Analysis Card ── */}
        <div className="rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] p-6 md:p-8">
          <p className="eyebrow mb-4">Wind Analysis · {race.event}</p>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <WindCompass deg={race.avg_twd_deg} speed={race.avg_tws_km_h} />
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="font-display text-4xl md:text-5xl text-ink leading-[0.92]">
                  {race.event}
                  <br />
                  <span className="italic text-teal">{race.race_label.replace("_", " ")}</span>
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  `${race.avg_tws_km_h} km/h`,
                  `${bearing} · ${race.avg_twd_deg}°`,
                  `${windCat} wind`,
                  `${race.num_boats} boats`,
                ].map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full border border-border bg-secondary text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                Ridge Regression model predicts optimal picks for {race.avg_tws_km_h} km/h {bearing} wind conditions
                based on historical Halifax training data.
              </p>
            </div>
          </div>
        </div>

        <div className="hairline" />

        {/* ── Section 3: Budget tracker ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="eyebrow">Build Your Lineup</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl text-ink leading-tight">
              Pick up to <span className="italic text-teal">3 teams</span>
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 border border-border rounded-full px-4 py-2 bg-card">
              <span className="font-display text-lg text-ink tabular">{selected.length}</span>
              <span className="font-display text-lg text-ink/25 tabular">/ 3</span>
              <span className="h-3 w-px bg-border mx-1" />
              <span className="eyebrow !text-[8px] text-muted-foreground">Budget</span>
              <span className={`font-display text-base tabular ${remaining < 0 ? "text-destructive" : "text-teal"}`}>
                {formatCost(Math.max(0, remaining))}
              </span>
            </div>
            {totalCost > 0 && (
              <p className="eyebrow !text-[8px] text-muted-foreground">
                Spent: {formatCost(totalCost)} · Remaining: {formatCost(Math.max(0, remaining))}
              </p>
            )}
          </div>
        </div>

        {/* ── Section 4: Team Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {race.teams.map(team => {
            const isSelected = selected.includes(team);
            const isRec = recSet.has(team);
            const tv = teamValues[team];
            const isDisabled = !isSelected && selected.length === 3;
            const notAffordable = !isSelected && tv && remaining < tv.cost;

            return (
              <button
                key={team}
                onClick={() => toggle(team)}
                onDoubleClick={() => setModalTeam(team)}
                className={`relative group p-4 rounded-sm border text-left transition-all duration-200 bg-card w-full
                  ${isSelected
                    ? "border-gold shadow-[var(--shadow-soft)] scale-[1.02]"
                    : isRec
                    ? "border-teal/40 hover:border-teal hover:scale-[1.02] hover:shadow-[var(--shadow-soft)]"
                    : notAffordable
                    ? "border-border opacity-40 cursor-not-allowed"
                    : isDisabled
                    ? "border-border opacity-35 cursor-not-allowed"
                    : "border-border hover:border-teal/40 hover:scale-[1.01] hover:shadow-[var(--shadow-soft)]"}
                `}
              >
                {/* AI Pick badge */}
                {isRec && (
                  <span
                    className="absolute top-2 right-2 eyebrow !text-[7px] rounded-sm px-1.5 py-0.5"
                    style={{
                      background: "oklch(0.70 0.14 200 / 0.12)",
                      border: "1px solid oklch(0.70 0.14 200 / 0.45)",
                      color: "oklch(0.75 0.14 195)",
                    }}
                  >
                    AI PICK
                  </span>
                )}

                {/* Selected gold indicator */}
                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-b-sm" />
                )}

                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-lg">{FLAG[team] ?? "🏴"}</span>
                  <div className="min-w-0">
                    <div className="font-display text-base text-ink truncate">{team}</div>
                    <div className="eyebrow !text-[7px] text-muted-foreground truncate">{FULL_NAME[team] ?? ""}</div>
                  </div>
                </div>

                {/* Stats row */}
                {tv && (
                  <div className="mt-2 pt-2 border-t border-border/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="eyebrow !text-[7px] text-muted-foreground">Cost</span>
                      <span className="font-display text-sm text-ink tabular">{formatCost(tv.cost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="eyebrow !text-[7px] text-muted-foreground">Wins</span>
                      <span className="font-display text-sm text-gold tabular">{tv.wins}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="eyebrow !text-[7px] text-muted-foreground">Win%</span>
                      <span className="font-display text-sm text-ink tabular">{tv.win_rate}%</span>
                    </div>
                  </div>
                )}

                {/* Details hint on hover */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="eyebrow !text-[6px] text-muted-foreground/50">dbl-click for details</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Hint ── */}
        <p className="text-center text-xs text-muted-foreground">
          Teams marked <span className="text-teal">teal</span> are AI-recommended · Double-click any card for details
        </p>

        {/* ── CTA ── */}
        {selected.length > 0 && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => onConfirm(selected, totalCost)}
              className="group inline-flex items-center gap-4 bg-ink text-cream pl-7 pr-2 py-2 rounded-full text-sm"
            >
              {selected.length === 3
                ? `Confirm lineup · ${formatCost(totalCost)} credits`
                : `Continue with ${selected.length} team${selected.length > 1 ? "s" : ""}`}
              <span className="h-11 w-11 rounded-full bg-gold text-ink grid place-items-center group-hover:bg-gold/80 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
