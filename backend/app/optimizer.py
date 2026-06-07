import sys
import numpy as np
import pandas as pd
import joblib
from pathlib import Path

from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))
from app.data_loader import load_metadata
from app.scoring_engine import score_race

# Where the trained model gets saved
MODEL_PATH = Path(__file__).parent.parent.parent / "models" / "optimizer.pkl"

# These are the columns we feed into the model
FEATURES = ["team", "avg_tws_km_h", "twd_sin", "twd_cos"]


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

        scores_df = score_race(event, race_label)

        for _, row in scores_df.iterrows():
            rows.append({
                "team": row["team"],
                "avg_tws_km_h": avg_tws,
                # Wind direction is circular (359° and 1° are close, not far apart)
                # sin/cos encoding fixes this — the model understands circular numbers
                "twd_sin": np.sin(np.radians(avg_twd)),
                "twd_cos": np.cos(np.radians(avg_twd)),
                "fantasy_points": float(row["total_pts"]),
            })

    return pd.DataFrame(rows)


def build_pipeline() -> Pipeline:
    """
    Builds the ML pipeline:
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


def recommend_teams(
    avg_tws_km_h: float,
    avg_twd_deg: float,
    available_teams: list[str],
    top_n: int = 3,
) -> list[dict]:
    """
    Given wind conditions and available teams, return the top_n predicted teams.
    Each result is: {"team": "AUS", "predicted_score": 87.3}
    """
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
