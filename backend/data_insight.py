"""
data_insight.py
Track 1 Step 4 — one-time correlation analysis.
Run from backend/: python data_insight.py

Answers: does VMG consistency or raw speed correlate more with fantasy score?
Share results with the team — everyone tells the same story to judges.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import pandas as pd
from app.data_loader import load_metadata, load_all_boats
from app.scoring_engine import score_race, _raw_vmg_std, _raw_speed_score

rows = []
for event in ["Halifax", "Bermuda"]:
    for race_label in load_metadata(event)["race_label"].tolist():
        try:
            meta = load_metadata(event)
            avg_tws = float(meta[meta["race_label"] == race_label]["avg_tws_km_h"].iloc[0])
            boats = load_all_boats(event, race_label)
            scores = score_race(event, race_label).set_index("team")
        except Exception as e:
            print(f"  Skipping {event}/{race_label}: {e}")
            continue
        for team, df in boats.items():
            rows.append({
                "event": event,
                "race": race_label,
                "team": team,
                "vmg_std": _raw_vmg_std(df),
                "norm_speed": _raw_speed_score(df, avg_tws),
                "total_pts": float(scores.loc[team, "total_pts"]) if team in scores.index else 0.0,
            })

analysis = pd.DataFrame(rows)
print("=" * 50)
print("Correlation with fantasy score (all events)")
print("=" * 50)
corr = analysis[["vmg_std", "norm_speed", "total_pts"]].corr()["total_pts"]
print(corr.to_string())
print()
print("Interpretation:")
print(f"  vmg_std correlation:   {corr['vmg_std']:.3f}  (negative = lower std → more pts)")
print(f"  norm_speed correlation:{corr['norm_speed']:.3f}  (positive = faster → more pts)")
print()
if abs(corr["vmg_std"]) > abs(corr["norm_speed"]):
    print("FINDING: Consistency beats brilliance.")
    print("  VMG consistency has a higher absolute correlation with fantasy score than raw speed.")
    print("  Teams that sail a steady, efficient line score better than fast-but-erratic boats.")
else:
    print("FINDING: Speed is the dominant factor.")
    print("  Raw wind-normalised speed has a higher correlation with fantasy score than VMG consistency.")
