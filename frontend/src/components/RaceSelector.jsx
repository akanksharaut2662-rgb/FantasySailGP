/**
 * RaceSelector.jsx
 * Step 1: Let the user choose a race from the full list.
 * Shows event, race number, wind speed, and wind direction as card grid.
 */

import { useEffect, useState } from "react";
import { fetchRaces } from "../api";

const EVENT_COLORS = {
  Halifax: "text-sail-teal  border-sail-teal/30  bg-sail-teal/10",
  Bermuda: "text-sail-amber border-sail-amber/30 bg-sail-amber/10",
};

function WindArrow({ deg }) {
  return (
    <span
      className="inline-block text-lg leading-none"
      style={{ transform: `rotate(${deg}deg)`, display: "inline-block" }}
      title={`${deg}°`}
    >
      ↑
    </span>
  );
}

export default function RaceSelector({ onSelect }) {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchRaces()
      .then(setRaces)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const events = ["All", ...new Set(races.map((r) => r.event))];
  const filtered = filter === "All" ? races : races.filter((r) => r.event === filter);

  return (
    <div className="animate-fadeUp max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black tracking-tight gradient-text mb-2">
          SailGP Fantasy Predictor
        </h1>
        <p className="text-white/50 text-sm">
          Fantasy football has 45&nbsp;M players. Fantasy sailing has zero. <span className="text-white/80">Until now.</span>
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {events.map((e) => (
          <button
            key={e}
            onClick={() => setFilter(e)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all
              ${filter === e
                ? "bg-ocean-500 text-white shadow-lg shadow-ocean-500/25"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"}`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center h-48 text-white/40">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-ocean-400 border-t-transparent" />
        </div>
      )}
      {error && (
        <div className="card p-6 border-sail-coral/30 bg-sail-coral/10 text-sail-coral">
          ⚠ Could not load races: {error}
        </div>
      )}

      {/* Race grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((race) => (
            <button
              key={`${race.event}-${race.race_label}`}
              onClick={() => onSelect(race)}
              className="card-hover p-5 text-left group"
            >
              {/* Event badge */}
              <span className={`badge mb-3 ${EVENT_COLORS[race.event] ?? "badge-blue"}`}>
                {race.event}
              </span>

              <h2 className="text-lg font-bold mb-1 group-hover:text-ocean-300 transition-colors">
                {race.race_label.replace("_", " ")}
              </h2>

              <div className="flex items-center gap-3 text-sm text-white/60 mb-4">
                <span>{new Date(race.race_start_utc).toLocaleDateString("en-CA")}</span>
                <span>·</span>
                <span>{race.num_boats} boats</span>
              </div>

              {/* Wind info */}
              <div className="flex gap-4">
                <div className="stat-chip flex-1">
                  <span className="text-xs text-white/40 mb-0.5">Wind</span>
                  <span className="text-base font-bold text-sail-teal">
                    {race.avg_tws_km_h.toFixed(1)}<span className="text-xs font-normal ml-0.5">km/h</span>
                  </span>
                </div>
                <div className="stat-chip flex-1">
                  <span className="text-xs text-white/40 mb-0.5">Dir</span>
                  <span className="text-base font-bold flex items-center gap-1">
                    <WindArrow deg={race.avg_twd_deg} />
                    {Math.round(race.avg_twd_deg)}°
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
