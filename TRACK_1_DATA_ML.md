<!--
=======================================================================
HOW TO USE THIS FILE
=======================================================================
This is your personal build guide for Track 1 of the SailGP Fantasy
Predictor hackathon project.

TO GET STARTED:
  1. Open a new chat with Claude (claude.ai) or any AI assistant
  2. Upload this file OR paste its full contents as your first message
  3. The AI will introduce itself, check your setup, and guide you
     through building your part step by step

You do not need to read this file in detail beforehand.
The AI will walk you through it.
=======================================================================
-->

---

> ## AI ASSISTANT — READ THIS ENTIRE BLOCK BEFORE RESPONDING
>
> You have been given the Track 1 build guide for the **SailGP Fantasy Predictor**, a hackathon project built by a team of 3 working in parallel. Your job is to act as a dedicated coding assistant for this developer's specific track: **Data Pipeline, Scoring Engine, and ML Optimizer**.
>
> Follow these steps **exactly and in order** before writing any code.
>
> ---
>
> ### STEP 1 — INTRODUCE YOURSELF
>
> Send this message (adapt the wording naturally):
>
> > "Hi! I'm your coding assistant for **Track 1 — Data & ML**. My job is to help you build the scoring engine and ML optimizer that power the whole project. Before we write a single line of code, I need to check your environment and dependencies — this saves us debugging time later. I'll ask a few quick questions."
>
> ---
>
> ### STEP 2 — DEPENDENCY CHECKS (ask ONE at a time, wait for each answer)
>
> Ask these questions in this exact order. Do not ask the next until you have an answer to the current one.
>
> **Question 1 — Python version:**
> > "First: run `python --version` in your terminal and paste the output here. We need Python 3.11 or higher."
>
> - If Python < 3.11: say "You'll need to upgrade to Python 3.11+. The easiest way is via pyenv (Mac/Linux) or the official installer at python.org. Come back once that's done."
> - If Python 3.11+: say "Perfect."
>
> **Question 2 — Working directory and data files:**
> > "Now run this command and paste what you see:
> > - Windows: `dir DataChallenge_Export`
> > - Mac/Linux: `ls DataChallenge_Export`"
>
> - If you see `Halifax` and `Bermuda` folders: say "Data confirmed."
> - If the command errors: say "You're likely not in the right directory. You should be running commands from inside the `FantasySailGP/` project folder. Run `cd path/to/FantasySailGP` first, then retry."
> - If the folder exists but looks empty or wrong: say "Something's off with the data. Can you also run `dir DataChallenge_Export\Halifax\boats\Race_1` (Windows) or `ls DataChallenge_Export/Halifax/boats/Race_1` (Mac/Linux) and paste the output?"
>
> **Question 3 — Teammate sync:**
> > "Quick team check: has the person on Track 2 (Backend API) started yet? You need to share two function signatures with them by end of Day 1 — they're listed in this file and I'll remind you when we get there. Just a yes/no is fine."
>
> - If yes: say "Good. I'll remind you at the right moment."
> - If no/unsure: say "No problem — just make sure to ping them once we finish Step 1 today."
>
> **Question 4 — Packages:**
> > "Last check: do you have `pandas`, `numpy`, `scikit-learn`, and `joblib` installed? Run `pip list | grep -E 'pandas|numpy|scikit|joblib'` (Mac/Linux) or `pip list | findstr /I "pandas numpy scikit joblib"` (Windows) and paste the output."
>
> - If all installed: say "Great, no installs needed."
> - If missing: say "Run `pip install pandas numpy scikit-learn joblib` and confirm it completes without errors."
>
> ---
>
> ### STEP 3 — ASSESS AND CONFIRM
>
> Once all 4 questions are answered and any blockers resolved, say:
>
> > "All clear. Here's what we're building today and the order we'll do it:
> >
> > 1. `data_loader.py` — CSV loading helpers (everything imports from this)
> > 2. `scoring_engine.py` — the 5 fantasy scoring functions + the main `score_race()` function
> > 3. `optimizer.py` + `train_model.py` — the ML model that recommends teams
> > 4. Data insight analysis — one correlation check to find the key story for judges
> >
> > We'll go one file at a time. I'll give you the code, tell you what to run to test it, and wait for you to confirm it works before we move on. Ready to start?"
>
> ---
>
> ### STEP 4 — WORKING STYLE (follow this throughout the session)
>
> - **One file at a time.** Complete and test each file before starting the next.
> - **After each file**, give the exact test command to run and say: *"Run that and paste the output. If it looks right, say 'next' and we'll move on."*
> - **If a test fails**, diagnose from the error output before suggesting fixes. Do not rewrite the whole file — fix the specific issue.
> - **At the end of Step 1 (data_loader.py)**, remind the user: *"Now is a good time to share these two function signatures with your Track 2 teammate so they can write stubs — I'll show you what to send them."*
> - **Never dump all files at once.** The user will get lost. Pace it.
> - **If the user goes off-script** (asks about frontend, asks to skip a step, etc.), answer briefly and redirect: *"Let's keep focused on Track 1 — [next step] is what unblocks the rest of the team."*

---

# Track 1 — Data Pipeline, Scoring Engine & ML Optimizer

> **Your role:** You own all Python data science. You touch no web code. Your deliverables are two importable functions that Track 2 wires into the API. Everything else in the project depends on your work being correct, so start here on Day 1.

---

## What You Own

```
backend/
  app/
    data_loader.py       ← CSV loading helpers
    scoring_engine.py    ← fantasy points from telemetry
    optimizer.py         ← ML model: train + predict
  train_model.py         ← one-time training script
models/
  optimizer.pkl          ← serialized trained model
```

You do NOT touch: `main.py`, `models.py`, `database.py`, anything in `frontend/`.

---

## The Two Functions You Must Deliver

These are the interfaces Track 2 will call. Lock these signatures by end of Day 1 even if the internals are incomplete.

```python
# scoring_engine.py
def score_race(event: str, race_label: str) -> pd.DataFrame:
    """
    Returns one row per team with columns:
    team, position_pts, speed_pts, overtake_pts, clean_sailing_pts,
    vmg_pts, total_pts, final_rank, status
    Sorted by total_pts descending.
    """

# optimizer.py
def recommend_teams(
    avg_tws_km_h: float,
    avg_twd_deg: float,
    available_teams: list[str],
    top_n: int = 3
) -> list[dict]:
    """
    Returns top_n dicts: [{"team": "AUS", "predicted_score": 87.3}, ...]
    Sorted by predicted_score descending.
    """
```

Post these signatures in the team chat on Day 1 so Track 2 can write stubs against them immediately.

---

## Data Access

All data lives under `DataChallenge_Export/`. Do NOT move or copy files.

```
DataChallenge_Export/
  Halifax/
    boats/Race_1/AUS.csv   ← one per team per race
    boats/Race_1/GBR.csv
    ...
    marks/Race_1/marks.csv
    race_metadata.csv
  Bermuda/
    boats/Race_1/AUS.csv
    ...
    race_metadata.csv
```

### race_metadata.csv columns you need

| Column | Notes |
|---|---|
| `race_label` | Primary key: `Race_1`, `Race_2`, ... |
| `avg_tws_km_h` | Race-level average wind speed |
| `avg_twd_deg` | Race-level average wind direction |
| `num_boats` | Number of boats (varies — Race_4 Halifax has only 7) |
| `teams` | Comma-separated string: `"AUS, CAN, DEN, ..."` |

**Warning:** `race_number` is NaN for Halifax Race_1–3. Never use it as a key. Use `race_label` everywhere.

### boat CSV columns you need

| Column | Type | Use |
|---|---|---|
| `DATETIME` | datetime index | Parse with `parse_dates=["DATETIME"]` |
| `BOAT_SPEED_km_h_1` | float | Speed scoring |
| `VMG_km_h_1` | float | VMG consistency scoring |
| `TRK_RACE_RANK_unk` | float | Position + overtake detection |
| `TRK_BOAT_RACE_STATUS_unk` | float | Filter to racing phase (==2) or finished (==3) |
| `TRK_PENALTY_COUNT_unk` | float | Cumulative penalty count |
| `TWS_SGP_km_h_1` | float | Per-boat wind speed (not needed for scoring, but useful for analysis) |

### Race status values

| Value | Meaning |
|---|---|
| 1 | Pre-start |
| **2** | **Racing** — use this phase for all scoring calculations |
| **3** | **Finished** — use this to get final rank |
| 4 | DNS |
| 5 | DNF |
| 6 | DSQ |
| 7 | OCS |
| 8 | DNC |

---

## Step 1 — data_loader.py

Build this first. Everything else imports from it.

```python
from pathlib import Path
import pandas as pd

DATA_ROOT = Path(__file__).parent.parent.parent / "DataChallenge_Export"

def metadata_file(event: str) -> Path:
    return DATA_ROOT / event / "race_metadata.csv"

def load_metadata(event: str) -> pd.DataFrame:
    return pd.read_csv(metadata_file(event))

def load_boat(event: str, race_label: str, team: str) -> pd.DataFrame:
    path = DATA_ROOT / event / "boats" / race_label / f"{team}.csv"
    return pd.read_csv(path, parse_dates=["DATETIME"], index_col="DATETIME")

def load_all_boats(event: str, race_label: str) -> dict[str, pd.DataFrame]:
    race_dir = DATA_ROOT / event / "boats" / race_label
    return {
        f.stem: pd.read_csv(f, parse_dates=["DATETIME"], index_col="DATETIME")
        for f in sorted(race_dir.glob("*.csv"))
    }

def list_races(event: str) -> list[str]:
    meta = load_metadata(event)
    return meta["race_label"].tolist()
```

**Quick test:** Run this in a Python shell and confirm `load_metadata("Halifax")` returns 6 rows and `load_all_boats("Halifax", "Race_1")` returns 10 DataFrames.

---

## Step 2 — scoring_engine.py

### Scoring overview

| Category | Max pts | Method |
|---|---|---|
| Finishing position | 50 | Fixed table by final rank |
| Wind-normalized speed | 20 | Ranked within race |
| Overtakes | 25 | 5 pts each, capped at 5 |
| Clean sailing | 15 | Based on final penalty count |
| VMG consistency | 15 | Ranked within race (lower std = better) |
| **Total max** | **125** | |

All calculations use **status == 2 (racing phase only)**, except finishing position which uses status == 3.

### Category 1 — Finishing Position

```python
POSITION_POINTS = {1: 50, 2: 40, 3: 30, 4: 20, 5: 15,
                   6: 10, 7: 7,  8: 5,  9: 3, 10: 2, 11: 1, 12: 1}

def score_finishing_position(df: pd.DataFrame) -> int:
    finished = df[df["TRK_BOAT_RACE_STATUS_unk"] == 3]
    if len(finished) == 0:
        return 0  # DNF, OCS, DSQ, DNS, DNC — all get 0, no exceptions
    final_rank = int(finished["TRK_RACE_RANK_unk"].iloc[-1])
    return POSITION_POINTS.get(final_rank, 0)
```

### Category 2 — Wind-Normalized Speed (raw metric, ranked at race level)

```python
SPEED_RANK_POINTS = {1: 20, 2: 15, 3: 10, 4: 7, 5: 5}
# rank 6 and below → 3 pts each

def _raw_speed_score(df: pd.DataFrame, avg_tws_km_h: float) -> float:
    """Returns normalized score. Ranked against other boats in score_race()."""
    racing = df[df["TRK_BOAT_RACE_STATUS_unk"] == 2]
    if len(racing) == 0 or avg_tws_km_h == 0:
        return 0.0
    return racing["BOAT_SPEED_km_h_1"].mean() / avg_tws_km_h
```

### Category 3 — Overtakes

```python
def score_overtakes(df: pd.DataFrame) -> int:
    racing = df[df["TRK_BOAT_RACE_STATUS_unk"] == 2].copy()
    rank_diff = racing["TRK_RACE_RANK_unk"].diff()
    raw_overtakes = int((rank_diff < 0).sum())
    return min(raw_overtakes, 5) * 5  # 5 pts each, capped at 5 overtakes
```

### Category 4 — Clean Sailing

```python
def score_clean_sailing(df: pd.DataFrame) -> int:
    # TRK_PENALTY_COUNT_unk is cumulative — use the last value
    final_penalties = int(df["TRK_PENALTY_COUNT_unk"].iloc[-1])
    if final_penalties == 0:
        return 15
    elif final_penalties == 1:
        return 5
    return 0
```

### Category 5 — VMG Consistency (raw metric, ranked at race level)

```python
def _raw_vmg_std(df: pd.DataFrame) -> float:
    """Returns std dev. Lower is better. Ranked against other boats in score_race()."""
    racing = df[df["TRK_BOAT_RACE_STATUS_unk"] == 2]
    if len(racing) < 2:
        return float("inf")
    return racing["VMG_km_h_1"].std()
```

### Main Function — score_race()

```python
import pandas as pd
from data_loader import load_metadata, load_all_boats

def score_race(event: str, race_label: str) -> pd.DataFrame:
    metadata = load_metadata(event)
    race_meta = metadata[metadata["race_label"] == race_label].iloc[0]
    avg_tws = float(race_meta["avg_tws_km_h"])

    boats = load_all_boats(event, race_label)

    # First pass: compute raw rank-dependent metrics
    speed_raw = {team: _raw_speed_score(df, avg_tws) for team, df in boats.items()}
    vmg_raw   = {team: _raw_vmg_std(df) for team, df in boats.items()}

    # Rank within race and assign points
    speed_pts_map = {}
    for rank, (team, _) in enumerate(
            sorted(speed_raw.items(), key=lambda x: x[1], reverse=True), start=1):
        speed_pts_map[team] = SPEED_RANK_POINTS.get(rank, 3)

    vmg_pts_map = {}
    for rank, (team, _) in enumerate(
            sorted(vmg_raw.items(), key=lambda x: x[1]), start=1):  # ascending
        if rank <= 3:
            vmg_pts_map[team] = 15
        elif rank <= 7:
            vmg_pts_map[team] = 8
        else:
            vmg_pts_map[team] = 0

    # Second pass: build results
    results = []
    for team, df in boats.items():
        pos_pts = score_finishing_position(df)
        spd_pts = speed_pts_map[team]
        ovt_pts = score_overtakes(df)
        cln_pts = score_clean_sailing(df)
        vmg_pts = vmg_pts_map[team]

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
            "total_pts": pos_pts + spd_pts + ovt_pts + cln_pts + vmg_pts,
            "final_rank": final_rank,
            "status": final_status,
        })

    return pd.DataFrame(results).sort_values("total_pts", ascending=False).reset_index(drop=True)
```

### Smoke test

Run this after building `score_race`:

```python
from scoring_engine import score_race
df = score_race("Halifax", "Race_1")
print(df[["team", "total_pts", "final_rank"]].to_string())
assert df["total_pts"].max() <= 125
assert len(df) == 10
```

---

## Step 3 — optimizer.py + train_model.py

### Build the training dataset

```python
import numpy as np
import pandas as pd
from data_loader import load_metadata
from scoring_engine import score_race

def build_training_data(event: str) -> pd.DataFrame:
    metadata = load_metadata(event)
    rows = []
    for _, race in metadata.iterrows():
        race_label = race["race_label"]
        scores_df = score_race(event, race_label)
        for _, row in scores_df.iterrows():
            rows.append({
                "team": row["team"],
                "avg_tws_km_h": float(race["avg_tws_km_h"]),
                "twd_sin": np.sin(np.radians(float(race["avg_twd_deg"]))),
                "twd_cos": np.cos(np.radians(float(race["avg_twd_deg"]))),
                "fantasy_points": float(row["total_pts"]),
            })
    return pd.DataFrame(rows)
```

**Why sin/cos for wind direction?** Wind direction is circular — 359° and 1° are 2° apart, but raw numeric encoding treats them as 358 apart. The sin/cos decomposition fixes this.

### Build the model pipeline

```python
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

FEATURES = ["team", "avg_tws_km_h", "twd_sin", "twd_cos"]
MODEL_PATH = Path(__file__).parent.parent.parent / "models" / "optimizer.pkl"

def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer([
        ("team_ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["team"]),
        ("wind_scaler", StandardScaler(), ["avg_tws_km_h", "twd_sin", "twd_cos"]),
    ])
    return Pipeline([("preprocessor", preprocessor), ("regressor", Ridge(alpha=1.0))])
```

### train_model.py (run once)

```python
import numpy as np
import joblib
from sklearn.metrics import mean_squared_error
from app.optimizer import build_pipeline, build_training_data, FEATURES, MODEL_PATH

# Train on Halifax
train_df = build_training_data("Halifax")
pipeline = build_pipeline()
pipeline.fit(train_df[FEATURES], train_df["fantasy_points"])

# Evaluate on Bermuda (out-of-sample test)
test_df = build_training_data("Bermuda")
y_pred = pipeline.predict(test_df[FEATURES])
rmse = np.sqrt(mean_squared_error(test_df["fantasy_points"], y_pred))
print(f"Bermuda RMSE: {rmse:.1f} pts")

# Top-3 hit rate per Bermuda race
from app.data_loader import load_metadata
bermuda_meta = load_metadata("Bermuda")
hits, total = 0, 0
for _, race in bermuda_meta.iterrows():
    race_label = race["race_label"]
    race_rows = test_df[test_df.index.isin(
        test_df.groupby("team").indices.keys()  # placeholder — filter by race
    )]
    # Compute per-race: actual top 3 vs predicted top 3
    # (implement the per-race groupby properly)

MODEL_PATH.parent.mkdir(exist_ok=True)
joblib.dump(pipeline, MODEL_PATH)
print(f"Model saved to {MODEL_PATH}")
```

### recommend_teams() — the inference function

```python
import joblib
import numpy as np
import pandas as pd

def recommend_teams(
    avg_tws_km_h: float,
    avg_twd_deg: float,
    available_teams: list[str],
    top_n: int = 3
) -> list[dict]:
    pipeline = joblib.load(MODEL_PATH)
    rows = [{
        "team": t,
        "avg_tws_km_h": avg_tws_km_h,
        "twd_sin": np.sin(np.radians(avg_twd_deg)),
        "twd_cos": np.cos(np.radians(avg_twd_deg)),
    } for t in available_teams]
    df = pd.DataFrame(rows)
    df["predicted_score"] = pipeline.predict(df[FEATURES])
    return (
        df[["team", "predicted_score"]]
        .sort_values("predicted_score", ascending=False)
        .head(top_n)
        .assign(predicted_score=lambda x: x["predicted_score"].round(1))
        .to_dict(orient="records")
    )
```

---

## Step 4 — The One Key Data Insight (Day 2)

Run this analysis and share the result with the whole team. Everyone tells the same story to judges.

```python
import pandas as pd
import numpy as np
from scoring_engine import score_race, _raw_vmg_std, _raw_speed_score
from data_loader import load_metadata, load_all_boats

rows = []
for race_label in ["Race_1", "Race_2", "Race_3", "Race_4", "Race_5", "Race_6"]:
    meta = load_metadata("Halifax")
    avg_tws = float(meta[meta["race_label"] == race_label]["avg_tws_km_h"].iloc[0])
    boats = load_all_boats("Halifax", race_label)
    scores = score_race("Halifax", race_label).set_index("team")
    for team, df in boats.items():
        rows.append({
            "race": race_label,
            "team": team,
            "vmg_std": _raw_vmg_std(df),
            "norm_speed": _raw_speed_score(df, avg_tws),
            "total_pts": float(scores.loc[team, "total_pts"]) if team in scores.index else 0,
        })

analysis = pd.DataFrame(rows)
print("Correlation with fantasy score:")
print(analysis[["vmg_std", "norm_speed", "total_pts"]].corr()["total_pts"])
```

**What to look for:** If `vmg_std` has a higher absolute correlation with `total_pts` than `norm_speed` does (note: vmg_std should be *negative* correlation since lower std = better), then the narrative is confirmed: "consistency beats brilliance." Report the actual numbers to the team.

---

## Day-by-Day Tasks

### Day 1
- [ ] Create `backend/app/__init__.py` (empty)
- [ ] Implement `data_loader.py` — all 4 functions
- [ ] Implement `scoring_engine.py` — all 5 scoring functions + `score_race()`
- [ ] Run smoke test on Halifax Race_1 — verify 10 rows, max 125 pts, plausible ranking
- [ ] Run `score_race()` on all 6 Halifax + 8 Bermuda races, print results, check for errors
- [ ] Share the `score_race()` function signature with Track 2 so they can write stubs

### Day 2
- [ ] Implement `optimizer.py` — `build_training_data()`, `build_pipeline()`, `recommend_teams()`
- [ ] Run `train_model.py` — serialize `models/optimizer.pkl`
- [ ] Print Bermuda RMSE and top-3 hit rate per race
- [ ] Run the data insight analysis and share findings with the team
- [ ] Share `recommend_teams()` signature with Track 2

### Day 3
- [ ] Hand off: confirm Track 2 can import `score_race` and `recommend_teams` without errors
- [ ] Help Track 2 debug any import or path issues
- [ ] If time: try XGBoost as an alternative model and compare RMSE

### Day 4
- [ ] Support Track 3 with GPS data for race replay (export per-race GPS as JSON if needed)
- [ ] Polish: add per-race performance logging

### Day 5
- [ ] Verify scoring numbers are consistent across all demo races
- [ ] Be ready to explain scoring formulas to judges in real time

---

## How to Run

```bash
cd backend
pip install pandas numpy scikit-learn joblib

# Test scoring engine
python -c "from app.scoring_engine import score_race; print(score_race('Halifax', 'Race_1'))"

# Train model (after scoring engine works)
python train_model.py
```
