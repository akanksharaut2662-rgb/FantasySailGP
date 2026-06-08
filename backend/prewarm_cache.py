"""
prewarm_cache.py
Pre-computes all race scores and stores them in SQLite so the first API call
for each race is instant. Run once after train_model.py.

Usage:
    cd backend
    python prewarm_cache.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.data_loader import list_races
from app.database import get_or_compute_scores, init_db

init_db()

EVENTS = {
    "Halifax": list_races("Halifax"),
    "Bermuda": list_races("Bermuda"),
}

total = sum(len(v) for v in EVENTS.values())
done = 0

for event, races in EVENTS.items():
    for race_label in races:
        try:
            scores = get_or_compute_scores(event, race_label)
            done += 1
            print(f"  [{done}/{total}] {event} {race_label} — {len(scores)} teams cached")
        except Exception as e:
            print(f"  SKIP {event} {race_label}: {e}")

print(f"\nDone. {done}/{total} races cached.")
