import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fantasy SailGP — Build Your Team. Race the Data." },
      { name: "description", content: "AI-powered fantasy racing. Build your fleet, run the simulation, dominate the leaderboard." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    const nowMuted = !v.muted;
    v.muted = nowMuted;
    if (!nowMuted) {
      v.volume = 0.6;
      v.play().catch(() => {});
    }
    setMuted(nowMuted);
  }

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{ background: "oklch(0.05 0.03 240)" }}
    >
      {/* ── Video background ── */}
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.9 }}
      />

      {/* ── Cinematic dark gradient overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,6,18,0.55) 0%, rgba(3,6,18,0.05) 45%, rgba(3,6,18,0.72) 100%)",
        }}
      />

      {/* ── Scan-line texture ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.12,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)",
        }}
      />

      {/* ── Corner telemetry brackets ── */}
      <div className="absolute inset-5 pointer-events-none">
        {[
          { top: 0, left: 0, borderTop: true, borderLeft: true },
          { top: 0, right: 0, borderTop: true, borderRight: true },
          { bottom: 0, left: 0, borderBottom: true, borderLeft: true },
          { bottom: 0, right: 0, borderBottom: true, borderRight: true },
        ].map((corner, i) => (
          <div
            key={i}
            className="absolute w-14 h-14"
            style={{
              top: corner.top !== undefined ? corner.top : undefined,
              bottom: corner.bottom !== undefined ? corner.bottom : undefined,
              left: corner.left !== undefined ? corner.left : undefined,
              right: corner.right !== undefined ? corner.right : undefined,
              borderTop: corner.borderTop ? "1.5px solid rgba(255,180,50,0.28)" : undefined,
              borderBottom: corner.borderBottom ? "1.5px solid rgba(255,180,50,0.28)" : undefined,
              borderLeft: corner.borderLeft ? "1.5px solid rgba(255,180,50,0.28)" : undefined,
              borderRight: corner.borderRight ? "1.5px solid rgba(255,180,50,0.28)" : undefined,
            }}
          />
        ))}
      </div>

      {/* ── Top-left telemetry panel ── */}
      <div
        className="absolute top-10 left-10 transition-all duration-1000"
        style={{ opacity: visible ? 1 : 0, transitionDelay: "500ms" }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            letterSpacing: "0.2em",
            lineHeight: 2,
          }}
        >
          <div style={{ color: "oklch(0.80 0.16 72)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "oklch(0.80 0.16 72)",
                display: "inline-block",
                animation: "pulse-cyan 2s ease-in-out infinite",
              }}
            />
            LIVE · SEASON V
          </div>
          <div style={{ color: "rgba(255,200,100,0.40)", marginTop: 2 }}>WIND 24.3 KM/H · TWD 045°</div>
          <div style={{ color: "rgba(255,200,100,0.25)" }}>BERMUDA · F50 FOILING</div>
        </div>
      </div>

      {/* ── Top-right telemetry panel ── */}
      <div
        className="absolute top-10 right-10 text-right transition-all duration-1000"
        style={{ opacity: visible ? 1 : 0, transitionDelay: "700ms" }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            letterSpacing: "0.2em",
            lineHeight: 2,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          <div>BOAT SPEED · 89 KM/H</div>
          <div>FOILING · ACTIVE</div>
          <div>AI MODEL · RIDGE REG</div>
        </div>
      </div>

      {/* ── Mute toggle ── */}
      <button
        onClick={toggleMute}
        className="absolute top-10 left-1/2 -translate-x-1/2 transition-all duration-700"
        style={{
          opacity: visible ? 0.6 : 0,
          fontFamily: "var(--font-mono)",
          fontSize: "8px",
          letterSpacing: "0.28em",
          color: "rgba(255,255,255,0.7)",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: "999px",
          padding: "5px 18px",
          cursor: "pointer",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
      >
        {muted ? "▶ UNMUTE" : "◀ MUTE"}
      </button>

      {/* ── CTA — bottom left ── */}
      <div
        className="absolute z-10"
        style={{
          bottom: "13%",
          left: "7%",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "all 1.3s cubic-bezier(0.22,1,0.36,1)",
          transitionDelay: "300ms",
        }}
      >
        {/* Small eyebrow above button */}
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8px",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(255,200,100,0.70)",
            marginBottom: "14px",
          }}
        >
          Season V · Race Predictor
        </p>

        <Link
          to="/app"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "1.25rem",
            background: "rgba(255,160,30,0.08)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,180,50,0.22)",
            borderRadius: "999px",
            paddingLeft: "2.25rem",
            paddingRight: "0.625rem",
            paddingTop: "0.9rem",
            paddingBottom: "0.9rem",
            color: "#ffffff",
            textDecoration: "none",
            transition: "all 0.35s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(255,160,30,0.14)";
            e.currentTarget.style.borderColor = "rgba(255,185,60,0.55)";
            e.currentTarget.style.transform = "scale(1.025)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,160,30,0.08)";
            e.currentTarget.style.borderColor = "rgba(255,180,50,0.22)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Build Your Team
          </span>
          <span
            style={{
              width: "3.25rem",
              height: "3.25rem",
              borderRadius: "999px",
              background: "linear-gradient(135deg, oklch(0.78 0.16 75), oklch(0.62 0.17 45))",
              color: "oklch(0.07 0.03 60)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              boxShadow: "0 0 20px oklch(0.74 0.16 65 / 0.45)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
      </div>

      {/* ── Bottom stats bar ── */}
      <div
        className="absolute bottom-8 inset-x-0 flex items-center justify-center gap-12"
        style={{
          opacity: visible ? 0.5 : 0,
          transition: "opacity 1.6s ease",
          transitionDelay: "900ms",
        }}
      >
        {[
          { label: "Teams", value: "13" },
          { label: "Races", value: "14" },
          { label: "Model", value: "Ridge" },
        ].map((s, i) => (
          <div key={i} className="text-center">
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 300,
                fontSize: "1.5rem",
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "8px",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginTop: "5px",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom label ── */}
      <div
        className="absolute bottom-4 inset-x-0 flex justify-center"
        style={{
          opacity: visible ? 0.22 : 0,
          transition: "opacity 1.8s ease",
          transitionDelay: "1100ms",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8px",
            letterSpacing: "0.45em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          Ocean of Data Challenge · Halifax &amp; Bermuda
        </p>
      </div>
    </div>
  );
}
