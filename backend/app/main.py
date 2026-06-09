"""
main.py
FastAPI entry point for SailGP Fantasy Predictor backend.
Run with: uvicorn app.main:app --reload   (from backend/ directory)
Docs:      http://localhost:8000/docs
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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
from .optimizer import get_optimizer_performance, recommend_teams

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
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}
