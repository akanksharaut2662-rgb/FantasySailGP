import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

const API = "http://localhost:8000";
const SESSION_KEY = "sailgp_session";

export type Session = { name: string; email: string; credits: number };

type AuthCtx = {
  session: Session | null;
  justSignedUp: boolean;
  clearJustSignedUp: () => void;
  signup: (name: string, email: string, password: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  setCredits: (credits: number, score?: number, teams?: string[]) => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

function readSession(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
    // Discard sessions missing required fields (e.g. from old localStorage auth)
    if (!s || typeof s.name !== "string" || typeof s.email !== "string") return null;
    return { name: s.name, email: s.email, credits: typeof s.credits === "number" ? s.credits : 0 };
  } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(readSession);
  const [justSignedUp, setJustSignedUp] = useState(false);

  function persist(s: Session | null) {
    setSessionState(s);
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  }

  const signup = useCallback(async (name: string, email: string, password: string): Promise<string | null> => {
    try {
      const r = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await r.json();
      if (!r.ok) return data.detail ?? "Signup failed.";
      persist({ name: data.name, email: data.email, credits: data.credits });
      setJustSignedUp(true);
      return null;
    } catch {
      return "Could not connect to server. Is the backend running?";
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const r = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) return data.detail ?? "Login failed.";
      persist({ name: data.name, email: data.email, credits: data.credits });
      return null;
    } catch {
      return "Could not connect to server. Is the backend running?";
    }
  }, []);

  const logout = useCallback(() => {
    persist(null);
  }, []);

  const setCredits = useCallback(async (credits: number, score?: number, teams?: string[]): Promise<void> => {
    if (!session) return;
    const safeCredits = Math.max(0, credits);
    try {
      await fetch(`${API}/api/auth/credits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.email,
          credits: safeCredits,
          ...(score !== undefined && { score }),
          ...(teams !== undefined && { teams }),
        }),
      });
      persist({ ...session, credits: safeCredits });
    } catch { /* ignore — credits will sync next login */ }
  }, [session]);

  const clearJustSignedUp = useCallback(() => setJustSignedUp(false), []);

  return (
    <AuthContext.Provider value={{ session, justSignedUp, clearJustSignedUp, signup, login, logout, setCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
