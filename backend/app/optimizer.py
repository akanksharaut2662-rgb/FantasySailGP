"""
optimizer.py
ML model: train Ridge Regression to predict fantasy points from wind conditions.
Uses team identity (one-hot encoded) + wind speed + sin/cos of wind direction.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import joblib
from pathlib import Path

from sklearn.compose import ColumnTransformer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_squared_error
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .data_loader import load_metadata
from .scoring_engine import score_race

# Where the trained model gets saved/loaded
MODEL_PATH = Path(__file__).parent.parent.parent / "models" / "optimizer.pkl"

# Feature columns fed into the model
FEATURES = ["team", "avg_tws_km_h", "twd_sin", "twd_cos"]


# ---------------------------------------------------------------------------
# Training data
# ---------------------------------------------------------------------------

def build_training_data(event: str) -> pd.DataFrame:
    """
    For each race in an event, score every team and combine with wind conditions.

    Returns one row per (team, race) with columns:
      team, avg_tws_km_h, twd_sin, twd_cos, fantasy_points
    """
    metadata = load_metadata(event)
    rows = []

    for _, race in metadata.iterrows():
        race_label = race["race_label"]
        avg_tws = float(race["avg_tws_km_h"])
        avg_twd = float(race["avg_twd_deg"])

        try:
            scores_df = score_race(event, race_label)
        except Exception as e:
            print(f"  Skipping {event}/{race_label}: {e}")
            continue

        for _, row in scores_df.iterrows():
            rows.append({
                "team": row["team"],
                "avg_tws_km_h": avg_tws,
                # Wind direction is circular (359° and 1° are close, not far apart).
                # sin/cos encoding fixes this — the model understands circular numbers.
                "twd_sin": np.sin(np.radians(avg_twd)),
                "twd_cos": np.cos(np.radians(avg_twd)),
                "fantasy_points": float(row["total_pts"]),
            })

    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def build_pipeline() -> Pipeline:
    """
    Builds the sklearn ML pipeline:
      - One-hot encodes team names (turns 'AUS' into a column of 0s and 1s)
      - Scales wind speed and direction to a standard range
      - Runs Ridge Regression to predict fantasy points
    """
    preprocessor = ColumnTransformer([
        # Team name → a column per team (AUS=1 rest=0, GBR=1 rest=0, etc.)
        ("team_ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["team"]),
        # Wind speed and direction → scaled to mean=0, std=1
        ("wind_scaler", StandardScaler(), ["avg_tws_km_h", "twd_sin", "twd_cos"]),
    ])

    return Pipeline([
        ("preprocessor", preprocessor),
        # Ridge Regression: like linear regression but handles small datasets better
        ("regressor", Ridge(alpha=1.0)),
    ])


# ---------------------------------------------------------------------------
# Training (called by train_model.py)
# ---------------------------------------------------------------------------

def train_optimizer(save_path: Path = MODEL_PATH) -> Pipeline:
    """Train on Halifax, validate on Bermuda, save model."""
    print("Building Halifax training data...")
    train_df = build_training_data("Halifax")
    X_train = train_df[FEATURES]
    y_train = train_df["fantasy_points"]

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)
    print(f"  Trained on {len(train_df)} rows.")

    print("Validating on Bermuda...")
    test_df = build_training_data("Bermuda")
    y_pred = pipeline.predict(test_df[FEATURES])
    rmse = float(np.sqrt(mean_squared_error(test_df["fantasy_points"], y_pred)))
    print(f"  Bermuda test RMSE: {rmse:.1f} pts")

    save_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, save_path)
    print(f"  Model saved to {save_path}")
    return pipeline


# ---------------------------------------------------------------------------
# Inference
# ---------------------------------------------------------------------------

def recommend_teams(
    avg_tws_km_h: float,
    avg_twd_deg: float,
    available_teams: list[str],
    top_n: int = 3,
    model_path: Path = MODEL_PATH,
) -> list[dict]:
    """
    Given wind conditions and available teams, return the top_n predicted teams.
    Each result is: {"team": "AUS", "predicted_score": 87.3}
    """
    pipeline: Pipeline = joblib.load(model_path)

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


# ---------------------------------------------------------------------------
# Performance evaluation (used by /api/optimizer/performance endpoint)
# ---------------------------------------------------------------------------

def get_optimizer_performance(model_path: Path = MODEL_PATH) -> dict:
    """
    Compute optimizer top-3 hit rate and RMSE across all races.
    Returns dict shaped for the OptimizerPerformanceResponse model.
    """
    pipeline: Pipeline = joblib.load(model_path)
    results = []

    for event in ["Halifax", "Bermuda"]:
        metadata = load_metadata(event)
        for _, race in metadata.iterrows():
            race_label = race["race_label"]
            try:
                scores_df = score_race(event, race_label)
            except Exception:
                continue

            teams = scores_df["team"].tolist()
            rows = [{
                "team": t,
                "avg_tws_km_h": float(race["avg_tws_km_h"]),
                "twd_sin": np.sin(np.radians(float(race["avg_twd_deg"]))),
                "twd_cos": np.cos(np.radians(float(race["avg_twd_deg"]))),
            } for t in teams]

            df = pd.DataFrame(rows)
            df["predicted_score"] = pipeline.predict(df[FEATURES])
            df["actual_score"] = scores_df["total_pts"].values

            predicted_top3 = df.nlargest(3, "predicted_score")["team"].tolist()
            actual_top3    = df.nlargest(3, "actual_score")["team"].tolist()
            hits = len(set(predicted_top3) & set(actual_top3))

            results.append({
                "event": event,
                "race_label": race_label,
                "predicted_top3": predicted_top3,
                "actual_top3": actual_top3,
                "hits": hits,
            })

    # Bermuda RMSE (out-of-sample)
    test_df = build_training_data("Bermuda")
    if len(test_df) > 0:
        y_pred = pipeline.predict(test_df[FEATURES])
        bermuda_rmse = float(np.sqrt(mean_squared_error(test_df["fantasy_points"], y_pred)))
    else:
        bermuda_rmse = 0.0

    return {
        "training_event": "Halifax",
        "test_event": "Bermuda",
        "bermuda_rmse": round(bermuda_rmse, 2),
        "races": results,
    }
