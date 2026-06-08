/**
 * api.js — All fetch calls to the SailGP Fantasy Predictor backend.
 * Base URL defaults to localhost:8000 (FastAPI dev server).
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

/** GET /api/races — all races from both events */
export const fetchRaces = () =>
  fetch(`${API_BASE}/races`).then(handleResponse);

/** GET /api/races/{event}/{raceLabel}/recommend */
export const fetchRecommendations = (event, raceLabel) =>
  fetch(`${API_BASE}/races/${event}/${raceLabel}/recommend`).then(handleResponse);

/** GET /api/races/{event}/{raceLabel}/leaderboard */
export const fetchLeaderboard = (event, raceLabel) =>
  fetch(`${API_BASE}/races/${event}/${raceLabel}/leaderboard`).then(handleResponse);

/** POST /api/score — compute scores for user-selected teams */
export const fetchScore = (event, raceLabel, userTeams) =>
  fetch(`${API_BASE}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, race_label: raceLabel, user_teams: userTeams }),
  }).then(handleResponse);

/** GET /api/optimizer/performance */
export const fetchOptimizerPerformance = () =>
  fetch(`${API_BASE}/optimizer/performance`).then(handleResponse);

/** GET /api/races/{event}/{raceLabel}/gps — GPS tracks for race replay (Day 4) */
export const fetchGPS = (event, raceLabel) =>
  fetch(`${API_BASE}/races/${event}/${raceLabel}/gps`).then(handleResponse);
