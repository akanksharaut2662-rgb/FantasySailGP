import { useState, useEffect } from "react";
import { fetchRaces, fetchRecommendations } from "../../lib/api";
import RaceScene from "./RaceScene";
import RaceMap from "./RaceMap";

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

export default function RaceSelector({ onRaceSelected, demoSelecting = false }) {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selecting, setSelecting] = useState(null);
  const [selectError, setSelectError] = useState(null);
  const [hoveredRace, setHoveredRace] = useState(null);
  const [liveWind, setLiveWind] = useState(null);
  // GPS preview tab: null = animation, "gps" = map replay
  const [previewMode, setPreviewMode] = useState("gps");
  const [gpsRace, setGpsRace] = useState({ event: "Halifax", raceLabel: "Race_1" });

  useEffect(() => {
    fetchRaces()
      .then(data => { setRaces(data); setLoading(false); })
      .catch(() => { setFetchError("Could not reach the API. Is the backend running?"); setLoading(false); });

    // Live Bermuda wind from OpenMeteo (free, no key)
    fetch("https://api.open-meteo.com/v1/forecast?latitude=32.3&longitude=-64.6&current=windspeed_10m,winddirection_10m&windspeed_unit=kmh")
      .then(r => r.json())
      .then(d => {
        const spd = d?.current?.windspeed_10m;
        const deg = d?.current?.winddirection_10m;
        if (spd != null && deg != null) setLiveWind({ spd: Math.round(spd), deg: Math.round(deg) });
      })
      .catch(() => {});
  }, []);

  // When a race is hovered, switch GPS preview to that race
  useEffect(() => {
    if (hoveredRace) {
      setGpsRace({ event: hoveredRace.event, raceLabel: hoveredRace.race_label });
    }
  }, [hoveredRace]);

  async function handleSelect(race) {
    if (selecting) return;
    setSelectError(null);
    setSelecting(`${race.event}-${race.race_label}`);
    try {
      const recData = await fetchRecommendations(race.event, race.race_label);
      onRaceSelected(race, recData.recommendations);
    } catch (e) {
      const msg = e?.message ?? "";
      if (msg.includes("503")) {
        setSelectError("Model not trained yet — run: cd backend && python train_model.py");
      } else {
        setSelectError("Failed to load recommendations. Try again.");
      }
      setSelecting(null);
    }
  }

  const effectiveSelecting = demoSelecting ? "Halifax-Race_1" : selecting;

  const halifax = races.filter(r => r.event === "Halifax");
  const bermuda = races.filter(r => r.event === "Bermuda");

  const sceneTeams = hoveredRace
    ? hoveredRace.teams
    : races.length > 0
    ? [...new Set(races.flatMap(r => r.teams))].slice(0, 8)
    : null;

  return (
    <div>
      {/* Compact header row — keeps GPS map above the fold */}
      <div className="px-6 md:px-10 pt-5 pb-3 flex items-center justify-between flex-wrap gap-3 border-b border-border">
        <div className="flex items-center gap-5 flex-wrap">
          <div>
            <p className="eyebrow !text-[9px]">Season V · Race Selection</p>
            <h1 className="mt-0.5 font-display text-2xl md:text-3xl text-ink leading-tight">
              Choose <span className="italic text-teal">your race.</span>
            </h1>
          </div>
          {liveWind && (
            <span className="inline-flex items-center gap-1.5 eyebrow !text-[8px] border border-teal/30 text-teal rounded-full px-3 py-1 bg-teal/5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse shrink-0" />
              Live Bermuda · {liveWind.spd} km/h · {liveWind.deg}°
            </span>
          )}
        </div>

        {/* Preview toggle inline with header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode("animation")}
            className={`eyebrow !text-[9px] px-3 py-1.5 rounded-full border transition-colors ${
              previewMode === "animation"
                ? "border-gold text-gold bg-gold/5"
                : "border-border text-muted-foreground hover:border-teal/40"
            }`}
          >
            Fleet
          </button>
          <button
            onClick={() => setPreviewMode("gps")}
            className={`eyebrow !text-[9px] px-3 py-1.5 rounded-full border transition-colors ${
              previewMode === "gps"
                ? "border-gold text-gold bg-gold/5"
                : "border-border text-muted-foreground hover:border-teal/40"
            }`}
          >
            GPS Replay
          </button>
        </div>
      </div>

      {/* Preview panel — immediately visible below the compact header */}
      {previewMode === "animation" ? (
        <RaceScene teams={sceneTeams} height={220} />
      ) : (
        <div className="px-4 md:px-8 py-3">
          <RaceMap
            event={gpsRace.event}
            raceLabel={gpsRace.raceLabel}
            windDeg={
              hoveredRace?.avg_twd_deg ??
              races.find(r => r.event === gpsRace.event && r.race_label === gpsRace.raceLabel)?.avg_twd_deg
            }
          />
        </div>
      )}

      <div className="hairline mx-6 md:mx-10" />

      {/* Race lists */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-12">
        {/* Error banners */}
        {fetchError && (
          <div className="mb-8 rounded-sm border border-destructive/30 bg-destructive/5 px-6 py-4 flex items-start gap-3">
            <span className="text-destructive mt-0.5">⚠</span>
            <div>
              <p className="eyebrow !text-[9px] text-destructive">API Error</p>
              <p className="text-sm text-ink/70 mt-1">{fetchError}</p>
            </div>
          </div>
        )}
        {selectError && (
          <div className="mb-8 rounded-sm border border-destructive/30 bg-destructive/5 px-6 py-4 flex items-start gap-3">
            <span className="text-destructive mt-0.5">⚠</span>
            <div>
              <p className="eyebrow !text-[9px] text-destructive">Could not load race</p>
              <p className="text-sm text-ink/70 mt-1">{selectError}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <p className="eyebrow animate-pulse">Loading races…</p>
          </div>
        ) : fetchError ? (
          <div className="py-24 text-center space-y-4">
            <p className="eyebrow text-destructive">Backend unreachable</p>
            <p className="text-sm text-ink/60">Check that the backend container is running on port 8000.</p>
            <button
              onClick={() => { setFetchError(null); setLoading(true); fetchRaces().then(d => { setRaces(d); setLoading(false); }).catch(() => setLoading(false)); }}
              className="eyebrow !text-[9px] text-teal border border-teal/30 rounded-full px-4 py-1.5 hover:bg-teal/5 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <RaceGroup
              title="Halifax 2024"
              subtitle="Training dataset"
              races={halifax}
              selecting={effectiveSelecting}
              onSelect={handleSelect}
              onHover={setHoveredRace}
            />
            <RaceGroup
              title="Bermuda 2026"
              subtitle="Test dataset — unseen by the model"
              races={bermuda}
              selecting={effectiveSelecting}
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
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h2 className="mt-2 font-display text-3xl text-ink">{title}</h2>
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
