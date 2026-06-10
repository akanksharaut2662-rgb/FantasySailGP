import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "../context/auth";
import TeamDashboard from "../components/app/TeamDashboard";
import ConfirmationScreen from "../components/app/ConfirmationScreen";
import SimulationScreen from "../components/app/SimulationScreen";
import RaceScoring from "../components/app/RaceScoring";
import Leaderboard from "../components/app/Leaderboard";
import { fetchRaces, fetchRecommendations, fetchScore, fetchTeamValues } from "../lib/api";

export const Route = createFileRoute("/app")({
  validateSearch: (search: Record<string, unknown>) => ({
    demo: search.demo === "1",
  }),
  head: () => ({
    meta: [{ title: "SailGP Fantasy — Build Your Fleet. Race the Data." }],
  }),
  component: FantasyApp,
});

const STEPS = [
  { num: 2, roman: "I",   label: "Team"     },
  { num: 3, roman: "II",  label: "Confirm"  },
  { num: 4, roman: "III", label: "Simulate" },
  { num: 5, roman: "IV",  label: "Results"  },
  { num: 6, roman: "V",   label: "Board"    },
];

const STARTING_CREDITS = 4_000_000;

function formatCredits(n: number) {
  return n.toLocaleString();
}

const FLAG: Record<string, string> = {
  AUS: "🇦🇺", BRA: "🇧🇷", CAN: "🇨🇦", DEN: "🇩🇰", ESP: "🇪🇸",
  FRA: "🇫🇷", GBR: "🇬🇧", GER: "🇩🇪", ITA: "🇮🇹", NZL: "🇳🇿",
  SUI: "🇨🇭", SWE: "🇸🇪", USA: "🇺🇸",
};

// ── Confetti ─────────────────────────────────────────────────────────────────
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = [
      "#FFD700", "#00D4FF", "#ffffff",
      "#9DFFB0", "#FF8C69", "#C0A8FF",
    ];

    type Piece = {
      x: number; y: number; vx: number; vy: number;
      w: number; h: number; color: string;
      angle: number; spin: number; opacity: number;
    };

    const pieces: Piece[] = Array.from({ length: 220 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height * 1.2,
      vx: (Math.random() - 0.5) * 2.5,
      vy: Math.random() * 2.5 + 1.5,
      w: Math.random() * 12 + 5,
      h: Math.random() * 7 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.12,
      opacity: Math.random() * 0.6 + 0.4,
    }));

    const start = Date.now();
    const TOTAL = 5500;
    let animId: number;

    const draw = () => {
      const elapsed = Date.now() - start;
      const fade = Math.max(0, 1 - Math.max(0, elapsed - 3500) / 2000);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        if (p.y > canvas.height + 30) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.globalAlpha = p.opacity * fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < TOTAL) animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 300 }}
    />
  );
}

// ── Race photo background ─────────────────────────────────────────────────────
function RaceBg() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <img
        src="/race-bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.60 }}
      />
      {/* Cinematic dark gradient — same layering as landing page video */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,6,18,0.70) 0%, rgba(3,6,18,0.20) 40%, rgba(3,6,18,0.78) 100%)",
        }}
      />
    </div>
  );
}


function FantasyApp() {
  const { demo: autoDemo } = Route.useSearch();
  const auth = useAuth();
  const [step, setStep] = useState(2);
  const [appReady, setAppReady] = useState(false);
  const [credits, setCredits] = useState(() => auth.session?.credits ?? STARTING_CREDITS);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [teamValues, setTeamValues] = useState<Record<string, any>>({});
  const [pendingTeams, setPendingTeams] = useState<string[]>([]);
  const [pendingCost, setPendingCost] = useState(0);
  const [confirmedTeams, setConfirmedTeams] = useState<string[]>([]);
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const demoStarted = useRef(false);

  function scrollTop() { window.scrollTo({ top: 0, behavior: "instant" }); }

  // ── Auto-load Bermuda Race_1 on mount ──
  useEffect(() => {
    Promise.all([
      fetchRaces(),
      fetchRecommendations("Bermuda", "Race_1"),
      fetchTeamValues(),
    ])
      .then(([races, recs, vals]: any[]) => {
        const race = races.find((r: any) => r.event === "Bermuda" && r.race_label === "Race_1");
        if (race) {
          setSelectedRace(race);
          setRecommendations((recs as any).recommendations ?? recs);
        }
        const map: Record<string, any> = {};
        for (const v of vals) map[v.team] = v;
        setTeamValues(map);
        setAppReady(true);
      })
      .catch(() => setAppReady(true));
  }, []);

  // ── Confetti trigger on leaderboard ──
  useEffect(() => {
    if (step === 6) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 6000);
      return () => clearTimeout(t);
    }
  }, [step]);

  function handleTeamsChosen(teams: string[], cost: number) {
    setPendingTeams(teams);
    setPendingCost(cost);
    setStep(3);
    scrollTop();
  }

  function handleConfirmFleet() {
    const next = Math.max(0, credits - pendingCost);
    setCredits(next);
    auth.setCredits(next);
    setConfirmedTeams(pendingTeams);
    setStep(4);
    scrollTop();
  }

  function handleSimulationComplete() {
    fetchScore(selectedRace.event, selectedRace.race_label, confirmedTeams)
      .then((result: any) => { setScoreResult(result); setStep(5); scrollTop(); })
      .catch(() => { setStep(5); scrollTop(); });
  }

  function handleViewLeaderboard() { setStep(6); scrollTop(); }

  function handleCreditsEarned(amount: number, score: number) {
    const next = Math.max(0, credits + amount);
    setCredits(next);
    auth.setCredits(next, score, confirmedTeams);
  }

  function handleReset() {
    setStep(2);
    setRecommendations([]);
    setPendingTeams([]);
    setPendingCost(0);
    setConfirmedTeams([]);
    setScoreResult(null);
    setCredits(auth.session?.credits ?? STARTING_CREDITS);
    demoStarted.current = false;
    scrollTop();
  }

  // ── Auto-demo: step 2 → 3 ──
  useEffect(() => {
    if (!autoDemo || step !== 2 || !appReady) return;
    const t = setTimeout(() => {
      const picks = recommendations.slice(0, 3).map((r: any) => r.team);
      const cost = picks.reduce((s: number, tm: string) => s + (teamValues[tm]?.cost ?? 1_000_000), 0);
      handleTeamsChosen(picks, cost);
    }, 3000);
    return () => clearTimeout(t);
  }, [autoDemo, step, appReady]);

  // ── Auto-demo: step 3 → 4 ──
  useEffect(() => {
    if (!autoDemo || step !== 3) return;
    const t = setTimeout(handleConfirmFleet, 2000);
    return () => clearTimeout(t);
  }, [autoDemo, step]);

  const userPicks = scoreResult?.leaderboard?.filter((r: any) => r.is_user_pick) ?? [];

  const stepIdx = STEPS.findIndex(s => s.num === step);

  // ── Loading overlay ──
  if (!appReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <RaceBg />
        <div className="relative z-10 text-center space-y-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent mx-auto"
            style={{ animation: "spin-slow 1s linear infinite" }}
          />
          <p className="eyebrow animate-pulse">Fetching race data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Ocean wave background */}
      <RaceBg />

      {/* Confetti overlay */}
      {showConfetti && <Confetti />}

      {/* ── Fixed header ── */}
      <header
        className="fixed top-0 inset-x-0 z-50"
        style={{
          background: "oklch(0.07 0.03 60 / 0.90)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid oklch(0.34 0.08 65 / 38%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="font-display text-3xl leading-none text-ink italic">B</div>
            <div className="flex flex-col leading-none">
              <span className="eyebrow !text-[9px]">SailGP</span>
              <span className="font-display text-base text-ink">Fantasy</span>
            </div>
          </Link>

          {/* Credits display — always visible */}
          <div
            className="flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{
              background: "oklch(0.16 0.06 60 / 0.80)",
              border: "1px solid oklch(0.74 0.14 75 / 0.40)",
            }}
          >
            <span className="eyebrow !text-[8px] text-muted-foreground">Credits</span>
            <span className="font-display text-base text-ink tabular">
              {formatCredits(credits)}
            </span>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-4 shrink-0">
            {autoDemo && (
              <span className="eyebrow !text-[8px] border border-gold/40 text-gold rounded-full px-2.5 py-1 bg-gold/5 animate-pulse">
                DEMO
              </span>
            )}
            {selectedRace && step >= 3 && (
              <span className="hidden md:block eyebrow !text-[9px] text-muted-foreground">
                {selectedRace.event} · {selectedRace.race_label.replace("_", " ")}
              </span>
            )}
            {step === 6 && userPicks.length > 0 && (
              <div className="hidden md:flex gap-1">
                {userPicks.map((r: any) => (
                  <span key={r.team} className="text-base">{FLAG[r.team] ?? "🏴"}</span>
                ))}
              </div>
            )}
            <div className="hidden sm:flex items-center gap-3">
              {STEPS.map((s) => (
                <span
                  key={s.num}
                  className={`font-display text-base leading-none ${
                    s.num === step ? "text-gold" : s.num < step ? "text-teal" : "text-ink/20"
                  }`}
                >
                  {s.roman}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Amber-to-gold progress bar */}
        <div className="h-px" style={{ background: "oklch(0.22 0.06 60 / 50%)" }}>
          <div
            className="h-px transition-all duration-700 ease-in-out"
            style={{
              width: `${stepIdx < 0 ? 0 : (stepIdx / (STEPS.length - 1)) * 100}%`,
              background: "linear-gradient(90deg, oklch(0.62 0.17 45), oklch(0.78 0.16 75), oklch(0.85 0.14 78))",
            }}
          />
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="relative z-10 pt-16" data-app style={{ overflowAnchor: "none" }}>
        {step === 2 && (
          <TeamDashboard
            race={selectedRace}
            recommendations={recommendations}
            teamValues={teamValues}
            credits={credits}
            onConfirm={handleTeamsChosen}
          />
        )}

        {step === 3 && (
          <ConfirmationScreen
            race={selectedRace}
            teams={pendingTeams}
            teamValues={teamValues}
            totalCost={pendingCost}
            creditsBefore={credits}
            onConfirm={handleConfirmFleet}
            onBack={() => { setStep(2); scrollTop(); }}
          />
        )}

        {step === 4 && (
          <SimulationScreen
            race={selectedRace}
            teams={confirmedTeams}
            onComplete={handleSimulationComplete}
          />
        )}

        {step === 5 && (
          <RaceScoring
            result={scoreResult}
            recommendations={recommendations}
            onViewLeaderboard={handleViewLeaderboard}
          />
        )}

        {step === 6 && (
          <Leaderboard
            result={scoreResult}
            recommendations={recommendations}
            credits={credits}
            teams={confirmedTeams}
            onCreditsEarned={handleCreditsEarned}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
