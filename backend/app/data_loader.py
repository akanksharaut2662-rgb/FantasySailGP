from pathlib import Path
import pandas as pd

# This points to DataChallenge_Export/ from wherever this file lives
DATA_ROOT = Path(__file__).parent.parent.parent / "DataChallenge_Export"


def load_metadata(event: str) -> pd.DataFrame:
    """Load race_metadata.csv for an event (Halifax or Bermuda)."""
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
