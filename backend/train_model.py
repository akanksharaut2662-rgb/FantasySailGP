"""
train_model.py
One-shot training script: trains the Ridge Regression optimizer and saves to models/optimizer.pkl.
Also prints per-race hit-rate analysis.

Run from the backend/ directory:
    python train_model.py
"""

import sys
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import mean_squared_error
import joblib

# Allow `from app.X import ...` when running as a script from backend/
sys.path.insert(0, str(Path(__file__).parent))

from app.optimizer import build_training_data, build_pipeline, FEATURES, MODEL_PATH
from app.data_loader import load_metadata
from app.scoring_engine import score_race

print("=" * 50)
print("Step 1: Building training data from Halifax...")
print("=" * 50)
train_df = build_training_data("Halifax")
print(f"Training rows: {len(train_df)}")
print(f"Teams: {sorted(train_df['team'].unique())}")
print(f"Avg fantasy points: {train_df['fantasy_points'].mean():.1f}")
print()

print("=" * 50)
print("Step 2: Training Ridge Regression model...")
print("=" * 50)
pipeline = build_pipeline()
pipeline.fit(train_df[FEATURES], train_df["fantasy_points"])
print("Model trained.")
print()

print("=" * 50)
print("Step 3: Evaluating on Bermuda (out-of-sample test)...")
print("=" * 50)
test_df = build_training_data("Bermuda")
y_pred = pipeline.predict(test_df[FEATURES])
rmse = float(np.sqrt(mean_squared_error(test_df["fantasy_points"], y_pred)))
print(f"Bermuda RMSE: {rmse:.1f} pts")
print(f"(Predictions are off by ~{rmse:.0f} pts on average)")
print()

print("=" * 50)
print("Step 4: Top-3 hit rate per Halifax race...")
print("=" * 50)

# Rebuild with race_label column for per-race breakdown
rows = []
for _, race in load_metadata("Halifax").iterrows():
    race_label = race["race_label"]
    scores_df = score_race("Halifax", race_label)
    for _, row in scores_df.iterrows():
        rows.append({
            "race_label": race_label,
            "team": row["team"],
            "avg_tws_km_h": float(race["avg_tws_km_h"]),
            "twd_sin": np.sin(np.radians(float(race["avg_twd_deg"]))),
            "twd_cos": np.cos(np.radians(float(race["avg_twd_deg"]))),
            "fantasy_points": float(row["total_pts"]),
        })

analysis_df = pd.DataFrame(rows)
analysis_df["predicted"] = pipeline.predict(analysis_df[FEATURES])

total_hits = 0
num_races = 0
for race_label, group in analysis_df.groupby("race_label"):
    actual_top3    = set(group.nlargest(3, "fantasy_points")["team"])
    predicted_top3 = set(group.nlargest(3, "predicted")["team"])
    hits = len(actual_top3 & predicted_top3)
    total_hits += hits
    num_races += 1
    print(f"  {race_label}: predicted={sorted(predicted_top3)}  actual={sorted(actual_top3)}  hits={hits}/3")

print(f"\nOverall: {total_hits}/{num_races * 3} top-3 picks correct")
print()

print("=" * 50)
print("Step 5: Saving model...")
print("=" * 50)
MODEL_PATH.parent.mkdir(exist_ok=True)
joblib.dump(pipeline, MODEL_PATH)
print(f"Model saved to {MODEL_PATH}")
print()
print("All done! Model is ready. Start the API with:")
print("  uvicorn app.main:app --reload")
