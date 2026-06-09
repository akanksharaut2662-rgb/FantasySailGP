import { useState } from "react";

const FULL_NAME = {
  AUS: "Australia", BRA: "Brazil", CAN: "Canada", DEN: "Denmark",
  ESP: "Spain", FRA: "France", GBR: "Great Britain", GER: "Germany",
  ITA: "Italy", NZL: "New Zealand", SUI: "Switzerland", SWE: "Sweden", USA: "United States",
};

// Each boat: team code, national color (muted for editorial palette), animation params, lane
const DEFAULT_FLEET = [
  { team: "AUS", color: "oklch(0.68 0.13 78)",  duration: "14s", delay: "0s",    top: "14%", size: 92 },
  { team: "NZL", color: "oklch(0.18 0.02 220)",  duration: "15s", delay: "3.2s",  top: "40%", size: 86 },
  { team: "GBR", color: "oklch(0.40 0.11 250)",  duration: "16s", delay: "0.8s",  top: "58%", size: 80 },
  { team: "FRA", color: "oklch(0.46 0.13 262)",  duration: "17s", delay: "5s",    top: "22%", size: 76 },
  { team: "ESP", color: "oklch(0.50 0.15 28)",   duration: "15s", delay: "7.5s",  top: "70%", size: 72 },
  { team: "USA", color: "oklch(0.47 0.15 22)",   duration: "18s", delay: "1.8s",  top: "48%", size: 78 },
  { team: "ITA", color: "oklch(0.46 0.13 152)",  duration: "16s", delay: "9s",    top: "30%", size: 68 },
  { team: "CAN", color: "oklch(0.52 0.16 24)",   duration: "19s", delay: "4.5s",  top: "64%", size: 70 },
];

/** Detailed SailGP foiling catamaran silhouette */
function SailBoat({ color, size }) {
  return (
    <svg
      viewBox="0 0 100 78"
      width={size}
      height={size * 0.78}
      fill="none"
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Main wing sail */}
      <polygon
        points="50,2 50,50 14,40"
        style={{ fill: color }}
      />
      {/* Jib / second sail panel */}
      <polygon
        points="50,10 50,46 78,38"
        style={{ fill: color, opacity: 0.42 }}
      />
      {/* Mast line */}
      <line x1="50" y1="2" x2="50" y2="50"
        style={{ stroke: color, strokeWidth: 1.2, opacity: 0.25 }} />

      {/* Cross beam */}
      <rect x="14" y="50" width="68" height="5" rx="2.5"
        style={{ fill: color, opacity: 0.92 }} />

      {/* Port hull */}
      <path d="M12,54 C12,62 18,68 28,69 L38,69 L40,55 Z"
        style={{ fill: color, opacity: 0.88 }} />
      {/* Starboard hull */}
      <path d="M60,55 L62,69 L72,69 C82,68 88,62 88,54 Z"
        style={{ fill: color, opacity: 0.88 }} />

      {/* Port foil strut */}
      <line x1="22" y1="64" x2="20" y2="76"
        style={{ stroke: color, strokeWidth: 2.5, opacity: 0.85, strokeLinecap: "round" }} />
      {/* Starboard foil strut */}
      <line x1="78" y1="64" x2="80" y2="76"
        style={{ stroke: color, strokeWidth: 2.5, opacity: 0.85, strokeLinecap: "round" }} />

      {/* Port T-foil wing */}
      <line x1="10" y1="76" x2="30" y2="76"
        style={{ stroke: color, strokeWidth: 4, opacity: 0.85, strokeLinecap: "round" }} />
      {/* Starboard T-foil wing */}
      <line x1="70" y1="76" x2="90" y2="76"
        style={{ stroke: color, strokeWidth: 4, opacity: 0.85, strokeLinecap: "round" }} />

      {/* Spray wake behind the foils */}
      <path d="M6,77 Q16,79 26,77" style={{ stroke: color, fill: "none", opacity: 0.18, strokeWidth: 2, strokeLinecap: "round" }} />
      <path d="M66,77 Q78,79 88,77" style={{ stroke: color, fill: "none", opacity: 0.18, strokeWidth: 2, strokeLinecap: "round" }} />
    </svg>
  );
}

/** Single animated boat with hover interaction */
function RacingBoat({ boat, paused }) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        top: boat.top,
        left: 0,
        animationName: "sail-right",
        animationDuration: boat.duration,
        animationTimingFunction: "linear",
        animationDelay: boat.delay,
        animationIterationCount: "infinite",
        animationFillMode: "both",
        animationPlayState: paused ? "paused" : "running",
        cursor: "default",
        zIndex: paused ? 20 : 1,
      }}
    >
      {/* Bobbing wrapper */}
      <div
        style={{
          animationName: "bob",
          animationDuration: `${(parseFloat(boat.duration) * 0.28).toFixed(1)}s`,
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDelay: `${parseFloat(boat.delay) * 0.5}s`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        <SailBoat color={boat.color} size={boat.size} />
      </div>

      {/* Team label */}
      <span
        className="font-mono tabular"
        style={{
          fontSize: "9px",
          letterSpacing: "0.18em",
          color: boat.color,
          opacity: paused ? 1 : 0.55,
          marginTop: "4px",
          transition: "opacity 0.2s",
          textTransform: "uppercase",
        }}
      >
        {boat.team}
      </span>

      {/* Tooltip on hover */}
      {paused && (
        <div
          className="absolute rounded-sm border border-border bg-card shadow-[var(--shadow-soft)] px-3 py-1.5 whitespace-nowrap pointer-events-none"
          style={{ bottom: "100%", marginBottom: "8px", left: "50%", transform: "translateX(-50%)" }}
        >
          <p className="eyebrow !text-[8px] text-muted-foreground">{boat.team}</p>
          <p className="font-display text-sm text-ink leading-tight">{FULL_NAME[boat.team] ?? boat.team}</p>
        </div>
      )}
    </div>
  );
}

/**
 * RaceScene — animated fleet of SailGP boats racing across the screen.
 * Pass `teams` to limit which boats appear (e.g. for a specific race).
 * Hover any boat to pause it and reveal its team name.
 */
export default function RaceScene({ teams, height = 240 }) {
  const [hoveredTeam, setHoveredTeam] = useState(null);

  const fleet = teams
    ? DEFAULT_FLEET.filter(b => teams.includes(b.team))
        .concat(DEFAULT_FLEET.filter(b => !teams.includes(b.team)))
        .slice(0, 8)
    : DEFAULT_FLEET;

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height }}
    >
      {/* Gradient fade — left edge */}
      <div
        className="absolute inset-y-0 left-0 w-32 z-10 pointer-events-none"
        style={{ background: "linear-gradient(90deg, var(--background) 20%, transparent)" }}
      />
      {/* Gradient fade — right edge */}
      <div
        className="absolute inset-y-0 right-0 w-32 z-10 pointer-events-none"
        style={{ background: "linear-gradient(-90deg, var(--background) 20%, transparent)" }}
      />

      {/* Water line at bottom */}
      <div className="absolute bottom-8 left-0 right-0 h-px bg-border opacity-50" />
      <div className="absolute bottom-6 left-0 right-0 h-px bg-border opacity-25" />

      {/* Fleet */}
      {fleet.map(boat => (
        <div
          key={boat.team}
          onMouseEnter={() => setHoveredTeam(boat.team)}
          onMouseLeave={() => setHoveredTeam(null)}
        >
          <RacingBoat
            boat={boat}
            paused={hoveredTeam === boat.team}
          />
        </div>
      ))}

      {/* Live indicator */}
      <div className="absolute top-4 right-40 flex items-center gap-2 opacity-50 z-10">
        <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
        <span className="font-mono text-[9px] tracking-widest text-ink uppercase">Fleet racing</span>
      </div>
    </div>
  );
}
