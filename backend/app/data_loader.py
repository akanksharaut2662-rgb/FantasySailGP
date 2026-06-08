"""
data_loader.py
Load SailGP telemetry CSVs from DataChallenge_Export/.
Paths are resolved relative to this file so the module works from any working directory.
CSVs are the source of truth — do NOT modify them.
"""

from pathlib import Path
import pandas as pd

# Resolve data root relative to this file — works regardless of CWD
DATA_ROOT = Path(__file__).parent.parent.parent / "DataChallenge_Export"


# ---------------------------------------------------------------------------
# Convenience path helpers
# ---------------------------------------------------------------------------

def boats_dir(event: str, race_label: str) -> Path:
    return DATA_ROOT / event / "boats" / race_label


def marks_file(event: str, race_label: str) -> Path:
    return DATA_ROOT / event / "marks" / race_label / "marks.csv"


def metadata_file(event: str) -> Path:
    return DATA_ROOT / event / "race_metadata.csv"


# ---------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------

def load_metadata(event: str) -> pd.DataFrame:
    """Load race_metadata.csv for an event (Halifax or Bermuda).

    Note: race_label is the primary key.
    race_number is NaN for Halifax Race_1–Race_3 — do not use it as a key.
    """
    path = DATA_ROOT / event / "race_metadata.csv"
    return pd.read_csv(path)


def load_boat(event: str, race_label: str, team: str) -> pd.DataFrame:
    """Load telemetry CSV for one team in one race."""
    path = DATA_ROOT / event / "boats" / race_label / f"{team}.csv"
    return pd.read_csv(path, parse_dates=["DATETIME"], index_col="DATETIME")


def load_all_boats(event: str, race_label: str) -> dict[str, pd.DataFrame]:
    """Load all team CSVs for a race. Keys are team codes like 'AUS', 'GBR'."""
    race_dir = DATA_ROOT / event / "boats" / race_label
    return {
        f.stem: pd.read_csv(f, parse_dates=["DATETIME"], index_col="DATETIME")
        for f in sorted(race_dir.glob("*.csv"))
    }


def list_races(event: str) -> list[str]:
    """Return all race labels for an event in order."""
    meta = load_metadata(event)
    return meta["race_label"].tolist()


def get_race_meta(event: str, race_label: str) -> pd.Series:
    """Return the metadata row for a specific race."""
    meta = load_metadata(event)
    rows = meta[meta["race_label"] == race_label]
    if len(rows) == 0:
        raise ValueError(f"Race '{race_label}' not found in {event} metadata.")
    return rows.iloc[0]
