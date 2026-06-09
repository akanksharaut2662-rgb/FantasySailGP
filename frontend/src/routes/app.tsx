import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import RaceSelector from "../components/app/RaceSelector";
import OptimizerPanel from "../components/app/OptimizerPanel";
import TeamBuilder from "../components/app/TeamBuilder";
import RaceScoring from "../components/app/RaceScoring";
import Leaderboard from "../components/app/Leaderboard";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [{ title: "SailGP Fantasy Predictor — Build Your Team. Race the Data." }],
  }),
  component: FantasyApp,
});

const STEPS = [
  { num: 1, roman: "I",    label: "Race"   },
  { num: 2, roman: "II",   label: "Picks"  },
  { num: 3, roman: "III",  label: "Lineup" },
  { num: 4, roman: "IV",   label: "Scores" },
  { num: 5, roman: "V",    label: "Board"  },
];

function FantasyApp() {
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
  function handleTeamsConfirmed(_teams, result) { setScoreResult(result); setStep(4); }
  function handleViewLeaderboard() { setStep(5); }
  function handleReset() {
    setStep(1); setSelectedRace(null); setRecommendations([]); setScoreResult(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 md:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="font-display text-3xl leading-none text-ink italic">B</div>
            <div className="flex flex-col leading-none">
              <span className="eyebrow !text-[9px]">SailGP</span>
              <span className="font-display text-base text-ink">Fantasy</span>
            </div>
          </Link>

          <div className="flex items-center gap-5 md:gap-8">
            {STEPS.map((s) => (
              <div key={s.num} className="hidden sm:flex items-center gap-1.5">
                <span className={`font-display text-lg leading-none ${
                  s.num === step ? "text-gold" : s.num < step ? "text-teal" : "text-ink/20"
                }`}>{s.roman}</span>
                <span className={`eyebrow !text-[9px] ${
                  s.num === step ? "text-ink" : s.num < step ? "text-teal/70" : "text-ink/20"
                }`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-border">
          <div
            className="h-px bg-gold transition-all duration-700 ease-in-out"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </header>

      <main className="pt-16">
        {step === 1 && <RaceSelector onRaceSelected={handleRaceSelected} />}
        {step === 2 && <OptimizerPanel race={selectedRace} recommendations={recommendations} onProceed={handleProceedToBuilder} />}
        {step === 3 && <TeamBuilder race={selectedRace} recommendations={recommendations} onConfirm={handleTeamsConfirmed} />}
        {step === 4 && <RaceScoring result={scoreResult} onViewLeaderboard={handleViewLeaderboard} />}
        {step === 5 && <Leaderboard result={scoreResult} recommendations={recommendations} onReset={handleReset} />}
      </main>
    </div>
  );
}
