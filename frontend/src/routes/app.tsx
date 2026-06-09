import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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

// ── Sunset sailing SVG scene background ──────────────────────────────────────
function SunsetBackground() {
  // Horizon line — sunset just beginning, sun still above water
  const HY = 570;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* SKY — rich blue at top, sunset just beginning near horizon */}
          <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#06142e" />   {/* deep navy top */}
            <stop offset="15%"  stopColor="#0a2040" />   {/* dark ocean blue */}
            <stop offset="30%"  stopColor="#0e2e58" />   {/* rich blue */}
            <stop offset="45%"  stopColor="#143868" />   {/* vibrant blue sky */}
            <stop offset="57%"  stopColor="#1c3a62" />   {/* blue starting to warm */}
            <stop offset="65%"  stopColor="#2a3855" />   {/* blue-steel transition */}
            <stop offset="72%"  stopColor="#5a3a30" />   {/* warm purple-brown */}
            <stop offset="79%"  stopColor="#a04820" />   {/* orange begins */}
            <stop offset="86%"  stopColor="#d06828" />   {/* warm orange */}
            <stop offset="92%"  stopColor="#ee8830" />   {/* golden orange */}
            <stop offset="96%"  stopColor="#f8aa40" />   {/* amber */}
            <stop offset="99%"  stopColor="#ffc850" />   {/* gold at horizon */}
            <stop offset="100%" stopColor="#ffe070" />   {/* bright gold strip */}
          </linearGradient>

          {/* OCEAN — lighter blue, still rich and oceanic */}
          <linearGradient id="ocean-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1e4878" />
            <stop offset="10%"  stopColor="#1a4272" />
            <stop offset="25%"  stopColor="#163a68" />
            <stop offset="45%"  stopColor="#122e58" />
            <stop offset="65%"  stopColor="#0e2448" />
            <stop offset="85%"  stopColor="#0c1e3c" />
            <stop offset="100%" stopColor="#0a1830" />
          </linearGradient>

          {/* Mid-wave blue fill */}
          <linearGradient id="wave-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#2a5898" stopOpacity="0.90" />
            <stop offset="100%" stopColor="#163870" stopOpacity="0.80" />
          </linearGradient>

          {/* Near-wave */}
          <linearGradient id="wave-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#2a5898" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#163870" stopOpacity="0.88" />
          </linearGradient>

          {/* Foreground wave */}
          <linearGradient id="wave-fore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#244e8a" stopOpacity="1" />
            <stop offset="100%" stopColor="#122a58" stopOpacity="1" />
          </linearGradient>

          {/* SUN halo radial */}
          <radialGradient id="sun-halo" cx="50%" cy="100%" r="85%">
            <stop offset="0%"  stopColor="#fff0b0" stopOpacity="1.0" />
            <stop offset="6%"  stopColor="#ffc840" stopOpacity="0.85" />
            <stop offset="18%" stopColor="#ff8820" stopOpacity="0.55" />
            <stop offset="38%" stopColor="#cc5500" stopOpacity="0.22" />
            <stop offset="65%" stopColor="#662200" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>

          {/* Sun path on water — golden on deep blue */}
          <linearGradient id="sunpath-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#ffd870" stopOpacity="0.88" />
            <stop offset="20%" stopColor="#ff9930" stopOpacity="0.60" />
            <stop offset="50%" stopColor="#cc5500" stopOpacity="0.28" />
            <stop offset="80%" stopColor="#551800" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </linearGradient>

          {/* Dark overlay — heavier top + bottom */}
          <linearGradient id="overlay-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.60" />
            <stop offset="15%"  stopColor="#000" stopOpacity="0.38" />
            <stop offset="40%"  stopColor="#000" stopOpacity="0.22" />
            <stop offset="62%"  stopColor="#000" stopOpacity="0.25" />
            <stop offset="82%"  stopColor="#000" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.70" />
          </linearGradient>

          {/* Foam gradient — bright white fading down */}
          <linearGradient id="foam-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#d8eeff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#a0ccee" stopOpacity="0.10" />
          </linearGradient>

          {/* Filters */}
          <filter id="f-haze" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id="f-sun" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="f-foam" x="-5%" y="-10%" width="110%" height="130%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
          <filter id="f-cloud" x="-20%" y="-30%" width="140%" height="160%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        {/* ── BASE SKY ── */}
        <rect width="1920" height={HY} fill="url(#sky-grad)" />

        {/* ── BASE OCEAN ── */}
        <rect y={HY} width="1920" height={1080 - HY} fill="url(#ocean-grad)" />

        {/* ── Sunset horizon atmospheric glow ── */}
        <ellipse
          cx="960" cy={HY} rx="800" ry="280"
          fill="url(#sun-halo)"
          filter="url(#f-haze)"
          opacity="0.70"
        />

        {/* ── Wispy clouds — blue-purple, lit warm below ── */}
        {/* Left cloud bank */}
        <ellipse cx="310" cy="210" rx="420" ry="55" fill="#1a2d55" opacity="0.45" filter="url(#f-cloud)" />
        <ellipse cx="260" cy="195" rx="280" ry="38" fill="#22355a" opacity="0.35" filter="url(#f-cloud)" />
        {/* Warm underside of left clouds */}
        <ellipse cx="340" cy="248" rx="360" ry="30" fill="#8a3a10" opacity="0.22" filter="url(#f-cloud)" />

        {/* Right cloud bank */}
        <ellipse cx="1580" cy="175" rx="380" ry="50" fill="#162848" opacity="0.42" filter="url(#f-cloud)" />
        <ellipse cx="1640" cy="155" rx="260" ry="35" fill="#1e3055" opacity="0.32" filter="url(#f-cloud)" />
        <ellipse cx="1560" cy="210" rx="320" ry="28" fill="#7a3015" opacity="0.18" filter="url(#f-cloud)" />

        {/* High mid clouds — cool blue-grey */}
        <ellipse cx="960" cy="125" rx="520" ry="40" fill="#0e2244" opacity="0.38" filter="url(#f-cloud)" />
        <ellipse cx="700" cy="330" rx="300" ry="22" fill="#2a3a58" opacity="0.28" filter="url(#f-cloud)" />
        <ellipse cx="1280" cy="290" rx="250" ry="20" fill="#28365a" opacity="0.25" filter="url(#f-cloud)" />

        {/* Orange-lit lower clouds */}
        <ellipse cx="480" cy="445" rx="340" ry="28" fill="#8a4018" opacity="0.30" filter="url(#f-cloud)" />
        <ellipse cx="1420" cy="420" rx="310" ry="26" fill="#7a3810" opacity="0.28" filter="url(#f-cloud)" />

        {/* ── Thin bright horizon line ── */}
        <rect x="0" y={HY - 2} width="1920" height="4" fill="#ffd860" opacity="0.28" />

        {/* ── Sun disc — above horizon (sunset just starting) ── */}
        <circle cx="960" cy={HY - 38} r="52" fill="#fff5c0" opacity="0.95" />
        {/* Immediate glow */}
        <circle cx="960" cy={HY - 38} r="90" fill="#ffcc44" opacity="0.50" filter="url(#f-sun)" />
        {/* Outer halo */}
        <circle cx="960" cy={HY - 38} r="160" fill="#ff8822" opacity="0.20" filter="url(#f-sun)" />

        {/* ── Sun path reflection — golden stripe on deep blue ── */}
        <polygon
          points={`855,${HY} 1065,${HY} 1210,1080 710,1080`}
          fill="url(#sunpath-grad)"
          opacity="0.65"
        />
        {/* Narrow bright centre ribbon */}
        <polygon
          points={`928,${HY} 992,${HY} 1044,1080 876,1080`}
          fill="#ffeeaa"
          opacity="0.25"
        />

        {/* ── OCEAN WAVES — rich deep blue with foam crests ── */}

        {/* Wave band 1 — far distance, thin */}
        <path
          d={`M0,${HY+22} C160,${HY+10} 320,${HY+32} 480,${HY+22}
             C640,${HY+10} 800,${HY+34} 960,${HY+22}
             C1120,${HY+10} 1280,${HY+32} 1440,${HY+22}
             C1600,${HY+10} 1760,${HY+32} 1920,${HY+22}
             L1920,${HY+65} L0,${HY+65} Z`}
          fill="url(#wave-mid)"
        />
        {/* Foam on wave 1 — very thin white line */}
        <path
          d={`M0,${HY+22} C160,${HY+10} 320,${HY+32} 480,${HY+22}
             C640,${HY+10} 800,${HY+34} 960,${HY+22}
             C1120,${HY+10} 1280,${HY+32} 1440,${HY+22}
             C1600,${HY+10} 1760,${HY+32} 1920,${HY+22}`}
          fill="none" stroke="#c8e4f8" strokeWidth="1.5" strokeOpacity="0.45"
          filter="url(#f-foam)"
        />

        {/* Wave band 2 — mid distance */}
        <path
          d={`M0,${HY+88} C240,${HY+70} 480,${HY+106} 720,${HY+88}
             C960,${HY+68} 1200,${HY+108} 1440,${HY+88}
             C1680,${HY+68} 1920,${HY+108} 1920,${HY+88}
             L1920,${HY+160} L0,${HY+160} Z`}
          fill="url(#wave-mid)"
        />
        {/* Foam on wave 2 */}
        <path
          d={`M0,${HY+88} C240,${HY+70} 480,${HY+106} 720,${HY+88}
             C960,${HY+68} 1200,${HY+108} 1440,${HY+88}
             C1680,${HY+68} 1920,${HY+108} 1920,${HY+88}`}
          fill="none" stroke="#d0eaff" strokeWidth="2.5" strokeOpacity="0.55"
          filter="url(#f-foam)"
        />
        {/* Broken foam patches on wave 2 */}
        {[[60,HY+82],[220,HY+74],[500,HY+100],[740,HY+76],[1000,HY+104],[1280,HY+74],[1520,HY+100],[1780,HY+76]].map(([x,y],i) => (
          <path key={i}
            d={`M${x},${y} Q${x+18},${y-4} ${x+36},${y}`}
            fill="none" stroke="#e8f5ff" strokeWidth="2" strokeOpacity={0.40 + (i%3)*0.10}
            strokeLinecap="round"
          />
        ))}

        {/* Wave band 3 — nearer, more prominent */}
        <path
          d={`M0,${HY+190} C300,${HY+166} 600,${HY+214} 900,${HY+190}
             C1200,${HY+166} 1500,${HY+216} 1920,${HY+190}
             L1920,${HY+290} L0,${HY+290} Z`}
          fill="url(#wave-near)"
        />
        {/* Foam on wave 3 */}
        <path
          d={`M0,${HY+190} C300,${HY+166} 600,${HY+214} 900,${HY+190}
             C1200,${HY+166} 1500,${HY+216} 1920,${HY+190}`}
          fill="none" stroke="#d8f0ff" strokeWidth="3" strokeOpacity="0.60"
          filter="url(#f-foam)"
        />
        {/* Broken foam patches wave 3 */}
        {[[40,HY+184],[180,HY+172],[420,HY+208],[680,HY+178],[920,HY+186],[1160,HY+170],[1380,HY+210],[1640,HY+178],[1850,HY+188]].map(([x,y],i) => (
          <path key={i}
            d={`M${x},${y} Q${x+24},${y-6} ${x+48},${y}`}
            fill="none" stroke="#eef8ff" strokeWidth={2.5 + (i%2)*0.5} strokeOpacity={0.45 + (i%3)*0.12}
            strokeLinecap="round"
          />
        ))}

        {/* Wave band 4 — near foreground */}
        <path
          d={`M0,${HY+330} C240,${HY+306} 480,${HY+354} 720,${HY+330}
             C960,${HY+304} 1200,${HY+356} 1440,${HY+330}
             C1680,${HY+306} 1920,${HY+356} 1920,${HY+330}
             L1920,${HY+460} L0,${HY+460} Z`}
          fill="url(#wave-fore)"
        />
        {/* Bold foam on wave 4 */}
        <path
          d={`M0,${HY+330} C240,${HY+306} 480,${HY+354} 720,${HY+330}
             C960,${HY+304} 1200,${HY+356} 1440,${HY+330}
             C1680,${HY+306} 1920,${HY+356} 1920,${HY+330}`}
          fill="none" stroke="#d0ecff" strokeWidth="4" strokeOpacity="0.65"
          filter="url(#f-foam)"
        />
        {/* Thick foam patches wave 4 */}
        {[[30,HY+326],[130,HY+314],[310,HY+346],[530,HY+322],[760,HY+310],[950,HY+348],[1140,HY+320],[1350,HY+308],[1570,HY+350],[1780,HY+322]].map(([x,y],i) => (
          <path key={i}
            d={`M${x},${y} Q${x+30},${y-8} ${x+60},${y}`}
            fill="none" stroke="#f0f8ff" strokeWidth={3 + (i%3)*1} strokeOpacity={0.50 + (i%3)*0.12}
            strokeLinecap="round"
          />
        ))}

        {/* ── Foreground ocean fill ── */}
        <rect y={HY + 460} width="1920" height="620" fill="#102240" />

        {/* Large foreground wave */}
        <path
          d={`M0,${HY+490} C280,${HY+462} 560,${HY+518} 840,${HY+490}
             C1120,${HY+460} 1400,${HY+522} 1680,${HY+490}
             L1920,${HY+490} L1920,${HY+620} L0,${HY+620} Z`}
          fill="#163660"
        />
        {/* Foam on foreground wave */}
        <path
          d={`M0,${HY+490} C280,${HY+462} 560,${HY+518} 840,${HY+490}
             C1120,${HY+460} 1400,${HY+522} 1680,${HY+490} L1920,${HY+490}`}
          fill="none" stroke="#cce8ff" strokeWidth="5" strokeOpacity="0.55"
          filter="url(#f-foam)"
        />
        {/* Big foam splashes foreground */}
        {[[80,HY+484],[260,HY+470],[500,HY+512],[780,HY+478],[1060,HY+464],[1300,HY+516],[1580,HY+480],[1840,HY+488]].map(([x,y],i) => (
          <path key={i}
            d={`M${x},${y} Q${x+40},${y-12} ${x+80},${y}`}
            fill="none" stroke="#e8f6ff" strokeWidth={4 + (i%3)*1.5} strokeOpacity={0.55 + (i%4)*0.10}
            strokeLinecap="round"
          />
        ))}

        {/* ── Sunset reflection shimmer spots on water ── */}
        {[[710,HY+40],[800,HY+55],[900,HY+35],[1010,HY+48],[1080,HY+38],
          [720,HY+80],[860,HY+90],[970,HY+75],[1050,HY+85],[1100,HY+72],
          [660,HY+130],[820,HY+140],[940,HY+120],[1060,HY+136],[1160,HY+122]
        ].map(([x,y],i) => (
          <ellipse key={i}
            cx={x} cy={y}
            rx={3 + (i%4)*2.5} ry={1.2 + (i%3)*0.5}
            fill="#ffdd88" opacity={0.08 + (i%5)*0.04}
          />
        ))}

        {/* ── SAILBOAT SILHOUETTES ── black against golden sky ── */}

        {/* Boat 1 — large, just left of sun */}
        <g opacity="0.97">
          <ellipse cx="792" cy={HY+4} rx="68" ry="8" fill="#020308" />
          <line x1="805" y1={HY+4} x2="800" y2={HY-218} stroke="#020308" strokeWidth="3.5" />
          <polygon points={`800,${HY-208} 882,${HY+2} 720,${HY+5}`} fill="#020308" />
          <polygon points={`800,${HY-168} 722,${HY+2} 800,${HY+4}`} fill="#020308" opacity="0.92" />
          <line x1="800" y1={HY+4} x2="878" y2={HY+15} stroke="#020308" strokeWidth="2" />
        </g>

        {/* Boat 2 — medium, far left */}
        <g opacity="0.90">
          <ellipse cx="390" cy={HY+6} rx="50" ry="6.5" fill="#020308" />
          <line x1="400" y1={HY+6} x2="396" y2={HY-162} stroke="#020308" strokeWidth="2.8" />
          <polygon points={`396,${HY-153} 452,${HY+4} 338,${HY+7}`} fill="#020308" />
          <polygon points={`396,${HY-118} 340,${HY+4} 396,${HY+6}`} fill="#020308" opacity="0.88" />
        </g>

        {/* Boat 3 — small, very far left */}
        <g opacity="0.76">
          <ellipse cx="195" cy={HY+8} rx="34" ry="5" fill="#020308" />
          <line x1="203" y1={HY+8} x2="200" y2={HY-108} stroke="#020308" strokeWidth="2" />
          <polygon points={`200,${HY-100} 236,${HY+6} 166,${HY+9}`} fill="#020308" />
          <polygon points={`200,${HY-72} 167,${HY+6} 200,${HY+8}`} fill="#020308" opacity="0.78" />
        </g>

        {/* Boat 4 — medium-large, right of sun */}
        <g opacity="0.94">
          <ellipse cx="1148" cy={HY+5} rx="58" ry="7.5" fill="#020308" />
          <line x1="1158" y1={HY+5} x2="1153" y2={HY-188} stroke="#020308" strokeWidth="3" />
          <polygon points={`1153,${HY-178} 1218,${HY+3} 1088,${HY+6}`} fill="#020308" />
          <polygon points={`1153,${HY-140} 1090,${HY+3} 1153,${HY+5}`} fill="#020308" opacity="0.90" />
          <line x1="1153" y1={HY+5} x2="1214" y2={HY+15} stroke="#020308" strokeWidth="2" />
        </g>

        {/* Boat 5 — small-medium, right */}
        <g opacity="0.82">
          <ellipse cx="1400" cy={HY+7} rx="40" ry="5.5" fill="#020308" />
          <line x1="1408" y1={HY+7} x2="1405" y2={HY-124} stroke="#020308" strokeWidth="2.2" />
          <polygon points={`1405,${HY-116} 1448,${HY+5} 1362,${HY+8}`} fill="#020308" />
          <polygon points={`1405,${HY-85} 1363,${HY+5} 1405,${HY+7}`} fill="#020308" opacity="0.80" />
        </g>

        {/* Boat 6 — small, between 2 and 4 */}
        <g opacity="0.86">
          <ellipse cx="620" cy={HY+6} rx="44" ry="6" fill="#020308" />
          <line x1="629" y1={HY+6} x2="625" y2={HY-145} stroke="#020308" strokeWidth="2.5" />
          <polygon points={`625,${HY-137} 672,${HY+4} 578,${HY+7}`} fill="#020308" />
          <polygon points={`625,${HY-100} 580,${HY+4} 625,${HY+6}`} fill="#020308" opacity="0.84" />
        </g>

        {/* Boat 7 — tiny, far right */}
        <g opacity="0.68">
          <ellipse cx="1660" cy={HY+9} rx="26" ry="4" fill="#020308" />
          <line x1="1666" y1={HY+9} x2="1664" y2={HY-76} stroke="#020308" strokeWidth="1.8" />
          <polygon points={`1664,${HY-70} 1692,${HY+7} 1636,${HY+10}`} fill="#020308" />
        </g>

        {/* Boat 8 — tiny ghost, very far right */}
        <g opacity="0.50">
          <ellipse cx="1820" cy={HY+10} rx="18" ry="3" fill="#020308" />
          <line x1="1825" y1={HY+10} x2="1823" y2={HY-52} stroke="#020308" strokeWidth="1.4" />
          <polygon points={`1823,${HY-47} 1844,${HY+8} 1802,${HY+11}`} fill="#020308" />
        </g>

        {/* ── Text-readability overlay ── */}
        <rect width="1920" height="1080" fill="url(#overlay-grad)" />
      </svg>
    </div>
  );
}

function FantasyApp() {
  const { demo: autoDemo } = Route.useSearch();
  const [step, setStep] = useState(2);
  const [appReady, setAppReady] = useState(false);
  const [credits, setCredits] = useState(STARTING_CREDITS);
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
    setCredits(c => c - pendingCost);
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

  function handleCreditsEarned(amount: number) {
    setCredits(c => c + amount);
  }

  function handleReset() {
    setStep(2);
    setRecommendations([]);
    setPendingTeams([]);
    setPendingCost(0);
    setConfirmedTeams([]);
    setScoreResult(null);
    setCredits(STARTING_CREDITS);
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
        <SunsetBackground />
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
      <SunsetBackground />

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
            onCreditsEarned={handleCreditsEarned}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
