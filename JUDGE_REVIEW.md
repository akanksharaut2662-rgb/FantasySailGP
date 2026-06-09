# FantasySailGP — Hackathon Judge Review & Implementation Roadmap

> Evaluated as a senior UI/UX designer + ML-aware hackathon judge.  
> Every issue below is grounded in what was actually found in the codebase — nothing hypothetical.

---

## Honest Scorecard (Current State)

| Dimension | Score | Notes |
|---|---|---|
| **Technical execution** | 78 / 100 | End-to-end functional. ML pipeline solid. GPS endpoint built but **never used**. |
| **ML quality & storytelling** | 52 / 100 | Model is methodologically sound but completely invisible to judges. |
| **UI / UX design** | 74 / 100 | Editorial aesthetic is excellent. Flow has friction points. |
| **Content credibility** | 38 / 100 | Landing page has 4 factual lies. Judges will catch every one. |
| **Presentation impact** | 61 / 100 | No single "wow" moment. The most impressive feature (GPS tracks) is hidden. |

**Overall: 61 / 100 — competitive, not winning.**

The engineering is real. The design is good. The problem is that the project *undersells* its genuine strengths and *oversells* things that aren't true. Judges who look at the code will find both.

---

## Part 1 — Credibility Killers (Fix These First)

These are the things that will make a technical judge distrust the entire project the moment they notice them.

---

### 1.1 Four Lies on the Landing Page

**File:** `frontend/src/components/site/AIEngine.tsx`

| Claim on screen | Reality | Fix |
|---|---|---|
| "Trained on 8 seasons · 1.2M data points" | Trained on 6 Halifax races (~60 rows × ~10 columns). Real number is closer to 600 data points. | Replace with real stats pulled from the API. |
| "Join 84,000 managers" | Zero real users. This is a hackathon project. | Delete entirely. Use "Built for the Ocean of Data Challenge." |
| AI picks show **T. Slingsby, P. Burling** (individual sailors) | The actual product picks **teams** (AUS, NZL, GBR), not individuals. | Replace with real team recommendations wired to the live API. |
| Form bars (92, 88, 84, 79) | These are hardcoded. The model outputs points (e.g. 187, 172), not a "form" percentage. | Wire to real `/api/optimizer/performance` data. |

**Why this matters:** Judges read code. They will open `AIEngine.tsx`, see hardcoded arrays, and immediately discount everything else.

---

### 1.2 "Sailors" vs. "Teams" — Wrong Product Description

**File:** `frontend/src/components/site/HowItWorks.tsx`

The section says:
> "Pick five sailors and a captain from the global pool. Budget caps and form ratings keep every decision honest."

The actual product:
- Picks **3 teams** (AUS, NZL, GBR, etc.), not individual sailors
- Has **no budget caps** (not implemented)
- Has **no "captain"** mechanic (not implemented)

**Fix:** Rewrite the four playbook steps to describe what the product actually does.

---

### 1.3 The Live Sim Section Is Entirely Hardcoded

**File:** `frontend/src/components/site/LiveSim.tsx`

Every single event (`+00:42 Start: "Clean line, AUS port end advantage" → +12 pts`) is static JSX. There is no live or historical data behind it.

**Fix options (choose one):**
- **Option A (fast):** Label it `Halifax · Race 1 · Replay` and populate it from the real API response for that race. The scoring engine returns per-category points; the events can be constructed from those.
- **Option B (best):** Use the GPS data to render it as "Race 1 highlights" with real timestamps and real point events.

---

### 1.4 Sydney Harbour Countdown with Fake Dates

**File:** `frontend/src/components/site/Countdown.tsx`

"Round Seven — Sydney Harbour · 14 March · 14:00 AEDT" is hardcoded placeholder content from the original scaffold.

**Fix:** Either replace with the actual Bermuda race dates from the dataset, or relabel it "Explore a past race" and link to the app.

---

## Part 2 — ML Storytelling (The Biggest Gap)

Judges need to *see* the model working. Right now the model is a black box that says "AI picked AUS" with no explanation. This is the highest-leverage area to improve.

---

### 2.1 What Judges Expect from an ML Project

A strong ML submission shows the full pipeline in the UI:

```
Raw data → Feature engineering → Model → Prediction → Validation
```

Currently the UI only shows the last step (Prediction). The rest is invisible.

---

### 2.2 Build a `/model` Route — The ML Intelligence Page

Create a new route at `/app/model` (accessible from the app nav) that is shown to judges as a dedicated "model explainer." This is your technical pitch to people who understand ML.

**Sections to include:**

#### Section A — The Data
> "We ingested X races of real SailGP telemetry — GPS tracks, wind speed, wind direction, boat speed, VMG, penalty flags, and live rank updates — from Halifax 2024 and Bermuda 2026."

Show a real sample from the dataset: a small table of columns (team, avg_tws_km_h, avg_twd_deg, speed_pts, vmg_pts, total_pts) — 5 rows is enough.

Pull this from the existing `/api/races` and `/api/optimizer/performance` endpoints. No new backend needed.

#### Section B — Feature Engineering
Show the circular encoding insight visually:

```
Wind at 355° and wind at 5° are 10° apart — not 350° apart.
Raw degrees fail. We encode as sin(θ) and cos(θ).
```

Draw a unit circle in SVG (it takes ~30 lines). Plot a few real wind directions on it. This one diagram will impress any ML judge more than a hundred bullet points.

#### Section C — Model Performance (Already in API)
The `/api/optimizer/performance` endpoint already returns everything needed:
- `bermuda_rmse` — average prediction error in points
- Per-race: `predicted_top3` vs `actual_top3`, `hits` count

Render this as a visual table with hit/miss indicators (✓ / ✗). Show the overall accuracy as a large number: **"X / 18 top-3 picks correct"**.

Currently this is only shown buried at step 5 of the app flow, in text-only format. Judges doing a quick demo will never reach it.

#### Section D — Why This Pick? (Explainability)
After the model recommends AUS, show:

```
AUS performs strongly in wind conditions 18–25 km/h
Based on 4 Halifax races in similar conditions, AUS finished top-3 in 3 of them.
```

This is computable from the training data without adding new ML complexity. Just filter `optimizer_performance.races` by wind speed bucket and compute hit rate per team.

---

### 2.3 Show Model Accuracy in the OptimizerPanel (Step 2 of Flow)

Currently the OptimizerPanel shows "Predicted: 187 pts" with no context.

Add below each recommendation card:
- A small horizontal bar: `Confidence — HIGH / MEDIUM / LOW` (based on distance from next-best prediction)
- One-line explanation: "AUS dominates in SE winds above 20 km/h" (from training data lookup)

This turns "a number" into "an insight."

---

### 2.4 Show Prediction vs. Actual After Scoring

On the RaceScoring page (Step 4), after the user sees their score:

Add one line per team:
```
AUS  Predicted: 92 pts  ·  Actual: 104 pts  ·  Model error: 12 pts
```

This concretely shows the model's accuracy and makes the ML feel alive. The predicted scores are already returned in the recommendations; just pass them through to the scoring component.

---

## Part 3 — The Biggest Missed Feature: GPS Race Map

**The GPS endpoint (`/api/races/{event}/{race_label}/gps`) exists in the backend and is tested — but no page in the frontend ever calls it.**

This is the single highest-impact change available. A map showing 8–10 boats' actual paths during a real SailGP race is a visceral, immediate "wow" for any judge, and it requires zero new backend work.

---

### 3.1 What to Build

A race replay map component. It can be as simple as:

1. Fetch GPS tracks from `/api/races/Halifax/Race_1/gps`
2. The response is `[{ team: "AUS", lat: [...], lon: [...], time_s: [...] }]`
3. Normalize lat/lon to a bounded SVG coordinate space (no map library needed)
4. Animate dots along each path using CSS `animation-delay` per track point
5. Color each team's path by their national color (already defined in `RaceScene.jsx`)

**Why SVG instead of Leaflet:** No dependency. Pure SVG projection of the lat/lon bounds → screen coords takes ~20 lines. And it fits the editorial aesthetic perfectly.

**Where to show it:**
- **Primary:** Add a "Race Replay" tab or panel inside the Step 1 race selector — click a race card and see the actual boats racing.
- **Secondary:** Show it at the top of the Leaderboard page (step 5) as a "this is how it really happened" reveal.

---

### 3.2 SVG Projection Formula (Ready to Implement)

```js
// Given bounds from the GPS data:
const lats = tracks.flatMap(t => t.lat);
const lons = tracks.flatMap(t => t.lon);
const minLat = Math.min(...lats), maxLat = Math.max(...lats);
const minLon = Math.min(...lons), maxLon = Math.max(...lons);

// Map to SVG coordinate space (e.g. 800×500):
const toX = (lon) => ((lon - minLon) / (maxLon - minLon)) * 800;
const toY = (lat) => ((maxLat - lat) / (maxLat - minLat)) * 500; // inverted: lat increases up, SVG down
```

Then each team's path becomes an SVG `<polyline>` and each current position is a `<circle>`. Animate using `requestAnimationFrame` or Framer Motion `animate`.

---

## Part 4 — UX Flow Improvements

---

### 4.1 Score Context — "Is My Score Good?"

**File:** `frontend/src/components/app/RaceScoring.jsx`

After the animated total reveals, users see a raw number (e.g. 312 pts) with zero context.

Add below the total:
```
312 pts  ·  Race average: 248 pts  ·  Race winner: 387 pts
You beat 7 of 10 teams.
```

All of this data is in the scoring API response (`result.leaderboard`). Just compute it client-side:
```js
const allScores = result.leaderboard.map(r => r.total_pts);
const avg = Math.round(allScores.reduce((a,b) => a+b, 0) / allScores.length);
const max = Math.max(...allScores);
const rank = allScores.filter(s => s > result.user_total_score).length + 1;
```

---

### 4.2 Team Builder — Show Why Each Team Is Good

**File:** `frontend/src/components/app/TeamBuilder.jsx`

Currently boats are clickable but show only the flag and country name. Users have no basis for choosing beyond the AI's recommendation.

Add to each team card when AI-recommended:
- The predicted score (already in `recommendations` prop)
- A one-line stat from training data (e.g. "3rd-best in high-wind races")

For non-recommended teams:
- Their average score across all races they competed in (computable from the leaderboard data if cached)

---

### 4.3 Progress Bar — Make It Feel Like a Journey

**File:** `frontend/src/routes/app.tsx`

The Roman numeral step indicators are elegant but static. The gold progress bar fills linearly, which is correct but cold.

Add the race/team context to the header at each step:
- Step 2: Show the selected race name next to the step indicators
- Step 3: Show "Halifax · Race 1" + "0/3 selected"
- Step 4+: Show the race name + user's teams (3 flag emojis)

This makes the header feel contextual and progressive, not just a step counter.

---

### 4.4 Error States Are Missing

There are no error states for:
- API fetch failure on the race list
- Model not trained (503 from recommend endpoint)
- Network timeout during `fetchScore`

All three currently result in a silent infinite loading state. Add error boundaries with editorial-styled messages and a "Try again" option.

---

### 4.5 Mobile Is Untested

The leaderboard table uses fixed grid columns (`grid-cols-[56px_1fr_44px_44px_44px_60px_44px_64px]`) that overflow on screens narrower than ~700px.

On mobile, collapse the scoring breakdown columns into a expandable accordion per row, or at minimum hide the smaller columns.

---

## Part 5 — What to Actually Build Before the Deadline

Ranked by judge impact vs. implementation time:

| Priority | What | Time est. | Impact |
|---|---|---|---|
| **P0** | Fix the 4 credibility lies on the landing page | 1 hr | Stops judges from losing trust |
| **P0** | Fix "sailors" → "teams" in HowItWorks | 30 min | Stops judges from thinking you don't know your own product |
| **P1** | Wire real AI picks to the landing page `#ai` section | 2 hr | Turns fake marketing into live demo |
| **P1** | GPS Race Map component on Step 1 | 4–6 hr | Single biggest "wow" moment for judges |
| **P2** | `/app/model` page: ML explainer with unit circle + performance table | 3–4 hr | Elevates from "we used ML" to "we understand ML" |
| **P2** | Score context on RaceScoring (avg, rank, max) | 1 hr | Makes scores feel meaningful |
| **P2** | Prediction vs. Actual line on each scoring card | 1 hr | Shows ML is working live |
| **P3** | Rewrite LiveSim section with data from a real race | 2 hr | Removes the last piece of fake content |
| **P3** | Team builder stat cards (predicted score + wind compatibility) | 2 hr | Reduces decision paralysis in the flow |
| **P4** | Mobile leaderboard table responsive fix | 1 hr | Table polish |
| **P4** | Error states for API failures | 1 hr | Professional polish |

---

## Part 6 — The Demo Script (What to Show Judges)

Regardless of what gets built, the judge walkthrough should follow this order:

```
1. Open landing page  →  "Here's what SailGP Fantasy is"
2. Click "Build team"  →  enters /app
3. [NEW] Show the Race Map  →  "These are real GPS tracks from a SailGP race"
4. Select Race 1 · Halifax  →  model reads wind, returns AI picks
5. [NEW] Explain the model  →  "We train on X races, wind speed + direction, team history"
6. Build team (pick 2 AI + 1 own pick)  →  shows the choice friction
7. Score reveals  →  animated, shows per-category breakdown
8. [NEW] Show "you scored 312 pts, race avg was 248"  →  model was right
9. Leaderboard  →  show model performance panel with hit rate
10. [NEW] Open /model page  →  show unit circle, per-race accuracy
```

This sequence ensures every ML concept is demonstrated visually, not just described.

---

## Part 7 — What the Judges Will Ask

Based on the project content, prepare answers to these:

**"Why Ridge Regression?"**
> Small dataset (60 rows). Ridge handles multicollinearity between teams better than plain linear regression. Interpretable coefficients. On 60 rows, a gradient-boosted tree would overfit badly. We validated this by testing on Bermuda — the RMSE of X pts means we're off by less than one scoring category on average.

**"How do you handle the wind direction being circular?"**
> We encode wind direction as sin(θ) and cos(θ). This means 359° and 1° are treated as 2° apart, not 358° apart. Without this, the model would learn that northerly winds are completely different from near-northerly winds — a fundamental error for a wind-based sport.

**"Is the model overfitting?"**
> We train exclusively on Halifax 2024 and test on Bermuda 2026 — a completely different event, different course, different conditions. The model was never shown any Bermuda data during training. The RMSE of X on an out-of-sample event is honest validation.

**"How is fantasy scoring computed?"**
> 5 categories from real telemetry: finishing position, wind-normalised boat speed, overtakes (live rank improvements), clean sailing (penalty count), and VMG consistency. Every point is grounded in actual sensor data — not arbitrary game-designer decisions.

**"What data does the GPS endpoint return?"**
> Per-boat lat/lon time series during the race, filtered to status codes 1 (pre-start), 2 (racing), and 3 (finished). We built a full GPS replay capability — [demo the map if built].

---

## Appendix — Component × Issue Map

| Component | Issue | Fix type |
|---|---|---|
| `AIEngine.tsx` | Fake picks, fake stats | Rewrite with live API |
| `HowItWorks.tsx` | Wrong product description | Content rewrite |
| `Countdown.tsx` | Fake event | Relabel or remove |
| `LiveSim.tsx` | All hardcoded | Wire to real race API response |
| `OptimizerPanel.jsx` | No explainability | Add confidence + reason text |
| `RaceScoring.jsx` | No score context | Add avg/max/rank computed from response |
| `Leaderboard.jsx` | Model performance buried | Promote to /model page + summary |
| `TeamBuilder.jsx` | No selection rationale | Add predicted score to each team card |
| `app.tsx` | Header has no context | Add race name + team flags at each step |
| *(missing)* | GPS Race Map | Build from existing `/api/.../gps` endpoint |
| *(missing)* | `/model` ML explainer page | New route with unit circle + hit-rate table |

---

*Document written 2026-06-08. All findings are from direct code inspection of the running project.*
