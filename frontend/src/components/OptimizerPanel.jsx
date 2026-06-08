/**
 * OptimizerPanel.jsx
 * Step 2: Show wind conditions for the selected race + ML team recommendations.
 */

import { useEffect, useState } from "react";
import { fetchRecommendations } from "../api";

function CompassArrow({ deg }) {
  const cardinalDir = (d) => {
    const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    return dirs[Math.round(d / 22.5) % 16];
  };
  return (
    <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-2">
      {/* Compass ring */}
      <div className="absolute inset-0 rounded-full border-2 border-ocean-500/40 animate-pulse-ring" />
      <div className="absolute inset-2 rounded-full border border-white/10" />
      {/* Arrow */}
      <div
        className="w-1 h-10 bg-gradient-to-t from-sail-teal to-transparent rounded-full origin-bottom"
        style={{ transform: `rotate(${deg}deg)` }}
      />
      <div className="absolute text-xs font-bold text-white/30">
        <span className="absolute -top-5 left-1/2 -translate-x-1/2">N</span>
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2">S</span>
        <span className="absolute -left-5 top-1/2 -translate-y-1/2">W</span>
        <span className="absolute -right-5 top-1/2 -translate-y-1/2">E</span>
      </div>
      <span className="absolute bottom-0 right-0 text-xs text-sail-teal font-semibold">
        {cardinalDir(deg)}
      </span>
    </div>
  );
}

const RANK_COLORS = ["text-yellow-400", "text-slate-300", "text-amber-600"];
const RANK_LABELS = ["🥇", "🥈", "🥉"];

export default function OptimizerPanel({ race, onContinue }) {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations(race.event, race.race_label)
      .then(setRecs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [race]);

  return (
    <div className="animate-fadeUp max-w-2xl mx-auto">
      {/* Back breadcrumb */}
      <p className="text-xs text-white/30 mb-6">
        {race.event} › {race.race_label.replace("_", " ")}
      </p>

      <h2 className="section-title mb-1">Race Conditions</h2>
      <p className="section-sub mb-8">
        Our ML optimizer analyses these wind conditions to recommend the strongest teams.
      </p>

      {/* Wind card */}
      <div className="card p-6 mb-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1 text-center">
          <CompassArrow deg={race.avg_twd_deg} />
          <p className="text-xs text-white/40 mt-4">Wind direction</p>
          <p className="text-2xl font-black">{Math.round(race.avg_twd_deg)}°</p>
        </div>
        <div className="w-px h-24 bg-white/10 hidden sm:block" />
        <div className="flex-1 text-center">
          <div className="text-5xl font-black gradient-text">
            {race.avg_tws_km_h.toFixed(1)}
          </div>
          <div className="text-white/40 text-sm mt-1">km/h average wind</div>
          <div className="mt-4 progress-bar w-full max-w-xs mx-auto">
            <div
              className="progress-fill bg-gradient-to-r from-ocean-500 to-sail-teal"
              style={{ width: `${Math.min(race.avg_tws_km_h / 50 * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-white/30 mt-1">
            {race.avg_tws_km_h < 20 ? "Light winds" : race.avg_tws_km_h < 35 ? "Moderate winds" : "Strong winds"}
          </p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card p-6">
        <h3 className="font-bold text-base mb-1 flex items-center gap-2">
          <span className="text-sail-teal">⚡</span> Optimizer Recommendations
        </h3>
        <p className="text-xs text-white/40 mb-5">
          Ridge Regression model trained on Halifax telemetry
        </p>

        {loading && (
          <div className="flex justify-center py-8 text-white/30">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-ocean-400 border-t-transparent" />
          </div>
        )}
        {error && (
          <p className="text-sail-coral text-sm">
            ⚠ {error.includes("503") ? "Model not trained yet — run train_model.py first." : error}
          </p>
        )}

        {recs && (
          <div className="space-y-3">
            {recs.recommendations.map((rec, i) => (
              <div
                key={rec.team}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10
                           hover:bg-white/10 transition-colors"
              >
                <span className="text-2xl w-8 text-center">{RANK_LABELS[i] ?? `${i + 1}.`}</span>
                <div className="flex-1">
                  <p className={`font-bold text-base ${RANK_COLORS[i] ?? "text-white"}`}>
                    {rec.team}
                  </p>
                  <div className="progress-bar mt-1 w-full max-w-[12rem]">
                    <div
                      className="progress-fill bg-gradient-to-r from-ocean-500 to-sail-teal"
                      style={{ width: `${Math.min(rec.predicted_score / 125 * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-white/70">
                  ~{rec.predicted_score.toFixed(1)} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={onContinue} className="btn-primary text-base px-7 py-3">
          Build your team →
        </button>
      </div>
    </div>
  );
}
