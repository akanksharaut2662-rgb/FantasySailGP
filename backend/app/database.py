"""
database.py
SQLite cache for computed race scores.
SQLite is a cache only — CSVs are the source of truth.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "fantasy_scores.db"


def init_db() -> None:
    """Create the race_scores table if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS race_scores (
            event            TEXT,
            race_label       TEXT,
            team             TEXT,
            total_pts        INTEGER,
            position_pts     INTEGER,
            speed_pts        INTEGER,
            overtake_pts     INTEGER,
            clean_sailing_pts INTEGER,
            vmg_pts          INTEGER,
            final_rank       INTEGER,
            status           INTEGER,
            PRIMARY KEY (event, race_label, team)
        )
    """)
    conn.commit()
    conn.close()


def get_cached_scores(event: str, race_label: str) -> list[dict] | None:
    """Return cached scores for a race, or None if not yet cached."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.execute(
        "SELECT * FROM race_scores WHERE event = ? AND race_label = ?",
        (event, race_label),
    )
    rows = cursor.fetchall()
    conn.close()
    if not rows:
        return None
    return [dict(r) for r in rows]


def cache_scores(event: str, race_label: str, scores: list[dict]) -> None:
    """Insert or replace computed scores into the cache."""
    conn = sqlite3.connect(DB_PATH)
    conn.executemany(
        """
        INSERT OR REPLACE INTO race_scores
            (event, race_label, team, total_pts, position_pts, speed_pts,
             overtake_pts, clean_sailing_pts, vmg_pts, final_rank, status)
        VALUES
            (:event, :race_label, :team, :total_pts, :position_pts, :speed_pts,
             :overtake_pts, :clean_sailing_pts, :vmg_pts, :final_rank, :status)
        """,
        [{**row, "event": event, "race_label": race_label} for row in scores],
    )
    conn.commit()
    conn.close()


def get_or_compute_scores(event: str, race_label: str) -> list[dict]:
    """Return cached scores, computing and caching them if not yet stored."""
    cached = get_cached_scores(event, race_label)
    if cached:
        return cached
    from .scoring_engine import score_race
    scores = score_race(event, race_label).to_dict(orient="records")
    cache_scores(event, race_label, scores)
    return scores


def clear_cache(event: str | None = None, race_label: str | None = None) -> None:
    """Utility: clear all cached scores, or just for a specific event/race."""
    conn = sqlite3.connect(DB_PATH)
    if event and race_label:
        conn.execute(
            "DELETE FROM race_scores WHERE event = ? AND race_label = ?",
            (event, race_label),
        )
    elif event:
        conn.execute("DELETE FROM race_scores WHERE event = ?", (event,))
    else:
        conn.execute("DELETE FROM race_scores")
    conn.commit()
    conn.close()
