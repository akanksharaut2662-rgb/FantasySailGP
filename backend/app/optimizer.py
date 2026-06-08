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
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .data_loader import load_metadata, list_races
from .scoring_engine import score_race

MODEL_PATH = Path("models/optimizer.pkl")


# ---------------------------------------------------------------------------
# Feature engineering helpers
# ---------------------------------------------------------------------------

def add_wind_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add sin/cos transformation of wind direction for circular feature handling."""
    df = df.copy()
    df["twd_sin"] = np.sin(np.radians(df["avg_twd_deg"]))
    df["twd_cos"] = np.cos(np.radians(df["avg_twd_deg"]))
    return df


FEATURE_COLS = ["team", "avg_tws_km_h", "twd_sin", "twd_cos"]
TARGET_COL = "fantasy_points"


# ---------------------------------------------------------------------------
# Pipeline builder
# ---------------------------------------------------------------------------

def build_pipeline() -> Pipeline:
    """Create the sklearn Pipeline with OHE team + scaled wind features + Ridge."""
    preprocessor = ColumnTransformer([
        ("team_ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["team"]),
        ("wind_scaler", StandardScaler(), ["avg_tws_km_h", "twd_sin", "twd_cos"]),
    ])
    return Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", Ridge(alpha=1.0)),
    ])


# ---------------------------------------------------------------------------
# Training data construction
# ---------------------------------------------------------------------------

def build_training_data(event: str) -> pd.DataFrame:
    """Build one row per (team, race) with wind conditions and fantasy points as target."""
    metadata = load_metadata(event)
    rows = []
    for _, race in metadata.iterrows():
        race_label = race["race_label"]
        try:
            scores_df = score_race(event, race_label)
        except Exception as e:
            print(f"  Skipping {event}/{race_label}: {e}")
            continue
        for _, row in scores_df.iterrows():
            rows.append({
                "team": row["team"],
                "avg_tws_km_h": race["avg_tws_km_h"],
                "avg_twd_deg": race["avg_twd_deg"],
                TARGET_COL: row["total_pts"],
            })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def train_optimizer(save_path: Path = MODEL_PATH) -> Pipeline:
    """Train Ridge Regression on Halifax data, validate on Bermuda, serialize model."""
    from sklearn.metrics import mean_squared_error

    print("Building Halifax training data...")
    train_df = add_wind_features(build_training_data("Halifax"))
    X_train = train_df[FEATURE_COLS]
    y_train = train_df[TARGET_COL]

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)
    print(f"  Trained on {len(train_df)} rows.")

    print("Validating on Bermuda...")
    test_df = add_wind_features(build_training_data("Bermuda"))
    X_test = test_df[FEATURE_COLS]
    y_test = test_df[TARGET_COL]
    y_pred = pipeline.predict(X_test)
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
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
    Returns top_n teams ranked by predicted fantasy points.
    Each item: {"team": str, "predicted_score": float}
    """
    pipeline: Pipeline = joblib.load(model_path)
    rows = [
        {
            "team": t,
            "avg_tws_km_h": avg_tws_km_h,
            "twd_sin": np.sin(np.radians(avg_twd_deg)),
            "twd_cos": np.cos(np.radians(avg_twd_deg)),
        }
        for t in available_teams
    ]
    df = pd.DataFrame(rows)
    df["predicted_score"] = pipeline.predict(df[FEATURE_COLS])
    return (
        df[["team", "predicted_score"]]
        .sort_values("predicted_score", ascending=False)
        .head(top_n)
        .to_dict(orient="records")
    )


def get_optimizer_performance(model_path: Path = MODEL_PATH) -> dict:
    """
    Compute model performance across all races in both events.
    Returns dict shaped for the /api/optimizer/performance response.
    """
    from sklearn.metrics import mean_squared_error

    pipeline: Pipeline = joblib.load(model_path)

    results = []
    all_y_true = []
    all_y_pred = []

    for event in ["Halifax", "Bermuda"]:
        metadata = load_metadata(event)
        for _, race in metadata.iterrows():
            race_label = race["race_label"]
            try:
                scores_df = score_race(event, race_label)
            except Exception:
                continue

            teams = scores_df["team"].tolist()
            rows = [
                {
                    "team": t,
                    "avg_tws_km_h": race["avg_tws_km_h"],
                    "twd_sin": np.sin(np.radians(race["avg_twd_deg"])),
                    "twd_cos": np.cos(np.radians(race["avg_twd_deg"])),
                }
                for t in teams
            ]
            df = pd.DataFrame(rows)
            df["predicted_score"] = pipeline.predict(df[FEATURE_COLS])
            df["actual_score"] = scores_df["total_pts"].values

            predicted_top3 = df.nlargest(3, "predicted_score")["team"].tolist()
            actual_top3 = df.nlargest(3, "actual_score")["team"].tolist()
            hits = len(set(predicted_top3) & set(actual_top3))

            all_y_true.extend(df["actual_score"].tolist())
            all_y_pred.extend(df["predicted_score"].tolist())

            results.append({
                "event": event,
                "race_label": race_label,
                "predicted_top3": predicted_top3,
                "actual_top3": actual_top3,
                "hits": hits,
            })

    # RMSE only on Bermuda rows (test set)
    bermuda_rows = [r for r in results if r["event"] == "Bermuda"]
    if bermuda_rows:
        test_df_all = add_wind_features(build_training_data("Bermuda"))
        y_t = test_df_all[TARGET_COL].values
        y_p = pipeline.predict(test_df_all[FEATURE_COLS])
        bermuda_rmse = float(np.sqrt(mean_squared_error(y_t, y_p)))
    else:
        bermuda_rmse = 0.0

    return {
        "training_event": "Halifax",
        "test_event": "Bermuda",
        "bermuda_rmse": round(bermuda_rmse, 2),
        "races": results,
    }
