<!--
=======================================================================
HOW TO USE THIS FILE
=======================================================================
This is your personal build guide for Track 2 of the SailGP Fantasy
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
> You have been given the Track 2 build guide for the **SailGP Fantasy Predictor**, a hackathon project built by a team of 3 working in parallel. Your job is to act as a dedicated coding assistant for this developer's specific track: **Backend API (FastAPI)**.
>
> This track has **two dependencies** — one from Track 1 (Python data science) and one outbound to Track 3 (React frontend). Your strategy is: **build with stubs first, wire real code when it arrives**. Follow these steps exactly and in order before writing any code.
>
> ---
>
> ### STEP 1 — INTRODUCE YOURSELF
>
> Send this message (adapt naturally):
>
> > "Hi! I'm your coding assistant for **Track 2 — Backend API**. You're the bridge of this project — Track 1's ML and scoring code flows through you to Track 3's UI. Your most important job today is to get a working (stub) API running so Track 3 isn't blocked. I need to check a few things before we start."
>
> ---
>
> ### STEP 2 — DEPENDENCY CHECKS (ask ONE at a time, wait for each answer)
>
> **Question 1 — Python version:**
> > "Run `python --version` and paste the output. We need Python 3.11+."
>
> - Python < 3.11: "You'll need to upgrade. See python.org or use pyenv. Come back once done."
> - Python 3.11+: "Good."
>
> **Question 2 — Working directory:**
> > "What folder are you in right now? Run `pwd` (Mac/Linux) or `cd` with no arguments (Windows) and paste the path. You should be in the `FantasySailGP/` project root."
>
> - Correct: "Good."
> - Wrong directory: "Navigate to the project root: `cd path/to/FantasySailGP`"
>
> **Question 3 — Track 1 status (CRITICAL DEPENDENCY):**
> > "Important one: what's the status of Track 1 (your teammate doing the data/ML work)? Pick the closest answer:
> > - A) They haven't started yet
> > - B) They've started but `score_race()` isn't working yet
> > - C) `score_race()` works and they've confirmed the function signature
> > - D) Both `score_race()` and `recommend_teams()` are done and tested"
>
> - **Answer A or B:** Say: "No problem — this is expected on Day 1. We'll build with stub functions that match the exact signature Track 1 will deliver. The stubs are already in this file. When Track 1 finishes, you replace the stub imports with real ones — I'll mark every stub clearly so you know exactly what to swap. For now, the API will return realistic fake data."
> - **Answer C:** Say: "Good — we can wire the real `score_race()` now and use a stub for `recommend_teams()` until Track 1 finishes the optimizer."
> - **Answer D:** Say: "Excellent — we can skip stubs entirely and wire real functions from the start."
>
> **Question 4 — Track 3 status:**
> > "Has Track 3 (the React frontend person) started yet? Do they have your API base URL?"
>
> - Not started / don't know: "Once we have stubs running (end of today), message them with: `Backend stub API is live at http://localhost:8000 — you can call all 5 endpoints and they'll return realistic fake data.` I'll show you the endpoint list to share."
> - Already started: "Good — make sure to notify them when stubs are up so they can switch from hardcoded mock data."
>
> **Question 5 — Model file:**
> > "Does the file `models/optimizer.pkl` exist yet? Run `dir models` (Windows) or `ls models` (Mac/Linux)."
>
> - File exists: "Good — the `/optimizer/performance` endpoint can be wired immediately."
> - File doesn't exist / folder missing: "That's fine — Track 1 creates this by running `train_model.py`. The `/optimizer/performance` endpoint will return a 503 until that file exists, which is the correct behavior. We'll implement it now and it'll work as soon as Track 1 produces the pkl."
>
> ---
>
> ### STEP 3 — ASSESS AND CONFIRM
>
> Based on Track 1's status from Question 3, tell the user which mode they're in:
>
> > **Mode A/B (stubs):** "We're in stub mode. Here's the plan for today:
> > 1. `requirements.txt` — install dependencies
> > 2. `models.py` — Pydantic schemas (no dependencies, do this first)
> > 3. `database.py` — SQLite cache helpers
> > 4. `main.py` — all 5 endpoints using stub functions
> > 5. Test every endpoint, then share the URL with Track 3
> >
> > When Track 1 is done, I'll tell you the exact 2-line change to replace each stub. Ready?"
> >
> > **Mode C/D (real code):** "Track 1 is ready, so we skip stubs. Same file order, but we'll import real functions. Ready?"
>
> ---
>
> ### STEP 4 — WORKING STYLE (follow this throughout)
>
> - **One file at a time.** Do not move to the next file until the current one works.
> - **After `main.py` is running**, give the user these 3 curl commands to run as a smoke test before anything else:
>   ```
>   curl http://localhost:8000/api/races
>   curl http://localhost:8000/api/races/Halifax/Race_1/recommend
>   curl -X POST http://localhost:8000/api/score -H "Content-Type: application/json" -d "{\"event\":\"Halifax\",\"race_label\":\"Race_1\",\"user_teams\":[\"AUS\",\"GBR\",\"CAN\"]}"
>   ```
>   Say: "Run all three and paste the outputs. All three should return JSON, not errors."
> - **Stub swap moment:** When the user says "Track 1 is done", immediately show them the exact import lines to change in `database.py` and `main.py`. Make it a 2-line diff, not a rewrite.
> - **CORS is a silent killer.** After stubs are running, proactively say: "Before Track 3 calls you from a browser, test CORS is configured — open http://localhost:8000/docs in a browser and confirm it loads. If it doesn't, we have a CORS problem to fix now, not on Day 3."
> - **Never dump all 4 files at once.** The user will get lost. One file, test it, confirm, next.

---

# Track 2 — Backend API (FastAPI)

> **Your role:** You own the FastAPI server. You are the bridge between Track 1's Python data science and Track 3's React frontend. On Day 1 you write stubs so Track 3 doesn't block. On Day 2 you wire Track 1's real functions in. By Day 3 the API is complete and both other tracks depend on it being stable.

---

## What You Own

```
backend/
  app/
    __init__.py
    main.py          ← FastAPI app, all routes, CORS
    models.py        ← Pydantic request/response schemas
    database.py      ← SQLite cache helpers
  requirements.txt
```

You do NOT touch: `data_loader.py`, `scoring_engine.py`, `optimizer.py`, anything in `frontend/`.

---

## What You Depend On From Track 1

Track 1 will deliver two functions. **On Day 1, write stubs for these.** On Day 2, replace stubs with real imports.

```python
# What Track 1 will give you — import like this once ready:
from app.scoring_engine import score_race
from app.optimizer import recommend_teams

# score_race("Halifax", "Race_1") returns a pd.DataFrame with columns:
#   team, position_pts, speed_pts, overtake_pts, clean_sailing_pts,
#   vmg_pts, total_pts, final_rank, status
#   (one row per team, sorted by total_pts descending)

# recommend_teams(avg_tws_km_h, avg_twd_deg, available_teams, top_n=3)
# returns: [{"team": "AUS", "predicted_score": 87.3}, ...]
```

### Day 1 stubs (use these until Track 1 is ready)

```python
def score_race(event: str, race_label: str):
    import pandas as pd
    teams = ["AUS", "GBR", "NZL", "USA", "CAN", "FRA", "GER", "DEN", "ESP", "SUI"]
    return pd.DataFrame([{
        "team": t, "position_pts": 20, "speed_pts": 10,
        "overtake_pts": 5, "clean_sailing_pts": 15, "vmg_pts": 8,
        "total_pts": 58, "final_rank": i + 1, "status": 3,
    } for i, t in enumerate(teams)])

def recommend_teams(avg_tws_km_h, avg_twd_deg, available_teams, top_n=3):
    return [{"team": t, "predicted_score": 80.0 - i * 5}
            for i, t in enumerate(available_teams[:top_n])]
```

---

## What Track 3 Needs From You

Track 3 will call these 5 endpoints. **These URLs, methods, and JSON shapes must not change after Day 2** — changing them breaks the frontend.

Share this table with Track 3 on Day 1 so they can build against stubs immediately:

| Method | URL | Purpose |
|---|---|---|
| GET | `/api/races` | List all races |
| GET | `/api/races/{event}/{race_label}/recommend` | ML recommendations |
| POST | `/api/score` | Run scoring for selected teams |
| GET | `/api/races/{event}/{race_label}/leaderboard` | Full race leaderboard |
| GET | `/api/optimizer/performance` | Model performance stats |

---

## Step 1 — requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
pandas==2.2.2
numpy==1.26.4
scikit-learn==1.5.0
joblib==1.4.2
pydantic==2.7.1
```

---

## Step 2 — models.py (Pydantic schemas)

```python
from pydantic import BaseModel
from typing import Optional

class TeamScore(BaseModel):
    team: str
    total_pts: int
    position_pts: int
    speed_pts: int
    overtake_pts: int
    clean_sailing_pts: int
    vmg_pts: int
    final_rank: Optional[int]
    status: int
    is_user_pick: bool = False

class RaceInfo(BaseModel):
    event: str
    race_label: str
    avg_tws_km_h: float
    avg_twd_deg: float
    num_boats: int
    teams: list[str]
    race_start_utc: str

class Recommendation(BaseModel):
    team: str
    predicted_score: float

class RecommendResponse(BaseModel):
    event: str
    race_label: str
    avg_tws_km_h: float
    avg_twd_deg: float
    recommendations: list[Recommendation]

class ScoreRequest(BaseModel):
    event: str
    race_label: str
    user_teams: list[str]

class ScoreResponse(BaseModel):
    event: str
    race_label: str
    user_teams: list[str]
    user_total_score: int
    leaderboard: list[TeamScore]

class RacePerformance(BaseModel):
    event: str
    race_label: str
    predicted_top3: list[str]
    actual_top3: list[str]
    hits: int

class OptimizerPerformanceResponse(BaseModel):
    training_event: str
    test_event: str
    bermuda_rmse: float
    races: list[RacePerformance]
```

---

## Step 3 — database.py (SQLite cache)

The scoring engine is the source of truth. SQLite only caches results so repeated API calls are fast.

```python
import sqlite3
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).parent.parent.parent / "fantasy_scores.db"

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS race_scores (
                event        TEXT,
                race_label   TEXT,
                team         TEXT,
                total_pts    INTEGER,
                position_pts INTEGER,
                speed_pts    INTEGER,
                overtake_pts INTEGER,
                clean_sailing_pts INTEGER,
                vmg_pts      INTEGER,
                final_rank   INTEGER,
                status       INTEGER,
                PRIMARY KEY (event, race_label, team)
            )
        """)

def get_cached_scores(event: str, race_label: str) -> Optional[list[dict]]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM race_scores WHERE event=? AND race_label=? ORDER BY total_pts DESC",
            (event, race_label)
        ).fetchall()
    return [dict(r) for r in rows] if rows else None

def cache_scores(event: str, race_label: str, scores: list[dict]):
    with sqlite3.connect(DB_PATH) as conn:
        conn.executemany(
            """INSERT OR REPLACE INTO race_scores
               (event, race_label, team, total_pts, position_pts, speed_pts,
                overtake_pts, clean_sailing_pts, vmg_pts, final_rank, status)
               VALUES (:event, :race_label, :team, :total_pts, :position_pts,
                       :speed_pts, :overtake_pts, :clean_sailing_pts, :vmg_pts,
                       :final_rank, :status)""",
            [{"event": event, "race_label": race_label, **row} for row in scores]
        )

def get_or_compute_scores(event: str, race_label: str) -> list[dict]:
    cached = get_cached_scores(event, race_label)
    if cached:
        return cached
    # Import here to avoid circular at module load time
    from app.scoring_engine import score_race
    df = score_race(event, race_label)
    scores = df.to_dict(orient="records")
    cache_scores(event, race_label, scores)
    return scores
```

---

## Step 4 — main.py (all endpoints)

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pathlib import Path

from app.models import (
    RaceInfo, RecommendResponse, Recommendation,
    ScoreRequest, ScoreResponse, TeamScore,
    OptimizerPerformanceResponse, RacePerformance
)
from app.database import init_db, get_or_compute_scores
from app.data_loader import load_metadata

app = FastAPI(title="SailGP Fantasy Predictor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

# ─── GET /api/races ────────────────────────────────────────────────────────────

@app.get("/api/races", response_model=list[RaceInfo])
def get_races():
    results = []
    for event in ["Halifax", "Bermuda"]:
        meta = load_metadata(event)
        for _, row in meta.iterrows():
            teams = [t.strip() for t in str(row["teams"]).split(",")]
            results.append(RaceInfo(
                event=event,
                race_label=row["race_label"],
                avg_tws_km_h=float(row["avg_tws_km_h"]),
                avg_twd_deg=float(row["avg_twd_deg"]),
                num_boats=int(row["num_boats"]),
                teams=teams,
                race_start_utc=str(row["race_start_utc"]),
            ))
    return results

# ─── GET /api/races/{event}/{race_label}/recommend ─────────────────────────────

@app.get("/api/races/{event}/{race_label}/recommend", response_model=RecommendResponse)
def get_recommendations(event: str, race_label: str):
    meta = load_metadata(event)
    race_row = meta[meta["race_label"] == race_label]
    if race_row.empty:
        raise HTTPException(404, f"Race {race_label} not found in {event}")
    race = race_row.iloc[0]
    teams = [t.strip() for t in str(race["teams"]).split(",")]

    from app.optimizer import recommend_teams
    recs = recommend_teams(
        avg_tws_km_h=float(race["avg_tws_km_h"]),
        avg_twd_deg=float(race["avg_twd_deg"]),
        available_teams=teams,
    )
    return RecommendResponse(
        event=event,
        race_label=race_label,
        avg_tws_km_h=float(race["avg_tws_km_h"]),
        avg_twd_deg=float(race["avg_twd_deg"]),
        recommendations=[Recommendation(**r) for r in recs],
    )

# ─── POST /api/score ───────────────────────────────────────────────────────────

@app.post("/api/score", response_model=ScoreResponse)
def score(req: ScoreRequest):
    scores = get_or_compute_scores(req.event, req.race_label)
    user_set = set(req.user_teams)
    leaderboard = [
        TeamScore(**{**s, "is_user_pick": s["team"] in user_set})
        for s in scores
    ]
    user_total = sum(s.total_pts for s in leaderboard if s.team in user_set)
    return ScoreResponse(
        event=req.event,
        race_label=req.race_label,
        user_teams=req.user_teams,
        user_total_score=user_total,
        leaderboard=leaderboard,
    )

# ─── GET /api/races/{event}/{race_label}/leaderboard ──────────────────────────

@app.get("/api/races/{event}/{race_label}/leaderboard", response_model=list[TeamScore])
def get_leaderboard(event: str, race_label: str):
    scores = get_or_compute_scores(event, race_label)
    return [TeamScore(**{**s, "is_user_pick": False}) for s in scores]

# ─── GET /api/optimizer/performance ───────────────────────────────────────────

@app.get("/api/optimizer/performance", response_model=OptimizerPerformanceResponse)
def get_optimizer_performance():
    import numpy as np
    from sklearn.metrics import mean_squared_error
    from app.optimizer import build_training_data, FEATURES
    import joblib
    from pathlib import Path

    MODEL_PATH = Path(__file__).parent.parent.parent / "models" / "optimizer.pkl"
    if not MODEL_PATH.exists():
        raise HTTPException(503, "Model not trained yet — run train_model.py first")

    pipeline = joblib.load(MODEL_PATH)
    test_df = build_training_data("Bermuda")
    y_pred = pipeline.predict(test_df[FEATURES])
    rmse = float(np.sqrt(mean_squared_error(test_df["fantasy_points"], y_pred)))

    # Per-race top-3 hit rate on Halifax (the training event — for demo storytelling)
    train_df = build_training_data("Halifax")
    train_df["predicted"] = pipeline.predict(train_df[FEATURES])
    races_perf = []
    for race_label, group in train_df.groupby("race"):
        actual_top3 = (
            group.nlargest(3, "fantasy_points")["team"].tolist()
        )
        predicted_top3 = (
            group.nlargest(3, "predicted")["team"].tolist()
        )
        hits = len(set(actual_top3) & set(predicted_top3))
        races_perf.append(RacePerformance(
            event="Halifax",
            race_label=race_label,
            predicted_top3=predicted_top3,
            actual_top3=actual_top3,
            hits=hits,
        ))

    return OptimizerPerformanceResponse(
        training_event="Halifax",
        test_event="Bermuda",
        bermuda_rmse=rmse,
        races=races_perf,
    )
```

---

## Step 5 — Pre-warm the Cache (optional script)

Run this after `train_model.py` completes to pre-compute all race scores into SQLite. Makes the demo fast.

```python
# backend/prewarm_cache.py
from app.database import get_or_compute_scores

events = {
    "Halifax": [f"Race_{i}" for i in range(1, 7)],
    "Bermuda": [f"Race_{i}" for i in range(1, 9)],
}

for event, races in events.items():
    for race_label in races:
        print(f"Caching {event} {race_label}...")
        get_or_compute_scores(event, race_label)

print("Done.")
```

---

## Day-by-Day Tasks

### Day 1 — Scaffold with stubs
- [ ] Create `backend/requirements.txt`
- [ ] Create `backend/app/__init__.py` (empty)
- [ ] Implement `models.py` (all Pydantic schemas)
- [ ] Implement `database.py` (full implementation)
- [ ] Implement `main.py` with stub versions of all 5 endpoints (using the Day 1 stub functions at the top of this doc)
- [ ] Run `uvicorn app.main:app --reload` and confirm all 5 endpoints return 200 with plausible stub data
- [ ] Share base URL `http://localhost:8000` and all endpoint paths with Track 3

**Day 1 done criteria:** `curl http://localhost:8000/api/races` returns a JSON array.

### Day 2 — Wire real Track 1 code
- [ ] Confirm Track 1's `score_race()` works by importing it directly and running it
- [ ] Replace stub `score_race` import in `database.py` with the real function
- [ ] Confirm Track 1's `recommend_teams()` works
- [ ] Replace stub in `/recommend` endpoint with real `recommend_teams` import
- [ ] Run `python prewarm_cache.py` to cache all races
- [ ] Test all endpoints return real data (not stubs)
- [ ] Notify Track 3: "API is live with real data"

**Day 2 done criteria:** `POST /api/score` returns real fantasy scores matching what Track 1 printed on Day 1.

### Day 3 — Complete + harden
- [ ] Implement `/api/optimizer/performance` endpoint (needs model trained first)
- [ ] Add 404 error handling for invalid event/race_label inputs
- [ ] Test CORS: confirm a fetch() call from `localhost:3000` or `localhost:5173` works
- [ ] Verify Track 3 can call all endpoints from the browser (no CORS errors)

### Day 4
- [ ] Add a GPS endpoint if Track 3 needs it for race replay:
  ```
  GET /api/races/{event}/{race_label}/gps
  Returns: [{"team": "AUS", "lat": [...], "lon": [...], "time": [...]}]
  ```
- [ ] Monitor: check server logs during Track 3's demo rehearsal

### Day 5
- [ ] Confirm server starts cleanly from a fresh terminal (no leftover state)
- [ ] Test all 5 demo race + team combinations the video will show
- [ ] Be ready to restart the server quickly if it crashes during recording

---

## How to Run

```bash
cd backend
pip install -r requirements.txt

# First time only: train the model
python train_model.py

# Optional: pre-warm the cache
python prewarm_cache.py

# Start the server
uvicorn app.main:app --reload
# Server runs at http://localhost:8000
# Auto-docs at http://localhost:8000/docs
```

### Quick endpoint tests (curl)

```bash
# List all races
curl http://localhost:8000/api/races

# Get recommendations for Halifax Race_1
curl http://localhost:8000/api/races/Halifax/Race_1/recommend

# Score a race with user's picks
curl -X POST http://localhost:8000/api/score \
  -H "Content-Type: application/json" \
  -d '{"event": "Halifax", "race_label": "Race_1", "user_teams": ["AUS", "GBR", "CAN"]}'
```

---

## GPS Endpoint (add on Day 4 if needed for Track 3's animated replay)

```python
@app.get("/api/races/{event}/{race_label}/gps")
def get_gps(event: str, race_label: str):
    from app.data_loader import load_all_boats
    boats = load_all_boats(event, race_label)
    result = []
    for team, df in boats.items():
        racing = df[df["TRK_BOAT_RACE_STATUS_unk"].isin([1, 2, 3])]
        result.append({
            "team": team,
            "lat": racing["LATITUDE_GPS_unk"].tolist(),
            "lon": racing["LONGITUDE_GPS_unk"].tolist(),
            "time_s": racing["TIME_RACE_s"].tolist(),
        })
    return result
```
