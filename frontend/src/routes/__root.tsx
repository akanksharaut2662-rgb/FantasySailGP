import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useEffect, useRef, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "../context/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Congratulations overlay (shown once after signup) ─────────────────────────

function CongratsOverlay() {
  const { justSignedUp, session, clearJustSignedUp } = useAuth();
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (justSignedUp) {
      setFadeOut(false);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => { setVisible(false); clearJustSignedUp(); }, 600);
      }, 3800);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [justSignedUp]);

  if (!visible) return null;

  return (
    <div
      onClick={() => { setFadeOut(true); setTimeout(() => { setVisible(false); clearJustSignedUp(); }, 600); }}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(3,6,18,0.72)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.6s ease",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          background: "rgba(8,14,32,0.82)",
          border: "1px solid rgba(255,180,50,0.45)",
          borderRadius: "20px",
          padding: "48px 56px",
          textAlign: "center",
          maxWidth: "420px",
          boxShadow: "0 0 80px rgba(255,160,40,0.25)",
          transform: fadeOut ? "scale(0.95)" : "scale(1)",
          transition: "transform 0.6s ease",
        }}
      >
        {/* Trophy */}
        <div style={{ fontSize: "52px", lineHeight: 1, marginBottom: "20px" }}>🏆</div>

        <div style={{ fontFamily: "var(--font-serif)", fontSize: "32px", fontStyle: "italic", color: "rgba(255,255,255,0.95)", marginBottom: "10px" }}>
          Welcome aboard{session?.name ? `, ${session.name.split(" ")[0]}` : ""}!
        </div>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,180,50,0.75)", marginBottom: "28px" }}>
          Season V · Fantasy SailGP
        </div>

        <div style={{
          background: "linear-gradient(135deg, rgba(255,160,30,0.15), rgba(255,180,50,0.08))",
          border: "1px solid rgba(255,180,50,0.30)",
          borderRadius: "12px",
          padding: "20px 24px",
          marginBottom: "24px",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.28em", color: "rgba(255,200,100,0.60)", marginBottom: "8px" }}>
            STARTING CREDITS
          </div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "42px", color: "rgba(255,180,50,0.95)", lineHeight: 1 }}>
            4,000,000
          </div>
        </div>

        <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          Use your credits to build a winning fleet.<br />Pick wisely — the wind decides everything.
        </p>

        <div style={{ marginTop: "24px", fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.25em", color: "rgba(255,255,255,0.20)" }}>
          TAP ANYWHERE TO CONTINUE
        </div>
      </div>
    </div>
  );
}

// ── Global user chip (top-right, all pages) ───────────────────────────────────

function UserChip() {
  const { session, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!session) return null;

  const initial = session.name.charAt(0).toUpperCase();

  return (
    <div ref={ref} style={{ position: "fixed", top: 14, right: 20, zIndex: 9999 }}>
      {/* Chip button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "rgba(8,14,32,0.72)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,180,50,0.32)",
          borderRadius: "99px",
          padding: "5px 12px 5px 5px",
          cursor: "pointer",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,180,50,0.60)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,180,50,0.32)")}
      >
        {/* Avatar */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, oklch(0.78 0.16 75), oklch(0.62 0.17 45))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700,
          color: "oklch(0.07 0.03 60)", flexShrink: 0,
        }}>
          {initial}
        </div>
        <span style={{
          fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500,
          color: "rgba(255,255,255,0.88)", maxWidth: "120px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {session.name.split(" ")[0]}
        </span>
        {/* Caret */}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: 0.4, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: "240px",
          background: "rgba(8,14,32,0.92)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,180,50,0.22)",
          borderRadius: "14px",
          padding: "16px",
          boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
          animation: "float-in 0.18s ease-out both",
        }}>
          {/* User info */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, oklch(0.78 0.16 75), oklch(0.62 0.17 45))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 700,
              color: "oklch(0.07 0.03 60)",
            }}>
              {initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.92)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.name}
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.email}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,180,50,0.12)", marginBottom: "14px" }} />

          {/* Balance */}
          <div style={{
            background: "rgba(255,160,30,0.08)",
            border: "1px solid rgba(255,180,50,0.18)",
            borderRadius: "10px",
            padding: "12px 14px",
            marginBottom: "14px",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "8px", letterSpacing: "0.28em", color: "rgba(255,180,50,0.55)", marginBottom: "6px" }}>
              CREDITS BALANCE
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "24px", color: "rgba(255,200,100,0.95)", lineHeight: 1 }}>
              {(session.credits ?? 0).toLocaleString()}
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => { setOpen(false); logout(); }}
            style={{
              width: "100%", padding: "9px 0",
              background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.18)",
              borderRadius: "8px", cursor: "pointer",
              fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 500,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(255,130,130,0.70)", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,80,80,0.12)"; e.currentTarget.style.color = "rgba(255,150,150,0.90)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,80,80,0.06)"; e.currentTarget.style.color = "rgba(255,130,130,0.70)"; }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ── Route setup ───────────────────────────────────────────────────────────────

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "Lovable Generated Project" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Lovable Generated Project" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <UserChip />
        <CongratsOverlay />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
