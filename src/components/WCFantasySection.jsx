import React from 'react';
import { wcFantasy } from '../lib/api.js';

const v4 = {
  bg: '#0d0118', bg2: '#15032a', bg3: '#1f0a3d',
  surface: 'rgba(255,255,255,0.03)', surfaceHi: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)', borderHi: 'rgba(255,255,255,0.16)',
  text: '#ffffff', textDim: '#b9aed0', textVeryDim: '#796a93',
  electric: '#00FF87', green: '#02EFFF', pink: '#FF2882',
  purple: '#7B2EE3', amber: '#FFB020', red: '#ff5577',
};
const display = 'Space Grotesk, sans-serif';
const mono    = 'JetBrains Mono, monospace';

const POS_COLOR = { GK: '#FFB020', DEF: '#02EFFF', MID: '#7B2EE3', FWD: '#FF2882' };

function PosBadge({ pos }) {
  return (
    <span style={{
      background: `${POS_COLOR[pos]}22`,
      border: `1px solid ${POS_COLOR[pos]}55`,
      color: POS_COLOR[pos],
      fontFamily: mono, fontSize: 9, fontWeight: 700,
      letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 4,
      textTransform: 'uppercase',
    }}>{pos}</span>
  );
}

function Spinner() {
  React.useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('wfs-spin')) {
      const s = document.createElement('style');
      s.id = 'wfs-spin';
      s.textContent = '@keyframes wfsSpin { to { transform: rotate(360deg); } }';
      document.head.appendChild(s);
    }
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: `3px solid ${v4.border}`, borderTopColor: v4.electric,
        animation: 'wfsSpin 0.75s linear infinite',
      }} />
      <div style={{ color: v4.textDim, fontFamily: mono, fontSize: 11, letterSpacing: '0.08em' }}>RUNNING OPTIMIZER…</div>
    </div>
  );
}

function PlayerRow({ player, rank }) {
  const isCaptain = player.is_captain;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: isCaptain ? 'rgba(0,255,135,0.07)' : 'transparent',
      borderBottom: `1px solid ${v4.border}`,
      borderRadius: isCaptain ? 8 : 0,
    }}>
      {rank != null && (
        <div style={{ width: 20, fontFamily: mono, fontSize: 11, color: v4.textVeryDim, textAlign: 'center', flexShrink: 0 }}>{rank}</div>
      )}
      <PosBadge pos={player.pos} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: display, fontSize: 14, fontWeight: 600, color: isCaptain ? v4.electric : v4.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {player.name}
          </span>
          {isCaptain && (
            <span style={{ fontFamily: mono, fontSize: 9, color: v4.electric, background: 'rgba(0,255,135,0.15)', border: '1px solid rgba(0,255,135,0.3)', padding: '1px 5px', borderRadius: 3, letterSpacing: '0.08em', flexShrink: 0 }}>C</span>
          )}
        </div>
        <div style={{ fontFamily: mono, fontSize: 10, color: v4.textVeryDim, marginTop: 1 }}>{player.team}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: isCaptain ? v4.electric : v4.text }}>
          {player.projected_pts.toFixed(1)}
          <span style={{ fontSize: 10, color: v4.textVeryDim, fontWeight: 400 }}> pts</span>
        </div>
        <div style={{ fontFamily: mono, fontSize: 10, color: v4.textVeryDim }}>${player.price_m.toFixed(1)}m</div>
      </div>
    </div>
  );
}

function SquadSection({ label, players, color }) {
  if (!players.length) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
        color: color, textTransform: 'uppercase', padding: '6px 14px',
        background: `${color}11`,
      }}>{label} ({players.length})</div>
      {players.map(p => <PlayerRow key={p.id} player={p} />)}
    </div>
  );
}

// ── Squad Optimizer ──────────────────────────────────────────────────────────

function SquadOptimizer() {
  const [status, setStatus] = React.useState('idle');
  const [result, setResult] = React.useState(null);
  const [errMsg, setErrMsg] = React.useState('');

  async function handleOptimise() {
    setStatus('loading');
    setResult(null);
    setErrMsg('');
    try {
      const data = await wcFantasy.optimise({ budget: 1000 });
      setResult(data);
      setStatus('success');
    } catch (e) {
      setErrMsg(e.message || 'Optimisation failed — try again.');
      setStatus('error');
    }
  }

  const byPos = (pos) => (result?.squad || []).filter(p => p.pos === pos);

  return (
    <div>
      <button
        onClick={handleOptimise}
        disabled={status === 'loading'}
        style={{
          width: '100%', padding: '13px 0',
          background: status !== 'loading' ? v4.electric : 'rgba(0,255,135,0.15)',
          color: status !== 'loading' ? v4.bg : v4.textVeryDim,
          border: 0, borderRadius: 10,
          fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          fontFamily: display, cursor: status !== 'loading' ? 'pointer' : 'not-allowed',
          boxShadow: status !== 'loading' ? '0 4px 20px rgba(0,255,135,0.28)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {status === 'loading' ? 'Optimising…' : 'Optimise squad →'}
      </button>

      {status === 'loading' && <Spinner />}

      {status === 'error' && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,85,119,0.1)', border: `1px solid rgba(255,85,119,0.3)`, borderRadius: 10, color: v4.red, fontFamily: mono, fontSize: 12 }}>
          {errMsg}
        </div>
      )}

      {status === 'success' && result && (
        <div style={{ marginTop: 20 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', marginBottom: 12,
            background: 'rgba(0,255,135,0.06)', border: `1px solid rgba(0,255,135,0.2)`,
            borderRadius: 10,
          }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 10, color: v4.textVeryDim, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Projected points</div>
              <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: v4.electric }}>{result.total_pts.toFixed(1)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: v4.textVeryDim, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Total cost</div>
              <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: v4.text }}>${result.total_cost_m.toFixed(1)}m</div>
            </div>
          </div>

          <div style={{ border: `1px solid ${v4.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <SquadSection label="Forwards"   players={byPos('FWD')} color={v4.pink}    />
            <SquadSection label="Midfielders" players={byPos('MID')} color={v4.purple}  />
            <SquadSection label="Defenders"  players={byPos('DEF')} color={v4.green}   />
            <SquadSection label="Goalkeepers" players={byPos('GK')}  color={v4.amber}   />
          </div>

          <p style={{ color: v4.textVeryDim, fontSize: 11, fontFamily: mono, textAlign: 'center', lineHeight: 1.6, margin: '14px 0 0' }}>
            Model projections for 3 group-stage matches · C = recommended captain · estimated prices
          </p>
        </div>
      )}
    </div>
  );
}

// ── Captain Picks ─────────────────────────────────────────────────────────────

function CaptainPicks() {
  const [status, setStatus] = React.useState('loading');
  const [picks,  setPicks]  = React.useState([]);
  const [errMsg, setErrMsg] = React.useState('');

  React.useEffect(() => {
    wcFantasy.captains(10)
      .then(d => { setPicks(d.picks); setStatus('success'); })
      .catch(e => { setErrMsg(e.message || 'Failed to load captain picks.'); setStatus('error'); });
  }, []);

  return (
    <div>
      {status === 'loading' && <Spinner />}
      {status === 'error' && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,85,119,0.1)', border: `1px solid rgba(255,85,119,0.3)`, borderRadius: 10, color: v4.red, fontFamily: mono, fontSize: 12 }}>
          {errMsg}
        </div>
      )}
      {status === 'success' && (
        <>
          <div style={{ border: `1px solid ${v4.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {picks.map((p, i) => <PlayerRow key={p.id} player={p} rank={i + 1} />)}
          </div>
          <p style={{ color: v4.textVeryDim, fontSize: 11, fontFamily: mono, textAlign: 'center', lineHeight: 1.6, margin: '14px 0 0' }}>
            Ranked by 3-match projected points · DC model team ratings + position share
          </p>
        </>
      )}
    </div>
  );
}

// ── Main section ─────────────────────────────────────────────────────────────

export default function WCFantasySection() {
  return (
    <div style={{ padding: '100px 56px', background: v4.bg, borderTop: `1px solid ${v4.border}`, borderBottom: `1px solid ${v4.border}` }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ color: v4.amber, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>wc2026 fantasy</div>
          <h2 style={{ color: v4.text, fontSize: 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, fontFamily: display }}>
            Let the model pick your team
          </h2>
          <p style={{ color: v4.textDim, fontSize: 16, marginTop: 16, maxWidth: 560, marginInline: 'auto', lineHeight: 1.55 }}>
            Dixon-Coles team ratings drive every projection. Set your budget, get an optimal squad — then see who to captain.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* Optimizer card */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
            border: `1px solid ${v4.border}`, borderRadius: 20, padding: 28,
          }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: v4.electric, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 6 }}>Squad Optimizer</div>
              <div style={{ color: v4.textDim, fontSize: 13, fontFamily: display, lineHeight: 1.5 }}>
                ILP solver picks 15 players — 2 GK, 5 DEF, 5 MID, 3 FWD — within budget, max 3 per nation.
              </div>
            </div>
            <SquadOptimizer />
          </div>

          {/* Captain picks card */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
            border: `1px solid ${v4.border}`, borderRadius: 20, padding: 28,
          }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: v4.amber, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 6 }}>Captain Picks</div>
              <div style={{ color: v4.textDim, fontSize: 13, fontFamily: display, lineHeight: 1.5 }}>
                Top 10 players ranked by projected 3-match returns. Double your points — pick the right captain.
              </div>
            </div>
            <CaptainPicks />
          </div>

        </div>
      </div>
    </div>
  );
}
