/**
 * App.jsx
 * Root component — single-page wizard: RaceSelector → OptimizerPanel → TeamBuilder → RaceScoring → Leaderboard
 */

import { useState } from "react";
import { fetchRecommendations, fetchScore } from "./api";

import RaceSelector   from "./components/RaceSelector";
import OptimizerPanel from "./components/OptimizerPanel";
import TeamBuilder    from "./components/TeamBuilder";
import RaceScoring    from "./components/RaceScoring";
import Leaderboard    from "./components/Leaderboard";

const STEPS = ["select", "optimizer", "builder", "scoring", "leaderboard"];

const STEP_LABELS = {
  select:      "Pick Race",
  optimizer:   "Conditions",
  builder:     "Your Team",
  scoring:     "Results",
  leaderboard: "Leaderboard",
};

function StepIndicator({ current }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-1 justify-center mb-10 select-none">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all
              ${i === idx
                ? "bg-ocean-500 text-white"
                : i < idx
                  ? "bg-white/10 text-white/60"
                  : "bg-white/5 text-white/20"}`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px]
              ${i < idx ? "bg-sail-teal text-ocean-900" : "bg-white/10"}`}>
              {i < idx ? "✓" : i + 1}
            </span>
            {STEP_LABELS[s]}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-4 ${i < idx ? "bg-white/30" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("select");
  const [selectedRace, setSelectedRace] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [pickedTeams, setPickedTeams] = useState(new Set());
  const [scoreResult, setScoreResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Step 1 → 2 ──
  function handleRaceSelect(race) {
    setSelectedRace(race);
    setPickedTeams(new Set());
    setScoreResult(null);
    setRecommendations(null);
    setStep("optimizer");
  }

  // ── Step 2 → 3 ──
  async function handleOptimizerContinue() {
    // Recs already fetched inside OptimizerPanel; we re-fetch here just to keep state at App level
    try {
      const recs = await fetchRecommendations(selectedRace.event, selectedRace.race_label);
      setRecommendations(recs);
    } catch (_) {
      // Non-fatal — recs optional
    }
    setStep("builder");
  }

  // ── Toggle team selection ──
  function handleToggleTeam(team) {
    setPickedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(team)) next.delete(team);
      else if (next.size < 3) next.add(team);
      return next;
    });
  }

  // ── Step 3 → 4 ──
  async function handleRunRace() {
    if (pickedTeams.size === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchScore(
        selectedRace.event,
        selectedRace.race_label,
        [...pickedTeams]
      );
      setScoreResult(result);
      setStep("scoring");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Reset ──
  function handleReset() {
    setStep("select");
    setSelectedRace(null);
    setPickedTeams(new Set());
    setScoreResult(null);
    setRecommendations(null);
  }

  return (
    <div className="min-h-screen px-4 py-10">
      {/* Top nav bar */}
      <header className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <button onClick={handleReset} className="flex items-center gap-2 group">
          <span className="text-sail-teal text-xl font-black tracking-tight group-hover:scale-110 transition-transform">
            ⛵
          </span>
          <span className="font-black text-white/80 text-sm">FantasySailGP</span>
        </button>
        <span className="text-xs text-white/20">Powered by SailGP telemetry</span>
      </header>

      <main className="max-w-5xl mx-auto">
        <StepIndicator current={step} />

        {/* Error banner */}
        {error && (
          <div className="mb-6 card p-4 border-sail-coral/30 bg-sail-coral/10 text-sail-coral text-sm">
            ⚠ {error}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="card p-8 flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-ocean-400 border-t-transparent" />
              <p className="text-white/60 text-sm">Computing fantasy scores…</p>
            </div>
          </div>
        )}

        {/* Step router */}
        {step === "select" && <RaceSelector onSelect={handleRaceSelect} />}

        {step === "optimizer" && selectedRace && (
          <OptimizerPanel race={selectedRace} onContinue={handleOptimizerContinue} />
        )}

        {step === "builder" && selectedRace && (
          <TeamBuilder
            race={selectedRace}
            recommendations={recommendations}
            selected={pickedTeams}
            onToggle={handleToggleTeam}
            onRunRace={handleRunRace}
          />
        )}

        {step === "scoring" && scoreResult && (
          <RaceScoring
            scoreResult={scoreResult}
            onContinue={() => setStep("leaderboard")}
          />
        )}

        {step === "leaderboard" && scoreResult && (
          <Leaderboard
            scoreResult={scoreResult}
            recommendations={recommendations}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
