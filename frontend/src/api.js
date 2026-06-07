const API_BASE = "http://localhost:8000/api";

// ─── MOCK DATA (swap with real fetch calls when Harsha's API is ready) ────────

const MOCK_RACES = [
  { event: "Halifax", race_label: "Race_1", avg_tws_km_h: 25.9, avg_twd_deg: 147.3, num_boats: 10, teams: ["AUS","CAN","DEN","ESP","FRA","GBR","GER","NZL","SUI","USA"], race_start_utc: "2024-06-01T19:07:31+00:00" },
  { event: "Halifax", race_label: "Race_2", avg_tws_km_h: 28.8, avg_twd_deg: 162.1, num_boats: 9,  teams: ["AUS","CAN","DEN","FRA","GBR","GER","NZL","SUI","USA"], race_start_utc: "2024-06-01T20:15:00+00:00" },
  { event: "Halifax", race_label: "Race_3", avg_tws_km_h: 22.4, avg_twd_deg: 135.0, num_boats: 4,  teams: ["AUS","GER","SUI","USA"], race_start_utc: "2024-06-02T18:30:00+00:00" },
  { event: "Halifax", race_label: "Race_4", avg_tws_km_h: 31.2, avg_twd_deg: 155.0, num_boats: 7,  teams: ["AUS","CAN","DEN","FRA","GBR","GER","NZL"], race_start_utc: "2024-06-02T19:45:00+00:00" },
  { event: "Halifax", race_label: "Race_5", avg_tws_km_h: 19.8, avg_twd_deg: 128.5, num_boats: 6,  teams: ["CAN","DEN","ESP","FRA","GBR","GER"], race_start_utc: "2024-06-03T18:00:00+00:00" },
  { event: "Halifax", race_label: "Race_6", avg_tws_km_h: 27.3, avg_twd_deg: 170.0, num_boats: 1,  teams: ["GBR"], race_start_utc: "2024-06-03T19:30:00+00:00" },
  { event: "Bermuda", race_label: "Race_1", avg_tws_km_h: 30.1, avg_twd_deg: 210.0, num_boats: 11, teams: ["AUS","BRA","CAN","DEN","ESP","FRA","GBR","GER","ITA","NZL","USA"], race_start_utc: "2026-05-09T19:00:00+00:00" },
  { event: "Bermuda", race_label: "Race_2", avg_tws_km_h: 26.5, avg_twd_deg: 198.0, num_boats: 10, teams: ["AUS","BRA","CAN","DEN","ESP","FRA","GBR","GER","NZL","SUI"], race_start_utc: "2026-05-09T20:30:00+00:00" },
];

const MOCK_RECOMMENDATIONS = {
  "Halifax-Race_1": [
    { team: "GBR", predicted_score: 91.2 },
    { team: "FRA", predicted_score: 84.7 },
    { team: "CAN", predicted_score: 78.3 },
  ],
  "Halifax-Race_4": [
    { team: "CAN", predicted_score: 95.1 },
    { team: "FRA", predicted_score: 88.4 },
    { team: "GBR", predicted_score: 82.0 },
  ],
};

const MOCK_SCORE = {
  event: "Halifax",
  race_label: "Race_1",
  user_teams: ["AUS", "GBR", "CAN"],
  user_total_score: 221,
  leaderboard: [
    { team: "GBR", total_pts: 98,  position_pts: 30, speed_pts: 20, overtake_pts: 25, clean_sailing_pts: 15, vmg_pts: 8,  final_rank: 3, status: 3, is_user_pick: true  },
    { team: "FRA", total_pts: 95,  position_pts: 40, speed_pts: 15, overtake_pts: 25, clean_sailing_pts: 15, vmg_pts: 0,  final_rank: 2, status: 3, is_user_pick: false },
    { team: "ESP", total_pts: 72,  position_pts: 50, speed_pts: 7,  overtake_pts: 0,  clean_sailing_pts: 15, vmg_pts: 0,  final_rank: 1, status: 3, is_user_pick: false },
    { team: "GER", total_pts: 70,  position_pts: 20, speed_pts: 10, overtake_pts: 25, clean_sailing_pts: 15, vmg_pts: 0,  final_rank: 4, status: 3, is_user_pick: false },
    { team: "NZL", total_pts: 66,  position_pts: 15, speed_pts: 3,  overtake_pts: 25, clean_sailing_pts: 15, vmg_pts: 8,  final_rank: 5, status: 3, is_user_pick: false },
    { team: "AUS", total_pts: 63,  position_pts: 5,  speed_pts: 3,  overtake_pts: 25, clean_sailing_pts: 15, vmg_pts: 15, final_rank: 8, status: 3, is_user_pick: true  },
    { team: "DEN", total_pts: 61,  position_pts: 10, speed_pts: 3,  overtake_pts: 25, clean_sailing_pts: 15, vmg_pts: 8,  final_rank: 6, status: 3, is_user_pick: false },
    { team: "SUI", total_pts: 61,  position_pts: 3,  speed_pts: 3,  overtake_pts: 25, clean_sailing_pts: 15, vmg_pts: 15, final_rank: 9, status: 3, is_user_pick: false },
    { team: "CAN", total_pts: 60,  position_pts: 7,  speed_pts: 5,  overtake_pts: 25, clean_sailing_pts: 15, vmg_pts: 8,  final_rank: 7, status: 3, is_user_pick: true  },
    { team: "USA", total_pts: 58,  position_pts: 0,  speed_pts: 3,  overtake_pts: 25, clean_sailing_pts: 15, vmg_pts: 15, final_rank: null, status: 5, is_user_pick: false },
  ],
};

// ─── API FUNCTIONS (replace mock returns with fetch() when Harsha's API is live) ─

export async function fetchRaces() {
  // TODO: replace with → return fetch(`${API_BASE}/races`).then(r => r.json());
  return MOCK_RACES;
}

export async function fetchRecommendations(event, raceLabel) {
  // TODO: replace with → return fetch(`${API_BASE}/races/${event}/${raceLabel}/recommend`).then(r => r.json());
  const key = `${event}-${raceLabel}`;
  const recs = MOCK_RECOMMENDATIONS[key] ?? [
    { team: "GBR", predicted_score: 88.0 },
    { team: "FRA", predicted_score: 81.5 },
    { team: "CAN", predicted_score: 75.0 },
  ];
  return { event, race_label: raceLabel, recommendations: recs };
}

export async function fetchScore(event, raceLabel, userTeams) {
  // TODO: replace with →
  // return fetch(`${API_BASE}/score`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ event, race_label: raceLabel, user_teams: userTeams }),
  // }).then(r => r.json());
  const leaderboard = MOCK_SCORE.leaderboard.map(row => ({
    ...row,
    is_user_pick: userTeams.includes(row.team),
  }));
  const userTotal = leaderboard
    .filter(r => r.is_user_pick)
    .reduce((sum, r) => sum + r.total_pts, 0);
  return { ...MOCK_SCORE, event, race_label: raceLabel, user_teams: userTeams, user_total_score: userTotal, leaderboard };
}
