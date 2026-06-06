# SailGP Fantasy Predictor — Complete Build Specification

> **Purpose:** This document is the single authoritative source of truth for building the SailGP Fantasy Predictor. It supersedes README.md and PROJECT_CONTEXT.md wherever they conflict. An LLM or developer should be able to implement the full project from this file alone.

---

## 1. Project Summary

**Product name:** SailGP Fantasy Predictor  
**Hackathon:** Ocean of Data Challenge — Foil Forward (DeepSense, Halifax)  
**Deadline:** June 10, 2026 at 11:59 pm ADT  
**Submission format:** 3-minute recorded video + Team Concept Submission Form

**One-line pitch:**
> Fantasy football has 45 million players. Fantasy sailing has zero. We're changing that — scored automatically from real SailGP telemetry, with a model that tells you who to pick before the race starts.

**The product loop:**
1. User selects a race (wind conditions are shown)
2. ML optimizer recommends which teams to pick based on those conditions
3. User picks up to 3 teams for their fantasy lineup
4. Scoring engine replays the real historical race and computes fantasy points from telemetry
5. Leaderboard shows user's score alongside how the optimizer's recommendation actually performed

---

## 2. Finalized Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Backend | Python 3.11+ + FastAPI | Single `backend/` folder |
| ML | scikit-learn + pandas + numpy | No deep learning needed |
| Frontend | React 18 + Tailwind CSS | `frontend/` folder |
| Data storage | SQLite (via sqlite3 stdlib) | Cache for computed scores only — CSVs are the source of truth |
| Data source | CSV files on disk | Do NOT move data — load from `DataChallenge_Export/` |

**Critical constraint:** SQLite is a cache, not the primary data layer. The scoring engine must be able to run directly from CSVs. SQLite caches results after first compute so the UI is fast.

---

## 3. Repository Structure to Build

```
FantasySailGP/
  DataChallenge_Export/          ← DO NOT MODIFY — raw data
    Halifax/
      boats/Race_N/TEAM.csv
      marks/Race_N/marks.csv
      race_metadata.csv
      data_dictionary.md
    Bermuda/
      boats/Race_N/TEAM.csv
      marks/Race_N/marks.csv
      race_metadata.csv
      data_dictionary.md
  backend/
    app/
      __init__.py
      main.py                    ← FastAPI entry point + CORS
      scoring_engine.py          ← compute fantasy scores from telemetry
      optimizer.py               ← ML model: train + predict
      data_loader.py             ← load and cache CSVs
      database.py                ← SQLite setup and helpers
      models.py                  ← Pydantic request/response models
    requirements.txt
    train_model.py               ← one-time script: train + serialize optimizer
  frontend/
    src/
      App.jsx
      api.js                     ← all fetch calls to backend
      components/
        RaceSelector.jsx
        OptimizerPanel.jsx
        TeamBuilder.jsx
        RaceScoring.jsx
        Leaderboard.jsx
    package.json
    tailwind.config.js
  models/
    optimizer.pkl                ← serialized trained model (git-ignored if large)
  BUILD_SPEC.md                  ← this file
```

---

## 4. Data Layer

### 4.1 Data Paths

```python
DATA_ROOT = Path("DataChallenge_Export")
HALIFAX_DIR = DATA_ROOT / "Halifax"
BERMUDA_DIR = DATA_ROOT / "Bermuda"

def boats_dir(event: str, race_label: str) -> Path:
    return DATA_ROOT / event / "boats" / race_label

def marks_file(event: str, race_label: str) -> Path:
    return DATA_ROOT / event / "marks" / race_label / "marks.csv"

def metadata_file(event: str) -> Path:
    return DATA_ROOT / event / "race_metadata.csv"
```

### 4.2 race_metadata.csv — Key Columns

| Column | Type | Example |
|---|---|---|
| `race_label` | str | `Race_1` |
| `race_number` | float | `24060101.0` |
| `race_start_utc` | ISO datetime str | `2024-06-01T19:07:31+00:00` |
| `race_end_utc` | ISO datetime str | `2024-06-01T19:21:21+00:00` |
| `avg_tws_km_h` | float | `25.9` |
| `avg_twd_deg` | float | `147.3` |
| `num_boats` | int | `10` |
| `teams` | comma-separated str | `"AUS, CAN, DEN, ..."` |

**Note:** `race_number` is NaN for Halifax Race_1 to Race_3 — do not use it as a key. Use `race_label` as the primary key everywhere.

### 4.3 boats/Race_N/TEAM.csv — Key Columns

Index: `DATETIME` (parse as UTC datetime)  
Second column: `TEAM` (same as filename stem, e.g., `AUS`)

| Column | Type | Description |
|---|---|---|
| `BOAT_SPEED_km_h_1` | float | Boat speed through water (km/h) |
| `VMG_km_h_1` | float | Velocity Made Good toward next mark (km/h) |
| `TRK_RACE_RANK_unk` | float | Live race position (1 = leading) |
| `TRK_BOAT_RACE_STATUS_unk` | float | See status table below |
| `TRK_PENALTY_COUNT_unk` | float | Penalties accumulated (cumulative) |
| `TWS_SGP_km_h_1` | float | True wind speed at the boat (km/h) |
| `TWD_SGP_deg` | float | True wind direction at the boat (degrees) |
| `LATITUDE_GPS_unk` | float | GPS latitude |
| `LONGITUDE_GPS_unk` | float | GPS longitude |
| `TIME_RACE_s` | float | Elapsed time since race start (seconds) |
| `TRK_LEG_NUM_unk` | float | Current leg number |
| `RATE_YAW_deg_s_1` | float | Yaw rate — used for maneuver detection |
| `TWA_SGP_deg` | float | True wind angle (0=head to wind, 180=downwind) |

### 4.4 Race Status Values

| Value | Meaning |
|---|---|
| 0 | No state |
| 1 | Pre-start |
| 2 | **Racing** — use this phase for scoring calculations |
| 3 | **Finished** — use this to get final rank |
| 4 | DNS |
| 5 | DNF |
| 6 | DSQ |
| 7 | OCS |
| 8 | DNC |

### 4.5 Loading Pattern

```python
import pandas as pd
from pathlib import Path

def load_boat(event: str, race_label: str, team: str) -> pd.DataFrame:
    path = DATA_ROOT / event / "boats" / race_label / f"{team}.csv"
    return pd.read_csv(path, parse_dates=["DATETIME"], index_col="DATETIME")

def load_all_boats(event: str, race_label: str) -> dict[str, pd.DataFrame]:
    race_dir = DATA_ROOT / event / "boats" / race_label
    return {
        f.stem: pd.read_csv(f, parse_dates=["DATETIME"], index_col="DATETIME")
        for f in race_dir.glob("*.csv")
    }

def load_metadata(event: str) -> pd.DataFrame:
    return pd.read_csv(metadata_file(event))
```

---

## 5. Scoring Engine

File: `backend/app/scoring_engine.py`

### 5.1 Overview

The scoring engine takes a race's boat telemetry and returns fantasy points per team broken down by category. All calculations use the **racing phase only** (`TRK_BOAT_RACE_STATUS_unk == 2`), except final rank which uses the last row where status == 3.

### 5.2 Scoring Categories and Formulas

#### Category 1: Finishing Position (max 50 pts)

```python
POSITION_POINTS = {1: 50, 2: 40, 3: 30, 4: 20, 5: 15,
                   6: 10, 7: 7, 8: 5, 9: 3, 10: 2, 11: 1, 12: 1}

def score_finishing_position(df: pd.DataFrame) -> int:
    finished = df[df["TRK_BOAT_RACE_STATUS_unk"] == 3]
    if len(finished) == 0:
        return 0  # DNF, OCS, DNS, DSQ, DNC all get 0
    final_rank = int(finished["TRK_RACE_RANK_unk"].iloc[-1])
    return POSITION_POINTS.get(final_rank, 0)
```

**DNF/OCS/DNS/DSQ/DNC rule:** Any boat that never reaches status 3 scores 0 finishing points. No exceptions.

#### Category 2: Wind-Normalized Speed (max 20 pts, awarded by rank within race)

Wind-normalized speed = `mean(BOAT_SPEED_km_h_1 during racing) / avg_tws_km_h`

This is a **relative** award: boats are ranked against each other within the same race, then points are awarded by rank. This ensures that all boats in a race have the same wind normalization denominator.

```python
SPEED_RANK_POINTS = {1: 20, 2: 15, 3: 10, 4: 7, 5: 5}
# Ranks 6 and below: 3 pts each

def score_speed(df: pd.DataFrame, avg_tws_km_h: float) -> float:
    racing = df[df["TRK_BOAT_RACE_STATUS_unk"] == 2]
    if len(racing) == 0 or avg_tws_km_h == 0:
        return 0.0
    return racing["BOAT_SPEED_km_h_1"].mean() / avg_tws_km_h

# In race-level computation: call score_speed for each team,
# sort descending, award SPEED_RANK_POINTS by rank.
```

#### Category 3: Overtakes (max 25 pts, capped at 5 overtakes)

An overtake = `TRK_RACE_RANK_unk` improves (decreases) by any amount between consecutive rows during the racing phase.

```python
def score_overtakes(df: pd.DataFrame) -> int:
    racing = df[df["TRK_BOAT_RACE_STATUS_unk"] == 2].copy()
    rank_diff = racing["TRK_RACE_RANK_unk"].diff()
    raw_overtakes = int((rank_diff < 0).sum())
    capped = min(raw_overtakes, 5)  # cap to prevent noise spikes
    return capped * 5  # 5 points per overtake
```

#### Category 4: Clean Sailing (max 15 pts)

Use the final value of `TRK_PENALTY_COUNT_unk` from the last row of data for that boat in that race.

```python
def score_clean_sailing(df: pd.DataFrame) -> int:
    final_penalties = int(df["TRK_PENALTY_COUNT_unk"].iloc[-1])
    if final_penalties == 0:
        return 15
    elif final_penalties == 1:
        return 5
    else:
        return 0
```

#### Category 5: VMG Consistency (max 15 pts, awarded by rank within race)

Lower standard deviation of `VMG_km_h_1` during racing = more consistent = better.

```python
def score_vmg_consistency(df: pd.DataFrame) -> float:
    racing = df[df["TRK_BOAT_RACE_STATUS_unk"] == 2]
    if len(racing) < 2:
        return 0.0
    return racing["VMG_km_h_1"].std()  # lower is better

# In race-level computation: call for each team, sort ascending (lower=better),
# award: rank 1-3 = 15 pts, rank 4-7 = 8 pts, rank 8+ = 0 pts
```

### 5.3 Total Score Per Boat

```
total_fantasy_points = position_pts + speed_pts + overtake_pts + clean_sailing_pts + vmg_pts
```

Maximum theoretical score: 50 + 20 + 25 + 15 + 15 = **125 points**

### 5.4 Main Scoring Function

```python
def score_race(event: str, race_label: str) -> pd.DataFrame:
    """
    Returns a DataFrame with columns:
    [team, position_pts, speed_pts, overtake_pts, clean_sailing_pts,
     vmg_pts, total_pts, final_rank, status]
    One row per team.
    """
    metadata = load_metadata(event)
    race_meta = metadata[metadata["race_label"] == race_label].iloc[0]
    avg_tws = race_meta["avg_tws_km_h"]

    boats = load_all_boats(event, race_label)
    results = []

    # Compute per-boat raw metrics
    speed_scores_raw = {}
    vmg_std_raw = {}

    for team, df in boats.items():
        speed_scores_raw[team] = score_speed(df, avg_tws)
        vmg_std_raw[team] = score_vmg_consistency(df)

    # Rank-based awards within race
    speed_ranked = sorted(speed_scores_raw.items(), key=lambda x: x[1], reverse=True)
    vmg_ranked = sorted(vmg_std_raw.items(), key=lambda x: x[1])  # ascending

    speed_pts_map = {}
    for i, (team, _) in enumerate(speed_ranked):
        speed_pts_map[team] = SPEED_RANK_POINTS.get(i + 1, 3)

    vmg_pts_map = {}
    for i, (team, _) in enumerate(vmg_ranked):
        if i < 3:
            vmg_pts_map[team] = 15
        elif i < 7:
            vmg_pts_map[team] = 8
        else:
            vmg_pts_map[team] = 0

    for team, df in boats.items():
        pos_pts = score_finishing_position(df)
        spd_pts = speed_pts_map[team]
        ovt_pts = score_overtakes(df)
        cln_pts = score_clean_sailing(df)
        vmg_pts = vmg_pts_map[team]
        total = pos_pts + spd_pts + ovt_pts + cln_pts + vmg_pts

        finished = df[df["TRK_BOAT_RACE_STATUS_unk"] == 3]
        final_rank = int(finished["TRK_RACE_RANK_unk"].iloc[-1]) if len(finished) > 0 else None
        final_status = int(df["TRK_BOAT_RACE_STATUS_unk"].iloc[-1])

        results.append({
            "team": team,
            "position_pts": pos_pts,
            "speed_pts": spd_pts,
            "overtake_pts": ovt_pts,
            "clean_sailing_pts": cln_pts,
            "vmg_pts": vmg_pts,
            "total_pts": total,
            "final_rank": final_rank,
            "status": final_status,
        })

    return pd.DataFrame(results).sort_values("total_pts", ascending=False)
```

---

## 6. ML Optimizer

File: `backend/app/optimizer.py`  
Training script: `backend/train_model.py`  
Serialized model: `models/optimizer.pkl`

### 6.1 Problem Framing

**Task:** Regression — predict the expected fantasy points a team will score, given wind conditions.  
**At inference time:** Given wind conditions for an upcoming race, predict score for each team, rank by predicted score, recommend top 3.

### 6.2 Training Data Construction

Build one row per (team, race) from Halifax:
- `team` — team identifier (one-hot encoded or label encoded)
- `avg_tws_km_h` — from `race_metadata.csv`
- `avg_twd_deg` — from `race_metadata.csv`
- `fantasy_points` — computed by `score_race()` for that boat in that race (the target)

```python
def build_training_data(event: str) -> pd.DataFrame:
    metadata = load_metadata(event)
    rows = []
    for _, race in metadata.iterrows():
        race_label = race["race_label"]
        scores_df = score_race(event, race_label)
        for _, row in scores_df.iterrows():
            rows.append({
                "team": row["team"],
                "avg_tws_km_h": race["avg_tws_km_h"],
                "avg_twd_deg": race["avg_twd_deg"],
                "fantasy_points": row["total_pts"],
            })
    return pd.DataFrame(rows)
```

**Expected output:** ~60 rows for Halifax (6 races × ~10 teams), ~96 rows for Bermuda.

### 6.3 Model Choice and Rationale

**Primary model:** Ridge Regression with one-hot encoded team feature.  
**Alternative:** XGBoost Regressor (try if Ridge performs poorly).  

Rationale: Only 60 training rows. Logistic Regression / Ridge avoids overfitting. If XGBoost is used, limit depth to 3 and use 50-100 estimators max.

**Important:** `team` identity MUST be a feature — without it, every boat in the same race has identical inputs (same wind for all boats in same race).

### 6.4 Feature Engineering

```python
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import joblib

def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer([
        ("team_ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["team"]),
        ("wind_scaler", StandardScaler(), ["avg_tws_km_h", "avg_twd_deg"]),
    ])
    return Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", Ridge(alpha=1.0)),
    ])
```

**Note on `avg_twd_deg`:** Wind direction is circular (359° and 1° are close). Add sine/cosine transformation:

```python
df["twd_sin"] = np.sin(np.radians(df["avg_twd_deg"]))
df["twd_cos"] = np.cos(np.radians(df["avg_twd_deg"]))
# Use twd_sin and twd_cos as features instead of raw avg_twd_deg
```

### 6.5 Training and Validation

```python
def train_optimizer():
    # Build training data from Halifax
    train_df = build_training_data("Halifax")
    train_df["twd_sin"] = np.sin(np.radians(train_df["avg_twd_deg"]))
    train_df["twd_cos"] = np.cos(np.radians(train_df["avg_twd_deg"]))

    features = ["team", "avg_tws_km_h", "twd_sin", "twd_cos"]
    X_train = train_df[features]
    y_train = train_df["fantasy_points"]

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    # Validate on Bermuda
    test_df = build_training_data("Bermuda")
    test_df["twd_sin"] = np.sin(np.radians(test_df["avg_twd_deg"]))
    test_df["twd_cos"] = np.cos(np.radians(test_df["avg_twd_deg"]))

    X_test = test_df[features]
    y_test = test_df["fantasy_points"]
    y_pred = pipeline.predict(X_test)

    # Evaluation: rank accuracy (did the top-3 predicted match top-3 actual?)
    # Report RMSE and top-3 hit rate per race
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    print(f"Bermuda test RMSE: {rmse:.1f} pts")

    joblib.dump(pipeline, "models/optimizer.pkl")
    return pipeline
```

### 6.6 Inference

```python
def recommend_teams(avg_tws_km_h: float, avg_twd_deg: float,
                    available_teams: list[str], top_n: int = 3) -> list[dict]:
    """
    Returns top_n teams ranked by predicted fantasy points.
    Each dict: {team, predicted_score}
    """
    pipeline = joblib.load("models/optimizer.pkl")
    rows = [{
        "team": t,
        "avg_tws_km_h": avg_tws_km_h,
        "twd_sin": np.sin(np.radians(avg_twd_deg)),
        "twd_cos": np.cos(np.radians(avg_twd_deg)),
    } for t in available_teams]
    df = pd.DataFrame(rows)
    df["predicted_score"] = pipeline.predict(df[["team", "avg_tws_km_h", "twd_sin", "twd_cos"]])
    return (
        df[["team", "predicted_score"]]
        .sort_values("predicted_score", ascending=False)
        .head(top_n)
        .to_dict(orient="records")
    )
```

---

## 7. Backend API (FastAPI)

File: `backend/app/main.py`

### 7.1 CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 7.2 Endpoints

#### GET /api/races

Returns all races from both events with wind metadata.

**Response:**
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
  },
  ...
]
```

---

#### GET /api/races/{event}/{race_label}/recommend

Returns ML optimizer's team recommendations for this race's wind conditions.

**Response:**
```json
{
  "race_label": "Race_1",
  "event": "Halifax",
  "avg_tws_km_h": 25.9,
  "avg_twd_deg": 147.3,
  "recommendations": [
    {"team": "AUS", "predicted_score": 87.3},
    {"team": "GBR", "predicted_score": 82.1},
    {"team": "NZL", "predicted_score": 75.6}
  ]
}
```

---

#### POST /api/score

Computes fantasy scores for a specific race. Returns full leaderboard + breakdown for user's selected teams.

**Request:**
```json
{
  "event": "Halifax",
  "race_label": "Race_1",
  "user_teams": ["AUS", "GBR", "CAN"]
}
```

**Response:**
```json
{
  "event": "Halifax",
  "race_label": "Race_1",
  "user_teams": ["AUS", "GBR", "CAN"],
  "user_total_score": 287,
  "leaderboard": [
    {
      "team": "AUS",
      "total_pts": 105,
      "position_pts": 50,
      "speed_pts": 20,
      "overtake_pts": 15,
      "clean_sailing_pts": 15,
      "vmg_pts": 5,
      "final_rank": 1,
      "is_user_pick": true
    },
    ...
  ]
}
```

`user_total_score` = sum of `total_pts` for teams in `user_teams`.

---

#### GET /api/races/{event}/{race_label}/leaderboard

Returns pre-computed leaderboard for a race (uses SQLite cache if available, otherwise computes).

**Response:** Same shape as the `leaderboard` array in the `/api/score` response.

---

#### GET /api/optimizer/performance

Returns model performance across all Halifax races (predicted top-3 vs actual top-3).

**Response:**
```json
{
  "training_event": "Halifax",
  "test_event": "Bermuda",
  "bermuda_rmse": 14.2,
  "races": [
    {
      "event": "Halifax",
      "race_label": "Race_1",
      "predicted_top3": ["AUS", "GBR", "NZL"],
      "actual_top3": ["AUS", "NZL", "GBR"],
      "hits": 3
    },
    ...
  ]
}
```

---

### 7.3 SQLite Cache (database.py)

```python
import sqlite3
from pathlib import Path

DB_PATH = Path("fantasy_scores.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS race_scores (
            event TEXT,
            race_label TEXT,
            team TEXT,
            total_pts INTEGER,
            position_pts INTEGER,
            speed_pts INTEGER,
            overtake_pts INTEGER,
            clean_sailing_pts INTEGER,
            vmg_pts INTEGER,
            final_rank INTEGER,
            status INTEGER,
            PRIMARY KEY (event, race_label, team)
        )
    """)
    conn.commit()
    conn.close()

def get_cached_scores(event: str, race_label: str) -> list[dict] | None:
    """Returns None if not cached yet."""
    ...

def cache_scores(event: str, race_label: str, scores: list[dict]):
    ...
```

---

## 8. Frontend (React)

### 8.1 Screen Flow

```
RaceSelector → OptimizerPanel → TeamBuilder → RaceScoring → Leaderboard
```

All screens exist on a single page (no routing required for demo). Use React state to track current step.

### 8.2 Component Descriptions

#### RaceSelector

- Dropdown or card grid listing all races from `/api/races`
- Show event name, race number, wind speed (km/h), wind direction (degrees)
- User selects one race to continue
- State: `selectedRace` (full race object)

#### OptimizerPanel

- Shown after race selected
- Displays wind conditions: speed + direction (use a compass/arrow graphic if possible)
- Shows ML recommendations from `/api/races/{event}/{race_label}/recommend`
- Format: ranked list with predicted scores (e.g., "1. Australia — Predicted: 87 pts")
- "Build your team →" button advances to TeamBuilder

#### TeamBuilder

- Shows all available teams for this race as selectable cards
- User selects up to 3 teams (enforce hard cap — disable others after 3 selected)
- Highlight optimizer's recommended teams visually (e.g., star icon or green border)
- Shows user's current selection count (e.g., "2 / 3 teams selected")
- "Run Race →" button calls `/api/score` and advances to RaceScoring

#### RaceScoring

- Displays the scoring breakdown for user's selected teams only
- One card per team showing: total score, and each category (position, speed, overtakes, clean sailing, VMG)
- Use icons or colour-coding for each category
- Show final race position for each team
- "View Leaderboard →" button advances to Leaderboard

#### Leaderboard

- Full leaderboard from `/api/score` response, all teams ranked by total_pts
- Highlight user's selected teams (bold row, coloured background)
- Show user's combined score prominently at top: "Your team scored 287 pts"
- Show optimizer's recommended teams highlighted differently (e.g., dashed border)
- "Try Another Race →" button resets to RaceSelector

### 8.3 API Client (api.js)

```javascript
const API_BASE = "http://localhost:8000/api";

export const fetchRaces = () =>
  fetch(`${API_BASE}/races`).then(r => r.json());

export const fetchRecommendations = (event, raceLabel) =>
  fetch(`${API_BASE}/races/${event}/${raceLabel}/recommend`).then(r => r.json());

export const fetchScore = (event, raceLabel, userTeams) =>
  fetch(`${API_BASE}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, race_label: raceLabel, user_teams: userTeams }),
  }).then(r => r.json());

export const fetchOptimizerPerformance = () =>
  fetch(`${API_BASE}/optimizer/performance`).then(r => r.json());
```

---

## 9. Build Order (5-Day Plan)

### Day 1 — Scoring Engine + Data Layer
- [ ] Implement `data_loader.py` (load metadata + all boats for a race)
- [ ] Implement all 5 scoring functions in `scoring_engine.py`
- [ ] Run `score_race("Halifax", "Race_1")` and inspect output — verify numbers make sense
- [ ] Run scoring engine on all 6 Halifax races and all 8 Bermuda races
- [ ] FastAPI skeleton: single `/api/score` endpoint returning real scores

**Day 1 done criteria:** CLI call returns a ranked leaderboard for Halifax Race_1 with plausible point values.

### Day 2 — ML Optimizer
- [ ] Implement `build_training_data()` — creates 60-row Halifax DataFrame
- [ ] Implement and train Ridge Regression pipeline with OHE team + scaled wind
- [ ] Evaluate on Bermuda: compute RMSE, compute top-3 hit rate per race
- [ ] Serialize to `models/optimizer.pkl`
- [ ] Add `/api/races/{event}/{race_label}/recommend` endpoint
- [ ] Find and document the one key data insight (see Section 10)

**Day 2 done criteria:** Model recommends top 3 teams for a given wind condition, validated on Bermuda.

### Day 3 — Backend Complete + React Scaffold
- [ ] Complete all FastAPI endpoints
- [ ] Add SQLite caching (`database.py`) — pre-compute and cache all race scores
- [ ] Scaffold React app with Tailwind
- [ ] Implement `RaceSelector` and `OptimizerPanel` — working end-to-end
- [ ] Implement `TeamBuilder` with 3-team limit

**Day 3 done criteria:** User can select a race, see optimizer recommendation, pick 3 teams.

### Day 4 — Full UI + Race Replay
- [ ] Implement `RaceScoring` and `Leaderboard` components
- [ ] Test full loop: select race → pick teams → see leaderboard
- [ ] Add animated race replay (stretch goal): boats moving on GPS map using Leaflet.js
  - Plot `LATITUDE_GPS_unk` / `LONGITUDE_GPS_unk` per team over time
  - Use `requestAnimationFrame` or 1-second interval to step through data
- [ ] Surface the one key data insight in the UI

### Day 5 — Polish + Video
- [ ] Test full demo on all 6 Halifax races
- [ ] Test full demo on 2-3 Bermuda races
- [ ] Fix any edge cases (teams with DNF, races with fewer boats)
- [ ] Record 3-minute video following demo script (Section 12)
- [ ] Submit

---

## 10. The One Key Data Insight

Every team member must tell the same story when a judge asks "what did you actually learn?"

**Run this analysis on Day 2:**

For each Halifax race, compute:
- Each team's VMG std dev (consistency) during racing phase
- Each team's mean wind-normalized speed
- Correlation of each metric with final fantasy score

**Expected hypothesis to test:**
> VMG consistency (low std dev) correlates more strongly with high fantasy scores than peak speed does.

If confirmed, the narrative is:
> "Across Halifax races, consistent VMG predicted fantasy scores better than peak boat speed. Consistency beats flashes of brilliance — and our optimizer reflects this."

If the hypothesis is wrong, report what actually does predict performance best. Do not cherry-pick.

---

## 11. Demo Script (3 Minutes)

| Time | Content |
|---|---|
| 0:00–0:20 | Problem: SailGP has no fan engagement layer. Fantasy football has 45M players. Fantasy sailing has zero. |
| 0:20–0:40 | Show race selector: "We're looking at Halifax Race 1. Wind is 25.9 km/h from 147°." |
| 0:40–1:10 | Show optimizer panel: "Our model recommends Australia, Great Britain, and New Zealand for these conditions." |
| 1:10–1:30 | Show team builder: user picks 3 teams (use optimizer's recommendation) |
| 1:30–1:50 | Run scoring: show points tick up per category. Animated replay if ready. |
| 1:50–2:20 | Show leaderboard. "The model was right — here's how it performed across all 6 Halifax races." Show optimizer performance table. |
| 2:20–2:50 | Data insight: "What we found in the data: consistency beats brilliance." |
| 2:50–3:00 | Business case: sponsorable categories, broadcaster integration, fan growth. Close. |

**Opening line:**
> "Fantasy football has 45 million players. Fantasy sailing has zero. We're changing that — scored automatically from real SailGP telemetry, with a model that tells you who to pick before the race starts."

**Do not cherry-pick races.** Show the model's track record across all Halifax races. A 4-out-of-6 result shown honestly is more credible than a cherry-picked win.

---

## 12. Judge Defense Prep

**Q (Tim Hornsby): "Why do you score overtakes? Gate selection matters more in SailGP."**
A: We score rank improvements as a proxy for aggressive racing and comeback ability. We acknowledge gate selection is tactically important — a future version would score gate choice explicitly using mark data.

**Q (Tim Hornsby): "Your speed scoring — is it wind-normalized?"**
A: Yes — we normalize `BOAT_SPEED_km_h_1` by the race's `avg_tws_km_h`. The same boat speed in 30 knots vs 15 knots is scored differently.

**Q (Tim Hornsby): "How did you handle DNFs?"**
A: Any boat that does not reach status 3 (Finished) receives zero finishing position points. The scoring engine checks for status == 3 before awarding position points.

**Q (Dr. Siegel): "How many training data points does your model have?"**
A: 60 rows — 6 races × 10 teams from Halifax. We acknowledge this is a small training set. We used Ridge Regression specifically because it is well-suited for low-data regimes. The model scales with more race data from future events.

**Q (Dr. Siegel): "How did you validate the model?"**
A: We trained on Halifax 2024 and tested on Bermuda 2026 — a genuine out-of-sample test, different city, two years later. We report RMSE and the top-3 team hit rate per race across all Bermuda races.

**Q: "What's the business model?"**
A: Sponsorable scoring categories (e.g., "The Red Bull Speed Award"), broadcaster integration, fan engagement for growing SailGP's audience from hardcore sailing fans to casual sports fans.

---

## 13. Key Constraints and Edge Cases

| Case | Rule |
|---|---|
| Team DNF/OCS/DSQ | Status != 3 at race end → 0 finishing pts, still scored on other categories |
| Race with fewer than 10 boats | Speed and VMG rank tiers still apply — just fewer boats compete for them |
| Team not in Bermuda but in Halifax (NZL) | Optimizer handles via `handle_unknown="ignore"` in OHE — NZL gets a neutral prediction in Bermuda context |
| Wind direction circularity | Use `sin(twd)` and `cos(twd)` as features, not raw degrees |
| Penalty count ambiguity | `TRK_PENALTY_COUNT_unk` is cumulative — use the last value in the boat's row data |
| Halifax Race_4 only has 7 boats | Normal — just rank among those 7 boats |

---

## 14. Requirements Files

### backend/requirements.txt
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
pandas==2.2.2
numpy==1.26.4
scikit-learn==1.5.0
joblib==1.4.2
pydantic==2.7.1
```

### frontend/package.json (key deps)
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

---

## 15. Running the Project

```bash
# Backend
cd backend
pip install -r requirements.txt
python train_model.py          # trains optimizer, saves models/optimizer.pkl
uvicorn app.main:app --reload  # runs on http://localhost:8000

# Frontend
cd frontend
npm install
npm run dev                    # runs on http://localhost:3000
```

---

*Last updated: 2026-06-06*  
*Decisions: Scoring system from PROJECT_CONTEXT (wind-normalized speed, VMG consistency, overtakes, penalties, position). ML from PROJECT_CONTEXT (Ridge Regression primary, XGBoost alternative). Tech stack from README (React + FastAPI + SQLite). SQLite is cache only — CSVs are source of truth.*
