"""
scoring_engine.py
Compute fantasy points per team from SailGP telemetry CSVs.
All scoring uses the racing phase only (TRK_BOAT_RACE_STATUS_unk == 2),
except finishing position which uses the last row where status == 3.

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
    6: 10, 7: 7, 8: 5, 9: 3, 10: 2, 11: 1, 12: 1,
}

SPEED_RANK_POINTS: dict[int, int] = {
    1: 20, 2: 15, 3: 10, 4: 7, 5: 5,
}
SPEED_DEFAULT_PTS = 3  # rank 6+

# VMG consistency (lower std dev = better)
VMG_TIER_1 = 15  # ranks 1-3
VMG_TIER_2 = 8   # ranks 4-7
VMG_TIER_3 = 0   # rank 8+

RACING_STATUS = 2
FINISHED_STATUS = 3


# ---------------------------------------------------------------------------
# Per-boat scoring helpers
# ---------------------------------------------------------------------------

def score_finishing_position(df: pd.DataFrame) -> int:
    """Award points for final race position.
    Boats that never reach status 3 (DNF/OCS/DNS/DSQ/DNC) get 0."""
    finished = df[df["TRK_BOAT_RACE_STATUS_unk"] == FINISHED_STATUS]
    if len(finished) == 0:
        return 0
    final_rank = int(finished["TRK_RACE_RANK_unk"].iloc[-1])
    return POSITION_POINTS.get(final_rank, 0)


def score_speed(df: pd.DataFrame, avg_tws_km_h: float) -> float:
    """Wind-normalized mean boat speed during racing phase.
    This is a raw metric; rank-based points are awarded at race level."""
    racing = df[df["TRK_BOAT_RACE_STATUS_unk"] == RACING_STATUS]
    if len(racing) == 0 or avg_tws_km_h == 0:
        return 0.0
    return racing["BOAT_SPEED_km_h_1"].mean() / avg_tws_km_h


def score_overtakes(df: pd.DataFrame) -> int:
    """5 pts per overtake (rank improvement), capped at 5 overtakes = 25 pts."""
    racing = df[df["TRK_BOAT_RACE_STATUS_unk"] == RACING_STATUS].copy()
    rank_diff = racing["TRK_RACE_RANK_unk"].diff()
    raw_overtakes = int((rank_diff < 0).sum())
    capped = min(raw_overtakes, 5)
    return capped * 5


def score_clean_sailing(df: pd.DataFrame) -> int:
    """Points based on final cumulative penalty count."""
    final_penalties = int(df["TRK_PENALTY_COUNT_unk"].iloc[-1])
    if final_penalties == 0:
        return 15
    elif final_penalties == 1:
        return 5
    else:
        return 0


def score_vmg_consistency(df: pd.DataFrame) -> float:
    """Std dev of VMG during racing (lower = more consistent = better).
    Raw metric; rank-based points awarded at race level."""
    racing = df[df["TRK_BOAT_RACE_STATUS_unk"] == RACING_STATUS]
    if len(racing) < 2:
        return 0.0
    return float(racing["VMG_km_h_1"].std())


# ---------------------------------------------------------------------------
# Race-level scoring
# ---------------------------------------------------------------------------

def score_race(event: str, race_label: str) -> pd.DataFrame:
    """
    Compute fantasy scores for all teams in a race.

    Returns a DataFrame with columns:
      team, position_pts, speed_pts, overtake_pts, clean_sailing_pts,
      vmg_pts, total_pts, final_rank, status
    Sorted by total_pts descending.
    """
    metadata = load_metadata(event)
    race_meta = metadata[metadata["race_label"] == race_label].iloc[0]
    avg_tws = float(race_meta["avg_tws_km_h"])

    boats = load_all_boats(event, race_label)

    # --- Step 1: compute raw metrics for rank-based categories ---
    speed_scores_raw: dict[str, float] = {}
    vmg_std_raw: dict[str, float] = {}

    for team, df in boats.items():
        speed_scores_raw[team] = score_speed(df, avg_tws)
        vmg_std_raw[team] = score_vmg_consistency(df)

    # --- Step 2: rank and assign points ---
    speed_ranked = sorted(speed_scores_raw.items(), key=lambda x: x[1], reverse=True)
    vmg_ranked = sorted(vmg_std_raw.items(), key=lambda x: x[1])  # ascending (lower=better)

    speed_pts_map: dict[str, int] = {}
    for i, (team, _) in enumerate(speed_ranked):
        speed_pts_map[team] = SPEED_RANK_POINTS.get(i + 1, SPEED_DEFAULT_PTS)

    vmg_pts_map: dict[str, int] = {}
    for i, (team, _) in enumerate(vmg_ranked):
        if i < 3:
            vmg_pts_map[team] = VMG_TIER_1
        elif i < 7:
            vmg_pts_map[team] = VMG_TIER_2
        else:
            vmg_pts_map[team] = VMG_TIER_3

    # --- Step 3: assemble results ---
    results = []
    for team, df in boats.items():
        pos_pts = score_finishing_position(df)
        spd_pts = speed_pts_map[team]
        ovt_pts = score_overtakes(df)
        cln_pts = score_clean_sailing(df)
        vmg_pts = vmg_pts_map[team]
        total = pos_pts + spd_pts + ovt_pts + cln_pts + vmg_pts

        finished = df[df["TRK_BOAT_RACE_STATUS_unk"] == FINISHED_STATUS]
        final_rank = int(finished["TRK_RACE_RANK_unk"].iloc[-1]) if len(finished) > 0 else None
        final_status = int(df["TRK_BOAT_RACE_STATUS_unk"].iloc[-1])

        results.append({
            "team": team,
            "position_pts": pos_pts,
            "speed_pts": spd_pts,
            "overtake_pts": ovt_pts,
            "clean_sailing_pts": cln_pts,
            "vmg_pts": vmg_pts,
            "total_pts": total,
            "final_rank": final_rank,
            "status": final_status,
        })

    return pd.DataFrame(results).sort_values("total_pts", ascending=False).reset_index(drop=True)
