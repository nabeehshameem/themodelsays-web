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
  { id: 'ticker',   label: 'Ticker'      },
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

function GwPredictions({ predictions }) {
  if (!predictions.length) {
    return (
      <p style={{ ...lbl, textTransform: 'none', letterSpacing: 0 }}>
        No fixtures found for this gameweek yet.
      </p>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 520 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 80px 3fr 72px',
          gap: 8, padding: '4px 0 8px', borderBottom: `1px solid ${v4.border}`,
        }}>
          {['HOME', 'AWAY', 'SCORE', 'H · D · A', 'xG'].map(h => (
            <span key={h} style={lbl}>{h}</span>
          ))}
        </div>
        {predictions.map((m, i) => {
          const total = m.p_home + m.p_draw + m.p_away || 100;
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 80px 3fr 72px',
              gap: 8, padding: '9px 0', alignItems: 'center',
              borderBottom: `1px solid ${v4.border}`,
            }}>
              <span style={{ color: v4.text, fontSize: 13, fontWeight: 600 }}>{m.home}</span>
              <span style={{ color: v4.textDim, fontSize: 13 }}>{m.away}</span>
              <span style={{ color: v4.electric, fontFamily: mono, fontSize: 13, fontWeight: 700 }}>
                {m.top_scoreline}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', height: 10, borderRadius: 3, overflow: 'hidden', flex: 1, minWidth: 60 }}>
                  <div style={{ width: `${m.p_home / total * 100}%`, background: 'rgba(0,255,135,0.55)' }} />
                  <div style={{ width: `${m.p_draw / total * 100}%`, background: 'rgba(255,255,255,0.18)' }} />
                  <div style={{ width: `${m.p_away / total * 100}%`, background: 'rgba(123,46,227,0.55)' }} />
                </div>
                <span style={{ ...lbl, letterSpacing: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {m.p_home.toFixed(0)}·{m.p_draw.toFixed(0)}·{m.p_away.toFixed(0)}
                </span>
              </div>
              <span style={{ ...lbl, letterSpacing: 0 }}>
                {m.xg_home?.toFixed(2)} : {m.xg_away?.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
      <p style={{ ...lbl, marginTop: 12, textTransform: 'none', letterSpacing: 0, lineHeight: 1.5 }}>
        Green = home · grey = draw · purple = away. Top scoreline from the Dixon-Coles matrix.
      </p>
    </div>
  );
}

// ── Fixture Ticker ─────────────────────────────────────────────────

function cellStyle(xg, lo, hi) {
  const t = hi > lo ? (xg - lo) / (hi - lo) : 0.5;
  if (t >= 0.65) return { bg: 'rgba(0,255,135,0.17)', text: '#00FF87' };
  if (t >= 0.35) return { bg: 'rgba(255,176,32,0.15)', text: '#FFB020' };
  return { bg: 'rgba(255,96,96,0.15)', text: '#ff8080' };
}

function FixtureTicker({ ticker }) {
  const { teams, from_gw, to_gw } = ticker;
  const gws = [];
  for (let g = from_gw; g <= to_gw; g++) gws.push(g);

  let lo = Infinity, hi = -Infinity;
  teams.forEach(t => t.cells.forEach(c => {
    if (c.xg_for < lo) lo = c.xg_for;
    if (c.xg_for > hi) hi = c.xg_for;
  }));

  const colTemplate = `80px 56px ${gws.map(() => '72px').join(' ')}`;

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 140 + gws.length * 76 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: colTemplate,
          gap: 4, padding: '4px 0 8px', borderBottom: `1px solid ${v4.border}`,
        }}>
          <span style={lbl}>Team</span>
          <span style={{ ...lbl, textAlign: 'right' }}>xG</span>
          {gws.map(g => (
            <span key={g} style={{ ...lbl, textAlign: 'center' }}>GW{g}</span>
          ))}
        </div>

        {teams.map((t, ri) => {
          const byGw = Object.fromEntries(t.cells.map(c => [c.gw, c]));
          return (
            <div key={t.team} style={{
              display: 'grid', gridTemplateColumns: colTemplate,
              gap: 4, padding: '5px 0',
              borderBottom: `1px solid ${v4.border}`,
              background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.013)',
            }}>
              <span style={{ color: v4.text, fontSize: 13, fontWeight: 600, alignSelf: 'center' }}>
                {t.team}
              </span>
              <span style={{
                fontFamily: mono, fontSize: 12, fontWeight: 700,
                color: v4.electric, textAlign: 'right', alignSelf: 'center',
              }}>
                {t.total_xg.toFixed(1)}
              </span>
              {gws.map(g => {
                const c = byGw[g];
                if (!c) {
                  return (
                    <div key={g} style={{ textAlign: 'center', color: v4.textVeryDim, fontSize: 10, alignSelf: 'center' }}>—</div>
                  );
                }
                const { bg, text } = cellStyle(c.xg_for, lo, hi);
                return (
                  <div key={g} style={{ background: bg, borderRadius: 5, padding: '4px 4px', textAlign: 'center' }}>
                    <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: text, lineHeight: 1.3 }}>
                      {c.opponent} {c.venue}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 9, color: text, opacity: 0.75 }}>
                      {c.xg_for.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <p style={{ ...lbl, marginTop: 12, textTransform: 'none', letterSpacing: 0, lineHeight: 1.5 }}>
        Green = easy (high expected goals) · red = hard. Ordered by cumulative xG over GW{from_gw}–{to_gw}.
      </p>
    </div>
  );
}

// ── Panel ──────────────────────────────────────────────────────────

export function ToolsPanel({ gameweek }) {
  const [data, setData]   = useState(null);
  const [state, setState] = useState('loading');
  const [tab, setTab]     = useState('xi');

  useEffect(() => {
    const ac = new AbortController();
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
        if (e.name === 'AbortError') return;
        setState(e instanceof ApiError && e.status === 404 ? 'pending' : 'error');
      }
    })();
    return () => ac.abort();
  }, [gameweek]);

  if (state === 'loading') {
    return <div style={{ ...card, ...lbl, letterSpacing: 0 }}>Loading GW tools…</div>;
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
