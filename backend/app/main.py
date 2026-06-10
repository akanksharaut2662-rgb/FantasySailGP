"""
main.py
FastAPI entry point for SailGP Fantasy Predictor backend.
Run with: uvicorn app.main:app --reload   (from backend/ directory)
Docs:      http://localhost:8000/docs
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .data_loader import load_all_boats, load_metadata
from .database import get_or_compute_scores, init_db
from .models import (
    OptimizerPerformanceResponse,
    RaceInfo,
    RecommendResponse,
    ScoreRequest,
    ScoreResponse,
    TeamRecommendation,
    TeamScore,
)
from .optimizer import get_feature_importance, get_optimizer_performance, recommend_teams

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="SailGP Fantasy Predictor API",
    version="0.1.0",
    description="Fantasy scoring engine and ML optimizer for SailGP races.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:8080",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

EVENTS = ["Halifax", "Bermuda"]


@app.on_event("startup")
def startup() -> None:
    init_db()


# ---------------------------------------------------------------------------
# GET /api/races
# ---------------------------------------------------------------------------

@app.get("/api/races", response_model=list[RaceInfo])
def get_races():
    """Return all races from both events with wind metadata."""
    races = []
    for event in EVENTS:
        try:
            meta = load_metadata(event)
        except FileNotFoundError:
            continue
        for _, row in meta.iterrows():
            teams_raw = row.get("teams", "")
            teams = [t.strip() for t in str(teams_raw).split(",") if t.strip()]
            races.append(
                RaceInfo(
                    event=event,
                    race_label=row["race_label"],
                    avg_tws_km_h=float(row["avg_tws_km_h"]),
                    avg_twd_deg=float(row["avg_twd_deg"]),
                    num_boats=int(row.get("num_boats", len(teams))),
                    teams=teams,
                    race_start_utc=str(row.get("race_start_utc", "")),
                )
            )
    return races


# ---------------------------------------------------------------------------
# GET /api/races/{event}/{race_label}/recommend
# ---------------------------------------------------------------------------

@app.get("/api/races/{event}/{race_label}/recommend", response_model=RecommendResponse)
def get_recommendations(event: str, race_label: str):
    """Return ML optimizer's team recommendations for a race's wind conditions."""
    try:
        meta = load_metadata(event)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Event '{event}' not found.")

    rows = meta[meta["race_label"] == race_label]
    if rows.empty:
        raise HTTPException(status_code=404, detail=f"Race '{race_label}' not found in {event}.")

    race_meta = rows.iloc[0]
    avg_tws = float(race_meta["avg_tws_km_h"])
    avg_twd = float(race_meta["avg_twd_deg"])
    teams = [t.strip() for t in str(race_meta.get("teams", "")).split(",") if t.strip()]

    try:
        recs = recommend_teams(avg_tws, avg_twd, teams)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Model not trained yet. Run: cd backend && python train_model.py",
        )

    return RecommendResponse(
        race_label=race_label,
        event=event,
        avg_tws_km_h=avg_tws,
        avg_twd_deg=avg_twd,
        recommendations=[TeamRecommendation(**r) for r in recs],
    )


# ---------------------------------------------------------------------------
# POST /api/score
# ---------------------------------------------------------------------------

@app.post("/api/score", response_model=ScoreResponse)
def compute_score(req: ScoreRequest):
    """Compute fantasy scores for a race and highlight user's selected teams."""
    try:
        scores = get_or_compute_scores(req.event, req.race_label)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    user_set = set(req.user_teams)
    leaderboard = [
        TeamScore(**{**row, "is_user_pick": row["team"] in user_set})
        for row in scores
    ]
    user_total = sum(row["total_pts"] for row in scores if row["team"] in user_set)

    return ScoreResponse(
        event=req.event,
        race_label=req.race_label,
        user_teams=req.user_teams,
        user_total_score=user_total,
        leaderboard=leaderboard,
    )


# ---------------------------------------------------------------------------
# GET /api/races/{event}/{race_label}/leaderboard
# ---------------------------------------------------------------------------

@app.get("/api/races/{event}/{race_label}/leaderboard", response_model=list[TeamScore])
def get_leaderboard(event: str, race_label: str):
    """Return full race leaderboard (cached if available, else compute)."""
    try:
        scores = get_or_compute_scores(event, race_label)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return [TeamScore(**{**row, "is_user_pick": False}) for row in scores]


# ---------------------------------------------------------------------------
# GET /api/optimizer/performance
# ---------------------------------------------------------------------------

@app.get("/api/optimizer/performance", response_model=OptimizerPerformanceResponse)
def optimizer_performance():
    """Return optimizer performance across all races (predicted top-3 vs actual top-3)."""
    try:
        perf = get_optimizer_performance()
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Model not trained yet. Run: cd backend && python train_model.py",
        )
    return OptimizerPerformanceResponse(**perf)


# ---------------------------------------------------------------------------
# GET /api/races/{event}/{race_label}/gps  (Day 4 — animated race replay)
# ---------------------------------------------------------------------------

@app.get("/api/races/{event}/{race_label}/gps")
def get_gps(event: str, race_label: str):
    """
    Return GPS tracks for all boats in a race.
    Response shape: [{"team": "AUS", "lat": [...], "lon": [...], "time_s": [...]}]
    Only includes timestamps where status is 1 (pre-start), 2 (racing), or 3 (finished).
    """
    try:
        boats = load_all_boats(event, race_label)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"{event}/{race_label} not found.")

    result = []
    for team, df in boats.items():
        active = df[df["TRK_BOAT_RACE_STATUS_unk"].isin([1, 2, 3])]
        result.append({
            "team": team,
            "lat": active["LATITUDE_GPS_unk"].tolist() if "LATITUDE_GPS_unk" in active.columns else [],
            "lon": active["LONGITUDE_GPS_unk"].tolist() if "LONGITUDE_GPS_unk" in active.columns else [],
            "time_s": active["TIME_RACE_s"].tolist() if "TIME_RACE_s" in active.columns else [],
        })
    return result


# ---------------------------------------------------------------------------
# GET /api/optimizer/features
# ---------------------------------------------------------------------------

@app.get("/api/optimizer/features")
def optimizer_features():
    """Return Ridge model feature coefficients — team weights + wind weights."""
    try:
        return get_feature_importance()
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Model not trained yet. Run: cd backend && python train_model.py",
        )


# ---------------------------------------------------------------------------
# GET /api/team-values
# ---------------------------------------------------------------------------

@app.get("/api/team-values")
def get_team_values():
    """Return market values for all teams based on historical performance."""
    team_stats: dict[str, dict] = {}

    for event in EVENTS:
        try:
            meta = load_metadata(event)
        except FileNotFoundError:
            continue
        for _, row in meta.iterrows():
            race_label = row["race_label"]
            teams_raw = row.get("teams", "")
            teams = [t.strip() for t in str(teams_raw).split(",") if t.strip()]
            for team in teams:
                if team not in team_stats:
                    team_stats[team] = {"wins": 0, "podiums": 0, "races": 0, "losses": 0}
                team_stats[team]["races"] += 1

            try:
                scores = get_or_compute_scores(event, race_label)
                sorted_scores = sorted(scores, key=lambda x: x.get("total_pts") or 0, reverse=True)
                for rank, score_row in enumerate(sorted_scores, 1):
                    team = score_row.get("team", "")
                    if not team:
                        continue
                    if team not in team_stats:
                        team_stats[team] = {"wins": 0, "podiums": 0, "races": 0, "losses": 0}
                    if rank == 1:
                        team_stats[team]["wins"] += 1
                        team_stats[team]["podiums"] += 1
                    elif rank <= 3:
                        team_stats[team]["podiums"] += 1
                    else:
                        team_stats[team]["losses"] += 1
            except Exception:
                pass

    BASE_COST = 1_000_000
    WIN_MULT = 600_000
    PODIUM_MULT = 100_000

    result = []
    for team, stats in sorted(team_stats.items()):
        total_races = stats["wins"] + stats["losses"]
        win_pct = stats["wins"] / max(total_races, 1) if total_races > 0 else 0.0
        cost = int(BASE_COST + (win_pct * WIN_MULT * 8) + (stats["podiums"] * PODIUM_MULT))
        cost = max(500_000, round(cost / 50_000) * 50_000)
        result.append({
            "team": team,
            "cost": cost,
            "wins": stats["wins"],
            "losses": stats["losses"],
            "podiums": stats["podiums"],
            "win_rate": round(win_pct * 100, 1),
        })

    result.sort(key=lambda x: x["cost"], reverse=True)
    return result


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Auth — users.json (no database, file-based)
# ---------------------------------------------------------------------------

USERS_FILE = Path(__file__).parent.parent / "users.json"


def _read_users() -> list[dict]:
    if not USERS_FILE.exists():
        return []
    try:
        return json.loads(USERS_FILE.read_text())
    except Exception:
        return []


def _write_users(users: list[dict]) -> None:
    USERS_FILE.write_text(json.dumps(users, indent=2))


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class CreditsUpdateRequest(BaseModel):
    email: str
    credits: int
    score: int | None = None
    teams: list[str] | None = None


@app.post("/api/auth/signup")
def auth_signup(req: SignupRequest):
    if not req.name.strip():
        raise HTTPException(400, "Name is required.")
    if "@" not in req.email:
        raise HTTPException(400, "Enter a valid email address.")
    if len(req.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    users = _read_users()
    if any(u["email"].lower() == req.email.lower() for u in users):
        raise HTTPException(400, "An account with this email already exists.")
    user = {
        "name": req.name.strip(),
        "email": req.email.lower(),
        "password": req.password,
        "credits": 4_000_000,
    }
    users.append(user)
    _write_users(users)
    return {"name": user["name"], "email": user["email"], "credits": user["credits"]}


@app.post("/api/auth/login")
def auth_login(req: LoginRequest):
    users = _read_users()
    user = next(
        (u for u in users if u["email"].lower() == req.email.lower() and u["password"] == req.password),
        None,
    )
    if not user:
        raise HTTPException(401, "Invalid email or password.")
    return {"name": user["name"], "email": user["email"], "credits": user["credits"]}


@app.patch("/api/auth/credits")
def auth_update_credits(req: CreditsUpdateRequest):
    users = _read_users()
    user = next((u for u in users if u["email"].lower() == req.email.lower()), None)
    if not user:
        raise HTTPException(404, "User not found.")
    user["credits"] = max(0, req.credits)
    if req.score is not None:
        user["last_score"] = req.score
    if req.teams is not None:
        user["last_teams"] = req.teams
    _write_users(users)
    return {"credits": user["credits"]}


@app.get("/api/leaderboard")
def global_leaderboard():
    """Return all registered users ranked by their last fantasy score."""
    users = _read_users()
    result = [
        {
            "name": u["name"],
            "credits": max(0, u.get("credits", 4_000_000)),
            "last_score": u.get("last_score", 0),
            "last_teams": u.get("last_teams", []),
        }
        for u in users
    ]
    result.sort(key=lambda x: x["last_score"], reverse=True)
    return result
