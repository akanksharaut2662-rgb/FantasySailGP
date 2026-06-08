"""
scoring_engine.py
Compute fantasy points per team from SailGP telemetry CSVs.

All scoring uses the racing phase only (TRK_BOAT_RACE_STATUS_unk == 2),
except finishing position which is computed from TIME_RACE_s at status == 3.

Maximum theoretical score per boat: 125 pts
  Position    50 pts
  Speed       20 pts
  Overtakes   25 pts
  Clean sail  15 pts
  VMG         15 pts
"""

import pandas as pd

from .data_loader import load_all_boats, load_metadata

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

POSITION_POINTS: dict[int, int] = {
    1: 50, 2: 40, 3: 30, 4: 20, 5: 15,
    6: 10, 7: 7,  8: 5,  9: 3, 10: 2, 11: 1, 12: 1,
}

SPEED_RANK_POINTS: dict[int, int] = {1: 20, 2: 15, 3: 10, 4: 7, 5: 5}
SPEED_DEFAULT_PTS = 3  # rank 6+

RACING_STATUS   = 2
FINISHED_STATUS = 3


# ---------------------------------------------------------------------------
# Rank computation helpers
# ---------------------------------------------------------------------------

def _compute_finish_ranks(boats: dict[str, pd.DataFrame]) -> dict[str, int | None]:
    """
    Rank teams by TIME_RACE_s at the moment they reach status=3 (Finished).
    Lower elapsed time = finished earlier = better rank.
    Teams that never reach status=3 get None (DNF/OCS/DNS/DSQ/DNC).
    """
    finish_times: dict[str, float] = {}
    for team, df in boats.items():
        finished = df[df["TRK_BOAT_RACE_STATUS_unk"] == FINISHED_STATUS]
        if len(finished) > 0:
            finish_times[team] = float(finished["TIME_RACE_s"].iloc[0])

    # Sort by finish time ascending — lowest time = 1st place
    ranked = sorted(finish_times.items(), key=lambda x: x[1])
    ranks: dict[str, int | None] = {team: rank + 1 for rank, (team, _) in enumerate(ranked)}

    # Teams that didn't finish get None
    for team in boats:
        if team not in ranks:
            ranks[team] = None

    return ranks


def _compute_race_ranks_over_time(boats: dict[str, pd.DataFrame]) -> dict[str, pd.Series]:
    """
    At each timestamp, rank teams by DISTANCE_RACE_m (more distance = ahead = rank 1).
    Returns a dict of team -> Series of rank at each timestamp.
    Only covers the racing phase (status == 2).

    This is more accurate than reading TRK_RACE_RANK_unk directly because it
    accounts for all boats simultaneously — no single-boat noise.
    """
    racing_dfs: dict[str, pd.Series] = {}
    for team, df in boats.items():
        racing = df[df["TRK_BOAT_RACE_STATUS_unk"] == RACING_STATUS]["DISTANCE_RACE_m"]
        racing = racing[~racing.index.duplicated(keep="first")]
        if len(racing) > 0:
            racing_dfs[team] = racing

    if not racing_dfs:
        return {team: pd.Series(dtype=float) for team in boats}

    combined = pd.DataFrame(racing_dfs)
    rank_df = combined.rank(axis=1, ascending=False, method="min")

    return {team: rank_df[team].dropna() for team in rank_df.columns}


# ---------------------------------------------------------------------------
# Per-boat scoring helpers
# ---------------------------------------------------------------------------

def score_finishing_position(finish_rank: int | None) -> int:
    """Points based on finishing rank. None = DNF/OCS/DNS/DSQ/DNC = 0 pts."""
    if finish_rank is None:
        return 0
    return POSITION_POINTS.get(finish_rank, 0)


def _raw_speed_score(df: pd.DataFrame, avg_tws_km_h: float) -> float:
    """
    Mean boat speed during racing divided by avg wind speed.
    Normalises speed so strong-wind races don't automatically score higher.
    Returns a raw metric — rank-based points assigned at race level.
    """
    racing = df[df["TRK_BOAT_RACE_STATUS_unk"] == RACING_STATUS]
    if len(racing) == 0 or avg_tws_km_h == 0:
        return 0.0
    return float(racing["BOAT_SPEED_km_h_1"].mean() / avg_tws_km_h)


def score_overtakes(rank_series: pd.Series) -> int:
    """
    Count how many times rank improved (decreased) during racing.
    5 pts each, capped at 5 overtakes = max 25 pts.
    """
    if len(rank_series) < 2:
        return 0
    diff = rank_series.diff()
    raw_overtakes = int((diff < 0).sum())
    return min(raw_overtakes, 5) * 5


def score_clean_sailing(df: pd.DataFrame) -> int:
    """
    0 penalties = 15 pts, 1 penalty = 5 pts, 2+ = 0 pts.
    TRK_PENALTY_COUNT_unk is cumulative so we read the last value.
    """
    final_penalties = int(df["TRK_PENALTY_COUNT_unk"].iloc[-1])
    if final_penalties == 0:
        return 15
    elif final_penalties == 1:
        return 5
    return 0


def _raw_vmg_std(df: pd.DataFrame) -> float:
    """
    Std dev of VMG during racing. Lower = more consistent = better.
    Returns a raw metric — rank-based points assigned at race level.
    """
    racing = df[df["TRK_BOAT_RACE_STATUS_unk"] == RACING_STATUS]
    if len(racing) < 2:
        return float("inf")
    return float(racing["VMG_km_h_1"].std())


# ---------------------------------------------------------------------------
# Race-level scoring
# ---------------------------------------------------------------------------

def score_race(event: str, race_label: str) -> pd.DataFrame:
    """
    Scores every team in a race. Returns a DataFrame sorted by total_pts descending.

    Columns: team, position_pts, speed_pts, overtake_pts, clean_sailing_pts,
             vmg_pts, total_pts, final_rank, status
    """
    metadata = load_metadata(event)
    race_meta = metadata[metadata["race_label"] == race_label].iloc[0]
    avg_tws = float(race_meta["avg_tws_km_h"])

    boats = load_all_boats(event, race_label)

    # Compute finishing ranks and live race ranks across all boats together
    finish_ranks = _compute_finish_ranks(boats)
    race_ranks_over_time = _compute_race_ranks_over_time(boats)

    # Raw metrics that need ranking within the race
    speed_raw = {team: _raw_speed_score(df, avg_tws) for team, df in boats.items()}
    vmg_raw   = {team: _raw_vmg_std(df) for team, df in boats.items()}

    # Assign speed points by rank (highest normalised speed = rank 1)
    speed_pts_map: dict[str, int] = {}
    for rank, (team, _) in enumerate(
            sorted(speed_raw.items(), key=lambda x: x[1], reverse=True), start=1):
        speed_pts_map[team] = SPEED_RANK_POINTS.get(rank, SPEED_DEFAULT_PTS)

    # Assign VMG points by rank (lowest std dev = rank 1 = most consistent)
    vmg_pts_map: dict[str, int] = {}
    for rank, (team, _) in enumerate(
            sorted(vmg_raw.items(), key=lambda x: x[1]), start=1):
        if rank <= 3:
            vmg_pts_map[team] = 15
        elif rank <= 7:
            vmg_pts_map[team] = 8
        else:
            vmg_pts_map[team] = 0

    results = []
    for team, df in boats.items():
        pos_pts = score_finishing_position(finish_ranks[team])
        spd_pts = speed_pts_map[team]
        ovt_pts = score_overtakes(race_ranks_over_time.get(team, pd.Series(dtype=float)))
        cln_pts = score_clean_sailing(df)
        vmg_pts = vmg_pts_map[team]

        results.append({
            "team": team,
            "position_pts": pos_pts,
            "speed_pts": spd_pts,
            "overtake_pts": ovt_pts,
            "clean_sailing_pts": cln_pts,
            "vmg_pts": vmg_pts,
            "total_pts": pos_pts + spd_pts + ovt_pts + cln_pts + vmg_pts,
            "final_rank": finish_ranks[team],
            "status": int(df["TRK_BOAT_RACE_STATUS_unk"].iloc[-1]),
        })

    return (
        pd.DataFrame(results)
        .sort_values("total_pts", ascending=False)
        .reset_index(drop=True)
    )
