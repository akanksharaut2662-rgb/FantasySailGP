import { useState } from "react";
import RaceSelector from "./components/RaceSelector";
import OptimizerPanel from "./components/OptimizerPanel";
import TeamBuilder from "./components/TeamBuilder";
import RaceScoring from "./components/RaceScoring";
import Leaderboard from "./components/Leaderboard";

const STEPS = [
  { num: 1, label: "Race" },
  { num: 2, label: "AI" },
  { num: 3, label: "Lineup" },
  { num: 4, label: "Live" },
  { num: 5, label: "Board" },
];

export default function App() {
  const [step, setStep] = useState(1);
  const [selectedRace, setSelectedRace] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [scoreResult, setScoreResult] = useState(null);

  function handleRaceSelected(race, recs) {
    setSelectedRace(race);
    setRecommendations(recs);
    setStep(2);
  }

  function handleProceedToBuilder() { setStep(3); }

  function handleTeamsConfirmed(_teams, result) {
    setScoreResult(result);
    setStep(4);
  }

  function handleViewLeaderboard() { setStep(5); }

  function handleReset() {
    setStep(1);
    setSelectedRace(null);
    setRecommendations([]);
    setScoreResult(null);
  }

  return (
    <div className="min-h-screen text-white" style={{ background: "#0a0e1a" }}>
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4" style={{ background: "#0d1220" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl">⛵</span>
            <div className="leading-none">
              <div className="text-sm font-black tracking-widest text-white">SAILGP</div>
              <div className="text-xs tracking-widest text-cyan-400" style={{ fontSize: "9px" }}>FANTASY PREDICTOR</div>
            </div>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all
                  ${s.num === step ? "bg-cyan-400 text-slate-900" : s.num < step ? "text-slate-400" : "text-slate-600"}`}>
                  {s.num} {s.label}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px ${s.num < step ? "bg-slate-500" : "bg-slate-700"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Screens */}
      {step === 1 && <RaceSelector onRaceSelected={handleRaceSelected} />}
      {step === 2 && <OptimizerPanel race={selectedRace} recommendations={recommendations} onProceed={handleProceedToBuilder} />}
      {step === 3 && <TeamBuilder race={selectedRace} recommendations={recommendations} onConfirm={handleTeamsConfirmed} />}
      {step === 4 && <RaceScoring result={scoreResult} onViewLeaderboard={handleViewLeaderboard} />}
      {step === 5 && <Leaderboard result={scoreResult} recommendations={recommendations} onReset={handleReset} />}
    </div>
  );
}
