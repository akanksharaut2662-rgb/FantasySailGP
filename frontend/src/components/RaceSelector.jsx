import { useState, useEffect } from "react";
import { fetchRaces, fetchRecommendations } from "../api";

const FLAG = {
  AUS: "🇦🇺", BRA: "🇧🇷", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", ITA: "🇮🇹", NZL: "🇳🇿",
  SUI: "🇨🇭", SWE: "🇸🇪", USA: "🇺🇸",
};

const EVENT_LABEL = {
  Halifax: "OCEAN OF DATA CHALLENGE • HALIFAX",
  Bermuda: "OCEAN OF DATA CHALLENGE • BERMUDA",
};

function Compass({ deg }) {
  return (
    <div className="relative w-12 h-12 rounded-full border border-white/20 flex items-center justify-center"
      style={{ background: "#111827" }}>
      {/* Cardinal labels */}
      <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-white/40 text-[8px] font-bold">N</span>
      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-white/40 text-[8px] font-bold">S</span>
      <span className="absolute left-0.5 top-1/2 -translate-y-1/2 text-white/40 text-[8px] font-bold">W</span>
      <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-white/40 text-[8px] font-bold">E</span>
      {/* Needle */}
      <div className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotate(${deg}deg)` }}>
        <div className="w-0.5 h-4 rounded-full" style={{ background: "#00d4ff" }} />
      </div>
    </div>
  );
}

function Boat({ size = 60, color = "#00d4ff" }) {
  const s = size;
  return (
    <svg viewBox="0 0 60 60" width={s} height={s} fill="none">
      <polygon points="30,2 30,46 6,46"  fill={color} />
      <polygon points="30,10 30,42 52,42" fill={color} opacity="0.6" />
      <ellipse cx="30" cy="50" rx="20" ry="5" fill={color} />
    </svg>
  );
}

const BOATS = [
  { top: "10%",  size: 56,  opacity: 0.22, duration: "28s", delay: "0s",   color: "#00d4ff" },
  { top: "30%",  size: 80,  opacity: 0.18, duration: "40s", delay: "6s",   color: "#ffffff" },
  { top: "52%",  size: 44,  opacity: 0.25, duration: "22s", delay: "3s",   color: "#00d4ff" },
  { top: "68%",  size: 64,  opacity: 0.20, duration: "35s", delay: "12s",  color: "#ffffff" },
  { top: "20%",  size: 36,  opacity: 0.20, duration: "18s", delay: "8s",   color: "#00d4ff" },
  { top: "78%",  size: 52,  opacity: 0.22, duration: "30s", delay: "15s",  color: "#ffffff" },
  { top: "42%",  size: 72,  opacity: 0.17, duration: "45s", delay: "20s",  color: "#00d4ff" },
];

function AnimatedBoats() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {BOATS.map((b, i) => (
        <div
          key={i}
          className="sail-right"
          style={{
            position: "absolute",
            top: b.top,
            left: 0,
            opacity: b.opacity,
            animationDuration: b.duration,
            animationDelay: b.delay,
          }}
        >
          <Boat size={b.size} color={b.color} />
        </div>
      ))}
    </div>
  );
}

export default function RaceSelector({ onRaceSelected }) {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);

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

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden py-20 px-6 text-center" style={{ background: "#0a0e1a" }}>
        <AnimatedBoats />
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/40 text-cyan-400 text-xs font-semibold tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            SEASON 5 • LIVE TELEMETRY
          </div>
          <h1 className="text-5xl sm:text-6xl font-black leading-tight text-white">
            Fantasy sailing<br />
            has <span style={{ color: "#00d4ff" }}>zero players.</span><br />
            Until now.
          </h1>
          <p className="text-slate-400 text-lg">
            Pick your race. Build your lineup. Score from real telemetry.
          </p>
        </div>
      </div>

      {/* Race lists */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {loading ? (
          <div className="text-center text-slate-500 animate-pulse py-20">Loading races...</div>
        ) : (
          <>
            <RaceGroup title="Halifax 2024" subtitle="Training dataset" races={halifax} selecting={selecting} onSelect={handleSelect} />
            <RaceGroup title="Bermuda 2026" subtitle="Test dataset — unseen by the model" races={bermuda} selecting={selecting} onSelect={handleSelect} />
          </>
        )}
      </div>
    </div>
  );
}

function RaceGroup({ title, subtitle, races, selecting, onSelect }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-black tracking-widest text-white uppercase">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <span className="text-xs text-slate-500">{races.length} AVAILABLE</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {races.map(race => (
          <RaceCard key={`${race.event}-${race.race_label}`} race={race} selecting={selecting} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function RaceCard({ race, selecting, onSelect }) {
  const key = `${race.event}-${race.race_label}`;
  const isSelecting = selecting === key;
  const disabled = selecting !== null;

  return (
    <button
      onClick={() => onSelect(race)}
      disabled={disabled}
      className={`text-left p-5 rounded-2xl border w-full transition-all duration-200
        ${isSelecting ? "border-cyan-400 ring-1 ring-cyan-400/50" : "border-white/10 hover:border-cyan-400/50"}
        ${disabled && !isSelecting ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
      style={{ background: "#111827" }}
    >
      {/* Event name */}
      <p className="text-xs tracking-widest text-slate-500 uppercase mb-1">
        {EVENT_LABEL[race.event] ?? race.event}
      </p>

      {/* Race name */}
      <h3 className="text-lg font-bold text-white mb-4">
        {race.event} • {race.race_label}
      </h3>

      {/* Wind info */}
      <div className="flex items-center gap-4 mb-4">
        <Compass deg={race.avg_twd_deg} />
        <div>
          <span className="text-3xl font-black" style={{ color: "#00d4ff" }}>{race.avg_tws_km_h}</span>
          <span className="text-xs text-slate-400 ml-1">KM/H WIND</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 pt-3 flex items-center justify-between">
        <div className="flex gap-1">
          {race.teams.slice(0, 5).map(t => (
            <span key={t} className="text-base">{FLAG[t] ?? "🏴"}</span>
          ))}
          {race.teams.length > 5 && (
            <span className="text-xs text-slate-400 ml-1">+{race.teams.length - 5}</span>
          )}
        </div>
        <span className="text-xs text-slate-400 font-semibold">{race.num_boats} BOATS</span>
      </div>

      {isSelecting && (
        <p className="mt-3 text-xs text-cyan-400 animate-pulse">Getting AI picks...</p>
      )}
    </button>
  );
}
