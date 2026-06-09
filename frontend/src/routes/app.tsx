import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import RaceSelector from "../components/app/RaceSelector";
import OptimizerPanel from "../components/app/OptimizerPanel";
import TeamBuilder from "../components/app/TeamBuilder";
import Leaderboard from "../components/app/Leaderboard";
import { fetchRaces, fetchRecommendations, fetchScore } from "../lib/api";

export const Route = createFileRoute("/app")({
  validateSearch: (search: Record<string, unknown>) => ({
    demo: search.demo === "1",
  }),
  head: () => ({
    meta: [{ title: "SailGP Fantasy Predictor — Build Your Team. Race the Data." }],
  }),
  component: FantasyApp,
});

const STEPS = [
  { num: 1, roman: "I",    label: "Race"    },
  { num: 2, roman: "II",   label: "Picks"   },
  { num: 3, roman: "III",  label: "Lineup"  },
  { num: 4, roman: "IV",   label: "Results" },
];

const FLAG: Record<string, string> = {
  AUS: "🇦🇺", BRA: "🇧🇷", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", ITA: "🇮🇹", NZL: "🇳🇿",
  SUI: "🇨🇭", SWE: "🇸🇪", USA: "🇺🇸",
};

function FantasyApp() {
  const { demo: autoDemo } = Route.useSearch();
  const [step, setStep] = useState(1);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [demoSelecting, setDemoSelecting] = useState(false);
  const demoStarted = useRef(false);

  function scrollTop() { window.scrollTo({ top: 0, behavior: "instant" }); }

  function handleRaceSelected(race: any, recs: any[]) {
    setSelectedRace(race);
    setRecommendations(recs);
    setStep(2);
    scrollTop();
  }
  function handleProceedToBuilder() { setStep(3); scrollTop(); }
  function handleTeamsConfirmed(_teams: string[], result: any) { setScoreResult(result); setStep(4); scrollTop(); }
  function handleReset() {
    setStep(1); setSelectedRace(null); setRecommendations([]); setScoreResult(null);
    demoStarted.current = false;
    scrollTop();
  }

  // ── Auto-demo: step 1 → 2 ──
  useEffect(() => {
    if (!autoDemo || step !== 1 || demoStarted.current) return;
    demoStarted.current = true;
    const t = setTimeout(async () => {
      setDemoSelecting(true);
      try {
        const [races, recs] = await Promise.all([
          fetchRaces(),
          fetchRecommendations("Halifax", "Race_1"),
        ]);
        const race = (races as any[]).find(r => r.event === "Halifax" && r.race_label === "Race_1");
        if (race && recs) { setSelectedRace(race); setRecommendations(recs as any[]); setStep(2); }
      } catch {}
      setDemoSelecting(false);
    }, 2500);
    return () => clearTimeout(t);
  }, [autoDemo, step]);

  // ── Auto-demo: step 2 → 3 ──
  useEffect(() => {
    if (!autoDemo || step !== 2) return;
    const t = setTimeout(() => setStep(3), 3500);
    return () => clearTimeout(t);
  }, [autoDemo, step]);

  // ── Auto-demo: step 3 → 4 ──
  useEffect(() => {
    if (!autoDemo || step !== 3 || recommendations.length === 0) return;
    const t = setTimeout(async () => {
      try {
        const picks = recommendations.slice(0, 3).map((r: any) => r.team);
        const result = await fetchScore("Halifax", "Race_1", picks);
        setScoreResult(result); setStep(4);
      } catch {}
    }, 2800);
    return () => clearTimeout(t);
  }, [autoDemo, step, recommendations]);

  // Context crumb shown in header at step 2+
  const userPicks = scoreResult?.leaderboard?.filter((r: any) => r.is_user_pick) ?? [];
  const aiTeams = recommendations.slice(0, 3).map((r: any) => r.team);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 md:px-10 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="font-display text-3xl leading-none text-ink italic">B</div>
            <div className="flex flex-col leading-none">
              <span className="eyebrow !text-[9px]">SailGP</span>
              <span className="font-display text-base text-ink">Fantasy</span>
            </div>
          </Link>

          {/* Centre: race context crumb (step 2+) or step indicators */}
          <div className="flex-1 flex items-center justify-center gap-3 mx-6 min-w-0">
            {step === 1 ? (
              <span className="eyebrow !text-[9px] text-muted-foreground">Select a race to begin</span>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                {selectedRace && (
                  <span className="eyebrow !text-[9px] text-ink truncate">
                    {selectedRace.event} · {selectedRace.race_label.replace("_", " ")}
                  </span>
                )}
                {step >= 4 && userPicks.length > 0 && (
                  <>
                    <span className="text-ink/20">·</span>
                    <div className="flex gap-1 shrink-0">
                      {userPicks.map((r: any) => (
                        <span key={r.team} className="text-base leading-none">{FLAG[r.team] ?? "🏴"}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: step progress + model link */}
          <div className="flex items-center gap-4 shrink-0">
            {autoDemo && (
              <span className="eyebrow !text-[8px] border border-gold/40 text-gold rounded-full px-2.5 py-1 bg-gold/5 animate-pulse">
                DEMO
              </span>
            )}
            <Link to="/model" className="hidden md:block eyebrow !text-[9px] text-muted-foreground hover:text-teal transition-colors">
              Model Intel
            </Link>
            <div className="hidden sm:flex items-center gap-4 md:gap-6">
              {STEPS.map((s) => (
                <div key={s.num} className="flex items-center gap-1">
                  <span className={`font-display text-base leading-none ${
                    s.num === step ? "text-gold" : s.num < step ? "text-teal" : "text-ink/20"
                  }`}>{s.roman}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gold progress bar */}
        <div className="h-px bg-border">
          <div
            className="h-px bg-gold transition-all duration-700 ease-in-out"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </header>

      <main className="pt-16" data-app style={{ overflowAnchor: "none" }}>
        {step === 1 && <RaceSelector onRaceSelected={handleRaceSelected} demoSelecting={demoSelecting} />}
        {step === 2 && <OptimizerPanel race={selectedRace} recommendations={recommendations} onProceed={handleProceedToBuilder} />}
        {step === 3 && <TeamBuilder race={selectedRace} recommendations={recommendations} initialSelected={aiTeams} onConfirm={handleTeamsConfirmed} />}
        {step === 4 && <Leaderboard result={scoreResult} recommendations={recommendations} onReset={handleReset} />}
      </main>
    </div>
  );
}
