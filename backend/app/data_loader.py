"""
data_loader.py
Load and cache SailGP telemetry CSVs from DataChallenge_Export/.
CSVs are the source of truth — do NOT move or modify them.
"""

import pandas as pd
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

DATA_ROOT = Path("DataChallenge_Export")
HALIFAX_DIR = DATA_ROOT / "Halifax"
BERMUDA_DIR = DATA_ROOT / "Bermuda"


def boats_dir(event: str, race_label: str) -> Path:
    return DATA_ROOT / event / "boats" / race_label


def marks_file(event: str, race_label: str) -> Path:
    return DATA_ROOT / event / "marks" / race_label / "marks.csv"


def metadata_file(event: str) -> Path:
    return DATA_ROOT / event / "race_metadata.csv"


# ---------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------

def load_boat(event: str, race_label: str, team: str) -> pd.DataFrame:
    """Load a single team's telemetry DataFrame for one race."""
    path = DATA_ROOT / event / "boats" / race_label / f"{team}.csv"
    return pd.read_csv(path, parse_dates=["DATETIME"], index_col="DATETIME")


def load_all_boats(event: str, race_label: str) -> dict[str, pd.DataFrame]:
    """Load all team CSVs for a race. Returns {team_code: DataFrame}."""
    race_dir = DATA_ROOT / event / "boats" / race_label
    return {
        f.stem: pd.read_csv(f, parse_dates=["DATETIME"], index_col="DATETIME")
        for f in sorted(race_dir.glob("*.csv"))
    }


def load_metadata(event: str) -> pd.DataFrame:
    """Load race_metadata.csv for an event.

    Note: race_label is the primary key — race_number is NaN for Halifax Race_1–Race_3.
    """
    return pd.read_csv(metadata_file(event))


def get_race_meta(event: str, race_label: str) -> pd.Series:
    """Return the metadata row for a specific race."""
    meta = load_metadata(event)
    rows = meta[meta["race_label"] == race_label]
    if len(rows) == 0:
        raise ValueError(f"Race '{race_label}' not found in {event} metadata.")
    return rows.iloc[0]


def list_races(event: str) -> list[str]:
    """Return sorted list of race_labels for an event."""
    meta = load_metadata(event)
    return sorted(meta["race_label"].tolist())
