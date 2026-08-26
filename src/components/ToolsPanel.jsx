import { useEffect, useState } from 'react';
import { fpl, ApiError } from '../lib/api';

const v4 = {
  surface:     'rgba(255,255,255,0.03)',
  border:      'rgba(255,255,255,0.08)',
  text:        '#ffffff',
  textDim:     '#b9aed0',
  textVeryDim: '#796a93',
  electric:    '#00FF87',
  amber:       '#FFB020',
};
const display = 'Space Grotesk, sans-serif';
const mono    = 'JetBrains Mono, monospace';

const card = {
  background: v4.surface, border: `1px solid ${v4.border}`,
  borderRadius: 14, padding: 24,
};
const lbl = {
  color: v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.1em', textTransform: 'uppercase',
};

const TABS = [
  { id: 'xi',       label: 'Optimal XI'  },
  { id: 'captain',  label: 'Captain'     },
  { id: 'fixtures', label: 'GW Fixtures' },
  { id: 'ticker',   label: 'Schedule'    },
];

const POS_ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

// ── Optimal XI ─────────────────────────────────────────────────────

function PlayerRow({ p }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 10, padding: '7px 0',
      borderBottom: `1px solid ${v4.border}`,
    }}>
      <span style={{ ...lbl, minWidth: 30 }}>{p.position}</span>
      <span style={{ color: p.is_captain ? v4.electric : v4.text, fontSize: 14, fontWeight: p.is_captain ? 700 : 400, flex: 1 }}>
        {p.name}
        {p.is_captain && (
          <span style={{
            fontFamily: mono, fontSize: 9, fontWeight: 800, marginLeft: 6,
            color: v4.electric, background: 'rgba(0,255,135,0.14)',
            padding: '2px 6px', borderRadius: 4,
          }}>C</span>
        )}
      </span>
      <span style={{ ...lbl, letterSpacing: 0 }}>{p.team}</span>
      <span style={{ ...lbl, letterSpacing: 0, minWidth: 44, textAlign: 'right' }}>
        £{p.price?.toFixed(1)}m
      </span>
      <span style={{
        fontFamily: mono, fontSize: 14, fontWeight: 700,
        color: p.is_captain ? v4.electric : v4.textDim,
        minWidth: 40, textAlign: 'right',
      }}>{p.projected_points?.toFixed(1)}</span>
    </div>
  );
}

function OptimalXI({ xi }) {
  const sorted = [...xi.players].sort(
    (a, b) => (POS_ORDER[a.position] ?? 9) - (POS_ORDER[b.position] ?? 9)
  );
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <div style={{ ...lbl, color: v4.electric }}>formation: {xi.formation}</div>
        <div style={lbl}>{xi.total_projected?.toFixed(1)} xPts</div>
      </div>
      {sorted.map(p => <PlayerRow key={p.player_id} p={p} />)}
      <p style={{ ...lbl, marginTop: 12, textTransform: 'none', letterSpacing: 0, lineHeight: 1.5 }}>
        {xi.note}
      </p>
    </div>
  );
}

// ── Captain ────────────────────────────────────────────────────────

function CaptainList({ captain }) {
  return (
    <div>
      <div style={{ ...lbl, color: v4.electric, marginBottom: 12 }}>
        top picks · doubling gain
      </div>
      {captain.map((p, i) => (
        <div key={p.player_id} style={{
          display: 'flex', alignItems: 'baseline', gap: 10, padding: '7px 0',
          borderBottom: `1px solid ${v4.border}`,
        }}>
          <span style={{ ...lbl, minWidth: 16 }}>{i + 1}</span>
          <span style={{
            color: i === 0 ? v4.electric : v4.text, fontSize: 14,
            fontWeight: i === 0 ? 700 : 400, flex: 1,
          }}>{p.name}</span>
          <span style={{ ...lbl, letterSpacing: 0 }}>
            {p.team}{p.opponent ? ` ${p.venue === 'H' ? 'v' : '@'} ${p.opponent}` : ''}
          </span>
          <span style={{
            fontFamily: mono, fontSize: 12, fontWeight: 700,
            color: i === 0 ? v4.electric : v4.textDim,
            minWidth: 54, textAlign: 'right',
          }}>+{p.captain_delta?.toFixed(1)}</span>
        </div>
      ))}
      <p style={{ ...lbl, marginTop: 12, textTransform: 'none', letterSpacing: 0, lineHeight: 1.5 }}>
        Captain delta = projected points doubled. The model's actual captain is committed with its squad.
      </p>
    </div>
  );
}

// ── GW Predictions ─────────────────────────────────────────────────

function fmtKickoff(utc) {
  const d = new Date(utc);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function GwPredictions({ predictions }) {
  if (!predictions.length) {
    return (
      <p style={{ ...lbl, textTransform: 'none', letterSpacing: 0 }}>
        No fixtures found for this gameweek yet.
      </p>
    );
  }

  // Group by date
  const byDate = [];
  const seen = {};
  [...predictions]
    .sort((a, b) => new Date(a.kickoff_utc) - new Date(b.kickoff_utc))
    .forEach(m => {
      const d = fmtKickoff(m.kickoff_utc);
      if (!seen[d]) { seen[d] = true; byDate.push({ date: d, matches: [] }); }
      byDate[byDate.length - 1].matches.push(m);
    });

  return (
    <div>
      {byDate.map(({ date, matches }) => (
        <div key={date}>
          <div style={{ ...lbl, color: v4.textVeryDim, marginTop: 14, marginBottom: 2 }}>{date}</div>
          {matches.map((m, i) => {
            // Which side is the model backing?
            const homeWins = m.p_home > m.p_away && m.p_home > m.p_draw;
            const awayWins = m.p_away > m.p_home && m.p_away > m.p_draw;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 0', borderBottom: `1px solid ${v4.border}`,
              }}>
                <span style={{
                  flex: 1, textAlign: 'right', fontSize: 14,
                  fontWeight: homeWins ? 700 : 400,
                  color: homeWins ? v4.text : v4.textDim,
                }}>{m.home}</span>

                {/* xG is continuous so it differentiates every fixture; rounding to an integer
                    "scoreline" produces contradictions (e.g. ARS 1.46 rounds to 1-1 despite
                    a 56% win probability and top_scoreline of 1-0 in the committed JSON). */}
                <span style={{ minWidth: 96, textAlign: 'center' }}>
                  <span style={{
                    display: 'block', fontFamily: mono, fontSize: 15,
                    fontWeight: 700, color: v4.electric,
                  }}>{m.xg_home.toFixed(1)} – {m.xg_away.toFixed(1)}</span>
                  <span style={{
                    display: 'block', ...lbl, letterSpacing: 0, marginTop: 2,
                  }}>xG · likeliest {m.top_scoreline}</span>
                </span>

                <span style={{
                  flex: 1, fontSize: 14,
                  fontWeight: awayWins ? 700 : 400,
                  color: awayWins ? v4.text : v4.textDim,
                }}>{m.away}</span>

                <span style={{
                  ...lbl, letterSpacing: 0, minWidth: 88, textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}>
                  {m.p_home.toFixed(0)}% · {m.p_draw.toFixed(0)}% · {m.p_away.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      ))}
      <p style={{ ...lbl, marginTop: 14, textTransform: 'none', letterSpacing: 0, lineHeight: 1.5 }}>
        xG from the Dixon-Coles model. Likeliest = modal exact scoreline. Win% as Home · Draw · Away.
        Bold team = model favourite.
      </p>
    </div>
  );
}

// ── Attack Schedule ─────────────────────────────────────────────────
// Ranked by cumulative attacking xG from the DC model. Each team's
// upcoming fixtures are shown as inline pills, coloured by per-fixture
// xG — green = favourable attacking match, red = tough.

function pillColor(xg, lo, hi) {
  const t = hi > lo ? (xg - lo) / (hi - lo) : 0.5;
  if (t >= 0.65) return { bg: 'rgba(0,255,135,0.15)', text: '#00FF87', border: 'rgba(0,255,135,0.3)' };
  if (t >= 0.35) return { bg: 'rgba(255,176,32,0.12)', text: '#FFB020', border: 'rgba(255,176,32,0.28)' };
  return { bg: 'rgba(255,100,100,0.12)', text: '#ff8080', border: 'rgba(255,100,100,0.28)' };
}

function FixtureTicker({ ticker }) {
  const { teams, from_gw, to_gw } = ticker;

  let lo = Infinity, hi = -Infinity;
  teams.forEach(t => t.cells.forEach(c => {
    if (c.xg_for < lo) lo = c.xg_for;
    if (c.xg_for > hi) hi = c.xg_for;
  }));

  const sorted = [...teams].sort((a, b) => b.total_xg - a.total_xg);
  const maxXg = sorted[0]?.total_xg || 1;

  return (
    <div>
      <div style={{ ...lbl, color: v4.textVeryDim, marginBottom: 14 }}>
        attack schedule · GW{from_gw}–{to_gw} · ranked by total expected goals scored
      </div>
      {sorted.map((t, ri) => (
        <div key={t.team} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 0', borderBottom: `1px solid ${v4.border}`,
        }}>
          <span style={{ ...lbl, minWidth: 20, textAlign: 'right' }}>{ri + 1}</span>
          <span style={{ color: v4.text, fontSize: 13, fontWeight: 700, minWidth: 38 }}>
            {t.team}
          </span>

          {/* xG bar */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, maxWidth: 120 }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${(t.total_xg / maxXg) * 100}%`,
                background: 'rgba(0,255,135,0.5)',
              }} />
            </div>
            <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: v4.electric, minWidth: 30 }}>
              {t.total_xg.toFixed(1)}
            </span>
          </div>

          {/* Fixture pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {t.cells.map(c => {
              const { bg, text, border } = pillColor(c.xg_for, lo, hi);
              return (
                <span key={c.gw} title={`GW${c.gw} · ${c.xg_for.toFixed(2)} xG`} style={{
                  fontFamily: mono, fontSize: 10, fontWeight: 700,
                  color: text, background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 5, padding: '2px 6px',
                  letterSpacing: '0.03em', whiteSpace: 'nowrap',
                  cursor: 'default',
                }}>
                  {c.opponent} {c.venue}
                </span>
              );
            })}
          </div>
        </div>
      ))}
      <p style={{ ...lbl, marginTop: 14, textTransform: 'none', letterSpacing: 0, lineHeight: 1.5 }}>
        Total xG = cumulative expected goals scored over GW{from_gw}–{to_gw} per the Dixon-Coles model.
        Green pill = good attacking fixture · red = hard · hover a pill to see expected goals.
      </p>
    </div>
  );
}

// ── Panel ──────────────────────────────────────────────────────────

export function ToolsPanel({ gameweek }) {
  const [data, setData]   = useState(null);
  const [state, setState] = useState('init');
  const [tab, setTab]     = useState('xi');

  useEffect(() => {
    const ac = new AbortController();
    // A request that never settles used to leave this panel showing its
    // initial state indefinitely - which is exactly how the site came to look
    // abandoned. Time it out and show the designed error instead.
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; ac.abort(); }, 10000);
    (async () => {
      try {
        let gw = gameweek;
        if (!gw) {
          const season = await fpl.season({ signal: ac.signal });
          const graded = season?.gameweeks ?? [];
          gw = graded.length ? graded[graded.length - 1].gameweek + 1 : 1;
        }
        setData(await fpl.tools(gw, { signal: ac.signal }));
        setState('ready');
      } catch (e) {
        if (e.name === 'AbortError' && !timedOut) return;   // unmount: silent
        setState(e instanceof ApiError && e.status === 404 ? 'pending' : 'error');
      }
    })().finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); ac.abort(); };
  }, [gameweek]);

  // Initial state, and therefore what the PRERENDERER bakes into the static
  // HTML that every visitor and crawler sees first. It must never read as
  // "Loading…": if the client fetch fails, that string is what stays on screen
  // permanently, which is precisely how the site came to look abandoned. A
  // skeleton shows the shape of real content and makes no claim.
  if (state === 'init') {
    return (
      <div style={card}>
        <div style={lbl}>{'gw tools'}</div>
        <div aria-hidden style={{ marginTop: 14 }}>
          {[92, 78, 85, 70, 88].map((w, i) => (
            <div key={i} style={{
              height: 12, width: `${w}%`, marginBottom: 10, borderRadius: 4,
              background: 'linear-gradient(90deg,rgba(255,255,255,.07),'
                        + 'rgba(255,255,255,.03))',
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (state === 'pending') {
    return (
      <div style={card}>
        <div style={lbl}>gw tools</div>
        <p style={{ color: v4.textDim, fontSize: 14, lineHeight: 1.6, margin: '12px 0 0' }}>
          The GW tools — optimal XI, captain picks, scoreline predictions, fixture ticker —
          are published about 24 hours before each deadline, alongside the model's squad and projections.
        </p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{ ...card, borderColor: 'rgba(255,176,32,0.3)' }}>
        <div style={{ ...lbl, color: v4.amber }}>tools unavailable</div>
        <p style={{ color: v4.textDim, fontSize: 14, margin: '10px 0 0' }}>
          Can't reach the tools endpoint right now. They're committed in the public repo.
        </p>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <div style={lbl}>gw{data.gameweek} tools</div>
        <div style={{ ...lbl, letterSpacing: 0 }}>model: {data.model}</div>
      </div>

      <div style={{
        display: 'flex', gap: 20, borderBottom: `1px solid ${v4.border}`, marginBottom: 20,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0 0 10px', marginBottom: -1,
            fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: tab === t.id ? v4.electric : v4.textVeryDim,
            borderBottom: `2px solid ${tab === t.id ? v4.electric : 'transparent'}`,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'xi'       && <OptimalXI xi={data.optimal_xi} />}
      {tab === 'captain'  && <CaptainList captain={data.captain} />}
      {tab === 'fixtures' && <GwPredictions predictions={data.gw_predictions} />}
      {tab === 'ticker'   && <FixtureTicker ticker={data.fixture_ticker} />}
    </div>
  );
}
