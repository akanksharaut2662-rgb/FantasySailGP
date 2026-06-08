import { useState } from "react";
import { fetchScore } from "../api";

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
  const color = selected ? "#00d4ff" : recommended ? "#00d4ff" : "#4b5563";
  return (
    <svg viewBox="0 0 60 60" className="w-14 h-14 mx-auto mb-3" fill="none">
      <polygon points="30,4 30,46 8,46" fill={color} opacity={selected ? "1" : "0.5"} />
      <polygon points="30,12 30,42 50,42" fill={color} opacity={selected ? "0.7" : "0.3"} />
      <ellipse cx="30" cy="50" rx="22" ry="6" fill={color} opacity={selected ? "0.9" : "0.3"} />
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">
            {race.event} • {race.race_label}
          </p>
          <h2 className="text-4xl font-black text-white">Build your lineup</h2>
        </div>
        <div className={`px-5 py-2 rounded-full border text-sm font-bold
          ${selected.length === 3 ? "border-cyan-400 text-cyan-400" : "border-white/20 text-slate-300"}`}
          style={{ background: "#111827" }}>
          <span style={{ color: "#00d4ff" }}>{selected.length}</span> / 3 teams selected
        </div>
      </div>

      {/* Boat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {race.teams.map(team => {
          const isSelected = selected.includes(team);
          const isRec = recTeams.has(team);
          const isDisabled = !isSelected && selected.length === 3;

          return (
            <button
              key={team}
              onClick={() => toggle(team)}
              disabled={isDisabled}
              className={`relative p-5 rounded-2xl border text-left transition-all duration-200 w-full
                ${isSelected ? "border-cyan-400 ring-1 ring-cyan-400/40" : isRec ? "border-cyan-400/30" : "border-white/10"}
                ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:border-cyan-400/50"}
              `}
              style={{ background: isSelected ? "rgba(0,212,255,0.07)" : "#111827" }}
            >
              {/* Star for AI recommended */}
              {isRec && (
                <span className="absolute top-3 right-3 text-lg">⭐</span>
              )}

              <BoatIcon selected={isSelected} recommended={isRec} />

              <div className="flex items-center gap-2">
                <span className="text-xl">{FLAG[team] ?? "🏴"}</span>
                <div>
                  <div className="font-black text-white text-base">{team}</div>
                  <div className="text-xs text-slate-400">{FULL_NAME[team] ?? team}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Run race button */}
      {selected.length === 3 && (
        <div className="text-center pt-2">
          <button
            onClick={handleRunRace}
            disabled={loading}
            className="px-10 py-4 rounded-full font-black text-slate-900 text-sm tracking-widest transition-all hover:scale-105 disabled:opacity-70"
            style={{ background: "#00d4ff" }}>
            {loading ? "LOADING..." : "RUN RACE →"}
          </button>
        </div>
      )}
    </div>
  );
}
