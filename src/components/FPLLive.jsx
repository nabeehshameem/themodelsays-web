// FPLLive.jsx
//
// Two components for the FPL section, built against the real backend
// contracts (see src/lib/api.js).
//
//   <FPLSeasonPanel />   — the model's committed gameweek + season record
//   <ReceiptFlow />      — "beat the model": team id in, H2H receipt out
//
// Design notes that are contract, not taste:
//
// 1. The EMPTY SEASON is a first-class view, not an edge case. Between FPL
//    launch and GW1 being graded — roughly four weeks — /api/fpl/model/season
//    correctly returns zero gameweeks. That is what most visitors will see
//    first, so it gets real copy rather than a spinner or a dash.
//
// 2. The OPEN PUBLICATION is a feature, not a loading state. The squad is
//    published at lock time — before the deadline — and the git commit
//    timestamp is the proof. Show the squad immediately on lock, with a
//    countdown while there is still time to change your own.
//
// 3. Receipt errors are distinguished. 409 (not graded yet), 404 (no such
//    team) and 502 (FPL down) mean different things to a user and must not
//    collapse into "something went wrong".

import { useCallback, useEffect, useState } from 'react';
import { fpl, ApiError } from '../lib/api';

const v4 = {
  bg: '#0d0118', bg2: '#15032a',
  surface: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)', borderHi: 'rgba(255,255,255,0.16)',
  text: '#ffffff', textDim: '#b9aed0', textVeryDim: '#796a93',
  electric: '#00FF87', purple: '#7B2EE3', amber: '#FFB020',
};
const display = 'Space Grotesk, sans-serif';
const mono = 'JetBrains Mono, monospace';

function useIsMobile() {
  const [m, setM] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 900 : false);
  useEffect(() => {
    const f = () => setM(window.innerWidth < 900);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return m;
}

const card = {
  background: v4.surface, border: `1px solid ${v4.border}`,
  borderRadius: 14, padding: 24,
};
const label = {
  color: v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.1em', textTransform: 'uppercase',
};

function useCountdown(iso) {
  const [left, setLeft] = useState('');
  useEffect(() => {
    if (!iso) return undefined;
    let id;
    const tick = () => {
      const ms = new Date(iso).getTime() - Date.now();
      if (ms <= 0) { setLeft('deadline passed'); clearInterval(id); return; }
      const h = Math.floor(ms / 3.6e6);
      const m = Math.floor((ms % 3.6e6) / 6e4);
      setLeft(h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`);
    };
    tick();
    id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [iso]);
  return left;
}

// ── The model's current gameweek ────────────────────────────────────────────

function CommitmentCard({ gw }) {
  const left = useCountdown(gw?.deadline_utc);
  if (!gw) return null;

  const xi = (gw.squad || []).filter(p => p.is_xi);
  const bench = (gw.squad || []).filter(p => !p.is_xi)
    .sort((a, b) => a.bench_order - b.bench_order);

  const status = gw.result ? 'graded' : gw.deadline_passed ? 'submitted' : 'live';

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={label}>gameweek {gw.gameweek} · {status}</div>
        {gw.result ? (
          <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, color: v4.electric }}>
            {gw.result.net_points} pts
          </div>
        ) : !gw.deadline_passed ? (
          <div style={{ ...label, color: v4.amber }}>{left} to deadline</div>
        ) : null}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        {xi.map(p => (
          <span key={p.player_id} style={{
            fontFamily: mono, fontSize: 12,
            color: p.is_captain ? v4.bg : v4.textDim,
            background: p.is_captain ? v4.electric : 'rgba(255,255,255,0.04)',
            border: `1px solid ${p.is_captain ? v4.electric : v4.border}`,
            borderRadius: 8, padding: '5px 10px', fontWeight: p.is_captain ? 700 : 400,
          }}>
            {p.name}{p.is_captain ? ' (C)' : p.is_vice ? ' (V)' : ''}
          </span>
        ))}
      </div>

      <div style={{ ...label, marginTop: 14 }}>
        bench · {bench.map(p => p.name).join(' · ')}
      </div>

      {gw.transfers?.hits > 0 && (
        <div style={{ ...label, marginTop: 8, color: v4.amber }}>
          took a {gw.transfers.hits}-point hit
        </div>
      )}

      {gw.result?.autosubs?.length > 0 && (
        <div style={{ ...label, marginTop: 8 }}>
          auto-subs · {gw.result.autosubs
            .map(s => `${s.out.name} → ${s.in.name}`).join(', ')}
        </div>
      )}

      <div style={{ ...label, marginTop: 14, textTransform: 'none', letterSpacing: 0 }}>
        Committed {new Date(gw.locked_at_utc).toUTCString()} — published to
        the public repo before the deadline.
      </div>
    </div>
  );
}

function SeasonRecord({ season }) {
  const rows = season?.gameweeks || [];

  if (rows.length === 0) {
    return (
      <div style={card}>
        <div style={label}>season record</div>
        <p style={{ color: v4.textDim, fontSize: 14, lineHeight: 1.6, margin: '12px 0 0' }}>
          {/* Deliberately state-independent. This branch renders both before
              GW1 and for the moment before each fetch resolves, and it is what
              gets baked into the prerendered HTML — which is not rebuilt when a
              gameweek is graded. Asserting "no gameweeks graded yet" would be
              true today and a published falsehood from GW1 onward. */}
          The model's gameweek scores appear here as they are graded — every
          squad committed before the deadline, every score published afterwards,
          including the bad ones.
        </p>
      </div>
    );
  }

  const max = Math.max(...rows.map(r =>
    Math.max(r.net_points, r.fpl_average || 0)), 1);
  const { above = 0, below = 0, equal = 0 } = season.vs_average || {};

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={label}>season record</div>
        <div style={{ fontFamily: mono, fontSize: 12, color: v4.textDim }}>
          beat the average {above}/{above + below + equal}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110, marginTop: 18 }}>
        {rows.map(r => (
          <div key={r.gameweek} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 90 }}>
              <div title={`GW${r.gameweek}: model ${r.net_points}`} style={{
                width: 10, height: `${(r.net_points / max) * 100}%`,
                background: v4.electric, borderRadius: '2px 2px 0 0',
              }} />
              {r.fpl_average != null && (
                <div title={`FPL average ${r.fpl_average}`} style={{
                  width: 10, height: `${(r.fpl_average / max) * 100}%`,
                  background: v4.textVeryDim, borderRadius: '2px 2px 0 0',
                }} />
              )}
            </div>
            <div style={{ ...label, fontSize: 9 }}>{r.gameweek}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 18, marginTop: 16 }}>
        <div>
          <div style={label}>model total</div>
          <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: v4.electric }}>
            {season.model_total}
          </div>
        </div>
        <div>
          <div style={label}>fpl average</div>
          <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: v4.textVeryDim }}>
            {season.average_total}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FPLSeasonPanel({ gameweek }) {
  const mobile = useIsMobile();
  const [season, setSeason] = useState(null);
  const [gw, setGw] = useState(null);
  const [state, setState] = useState('ready');

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const s = await fpl.season({ signal: ac.signal });
        setSeason(s);
        // Latest graded GW, or the explicit one passed in.
        const target = gameweek
          ?? (s.gameweeks.length ? s.gameweeks[s.gameweeks.length - 1].gameweek + 1 : 1);
        try {
          setGw(await fpl.modelGameweek(target, { signal: ac.signal }));
        } catch (e) {
          // 404 = not locked yet. Legitimate pre-season state, not a failure.
          if (!(e instanceof ApiError && e.status === 404)) throw e;
        }
        setState('ready');
      } catch (e) {
        if (e.name !== 'AbortError') setState('error');
      }
    })();
    return () => ac.abort();
  }, [gameweek]);

  if (state === 'loading') {
    return <div style={{ ...card, color: v4.textVeryDim, fontFamily: mono, fontSize: 12 }}>Loading the model's season…</div>;
  }
  if (state === 'error') {
    return (
      <div style={{ ...card, borderColor: 'rgba(255,176,32,0.3)' }}>
        <div style={{ ...label, color: v4.amber }}>temporarily unavailable</div>
        <p style={{ color: v4.textDim, fontSize: 14, margin: '10px 0 0' }}>
          The season record can't be reached right now. The committed squads
          are still public in the repo — nothing depends on this page being up.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16 }}>
      {gw ? <CommitmentCard gw={gw} /> : (
        <div style={card}>
          <div style={label}>next gameweek</div>
          <p style={{ color: v4.textDim, fontSize: 14, lineHeight: 1.6, margin: '12px 0 0' }}>
            The squad publishes when the model locks, before each deadline —
            committed to the public repo. The git timestamp is the proof it
            was not changed afterwards.
          </p>
        </div>
      )}
      <SeasonRecord season={season} />
    </div>
  );
}

// ── Beat the model ──────────────────────────────────────────────────────────

const ERRORS = {
  409: gw => `Gameweek ${gw} hasn't been graded yet. Receipts appear once the gameweek finishes and bonus points settle — usually the Monday after.`,
  404: () => "We couldn't find that team ID. It's the number in your FPL team's URL: fantasy.premierleague.com/entry/YOUR-ID/event/1",
  502: () => "FPL's own API isn't responding right now. Nothing's wrong with your team — try again in a few minutes.",
};

const inputStyle = {
  background: 'rgba(0,0,0,0.3)', border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: 10, padding: '12px 14px', color: '#ffffff',
  fontFamily: 'JetBrains Mono, monospace', fontSize: 14, outline: 'none', width: '100%',
};

function tabStyle(active) {
  return {
    background: active ? '#00FF87' : 'transparent',
    color: active ? '#0d0118' : '#b9aed0',
    border: `1px solid ${active ? '#00FF87' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 8, padding: '8px 16px',
    fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13,
    cursor: 'pointer',
  };
}

export function ReceiptFlow({ gameweek }) {
  const [mode, setMode] = useState('id');
  const [teamId, setTeamId] = useState('');
  const [points, setPoints] = useState('');
  const [gw, setGw] = useState(gameweek ?? '');
  const [receipt, setReceipt] = useState(null);
  const [manual, setManual] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const reset = () => { setReceipt(null); setManual(null); setErr(null); };

  const submitId = useCallback(async () => {
    const id = parseInt(teamId, 10);
    const g = parseInt(gw, 10);
    if (!id || !g) { setErr('Enter your FPL team ID and a gameweek.'); return; }
    setBusy(true); reset();
    try {
      setReceipt(await fpl.receipt(g, id));
    } catch (e) {
      const build = e instanceof ApiError ? ERRORS[e.status] : null;
      setErr(build ? build(g) : 'Something went wrong fetching that receipt.');
    } finally {
      setBusy(false);
    }
  }, [teamId, gw]);

  const submitPoints = useCallback(async () => {
    const p = parseInt(points, 10);
    const g = parseInt(gw, 10);
    if (!p || !g) { setErr('Enter your points and a gameweek.'); return; }
    setBusy(true); reset();
    try {
      const modelGw = await fpl.modelGameweek(g);
      if (!modelGw?.result) {
        setErr(ERRORS[409](g));
      } else {
        setManual({ userPoints: p, modelPoints: modelGw.result.net_points, gameweek: g });
      }
    } catch (e) {
      // 404 = GW not locked yet, treat same as ungraded
      if (e instanceof ApiError && e.status === 404) {
        setErr(ERRORS[409](g));
      } else {
        const build = e instanceof ApiError ? ERRORS[e.status] : null;
        setErr(build ? build(g) : "Something went wrong fetching the model's score.");
      }
    } finally {
      setBusy(false);
    }
  }, [points, gw]);

  return (
    <div style={card}>
      <div style={label}>beat the model</div>
      <p style={{ color: v4.textDim, fontSize: 14, lineHeight: 1.55, margin: '12px 0 18px' }}>
        The model plays by your rules — one squad, real budget, real transfers,
        hits paid. See how you did against it.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button style={tabStyle(mode === 'id')}
                onClick={() => { setMode('id'); reset(); }}>
          Team ID
        </button>
        <button style={tabStyle(mode === 'points')}
                onClick={() => { setMode('points'); reset(); }}>
          Just my points
        </button>
      </div>

      {mode === 'id' ? (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 180px' }}>
              <input style={inputStyle} inputMode="numeric" placeholder="FPL team ID"
                     value={teamId} onChange={e => setTeamId(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && submitId()} />
            </div>
            <div style={{ flex: '1 1 90px' }}>
              <input style={inputStyle} inputMode="numeric" placeholder="GW"
                     value={gw} onChange={e => setGw(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && submitId()} />
            </div>
            <button onClick={submitId} disabled={busy} style={{
              background: busy ? v4.textVeryDim : v4.electric, color: v4.bg,
              border: 'none', borderRadius: 10, padding: '12px 22px',
              fontFamily: display, fontWeight: 700, fontSize: 14,
              cursor: busy ? 'default' : 'pointer',
            }}>
              {busy ? 'Checking…' : 'Get receipt'}
            </button>
          </div>

          <button onClick={() => setHelpOpen(h => !h)} style={{
            background: 'none', border: 'none', padding: '10px 0 0',
            color: v4.textVeryDim, fontFamily: mono, fontSize: 11,
            cursor: 'pointer', textDecoration: 'underline',
          }}>
            {helpOpen ? '▲' : '▼'} Where do I find my team ID?
          </button>
          {helpOpen && (
            <div style={{
              marginTop: 8, padding: '12px 14px', borderRadius: 10,
              background: 'rgba(0,0,0,0.25)', border: `1px solid ${v4.border}`,
              color: v4.textDim, fontSize: 13, lineHeight: 1.7,
            }}>
              <div>1. Open FPL in a <strong style={{ color: v4.text }}>browser</strong> (not the app).</div>
              <div>2. Click <strong style={{ color: v4.text }}>Points</strong> in the top nav, or <strong style={{ color: v4.text }}>View Gameweek History</strong> from Pick Team.</div>
              <div>3. The URL reads <span style={{ fontFamily: mono, color: v4.electric }}>/entry/YOUR-ID/event/…</span> — that number is your team ID.</div>
              <div>4. It only exists once you've entered a squad and played a gameweek.</div>
              <div style={{ marginTop: 8, color: v4.textVeryDim, fontSize: 11 }}>
                IDs may change between seasons — check it each year.
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 180px' }}>
            <input style={inputStyle} inputMode="numeric" placeholder="Your points this GW"
                   value={points} onChange={e => setPoints(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && submitPoints()} />
          </div>
          <div style={{ flex: '1 1 90px' }}>
            <input style={inputStyle} inputMode="numeric" placeholder="GW"
                   value={gw} onChange={e => setGw(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && submitPoints()} />
          </div>
          <button onClick={submitPoints} disabled={busy} style={{
            background: 'transparent', color: v4.textDim,
            border: `1px solid ${v4.border}`, borderRadius: 10, padding: '12px 22px',
            fontFamily: display, fontWeight: 700, fontSize: 14,
            cursor: busy ? 'default' : 'pointer',
          }}>
            {busy ? 'Checking…' : 'Compare'}
          </button>
        </div>
      )}

      {busy && mode === 'id' && (
        <div style={{ ...label, marginTop: 12, textTransform: 'none', letterSpacing: 0 }}>
          First look-up for a team pulls every graded gameweek so the season
          record is complete — this can take a few seconds. It's instant after that.
        </div>
      )}

      {err && (
        <div style={{
          marginTop: 16, padding: '12px 14px', borderRadius: 10,
          background: 'rgba(255,176,32,0.08)',
          border: '1px solid rgba(255,176,32,0.25)',
          color: v4.textDim, fontSize: 13, lineHeight: 1.55,
        }}>{err}</div>
      )}

      {receipt && <Receipt r={receipt} />}
      {manual && (
        <ManualResult m={manual} onUpgrade={() => {
          setMode('id'); setManual(null); setErr(null);
        }} />
      )}
    </div>
  );
}

function Receipt({ r }) {
  const won = r.winner === 'user';
  const drew = r.winner === 'draw';
  const colour = won ? v4.electric : drew ? v4.amber : v4.textDim;
  const share = fpl.shareUrl(r.gameweek, r.user.team_id);

  const score = (name, pts, highlight) => (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ ...label, marginBottom: 6 }}>{name}</div>
      <div style={{
        fontFamily: mono, fontSize: 44, fontWeight: 700,
        color: highlight ? colour : v4.textDim, lineHeight: 1,
      }}>{pts}</div>
    </div>
  );

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${v4.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {score(r.user.team_name || 'You', r.user.points_net, won)}
        <div style={{ ...label, fontSize: 13 }}>vs</div>
        {score('The Model', r.model.net_points, r.winner === 'model')}
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <div style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: colour }}>
          {won ? 'You beat the model' : drew ? 'Dead heat' : 'The model beat you'}
        </div>
        <div style={{ ...label, marginTop: 8 }}>
          season · you {r.h2h_season.user} — {r.h2h_season.model} model
          {r.h2h_season.draws ? ` · ${r.h2h_season.draws} drawn` : ''}
        </div>
        {r.user.hit_points > 0 && (
          <div style={{ ...label, marginTop: 6, color: v4.amber }}>
            includes your −{r.user.hit_points} for transfers
          </div>
        )}
      </div>

      <a href={share} target="_blank" rel="noopener noreferrer" style={{
        display: 'block', textAlign: 'center', marginTop: 18,
        padding: '12px 20px', borderRadius: 10,
        border: `1px solid ${v4.borderHi}`, color: v4.text,
        fontFamily: display, fontWeight: 700, fontSize: 14, textDecoration: 'none',
      }}>
        Share this receipt →
      </a>
    </div>
  );
}

function ManualResult({ m, onUpgrade }) {
  const won = m.userPoints > m.modelPoints;
  const drew = m.userPoints === m.modelPoints;
  const colour = won ? v4.electric : drew ? v4.amber : v4.textDim;

  const score = (name, pts, highlight, sub) => (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ ...label, marginBottom: sub ? 2 : 6 }}>{name}</div>
      {sub && (
        <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, marginBottom: 4 }}>
          {sub}
        </div>
      )}
      <div style={{
        fontFamily: mono, fontSize: 44, fontWeight: 700,
        color: highlight ? colour : v4.textDim, lineHeight: 1,
      }}>{pts}</div>
    </div>
  );

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${v4.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {score('You', m.userPoints, won, 'self-reported')}
        <div style={{ ...label, fontSize: 13 }}>vs</div>
        {score('The Model', m.modelPoints, !won && !drew)}
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <div style={{ fontFamily: display, fontSize: 16, fontWeight: 700, color: colour }}>
          {won ? 'You beat the model' : drew ? 'Dead heat' : 'The model beat you'}
        </div>
        <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
          The model's score is from the verified graded record. Your score is self-reported.
        </div>
      </div>

      <button onClick={onUpgrade} style={{
        display: 'block', width: '100%', marginTop: 18,
        padding: '12px 20px', borderRadius: 10,
        background: 'transparent',
        border: `1px solid ${v4.borderHi}`, color: v4.textDim,
        fontFamily: display, fontWeight: 700, fontSize: 13,
        cursor: 'pointer', textAlign: 'center',
      }}>
        Use your team ID for a verified, shareable receipt →
      </button>
    </div>
  );
}
