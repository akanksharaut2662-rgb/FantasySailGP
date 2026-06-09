import { useState, useEffect } from "react";
import { fetchRaces, fetchRecommendations } from "../../lib/api";
import RaceScene from "./RaceScene";

const FLAG = {
  AUS: "🇦🇺", BRA: "🇧🇷", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", ITA: "🇮🇹", NZL: "🇳🇿",
  SUI: "🇨🇭", SWE: "🇸🇪", USA: "🇺🇸",
};

const EVENT_LABEL = {
  Halifax: "Ocean of Data Challenge · Halifax",
  Bermuda: "Ocean of Data Challenge · Bermuda",
};

function Compass({ deg }) {
  return (
    <div className="relative w-12 h-12 rounded-full border border-border bg-card flex items-center justify-center shrink-0">
      <span className="absolute top-0.5 left-1/2 -translate-x-1/2 eyebrow !text-[6px]">N</span>
      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 eyebrow !text-[6px]">S</span>
      <span className="absolute left-0.5 top-1/2 -translate-y-1/2 eyebrow !text-[6px]">W</span>
      <span className="absolute right-0.5 top-1/2 -translate-y-1/2 eyebrow !text-[6px]">E</span>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotate(${deg}deg)` }}
      >
        <div className="w-px h-4 rounded-full" style={{ background: "var(--teal)" }} />
      </div>
    </div>
  );
}

export default function RaceSelector({ onRaceSelected }) {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [hoveredRace, setHoveredRace] = useState(null);

  useEffect(() => {
    fetchRaces().then(data => { setRaces(data); setLoading(false); });
  }, []);

  async function handleSelect(race) {
    if (selecting) return;
    setSelecting(`${race.event}-${race.race_label}`);
    const recData = await fetchRecommendations(race.event, race.race_label);
    onRaceSelected(race, recData.recommendations);
  }

  const halifax = races.filter(r => r.event === "Halifax");
  const bermuda = races.filter(r => r.event === "Bermuda");

  // Gather all unique teams from hovered race for the scene, or all races
  const sceneTeams = hoveredRace
    ? hoveredRace.teams
    : races.length > 0
    ? [...new Set(races.flatMap(r => r.teams))].slice(0, 8)
    : null;

  return (
    <div>
      {/* Hero text */}
      <div className="px-6 md:px-10 pt-16 pb-8 max-w-3xl mx-auto">
        <p className="eyebrow">Season V · Race Selection</p>
        <h1 className="mt-6 font-display text-[13vw] md:text-8xl leading-[0.88] text-ink">
          Choose<br />
          <span className="italic text-teal">your race.</span>
        </h1>
        <p className="mt-8 text-muted-foreground max-w-sm leading-relaxed text-sm">
          Pick a race, let the model read the wind, then build your lineup.
          Hover a boat to see the team.
        </p>
      </div>

      {/* Live race animation */}
      <RaceScene teams={sceneTeams} height={220} />

      <div className="hairline mx-6 md:mx-10" />

      {/* Race lists */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-16 space-y-16">
        {loading ? (
          <div className="py-24 text-center">
            <p className="eyebrow animate-pulse">Loading races…</p>
          </div>
        ) : (
          <>
            <RaceGroup
              title="Halifax 2024"
              subtitle="Training dataset"
              races={halifax}
              selecting={selecting}
              onSelect={handleSelect}
              onHover={setHoveredRace}
            />
            <RaceGroup
              title="Bermuda 2026"
              subtitle="Test dataset — unseen by the model"
              races={bermuda}
              selecting={selecting}
              onSelect={handleSelect}
              onHover={setHoveredRace}
            />
          </>
        )}
      </div>
    </div>
  );
}

function RaceGroup({ title, subtitle, races, selecting, onSelect, onHover }) {
  return (
    <div>
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h2 className="mt-3 font-display text-5xl text-ink">{title}</h2>
        </div>
        <span className="eyebrow !text-[9px] text-muted-foreground">{races.length} available</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {races.map(race => (
          <RaceCard
            key={`${race.event}-${race.race_label}`}
            race={race}
            selecting={selecting}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </div>
    </div>
  );
}

function RaceCard({ race, selecting, onSelect, onHover }) {
  const key = `${race.event}-${race.race_label}`;
  const isSelecting = selecting === key;
  const disabled = selecting !== null;

  return (
    <button
      onClick={() => onSelect(race)}
      onMouseEnter={() => onHover(race)}
      onMouseLeave={() => onHover(null)}
      disabled={disabled}
      className={`group text-left p-6 rounded-sm border w-full transition-all duration-300 bg-card shadow-[var(--shadow-soft)]
        ${isSelecting
          ? "border-gold"
          : "border-border hover:border-teal/40"}
        ${disabled && !isSelecting ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <p className="eyebrow !text-[9px]">{EVENT_LABEL[race.event] ?? race.event}</p>

      <h3 className="mt-3 font-display text-2xl text-ink">
        {race.event} · <span className="italic">{race.race_label.replace("_", " ")}</span>
      </h3>

      <div className="hairline my-5 origin-left" />

      <div className="flex items-center gap-4 mb-5">
        <Compass deg={race.avg_twd_deg} />
        <div>
          <span className="font-display text-3xl text-ink leading-none">{race.avg_tws_km_h}</span>
          <span className="eyebrow !text-[9px] ml-2">KM/H</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {race.teams.slice(0, 5).map(t => (
            <span key={t} className="text-sm">{FLAG[t] ?? "🏴"}</span>
          ))}
          {race.teams.length > 5 && (
            <span className="text-xs text-muted-foreground ml-1">+{race.teams.length - 5}</span>
          )}
        </div>
        <span className="eyebrow !text-[9px] text-muted-foreground">{race.num_boats} boats</span>
      </div>

      {isSelecting && (
        <p className="mt-4 eyebrow !text-[9px] text-gold animate-pulse">Reading conditions…</p>
      )}
    </button>
  );
}
