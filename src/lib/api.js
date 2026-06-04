// API client for the FPL Optimiser backend (Railway-hosted FastAPI).
//
// The backend URL is read from VITE_API_URL at build time. In dev, set it in
// `.env.local`; in production (Vercel), set it in Project Settings → Environment
// Variables.
//
// All endpoints documented in the backend repo: api.py / FastAPI auto-docs at
// `${VITE_API_URL}/docs`.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
    cache: 'no-store',
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(
      data?.detail || res.statusText || 'Request failed',
      res.status,
      data
    );
  }
  return data;
}

// ── World Cup ─────────────────────────────────────────────────────
// GET /api/wc/teams → { teams: string[] }
export function fetchWcTeams() {
  return request('/api/wc/teams');
}

// POST /api/wc/predict → {
//   home_name, away_name, home_xg, away_xg, predicted_score,
//   win_pct, draw_pct, loss_pct,
//   most_likely: [{ home_goals, away_goals, probability_pct }, ...]
// }
export function predictWorldCupMatch({ home, away, knockout = false }) {
  return request('/api/wc/predict', {
    method: 'POST',
    body: { home_team: home, away_team: away, knockout },
  });
}

// GET /api/wc/simulate?n_sim=10000 → {
//   teams: [{ team, group, r32_pct, qf_pct, sf_pct, final_pct, win_pct }],
//   n_sim: number
// }
export function fetchSimulation(nSim = 10_000) {
  return request(`/api/wc/simulate?n_sim=${nSim}`);
}

// ── WC Fantasy ───────────────────────────────────────────────────
// booster: "wildcard" | "12th_man" | "max_captain" | "qualification_booster" | null
// locked_player_ids: number[] — squad builder picks forced into the solution
export const wcFantasy = {
  players:    ()     => request('/api/wc/fantasy/players'),
  optimise:   (body) => request('/api/wc/fantasy/optimise', { method: 'POST', body }),
  captains:   (top_n = 10, matchday = null) =>
    request(`/api/wc/fantasy/captains?top_n=${top_n}${matchday != null ? `&matchday=${matchday}` : ''}`),
  liveAdvice: (matchday) => request(`/api/wc/fantasy/captains/live?matchday=${matchday}`),
};

// ── Email subscriptions ───────────────────────────────────────────
export function subscribeEmail(email) {
  return request('/api/notify/subscribe', { method: 'POST', body: { email } });
}

// ── FPL (add as the app grows in July) ────────────────────────────
export const fpl = {
  nextGameweek: () => request('/gameweek/next'),
  predictions: (gw) => request(`/predictions/${gw}`),
  captains: (gw, top = 7) => request(`/captains/${gw}?top_n=${top}`),
  differentials: (gw) => request(`/differentials/${gw}`),
  fixtureTicker: (gw, weeks = 5) => request(`/fixture-ticker/${gw}?num_gws=${weeks}`),
  team: (teamId) => request(`/team/${teamId}`),
  optimise: (body) => request('/optimise', { method: 'POST', body }),
  transfers: (body) => request('/transfers', { method: 'POST', body }),
};

export { ApiError, API_URL };
