<!--
=======================================================================
HOW TO USE THIS FILE
=======================================================================
This is your personal build guide for Track 3 of the SailGP Fantasy
Predictor hackathon project.

TO GET STARTED:
  1. Open a new chat with Claude (claude.ai) or any AI assistant
  2. Upload this file OR paste its full contents as your first message
  3. The AI will introduce itself, check your dependencies, and guide
     you through building your part step by step

You do not need to read this file in detail beforehand.
The AI will walk you through it.
=======================================================================
-->

---

> ## AI ASSISTANT — READ THIS ENTIRE BLOCK BEFORE RESPONDING
>
> You have been given the Track 3 build guide for the **SailGP Fantasy Predictor**, a hackathon project built by a team of 3 working in parallel. Your job is to act as a dedicated coding assistant for this developer's specific track: **Frontend (React + Tailwind)**.
>
> This track has **one hard dependency**: Track 2's backend API. Your strategy is: **build the full UI with hardcoded mock data first, then swap to real API calls when Track 2 is ready**. The UI should look complete and polished from Day 1 — never wait on another track to make progress. Follow these steps exactly and in order before writing any code.
>
> ---
>
> ### STEP 1 — INTRODUCE YOURSELF
>
> Send this message (adapt naturally):
>
> > "Hi! I'm your coding assistant for **Track 3 — Frontend**. You own everything the user sees — this is the most visible part of the project and the demo lives or dies on how good it looks. The good news: you can build the full UI today without needing any backend at all. We'll use hardcoded mock data first, then plug in the real API when Track 2 is ready. Let me check your setup first."
>
> ---
>
> ### STEP 2 — DEPENDENCY CHECKS (ask ONE at a time, wait for each answer)
>
> **Question 1 — Node.js version:**
> > "Run `node --version` and paste the output. We need Node 18 or higher."
>
> - Node < 18: "You'll need to upgrade. Go to nodejs.org, download the LTS version (20+), install it, then come back."
> - Node 18+: "Good."
>
> **Question 2 — npm:**
> > "Run `npm --version` and paste it. Just confirming npm is available."
>
> - Works: "Good."
> - Errors: "npm usually comes with Node — try reinstalling Node from nodejs.org."
>
> **Question 3 — Track 2 status (KEY DEPENDENCY):**
> > "What's the status of Track 2 — the backend API? Pick the closest:
> > - A) They haven't started yet
> > - B) They're working on it but nothing is running yet
> > - C) Their stub API is running at http://localhost:8000 (try opening that URL in your browser)
> > - D) Their API has real data (not stubs)"
>
> - **Answer A or B:** Say: "Perfect — this is fine. We'll build the entire UI with hardcoded mock data. I'll structure the code so the *only* change needed when Track 2 is ready is uncommenting the real `api.js` calls. Your UI will look 100% complete from today. Here's what we'll mock:
>   - Races list: 2 Halifax races and 2 Bermuda races hardcoded
>   - Recommendations: AUS, GBR, NZL with made-up predicted scores
>   - Score result: a full leaderboard with all 10 teams and plausible point values
>   I'll label every mock with a `// TODO: replace with real API call` comment so the swap is obvious."
> - **Answer C:** Say: "Stub API is up — great. We'll use mock data for the few endpoints that aren't stubbed yet, and call the real stub endpoints for the ones that are. I'll note which is which."
> - **Answer D:** Say: "Real data is live — we skip mocks entirely and wire the real API from the start."
>
> **Question 4 — React experience:**
> > "Quick context check: how comfortable are you with React? Pick one:
> > - A) New to React (I know JS but not React)
> > - B) Used React before but not recently
> > - C) Comfortable with React and hooks"
>
> - **Answer A:** "No problem. I'll explain each React concept as we use it — hooks, props, state. You'll pick it up fast on this project."
> - **Answer B:** "I'll include brief reminders for any patterns that might be rusty."
> - **Answer C:** "I'll keep the explanations minimal and focus on what's specific to this project."
>
> **Question 5 — Working directory:**
> > "Where are you running commands from? The `frontend/` folder doesn't exist yet — we'll create it. You should be in the `FantasySailGP/` project root. Run `pwd` (Mac/Linux) or `cd` with no arguments (Windows) to confirm."
>
> - Correct: "Good."
> - Wrong: "Navigate to the project root: `cd path/to/FantasySailGP`"
>
> ---
>
> ### STEP 3 — ASSESS AND CONFIRM
>
> Based on Track 2's status from Question 3, tell the user which mode they're in:
>
> > **Mock mode (A/B):**
> > "We're building in mock mode — all data is hardcoded, no backend needed. The build order:
> > 1. Project setup (Vite + Tailwind + install)
> > 2. `api.js` — mock version with hardcoded data and `// TODO` comments for real calls
> > 3. `App.jsx` — the 5-screen state machine
> > 4. `RaceSelector` — first screen, works with mock race list
> > 5. `OptimizerPanel` — second screen, works with mock recommendations
> > 6. `TeamBuilder` — third screen, 3-team selection with AI pick highlights
> > 7. `RaceScoring` — fourth screen, category breakdown bars
> > 8. `Leaderboard` — fifth screen, full rankings with highlights
> >
> > We'll go one component at a time. I'll give you code, tell you what to look at in the browser, and wait for your confirmation before moving on. Ready?"
> >
> > **Real API mode (C/D):**
> > "Track 2 is live — same build order, but `api.js` makes real fetch calls from the start. Ready?"
>
> ---
>
> ### STEP 4 — WORKING STYLE (follow this throughout)
>
> - **One component at a time.** Do not write `TeamBuilder` until `RaceSelector` renders correctly in the browser.
> - **After each component**, say: *"Open the browser and confirm you see [specific thing]. Screenshot or describe what you see. If it looks right, say 'next'."*
> - **Browser is the test.** There are no unit tests in this track — the test is whether it looks right and the flow works.
> - **The mock-to-real swap.** When the user says "Track 2 is ready", show them the exact lines to change in `api.js` — a small, targeted diff. Do not rewrite components.
> - **Polish is real work.** If the user says "looks good, what's next?" after a functional but ugly component, prompt them: *"Before we move on — does it look polished enough for a demo? Remember judges will see this on screen. Quick wins: consistent spacing, hover states, loading spinners."*
> - **Never dump all 5 components at once.** The user will not be able to test or understand what they've built.
> - **Stretch goal awareness.** The animated race replay (Day 4) uses Leaflet.js. If the user asks about it early, say: *"That's Day 4 work — let's get all 5 screens working first. I'll remind you when we're there."*

---

# Track 3 — Frontend (React)

> **Your role:** You own everything the user sees. You build the React app from Day 1 using mock data, then swap to real API calls on Day 3 when Track 2 is live. The demo lives and dies on how good your UI looks — polish matters here.

---

## What You Own

```
frontend/
  src/
    App.jsx
    api.js              ← all API calls in one place
    components/
      RaceSelector.jsx
      OptimizerPanel.jsx
      TeamBuilder.jsx
      RaceScoring.jsx
      Leaderboard.jsx
  package.json
  vite.config.js
  tailwind.config.js
  index.html
```

You do NOT touch: anything in `backend/`.

---

## What Track 2 Will Give You

Track 2's API runs at `http://localhost:8000`. These are the 5 endpoints you will call:

### 1. GET /api/races
Returns all races.
```json
[
  {
    "event": "Halifax",
    "race_label": "Race_1",
    "avg_tws_km_h": 25.9,
    "avg_twd_deg": 147.3,
    "num_boats": 10,
    "teams": ["AUS", "CAN", "DEN", "ESP", "FRA", "GBR", "GER", "NZL", "SUI", "USA"],
    "race_start_utc": "2024-06-01T19:07:31+00:00"
  }
]
```

### 2. GET /api/races/{event}/{race_label}/recommend
Returns ML model's top-3 team picks.
```json
{
  "event": "Halifax",
  "race_label": "Race_1",
  "avg_tws_km_h": 25.9,
  "avg_twd_deg": 147.3,
  "recommendations": [
    {"team": "AUS", "predicted_score": 87.3},
    {"team": "GBR", "predicted_score": 82.1},
    {"team": "NZL", "predicted_score": 75.6}
  ]
}
```

### 3. POST /api/score
Request:
```json
{"event": "Halifax", "race_label": "Race_1", "user_teams": ["AUS", "GBR", "CAN"]}
```
Response:
```json
{
  "user_total_score": 287,
  "leaderboard": [
    {
      "team": "AUS", "total_pts": 105, "position_pts": 50, "speed_pts": 20,
      "overtake_pts": 15, "clean_sailing_pts": 15, "vmg_pts": 5,
      "final_rank": 1, "status": 3, "is_user_pick": true
    }
  ]
}
```

### 4. GET /api/races/{event}/{race_label}/leaderboard
Same shape as `leaderboard` array above, `is_user_pick` is always false.

### 5. GET /api/optimizer/performance
```json
{
  "bermuda_rmse": 14.2,
  "races": [
    {
      "event": "Halifax", "race_label": "Race_1",
      "predicted_top3": ["AUS", "GBR", "NZL"],
      "actual_top3": ["AUS", "NZL", "GBR"],
      "hits": 3
    }
  ]
}
```

**Track 2 will have stub responses running by end of Day 1.** Build against those stubs from Day 1 — don't wait for real data.

---

## Screen Flow

```
Step 1          Step 2           Step 3        Step 4         Step 5
RaceSelector → OptimizerPanel → TeamBuilder → RaceScoring → Leaderboard
```

All on one page. Use a `step` state variable (1–5) to show/hide screens. No routing library needed.

---

## Step 1 — Project Setup

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install leaflet react-leaflet   # for race replay on Day 4
```

**tailwind.config.js:**
```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**vite.config.js** — proxy API calls to avoid CORS issues in dev:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

With this proxy, call `/api/races` (not `http://localhost:8000/api/races`) from your components.

---

## Step 2 — api.js (all fetch calls)

```javascript
// src/api.js
const BASE = "/api";  // proxied to http://localhost:8000

export const fetchRaces = () =>
  fetch(`${BASE}/races`).then(r => r.json());

export const fetchRecommendations = (event, raceLabel) =>
  fetch(`${BASE}/races/${event}/${raceLabel}/recommend`).then(r => r.json());

export const fetchScore = (event, raceLabel, userTeams) =>
  fetch(`${BASE}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, race_label: raceLabel, user_teams: userTeams }),
  }).then(r => r.json());

export const fetchLeaderboard = (event, raceLabel) =>
  fetch(`${BASE}/races/${event}/${raceLabel}/leaderboard`).then(r => r.json());

export const fetchOptimizerPerformance = () =>
  fetch(`${BASE}/optimizer/performance`).then(r => r.json());

export const fetchGPS = (event, raceLabel) =>
  fetch(`${BASE}/races/${event}/${raceLabel}/gps`).then(r => r.json());
```

---

## Step 3 — App.jsx (state machine)

```jsx
// src/App.jsx
import { useState } from "react";
import RaceSelector from "./components/RaceSelector";
import OptimizerPanel from "./components/OptimizerPanel";
import TeamBuilder from "./components/TeamBuilder";
import RaceScoring from "./components/RaceScoring";
import Leaderboard from "./components/Leaderboard";

export default function App() {
  const [step, setStep] = useState(1);
  const [selectedRace, setSelectedRace] = useState(null);   // full race object
  const [recommendations, setRecommendations] = useState([]); // [{team, predicted_score}]
  const [userTeams, setUserTeams] = useState([]);            // up to 3 team strings
  const [scoreResult, setScoreResult] = useState(null);      // POST /score response

  const reset = () => {
    setStep(1);
    setSelectedRace(null);
    setRecommendations([]);
    setUserTeams([]);
    setScoreResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-blue-900 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          ⛵ SailGP Fantasy Predictor
        </h1>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(s => (
            <div key={s}
              className={`w-3 h-3 rounded-full ${step >= s ? "bg-blue-400" : "bg-slate-600"}`}
            />
          ))}
        </div>
      </header>

      {/* Screens */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {step === 1 && (
          <RaceSelector
            onSelect={(race) => { setSelectedRace(race); setStep(2); }}
          />
        )}
        {step === 2 && (
          <OptimizerPanel
            race={selectedRace}
            onRecommend={(recs) => { setRecommendations(recs); setStep(3); }}
          />
        )}
        {step === 3 && (
          <TeamBuilder
            race={selectedRace}
            recommendations={recommendations}
            onSubmit={(teams, result) => { setUserTeams(teams); setScoreResult(result); setStep(4); }}
          />
        )}
        {step === 4 && (
          <RaceScoring
            race={selectedRace}
            userTeams={userTeams}
            scoreResult={scoreResult}
            onNext={() => setStep(5)}
          />
        )}
        {step === 5 && (
          <Leaderboard
            race={selectedRace}
            userTeams={userTeams}
            recommendations={recommendations}
            scoreResult={scoreResult}
            onReset={reset}
          />
        )}
      </main>
    </div>
  );
}
```

---

## Step 4 — Component Specifications

### RaceSelector.jsx

**Purpose:** User picks which race to run.

**API call:** `fetchRaces()`

**Layout:**
- Heading: "Select a Race"
- Filter tabs: "Halifax 2024" | "Bermuda 2026"
- Grid of race cards (2–3 per row), each card shows:
  - Race number (e.g., "Race 1")
  - Wind speed: `25.9 km/h`
  - Wind direction: `147°` (add a small directional arrow using CSS rotation)
  - Number of boats
- Clicking a card calls `onSelect(race)`

```jsx
import { useEffect, useState } from "react";
import { fetchRaces } from "../api";

export default function RaceSelector({ onSelect }) {
  const [races, setRaces] = useState([]);
  const [event, setEvent] = useState("Halifax");

  useEffect(() => { fetchRaces().then(setRaces); }, []);

  const filtered = races.filter(r => r.event === event);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Select a Race</h2>
      <p className="text-slate-400 mb-6">
        Choose a race to build your fantasy lineup
      </p>

      {/* Event tabs */}
      <div className="flex gap-2 mb-6">
        {["Halifax", "Bermuda"].map(e => (
          <button key={e}
            onClick={() => setEvent(e)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${event === e ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
          >
            {e} {e === "Halifax" ? "2024" : "2026"}
          </button>
        ))}
      </div>

      {/* Race cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(race => (
          <button key={race.race_label}
            onClick={() => onSelect(race)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600
                       hover:border-blue-500 rounded-xl p-4 text-left transition-all"
          >
            <div className="text-lg font-bold">{race.race_label.replace("_", " ")}</div>
            <div className="text-slate-400 text-sm mt-1">
              💨 {race.avg_tws_km_h} km/h
            </div>
            <div className="text-slate-400 text-sm">
              🧭 {race.avg_twd_deg}°
            </div>
            <div className="text-slate-400 text-sm">
              {race.num_boats} boats
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

### OptimizerPanel.jsx

**Purpose:** Show wind conditions and ML-powered team recommendations.

**API call:** `fetchRecommendations(race.event, race.race_label)`

**Layout:**
- Heading: "AI Race Optimizer"
- Wind conditions card: speed + direction with a compass arrow graphic
- "Analysing conditions..." loading state while fetching
- Recommendations list: rank 1, 2, 3 with predicted scores
- "Build Your Team →" button calls `onRecommend(recs)`

```jsx
import { useEffect, useState } from "react";
import { fetchRecommendations } from "../api";

const FLAG = { AUS: "🇦🇺", GBR: "🇬🇧", NZL: "🇳🇿", USA: "🇺🇸", CAN: "🇨🇦",
               FRA: "🇫🇷", GER: "🇩🇪", DEN: "🇩🇰", ESP: "🇪🇸", SUI: "🇨🇭",
               BRA: "🇧🇷", ITA: "🇮🇹", SWE: "🇸🇪" };

export default function OptimizerPanel({ race, onRecommend }) {
  const [recs, setRecs] = useState(null);

  useEffect(() => {
    fetchRecommendations(race.event, race.race_label).then(data => {
      setRecs(data.recommendations);
    });
  }, [race]);

  if (!recs) return (
    <div className="text-center py-20 text-slate-400">
      Analysing wind conditions...
    </div>
  );

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">AI Race Optimizer</h2>
      <p className="text-slate-400 mb-6">
        {race.event} — {race.race_label.replace("_", " ")}
      </p>

      {/* Wind card */}
      <div className="bg-blue-900/40 border border-blue-700 rounded-xl p-5 mb-6 flex gap-8">
        <div>
          <div className="text-slate-400 text-sm">Wind Speed</div>
          <div className="text-3xl font-bold">{race.avg_tws_km_h} <span className="text-base font-normal text-slate-400">km/h</span></div>
        </div>
        <div>
          <div className="text-slate-400 text-sm">Wind Direction</div>
          <div className="text-3xl font-bold">{race.avg_twd_deg}°</div>
        </div>
        <div className="flex items-center">
          {/* Arrow pointing in wind direction */}
          <div
            className="text-4xl"
            style={{ transform: `rotate(${race.avg_twd_deg}deg)`, display: "inline-block" }}
          >
            ↑
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Model Recommends</h3>
        <div className="space-y-3">
          {recs.map((rec, i) => (
            <div key={rec.team}
              className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-blue-400">#{i + 1}</span>
                <span className="text-xl">{FLAG[rec.team] || "🏴"}</span>
                <span className="font-semibold text-lg">{rec.team}</span>
              </div>
              <div className="text-right">
                <div className="text-blue-400 font-bold">{Math.round(rec.predicted_score)} pts</div>
                <div className="text-slate-500 text-xs">predicted</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onRecommend(recs)}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold
                   py-3 px-6 rounded-xl text-lg transition-colors"
      >
        Build Your Team →
      </button>
    </div>
  );
}
```

---

### TeamBuilder.jsx

**Purpose:** User picks up to 3 teams. Optimizer picks are highlighted.

**API call:** `fetchScore()` on submit — passes result to parent.

**Rules:**
- Hard cap at 3 teams. Disable all unselected cards once 3 are chosen.
- Highlight optimizer-recommended teams with a star icon.
- Show selected count: "2 / 3 teams selected"
- "Run Race →" button disabled until at least 1 team selected

```jsx
import { useState } from "react";
import { fetchScore } from "../api";

const FLAG = { AUS: "🇦🇺", GBR: "🇬🇧", NZL: "🇳🇿", USA: "🇺🇸", CAN: "🇨🇦",
               FRA: "🇫🇷", GER: "🇩🇪", DEN: "🇩🇰", ESP: "🇪🇸", SUI: "🇨🇭",
               BRA: "🇧🇷", ITA: "🇮🇹", SWE: "🇸🇪" };

export default function TeamBuilder({ race, recommendations, onSubmit }) {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const recTeams = new Set(recommendations.map(r => r.team));

  const toggle = (team) => {
    setSelected(prev =>
      prev.includes(team)
        ? prev.filter(t => t !== team)
        : prev.length < 3 ? [...prev, team] : prev
    );
  };

  const handleRun = async () => {
    setLoading(true);
    const result = await fetchScore(race.event, race.race_label, selected);
    setLoading(false);
    onSubmit(selected, result);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Build Your Team</h2>
      <p className="text-slate-400 mb-1">Select up to 3 teams for your lineup</p>
      <p className="text-blue-400 font-semibold mb-6">
        {selected.length} / 3 teams selected
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {race.teams.map(team => {
          const isSelected = selected.includes(team);
          const isRec = recTeams.has(team);
          const isDisabled = !isSelected && selected.length >= 3;
          return (
            <button key={team}
              onClick={() => toggle(team)}
              disabled={isDisabled}
              className={`relative p-4 rounded-xl border-2 text-left transition-all
                ${isSelected
                  ? "bg-blue-600/30 border-blue-500"
                  : isDisabled
                    ? "opacity-40 cursor-not-allowed bg-slate-800 border-slate-700"
                    : "bg-slate-800 border-slate-600 hover:border-slate-400"
                }`}
            >
              {isRec && (
                <span className="absolute top-2 right-2 text-yellow-400 text-xs font-bold">
                  ★ AI Pick
                </span>
              )}
              <div className="text-2xl mb-1">{FLAG[team] || "🏴"}</div>
              <div className="font-bold text-lg">{team}</div>
              {isSelected && (
                <div className="text-blue-400 text-xs mt-1">✓ Selected</div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleRun}
        disabled={selected.length === 0 || loading}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50
                   disabled:cursor-not-allowed text-white font-bold
                   py-3 px-6 rounded-xl text-lg transition-colors"
      >
        {loading ? "Running Race..." : "Run Race →"}
      </button>
    </div>
  );
}
```

---

### RaceScoring.jsx

**Purpose:** Show the breakdown for the user's 3 picks only.

**No new API call** — uses `scoreResult` passed from parent.

**Layout:**
- Heading: "Race Results — Your Team"
- One card per selected team
- Each card shows: final position, total score, and a breakdown bar/row for each of the 5 categories
- "View Full Leaderboard →" button

```jsx
const CATEGORY_LABELS = [
  { key: "position_pts",      label: "Finishing Position", icon: "🏆", max: 50 },
  { key: "speed_pts",         label: "Speed",              icon: "💨", max: 20 },
  { key: "overtake_pts",      label: "Overtakes",          icon: "⚡", max: 25 },
  { key: "clean_sailing_pts", label: "Clean Sailing",      icon: "✅", max: 15 },
  { key: "vmg_pts",           label: "VMG Consistency",    icon: "📐", max: 15 },
];

const STATUS_LABEL = { 3: "Finished", 4: "DNS", 5: "DNF", 6: "DSQ", 7: "OCS", 8: "DNC" };
const FLAG = { AUS: "🇦🇺", GBR: "🇬🇧", NZL: "🇳🇿", USA: "🇺🇸", CAN: "🇨🇦",
               FRA: "🇫🇷", GER: "🇩🇪", DEN: "🇩🇰", ESP: "🇪🇸", SUI: "🇨🇭",
               BRA: "🇧🇷", ITA: "🇮🇹", SWE: "🇸🇪" };

export default function RaceScoring({ race, userTeams, scoreResult, onNext }) {
  const userRows = scoreResult.leaderboard.filter(r => userTeams.includes(r.team));
  const ordinal = n => ["1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th"][n-1] || `${n}th`;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Race Results — Your Team</h2>
      <p className="text-slate-400 mb-2">
        {race.event} — {race.race_label.replace("_", " ")}
      </p>
      <div className="text-4xl font-bold text-blue-400 mb-6">
        Your team scored: {scoreResult.user_total_score} pts
      </div>

      <div className="space-y-4 mb-6">
        {userRows.map(row => (
          <div key={row.team} className="bg-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{FLAG[row.team] || "🏴"}</span>
                <span className="text-xl font-bold">{row.team}</span>
                <span className="text-slate-400 text-sm">
                  {row.final_rank ? ordinal(row.final_rank) : (STATUS_LABEL[row.status] || "?")}
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{row.total_pts} pts</div>
            </div>

            <div className="space-y-2">
              {CATEGORY_LABELS.map(cat => (
                <div key={cat.key} className="flex items-center gap-2 text-sm">
                  <span className="w-5">{cat.icon}</span>
                  <span className="w-36 text-slate-400">{cat.label}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 rounded-full h-2 transition-all"
                      style={{ width: `${(row[cat.key] / cat.max) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-medium">
                    {row[cat.key]}/{cat.max}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold
                   py-3 px-6 rounded-xl text-lg transition-colors"
      >
        View Full Leaderboard →
      </button>
    </div>
  );
}
```

---

### Leaderboard.jsx

**Purpose:** Full race rankings, user picks highlighted, optimizer picks noted.

**No new API call** — uses `scoreResult` from parent.

**Also shows:** Model performance panel (call `fetchOptimizerPerformance()` here).

```jsx
import { useEffect, useState } from "react";
import { fetchOptimizerPerformance } from "../api";

const FLAG = { AUS: "🇦🇺", GBR: "🇬🇧", NZL: "🇳🇿", USA: "🇺🇸", CAN: "🇨🇦",
               FRA: "🇫🇷", GER: "🇩🇪", DEN: "🇩🇰", ESP: "🇪🇸", SUI: "🇨🇭",
               BRA: "🇧🇷", ITA: "🇮🇹", SWE: "🇸🇪" };

export default function Leaderboard({ race, userTeams, recommendations, scoreResult, onReset }) {
  const [modelPerf, setModelPerf] = useState(null);
  const recTeams = new Set(recommendations.map(r => r.team));

  useEffect(() => {
    fetchOptimizerPerformance().then(setModelPerf).catch(() => setModelPerf(null));
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Final Leaderboard</h2>

      {/* User score banner */}
      <div className="bg-blue-600/20 border border-blue-500 rounded-xl p-4 mb-6 text-center">
        <div className="text-slate-400 text-sm">Your team total</div>
        <div className="text-5xl font-bold text-blue-400">{scoreResult.user_total_score} pts</div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm mb-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-600/40 border border-blue-500" />
          <span className="text-slate-400">Your pick</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-yellow-400">★</span>
          <span className="text-slate-400">AI pick</span>
        </div>
      </div>

      {/* Leaderboard rows */}
      <div className="space-y-2 mb-8">
        {scoreResult.leaderboard.map((row, i) => (
          <div key={row.team}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl
              ${row.is_user_pick ? "bg-blue-600/20 border border-blue-600" : "bg-slate-800"}`}
          >
            <span className="w-6 text-slate-400 font-mono text-sm">{i + 1}</span>
            <span className="text-xl">{FLAG[row.team] || "🏴"}</span>
            <span className="flex-1 font-semibold">
              {row.team}
              {recTeams.has(row.team) && <span className="text-yellow-400 ml-1 text-xs">★ AI</span>}
            </span>
            <span className="text-slate-400 text-sm">
              {row.final_rank ? `P${row.final_rank}` : "DNF"}
            </span>
            <span className="font-bold text-blue-400">{row.total_pts} pts</span>
          </div>
        ))}
      </div>

      {/* Model performance panel */}
      {modelPerf && (
        <div className="bg-slate-800 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-lg mb-1">Model Performance</h3>
          <p className="text-slate-400 text-sm mb-3">
            Trained on Halifax 2024 · Tested on Bermuda 2026
          </p>
          <p className="text-slate-400 text-sm mb-3">
            Bermuda RMSE: <span className="text-white font-bold">{modelPerf.bermuda_rmse.toFixed(1)} pts</span>
          </p>
          <div className="space-y-1">
            {modelPerf.races.map(r => (
              <div key={r.race_label} className="flex items-center gap-2 text-sm">
                <span className="text-slate-500 w-14">{r.race_label.replace("_"," ")}</span>
                <span className={`font-bold ${r.hits >= 2 ? "text-green-400" : "text-red-400"}`}>
                  {r.hits}/3 hits
                </span>
                <span className="text-slate-500">
                  pred: {r.predicted_top3.join(", ")} · actual: {r.actual_top3.join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold
                   py-3 px-6 rounded-xl text-lg transition-colors"
      >
        Try Another Race →
      </button>
    </div>
  );
}
```

---

## Day-by-Day Tasks

### Day 1 — Project setup + first 2 screens working with mock data
- [ ] Run `npm create vite` and set up Tailwind (see Step 1)
- [ ] Create `api.js` — all 5 functions (they'll 404 until Track 2 is up, that's fine)
- [ ] Create `App.jsx` state machine
- [ ] Build `RaceSelector` — hardcode 2-3 mock race objects to display
- [ ] Build `OptimizerPanel` — hardcode mock recommendations to display
- [ ] Confirm both screens render and the step flow works
- [ ] Run `npm run dev` and share `localhost:5173` URL with the team

**Day 1 done criteria:** You can click through RaceSelector → OptimizerPanel with mock data.

### Day 2 — Remaining screens + real API when available
- [ ] Build `TeamBuilder` with 3-team selection logic
- [ ] Build `RaceScoring` with category breakdown bars
- [ ] Build `Leaderboard` with highlighting logic
- [ ] Wire `api.js` to the real backend (Track 2 should be running stubs by now)
- [ ] Test full flow with stub data from Track 2

**Day 2 done criteria:** Full 5-step flow works end-to-end with stub data.

### Day 3 — Real data + polish
- [ ] Confirm Track 2 API has real data (not stubs) — verify scores look correct
- [ ] Test all 6 Halifax races in the UI
- [ ] Add loading spinners where needed
- [ ] Polish: colours, spacing, mobile friendliness if time allows

**Day 3 done criteria:** Full flow works with real race data.

### Day 4 — Animated race replay (stretch goal)
Add this to `RaceScoring` (or as a separate `RaceReplay` component between TeamBuilder and RaceScoring).

```jsx
// Fetch GPS: fetchGPS(race.event, race.race_label)
// Response: [{team: "AUS", lat: [...], lon: [...], time_s: [...]}]
// Use react-leaflet to draw a map
// Animate: use setInterval(1000ms) to step an index through the GPS arrays
// Draw a circle marker per team at current position
// Color each team differently (use a fixed colour map)
// Show a "time elapsed" counter
```

Install: `npm install leaflet react-leaflet`

Required CSS in `index.html`:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

### Day 5 — Demo prep
- [ ] Run through the full demo script 3 times
- [ ] Make sure the UI looks clean at 1920×1080 (recording resolution)
- [ ] No console errors during the demo races
- [ ] Test the specific races planned for the video
- [ ] Have a backup plan if the API goes down (screenshot fallback)

---

## How to Run

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

**Backend must be running** at `http://localhost:8000` for API calls to work (proxied via Vite).

---

## Country Flags Reference

```javascript
const FLAG = {
  AUS: "🇦🇺", GBR: "🇬🇧", NZL: "🇳🇿", USA: "🇺🇸", CAN: "🇨🇦",
  FRA: "🇫🇷", GER: "🇩🇪", DEN: "🇩🇰", ESP: "🇪🇸", SUI: "🇨🇭",
  BRA: "🇧🇷", ITA: "🇮🇹", SWE: "🇸🇪"
};
```

---

## Visual Style Guide

| Element | Tailwind classes |
|---|---|
| Page background | `bg-slate-900 text-white` |
| Cards | `bg-slate-800 rounded-xl p-4` |
| Selected/active | `bg-blue-600/30 border-2 border-blue-500` |
| Disabled | `opacity-40 cursor-not-allowed` |
| Score numbers | `text-blue-400 font-bold` |
| Primary button | `bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl` |
| Secondary button | `bg-slate-700 hover:bg-slate-600 text-white` |
| AI pick star | `text-yellow-400` |
| Good result | `text-green-400` |
| Bad result | `text-red-400` |
