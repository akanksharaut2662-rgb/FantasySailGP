"""
models.py
Pydantic request/response models for the FastAPI backend.
"""

from __future__ import annotations

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Shared sub-models
# ---------------------------------------------------------------------------

class TeamScore(BaseModel):
    team: str
    total_pts: int
    position_pts: int
    speed_pts: int
    overtake_pts: int
    clean_sailing_pts: int
    vmg_pts: int
    final_rank: int | None
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


class TeamRecommendation(BaseModel):
    team: str
    predicted_score: float


# ---------------------------------------------------------------------------
# Request bodies
# ---------------------------------------------------------------------------

class ScoreRequest(BaseModel):
    event: str
    race_label: str
    user_teams: list[str]


# ---------------------------------------------------------------------------
# Response bodies
# ---------------------------------------------------------------------------

class RecommendResponse(BaseModel):
    race_label: str
    event: str
    avg_tws_km_h: float
    avg_twd_deg: float
    recommendations: list[TeamRecommendation]


class ScoreResponse(BaseModel):
    event: str
    race_label: str
    user_teams: list[str]
    user_total_score: int
    leaderboard: list[TeamScore]


class RacePerformanceEntry(BaseModel):
    event: str
    race_label: str
    predicted_top3: list[str]
    actual_top3: list[str]
    hits: int


class OptimizerPerformanceResponse(BaseModel):
    training_event: str
    test_event: str
    bermuda_rmse: float
    races: list[RacePerformanceEntry]
