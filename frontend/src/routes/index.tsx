import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fantasy SailGP — Build Your Team. Race the Data." },
      { name: "description", content: "AI-powered fantasy racing. Build your fleet, run the simulation, dominate the leaderboard." },
    ],
  }),
  component: LandingPage,
});

// ── Auth Modal ────────────────────────────────────────────────────────────────

function AuthModal({
  tab, onTabChange, onClose, onSuccess,
}: {
  tab: "login" | "signup";
  onTabChange: (t: "login" | "signup") => void;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const auth = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchTab(t: "login" | "signup") {
    setError(null);
    setName(""); setEmail(""); setPassword("");
    onTabChange(t);
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const err = tab === "signup"
      ? await auth.signup(name, email, password)
      : await auth.login(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    onSuccess();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,180,50,0.20)",
    borderRadius: "8px",
    padding: "11px 16px",
    color: "rgba(255,255,255,0.90)",
    fontFamily: "var(--font-sans)",
    fontSize: "13px",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(3,6,18,0.22)" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "380px",
          margin: "0 16px",
          background: "rgba(8,14,32,0.28)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,180,50,0.22)",
          borderRadius: "16px",
          padding: "36px 32px 32px",
          boxShadow: "0 8px 48px rgba(0,0,0,0.35)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 18,
            background: "none", border: "none",
            color: "rgba(255,255,255,0.40)",
            fontSize: "18px", cursor: "pointer", lineHeight: 1,
          }}
        >✕</button>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: "rgba(255,255,255,0.92)", lineHeight: 1, fontStyle: "italic" }}>
            Fantasy
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,180,50,0.70)", marginTop: "6px" }}>
            SailGP · Season V
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "99px", padding: "3px", marginBottom: "20px" }}>
          {(["signup", "login"] as const).map(t => (
            <button key={t} onClick={() => switchTab(t)} style={{
              flex: 1, padding: "7px 0", borderRadius: "99px", border: "none", cursor: "pointer",
              fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 500,
              letterSpacing: "0.12em", textTransform: "uppercase", transition: "all 0.22s",
              background: tab === t ? "linear-gradient(135deg, oklch(0.78 0.16 75), oklch(0.62 0.17 45))" : "transparent",
              color: tab === t ? "oklch(0.07 0.03 60)" : "rgba(255,255,255,0.50)",
            }}>
              {t === "signup" ? "Sign Up" : "Log In"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {tab === "signup" && (
            <input
              type="text" placeholder="Name" value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle} autoComplete="name"
              onFocus={e => (e.target.style.borderColor = "rgba(255,180,50,0.55)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,180,50,0.20)")}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
          )}
          <input
            type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle} autoComplete="email"
            onFocus={e => (e.target.style.borderColor = "rgba(255,180,50,0.55)")}
            onBlur={e => (e.target.style.borderColor = "rgba(255,180,50,0.20)")}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle} autoComplete={tab === "signup" ? "new-password" : "current-password"}
            onFocus={e => (e.target.style.borderColor = "rgba(255,180,50,0.55)")}
            onBlur={e => (e.target.style.borderColor = "rgba(255,180,50,0.20)")}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {/* Inline error */}
        {error && (
          <p style={{ marginTop: "12px", fontSize: "11px", color: "oklch(0.68 0.18 28)", fontFamily: "var(--font-sans)", textAlign: "center", lineHeight: 1.4 }}>
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            marginTop: "20px", width: "100%",
            background: "linear-gradient(135deg, oklch(0.78 0.16 75), oklch(0.62 0.17 45))",
            border: "none", borderRadius: "99px", padding: "13px 0",
            color: "oklch(0.07 0.03 60)",
            fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600,
            letterSpacing: "0.18em", textTransform: "uppercase",
            cursor: loading ? "wait" : "pointer",
            boxShadow: "0 0 24px oklch(0.74 0.14 75 / 0.35)", transition: "opacity 0.2s",
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = "1"; }}
        >
          {loading ? "Please wait…" : tab === "signup" ? "Create Account" : "Sign In"}
        </button>

        {/* Switch hint */}
        <p style={{ marginTop: "16px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: "11px", color: "rgba(255,255,255,0.30)" }}>
          {tab === "signup"
            ? <>Already racing?{" "}<button onClick={() => switchTab("login")} style={{ background: "none", border: "none", color: "rgba(255,180,50,0.70)", cursor: "pointer", fontSize: "11px", padding: 0 }}>Log in</button></>
            : <>New to Fantasy SailGP?{" "}<button onClick={() => switchTab("signup")} style={{ background: "none", border: "none", color: "rgba(255,180,50,0.70)", cursor: "pointer", fontSize: "11px", padding: 0 }}>Sign up</button></>
          }
        </p>
      </div>
    </div>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────

function LandingPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("signup");
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
    if (!nowMuted) { v.volume = 0.6; v.play().catch(() => {}); }
    setMuted(nowMuted);
  }

  function openAuth(tab: "login" | "signup") {
    setAuthTab(tab);
    setShowAuth(true);
  }

  function handleAuthSuccess() {
    setShowAuth(false);
    navigate({ to: "/app", search: { demo: false } });
  }

  function handleBuildTeam() {
    if (session) {
      navigate({ to: "/app", search: { demo: false } });
    } else {
      openAuth("login");
    }
  }

  const btnBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "1.25rem",
    background: "rgba(255,160,30,0.08)",
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,180,50,0.22)", borderRadius: "999px",
    paddingLeft: "2.25rem", paddingRight: "0.625rem",
    paddingTop: "0.9rem", paddingBottom: "0.9rem",
    color: "#ffffff", cursor: "pointer",
    textDecoration: "none", transition: "all 0.35s ease",
    fontFamily: "inherit",
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ background: "oklch(0.05 0.03 240)" }}>

      {/* ── Auth modal ── */}
      {showAuth && (
        <AuthModal
          tab={authTab}
          onTabChange={setAuthTab}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* ── Video background ── */}
      <video
        ref={videoRef} src="/intro.mp4"
        autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.9 }}
      />

      {/* ── Cinematic gradient overlay ── */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(3,6,18,0.55) 0%, rgba(3,6,18,0.05) 45%, rgba(3,6,18,0.72) 100%)" }} />

      {/* ── Scan-line texture ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.12, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)" }} />

      {/* ── Corner telemetry brackets ── */}
      <div className="absolute inset-5 pointer-events-none">
        {[
          { top: 0, left: 0, borderTop: true, borderLeft: true },
          { top: 0, right: 0, borderTop: true, borderRight: true },
          { bottom: 0, left: 0, borderBottom: true, borderLeft: true },
          { bottom: 0, right: 0, borderBottom: true, borderRight: true },
        ].map((corner, i) => (
          <div key={i} className="absolute w-14 h-14" style={{
            top: corner.top !== undefined ? corner.top : undefined,
            bottom: corner.bottom !== undefined ? corner.bottom : undefined,
            left: corner.left !== undefined ? corner.left : undefined,
            right: corner.right !== undefined ? corner.right : undefined,
            borderTop: corner.borderTop ? "1.5px solid rgba(255,180,50,0.28)" : undefined,
            borderBottom: corner.borderBottom ? "1.5px solid rgba(255,180,50,0.28)" : undefined,
            borderLeft: corner.borderLeft ? "1.5px solid rgba(255,180,50,0.28)" : undefined,
            borderRight: corner.borderRight ? "1.5px solid rgba(255,180,50,0.28)" : undefined,
          }} />
        ))}
      </div>

      {/* ── Top-left telemetry panel ── */}
      <div className="absolute top-10 left-10 transition-all duration-1000" style={{ opacity: visible ? 1 : 0, transitionDelay: "500ms" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.2em", lineHeight: 2 }}>
          <div style={{ color: "oklch(0.80 0.16 72)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "oklch(0.80 0.16 72)", display: "inline-block", animation: "pulse-cyan 2s ease-in-out infinite" }} />
            LIVE · SEASON V
          </div>
          <div style={{ color: "rgba(255,200,100,0.40)", marginTop: 2 }}>WIND 24.3 KM/H · TWD 045°</div>
          <div style={{ color: "rgba(255,200,100,0.25)" }}>BERMUDA · F50 FOILING</div>
        </div>
      </div>

      {/* ── Top-right telemetry (always shown — global user chip handles logged-in state) ── */}
      <div className="absolute top-10 right-10 text-right transition-all duration-1000" style={{ opacity: visible ? 1 : 0, transitionDelay: "700ms" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.2em", lineHeight: 2, color: "rgba(255,255,255,0.25)" }}>
          <div>BOAT SPEED · 89 KM/H</div>
          <div>FOILING · ACTIVE</div>
          <div>AI MODEL · RIDGE REG</div>
        </div>
      </div>

      {/* ── Mute toggle ── */}
      <button onClick={toggleMute} className="absolute top-10 left-1/2 -translate-x-1/2 transition-all duration-700" style={{
        opacity: visible ? 0.6 : 0,
        fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.28em",
        color: "rgba(255,255,255,0.7)",
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "999px", padding: "5px 18px", cursor: "pointer",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
      >
        {muted ? "▶ UNMUTE" : "◀ MUTE"}
      </button>

      {/* ── CTA — bottom left ── */}
      <div className="absolute z-10" style={{
        bottom: "13%", left: "7%",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "all 1.3s cubic-bezier(0.22,1,0.36,1)",
        transitionDelay: "300ms",
      }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,200,100,0.70)", marginBottom: "14px" }}>
          Season V · Race Predictor
        </p>

        {/* Build Your Team */}
        <button
          onClick={handleBuildTeam}
          style={btnBase}
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
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Build Your Team
          </span>
          <span style={{
            width: "3.25rem", height: "3.25rem", borderRadius: "999px",
            background: "linear-gradient(135deg, oklch(0.78 0.16 75), oklch(0.62 0.17 45))",
            color: "oklch(0.07 0.03 60)", display: "grid", placeItems: "center",
            flexShrink: 0, boxShadow: "0 0 20px oklch(0.74 0.16 65 / 0.45)",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </button>

        {/* Sign Up / Log In (only when not logged in) */}
        {!session && (
          <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => openAuth("signup")} style={{
              fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.80)",
              background: "rgba(255,160,30,0.10)", border: "1px solid rgba(255,180,50,0.28)",
              borderRadius: "999px", padding: "8px 22px", cursor: "pointer",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              transition: "all 0.25s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,160,30,0.18)"; e.currentTarget.style.borderColor = "rgba(255,185,60,0.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,160,30,0.10)"; e.currentTarget.style.borderColor = "rgba(255,180,50,0.28)"; }}
            >
              Sign Up
            </button>
            <button onClick={() => openAuth("login")} style={{
              fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase",
              color: "rgba(255,200,100,0.55)", background: "none", border: "none",
              cursor: "pointer", padding: "8px 4px", transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,200,100,0.90)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,200,100,0.55)")}
            >
              Log In →
            </button>
          </div>
        )}

        {/* Logged-in welcome */}
        {session && (
          <p style={{ marginTop: "10px", fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.22em", color: "rgba(255,180,50,0.55)" }}>
            WELCOME BACK, {session.name.toUpperCase().split(" ")[0]} · READY TO RACE
          </p>
        )}
      </div>

      {/* ── Bottom stats bar ── */}
      <div className="absolute bottom-8 inset-x-0 flex items-center justify-center gap-12" style={{ opacity: visible ? 0.5 : 0, transition: "opacity 1.6s ease", transitionDelay: "900ms" }}>
        {[{ label: "Teams", value: "13" }, { label: "Races", value: "14" }, { label: "Model", value: "Ridge" }].map((s, i) => (
          <div key={i} className="text-center">
            <div style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: "1.5rem", color: "#fff", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: "5px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Bottom label ── */}
      <div className="absolute bottom-4 inset-x-0 flex justify-center" style={{ opacity: visible ? 0.22 : 0, transition: "opacity 1.8s ease", transitionDelay: "1100ms" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.45em", textTransform: "uppercase", color: "rgba(255,255,255,0.9)" }}>
          Ocean of Data Challenge · Halifax &amp; Bermuda
        </p>
      </div>
    </div>
  );
}
