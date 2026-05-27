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
// POST /api/wc/predict — used by the score predictor widget.
// Returns { home_score, away_score, win_prob, draw_prob, ... } — confirm shape
// against the Railway endpoint and adjust callers as needed.
export function predictWorldCupMatch({ home, away, stage = 'group' }) {
  return request('/api/wc/predict', {
    method: 'POST',
    body: { home, away, stage },
  });
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
