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
//   most_likely, home_first_pct, away_first_pct, no_goal_pct,
//   home_scorers, away_scorers
// }
export function predictWorldCupMatch({ home, away }) {
  return request('/api/wc/predict', {
    method: 'POST',
    body: { home_team: home, away_team: away },
  });
}

// GET /api/wc/simulate?n_sim=10000 → {
//   teams: [{ team, group, r32_pct, qf_pct, sf_pct, final_pct, win_pct }],
//   n_sim: number
// }
export function fetchSimulation(nSim = 10_000) {
  return request(`/api/wc/simulate?n_sim=${nSim}`);
}

// GET /api/wc/standings → {
//   groups: { [A-L]: [{ team, pos, pts, gd, pos_locked, qualified_locked, top2_locked_out }] }
// }
export function fetchStandings() {
  return request('/api/wc/standings');
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

// ── FPL: The Model's season ───────────────────────────────────────
//
// Endpoint contracts are fixed by the backend (src/fpl_api.py,
// src/fpl_receipts.py). Response shapes are documented here because the
// disclosure rules matter to the UI: before a deadline the model's squad is
// deliberately withheld, and the frontend must render that state rather than
// treat it as an error.

// GET /api/fpl/model/gw/{gw}
//
// Two states:
//
//  404  → gameweek not locked yet
//
//  200  → locked: squad visible immediately (open publication — the git commit
//         timestamp proves it was committed before the deadline).
//    { gameweek, locked_at_utc, deadline_utc, squad_hash, deadline_passed,
//      squad: [{ player_id, name, position, team, price,
//                is_xi, is_captain, is_vice, bench_order }],
//      transfers: { in: [...], out: [...], hits },
//      free_transfers, bank, expected_points,
//      result: null | {       → null until the gameweek is graded
//        gross_points, hit_points, net_points,
//        effective_captain: { player_id, name, ... } | null,
//        autosubs: [{ out: {...}, in: {...} }],
//        graded_at_utc } }
//
//  deadline_passed: use for "still time to change yours" copy, NOT to gate
//  the squad display — the squad is always visible once the GW is locked.
export function fetchModelGameweek(gw, { signal } = {}) {
  return request(`/api/fpl/model/gw/${gw}`, { signal });
}

// GET /api/fpl/model/season → {
//   gameweeks: [{ gameweek, net_points, hit_points, fpl_average, cumulative }],
//   model_total, average_total,
//   vs_average: { above, below, equal }
// }
//
// Before the first graded gameweek this correctly returns an EMPTY season:
// { gameweeks: [], model_total: 0, average_total: 0,
//   vs_average: { above: 0, below: 0, equal: 0 } }
// That is the site's initial state for the weeks between launch and GW1
// being graded — build it as a first-class view, not an edge case.
export function fetchModelSeason({ signal } = {}) {
  return request('/api/fpl/model/season', { signal });
}

// GET /api/fpl/receipt/{gw}/{teamId} → {
//   gameweek,
//   user:  { team_id, team_name, points_gross, hit_points, points_net },
//   model: { net_points },
//   winner: 'user' | 'model' | 'draw',
//   h2h_season: { user, model, draws },
//   from_cache: boolean
// }
//
// Error states the UI must distinguish:
//   409 → gameweek exists but is not graded yet ("check back after the GW")
//   404 → no such FPL team id ("we couldn't find that team")
//   502 → FPL's API is unreachable ("FPL is down, try later") — not the
//         user's fault, and retrying later will work.
//
// First call for a team backfills every graded gameweek so the season H2H is
// complete; it can take a few seconds. Show a spinner, and note that repeat
// calls are served from cache instantly.
export function fetchReceipt(gw, teamId, { signal } = {}) {
  return request(`/api/fpl/receipt/${gw}/${teamId}`, { signal });
}

// Shareable receipt URLs. These are served by the BACKEND, not this SPA:
// /r/ is a server-rendered page carrying og: tags so links unfurl on
// Twitter/Reddit (crawlers never execute our JS). Link to them; don't try to
// route them in React.
export function receiptShareUrl(gw, teamId) {
  return `${API_URL}/r/${gw}/${teamId}`;
}
export function receiptCardUrl(gw, teamId, fmt = 'og') {
  return `${API_URL}/card/${gw}/${teamId}.png?fmt=${fmt}`;
}

// GET /api/fpl/projections/{gw} → {
//   gameweek, deadline_utc, generated_at_utc, model,
//   captain_candidates: [{ player_id, name, team, position, price,
//                          projected_points, opponent, venue }],
//   by_position: { GK: [...], DEF: [...], MID: [...], FWD: [...] },
//   excluded: [{ player_id, name, team }],
//   note
// }
//
// The only endpoint that is useful BEFORE a deadline. Published when the model
// locks (about 10h out) and readable immediately, unlike the squad — these are
// the model's view of every player, not its selection, so they carry neither
// the squad nor the hash. 404 until the lock has run for that gameweek.
export function fetchProjections(gw, { signal } = {}) {
  return request(`/api/fpl/projections/${gw}`, { signal });
}

export const fpl = {
  projections: fetchProjections,
  modelGameweek: fetchModelGameweek,
  season: fetchModelSeason,
  receipt: fetchReceipt,
  shareUrl: receiptShareUrl,
  cardUrl: receiptCardUrl,
};

export { ApiError, API_URL };
