import { useState, useEffect, useRef } from "react";

const FLAG = {
  AUS: "🇦🇺", BRA: "🇧🇷", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", ITA: "🇮🇹", NZL: "🇳🇿",
  SUI: "🇨🇭", SWE: "🇸🇪", USA: "🇺🇸",
};

const RACE_MESSAGES = [
  "Fleet crossing start line…",
  "Boats foiling at 45 knots…",
  "Gate 1 — position battle forming…",
  "Wind shift: {team1} responds first…",
  "Mark 2 — overtake opportunity…",
  "{team2} rounding the leeward gate…",
  "Sprint to finish — final standings locked…",
  "Scoring engine computing fantasy points…",
];

const TOTAL_DURATION = 4200; // ms

function TelemetryLine({ label, value, unit, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className="flex items-center justify-between py-2 border-b border-border/30 transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(-8px)" }}
    >
      <span className="eyebrow !text-[8px] text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-base text-ink tabular">{value}</span>
        {unit && <span className="eyebrow !text-[7px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

export default function SimulationScreen({ race, teams, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);
  const completedRef = useRef(false);
  const startRef = useRef(Date.now());

  // Interpolate race status messages with real team names
  const messages = RACE_MESSAGES.map(m =>
    m
      .replace("{team1}", teams[0] ? `${FLAG[teams[0]] ?? ""} ${teams[0]}` : "leader")
      .replace("{team2}", teams[1] ? `${FLAG[teams[1]] ?? ""} ${teams[1]}` : "team")
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(elapsed / TOTAL_DURATION, 1);
      setProgress(pct * 100);
      setMessageIdx(Math.min(
        Math.floor(pct * messages.length),
        messages.length - 1,
      ));
      if (pct >= 1 && !completedRef.current) {
        completedRef.current = true;
        clearInterval(interval);
        setTimeout(onComplete, 200);
      }
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const progressPct = Math.round(progress);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full space-y-10">
        {/* Header */}
        <div className="text-center">
          <p className="eyebrow mb-3">Race Simulation</p>
          <h2 className="font-display text-5xl md:text-6xl text-ink leading-[0.92]">
            Running the<br />
            <span className="italic text-teal">race.</span>
          </h2>
          {race && (
            <p className="mt-3 text-sm text-muted-foreground">
              {race.event} · {race.race_label?.replace("_", " ")}
            </p>
          )}
        </div>

        {/* Animated fleet */}
        <div className="relative h-16 rounded-sm border border-border bg-card overflow-hidden">
          <div className="absolute inset-0 flex items-center">
            {teams.map((team, i) => (
              <div
                key={team}
                className="absolute flex items-center gap-1 transition-all duration-300 ease-linear"
                style={{
                  left: `${Math.min(progress * 0.85 + i * 4, 100 - 8)}%`,
                  top: `${20 + i * 20}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <span className="text-lg">{FLAG[team] ?? "🏴"}</span>
                <span className="eyebrow !text-[7px] text-muted-foreground hidden sm:block">{team}</span>
              </div>
            ))}
          </div>
          {/* Finish line */}
          <div
            className="absolute top-0 bottom-0 w-px"
            style={{ right: "6%", background: "var(--gold)", opacity: 0.4 }}
          />
          <div className="absolute top-2 right-[6%] translate-x-1/2 eyebrow !text-[6px] text-gold">FINISH</div>
        </div>

        {/* Progress bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="eyebrow !text-[8px] text-muted-foreground">Race Progress</span>
            <span className="font-display text-base text-ink tabular">{progressPct}%</span>
          </div>
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, var(--teal), var(--gold))",
              }}
            />
          </div>
          {/* Race status message */}
          <p
            key={messageIdx}
            className="text-sm text-ink/70 text-center animate-tick min-h-[1.5rem]"
          >
            {messages[messageIdx]}
          </p>
        </div>

        {/* Live telemetry panel */}
        <div className="rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <p className="eyebrow mb-3">Live Telemetry</p>
          {race && (
            <>
              <TelemetryLine label="Wind Speed" value={race.avg_tws_km_h} unit="km/h" delay={200} />
              <TelemetryLine label="Wind Direction" value={`${race.avg_twd_deg}°`} delay={400} />
              <TelemetryLine label="Fleet Size" value={race.num_boats} unit="boats" delay={600} />
            </>
          )}
          <TelemetryLine label="Scoring Engine" value="ACTIVE" delay={800} />
          <TelemetryLine label="ML Optimizer" value="MONITORING" delay={1000} />
          <TelemetryLine
            label="Your Teams"
            value={teams.map(t => FLAG[t] ?? t).join("  ")}
            delay={1200}
          />
        </div>
      </div>
    </div>
  );
}
