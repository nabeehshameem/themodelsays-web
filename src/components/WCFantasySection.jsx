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

const BOOSTERS = [
  { id: null,                     label: 'No booster',            short: 'None',       color: '#796a93', desc: 'Standard optimal squad.' },
  { id: 'wildcard',               label: 'Wildcard',              short: 'Wildcard',   color: '#7B2EE3', desc: 'Unlimited transfers (MD2+ only). Builds your ideal fresh squad.' },
  { id: '12th_man',               label: '12th Man',              short: '12th Man',   color: '#00FF87', desc: 'Pick 1 extra player outside your squad — no budget or team cap.' },
  { id: 'max_captain',            label: 'Maximum Captain',       short: 'Max Cap',    color: '#FFB020', desc: 'Auto-assigns captaincy to your highest scorer. Ranks your XI by ceiling.' },
  { id: 'qualification_booster',  label: 'Qualification Booster', short: 'Qual +2',    color: '#FF2882', desc: '+2 pts per starting XI player whose team advances from the round. R32+ only.' },
];

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

// ── Booster picker ───────────────────────────────────────────────────────────

function BoosterPicker({ value, onChange }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: v4.textVeryDim, textTransform: 'uppercase', marginBottom: 8 }}>
        Booster
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {BOOSTERS.map(b => {
          const active = value === b.id;
          return (
            <button
              key={String(b.id)}
              onClick={() => onChange(b.id)}
              title={b.desc}
              style={{
                padding: '5px 11px',
                background: active ? `${b.color}22` : 'transparent',
                border: `1px solid ${active ? b.color : v4.border}`,
                borderRadius: 6,
                color: active ? b.color : v4.textDim,
                fontFamily: mono, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.05em', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {b.short}
            </button>
          );
        })}
      </div>
      {value !== null && (
        <div style={{ marginTop: 7, fontFamily: mono, fontSize: 10, color: v4.textVeryDim, lineHeight: 1.5 }}>
          {BOOSTERS.find(b => b.id === value)?.desc}
        </div>
      )}
    </div>
  );
}

// ── Booster result panels ────────────────────────────────────────────────────

function TwelfthManPanel({ player }) {
  if (!player) return null;
  const color = v4.electric;
  return (
    <div style={{ marginTop: 16, padding: '14px 16px', background: `${color}0d`, border: `1px solid ${color}33`, borderRadius: 12 }}>
      <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color, textTransform: 'uppercase', marginBottom: 10 }}>
        12th Man — recommended pick
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <PosBadge pos={player.pos} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: display, fontSize: 14, fontWeight: 700, color: v4.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</div>
          <div style={{ fontFamily: mono, fontSize: 10, color: v4.textVeryDim, marginTop: 1 }}>{player.team}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color }}>{player.projected_pts.toFixed(1)} <span style={{ fontSize: 10, color: v4.textVeryDim, fontWeight: 400 }}>pts</span></div>
          <div style={{ fontFamily: mono, fontSize: 10, color: v4.textVeryDim }}>${player.price_m.toFixed(1)}m</div>
        </div>
      </div>
      <div style={{ marginTop: 10, fontFamily: mono, fontSize: 10, color: v4.textVeryDim, lineHeight: 1.5 }}>
        No budget or team-cap restrictions apply. This player cannot be captained, subbed, or transferred.
      </div>
    </div>
  );
}

function MaxCapPanel({ candidates, expectedPts }) {
  if (!candidates?.length) return null;
  const color = v4.amber;
  return (
    <div style={{ marginTop: 16, padding: '14px 16px', background: `${color}0d`, border: `1px solid ${color}33`, borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color, textTransform: 'uppercase' }}>
          Max Captain — auto-assign candidates
        </div>
        {expectedPts != null && (
          <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color }}>
            ~{expectedPts.toFixed(1)} <span style={{ fontSize: 9, color: v4.textVeryDim, fontWeight: 400 }}>exp. cap pts</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {candidates.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i === 0 ? `${color}22` : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 0 ? color : v4.border}`, fontSize: 9, fontFamily: mono, fontWeight: 700, color: i === 0 ? color : v4.textVeryDim }}>
              {i + 1}
            </div>
            <PosBadge pos={p.pos} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: display, fontSize: 13, fontWeight: 600, color: v4.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: v4.textVeryDim }}>{p.team}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: i === 0 ? color : v4.textDim }}>{p.pts_per_match.toFixed(1)}<span style={{ fontSize: 9, color: v4.textVeryDim, fontWeight: 400 }}>/match</span></div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontFamily: mono, fontSize: 10, color: v4.textVeryDim, lineHeight: 1.5 }}>
        Ranked by single-match ceiling. Captaincy auto-fires on whoever scores most — no decision needed.
      </div>
    </div>
  );
}

function QualBoosterPanel({ breakdown, total }) {
  if (!breakdown?.length) return null;
  const color = v4.pink;
  const sorted = [...breakdown].sort((a, b) => b.qual_bonus - a.qual_bonus);
  return (
    <div style={{ marginTop: 16, padding: '14px 16px', background: `${color}0d`, border: `1px solid ${color}33`, borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color, textTransform: 'uppercase' }}>
          Qualification Booster — expected +2 bonus
        </div>
        {total != null && (
          <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color }}>
            +{total.toFixed(2)} <span style={{ fontSize: 9, color: v4.textVeryDim, fontWeight: 400 }}>exp. pts</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map(p => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PosBadge pos={p.pos} />
            <div style={{ flex: 1, fontFamily: display, fontSize: 12, color: v4.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
            <div style={{ fontFamily: mono, fontSize: 11, color: p.qual_bonus > 0.5 ? color : v4.textVeryDim, fontWeight: 700, flexShrink: 0 }}>
              +{p.qual_bonus.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontFamily: mono, fontSize: 10, color: v4.textVeryDim, lineHeight: 1.5 }}>
        +2 pts per starter whose team wins their knockout match. Captain's +2 is not doubled. R32+ only.
      </div>
    </div>
  );
}

// ── Squad Optimizer ──────────────────────────────────────────────────────────

function SquadOptimizer() {
  const [status,  setStatus]  = React.useState('idle');
  const [result,  setResult]  = React.useState(null);
  const [errMsg,  setErrMsg]  = React.useState('');
  const [booster, setBooster] = React.useState(null);

  async function handleOptimise() {
    setStatus('loading');
    setResult(null);
    setErrMsg('');
    try {
      const data = await wcFantasy.optimise({ budget: 1000, booster });
      setResult(data);
      setStatus('success');
    } catch (e) {
      setErrMsg(e.message || 'Optimisation failed — try again.');
      setStatus('error');
    }
  }

  const byPos = (pos) => (result?.squad || []).filter(p => p.pos === pos);
  const activeBooster = BOOSTERS.find(b => b.id === booster);
  const btnColor = booster ? activeBooster.color : v4.electric;

  return (
    <div>
      <BoosterPicker value={booster} onChange={(b) => { setBooster(b); setResult(null); setStatus('idle'); }} />

      <button
        onClick={handleOptimise}
        disabled={status === 'loading'}
        style={{
          width: '100%', padding: '13px 0',
          background: status !== 'loading' ? btnColor : `${btnColor}33`,
          color: status !== 'loading' ? (booster ? v4.bg : v4.bg) : v4.textVeryDim,
          border: 0, borderRadius: 10,
          fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          fontFamily: display, cursor: status !== 'loading' ? 'pointer' : 'not-allowed',
          boxShadow: status !== 'loading' ? `0 4px 20px ${btnColor}44` : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {status === 'loading'
          ? 'Optimising…'
          : booster
            ? `Optimise with ${activeBooster.short} →`
            : 'Optimise squad →'}
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
            background: `${btnColor}0f`, border: `1px solid ${btnColor}33`,
            borderRadius: 10,
          }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 10, color: v4.textVeryDim, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Projected points</div>
              <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: btnColor }}>{result.total_pts.toFixed(1)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: v4.textVeryDim, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Total cost</div>
              <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: v4.text }}>${result.total_cost_m.toFixed(1)}m</div>
            </div>
          </div>

          <div style={{ border: `1px solid ${v4.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <SquadSection label="Forwards"    players={byPos('FWD')} color={v4.pink}   />
            <SquadSection label="Midfielders" players={byPos('MID')} color={v4.purple} />
            <SquadSection label="Defenders"   players={byPos('DEF')} color={v4.green}  />
            <SquadSection label="Goalkeepers" players={byPos('GK')}  color={v4.amber}  />
          </div>

          {/* Booster panels */}
          <TwelfthManPanel player={result.twelfth_man} />
          <MaxCapPanel candidates={result.max_cap_candidates} expectedPts={result.expected_max_cap_pts} />
          <QualBoosterPanel breakdown={result.qual_booster_breakdown} total={result.qual_booster_total} />

          <p style={{ color: v4.textVeryDim, fontSize: 11, fontFamily: mono, textAlign: 'center', lineHeight: 1.6, margin: '14px 0 0' }}>
            Model projections for 3 group-stage matches · C = recommended captain · estimated prices
          </p>
        </div>
      )}
    </div>
  );
}

// ── Captain Picks ─────────────────────────────────────────────────────────────

const MATCHDAYS = [
  { id: null, label: 'All 3' },
  { id: 1,    label: 'MD 1' },
  { id: 2,    label: 'MD 2' },
  { id: 3,    label: 'MD 3' },
];

function CaptainPicks() {
  const [matchday,     setMatchday]     = React.useState(null);
  const [status,       setStatus]       = React.useState('loading');
  const [picks,        setPicks]        = React.useState([]);
  const [liveStatus,   setLiveStatus]   = React.useState('idle');
  const [liveData,     setLiveData]     = React.useState(null);
  const [errMsg,       setErrMsg]       = React.useState('');

  // Load captain picks whenever matchday tab changes
  React.useEffect(() => {
    setStatus('loading');
    setPicks([]);
    wcFantasy.captains(10, matchday)
      .then(d => { setPicks(d.picks); setStatus('success'); })
      .catch(e => { setErrMsg(e.message || 'Failed to load captain picks.'); setStatus('error'); });
  }, [matchday]);

  // Poll live advice whenever a specific matchday is selected
  React.useEffect(() => {
    if (matchday == null) { setLiveData(null); return; }
    setLiveStatus('loading');
    wcFantasy.liveAdvice(matchday)
      .then(d => { setLiveData(d); setLiveStatus('done'); })
      .catch(() => setLiveStatus('idle'));
  }, [matchday]);

  const isLive = liveData?.is_live;

  return (
    <div>
      {/* Matchday tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {MATCHDAYS.map(({ id, label }) => {
          const active = id === matchday;
          return (
            <button
              key={String(id)}
              onClick={() => setMatchday(id)}
              style={{
                flex: 1, padding: '6px 0',
                background: active ? v4.amber : 'transparent',
                color: active ? v4.bg : v4.textDim,
                border: `1px solid ${active ? v4.amber : v4.border}`,
                borderRadius: 7, fontSize: 11, fontWeight: 700,
                fontFamily: mono, cursor: 'pointer', transition: 'all 0.15s',
                letterSpacing: '0.05em',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Live swap banner */}
      {isLive && (
        <div style={{
          marginBottom: 14, padding: '10px 14px',
          background: 'rgba(255,176,32,0.08)', border: '1px solid rgba(255,176,32,0.3)',
          borderRadius: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff4444', display: 'inline-block', boxShadow: '0 0 6px #ff4444' }} />
            <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: v4.amber, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Matchday {matchday} live · {liveData.played_team_count / 2} of {(liveData.played_team_count + liveData.remaining_team_count) / 2} fixtures played
            </span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 10, color: v4.textDim, lineHeight: 1.5 }}>
            {liveData.remaining_picks.length > 0
              ? `Best still-to-play captain options ranked below ↓`
              : 'All fixtures in this matchday have kicked off.'}
          </div>
        </div>
      )}

      {status === 'loading' && <Spinner />}
      {status === 'error' && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,85,119,0.1)', border: `1px solid rgba(255,85,119,0.3)`, borderRadius: 10, color: v4.red, fontFamily: mono, fontSize: 12 }}>
          {errMsg}
        </div>
      )}

      {status === 'success' && (
        <>
          {/* If live: show remaining picks first, then full list */}
          {isLive && liveData.remaining_picks.length > 0 ? (
            <>
              <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, color: v4.amber, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 14px', background: 'rgba(255,176,32,0.08)', borderRadius: '8px 8px 0 0', border: `1px solid ${v4.border}`, borderBottom: 'none' }}>
                Still to play — swap candidates
              </div>
              <div style={{ border: `1px solid ${v4.border}`, borderRadius: '0 0 12px 12px', overflow: 'hidden', marginBottom: 14 }}>
                {liveData.remaining_picks.map((p, i) => <PlayerRow key={p.id} player={p} rank={i + 1} />)}
              </div>
              <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, color: v4.textVeryDim, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 14px', background: v4.surface, borderRadius: '8px 8px 0 0', border: `1px solid ${v4.border}`, borderBottom: 'none' }}>
                All picks — matchday {matchday}
              </div>
              <div style={{ border: `1px solid ${v4.border}`, borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                {picks.map((p, i) => <PlayerRow key={p.id} player={p} rank={i + 1} />)}
              </div>
            </>
          ) : (
            <div style={{ border: `1px solid ${v4.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {picks.map((p, i) => <PlayerRow key={p.id} player={p} rank={i + 1} />)}
            </div>
          )}
          <p style={{ color: v4.textVeryDim, fontSize: 11, fontFamily: mono, textAlign: 'center', lineHeight: 1.6, margin: '14px 0 0' }}>
            {matchday == null
              ? 'Ranked by 3-match projected points · DC model ratings + position share'
              : `Matchday ${matchday} projected points · 1 match per player`}
          </p>
        </>
      )}
    </div>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = React.useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  React.useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

// ── Main section ─────────────────────────────────────────────────────────────

export default function WCFantasySection() {
  const isMobile = useIsMobile();
  return (
    <div style={{ padding: isMobile ? '60px 16px' : '100px 56px', background: v4.bg, borderTop: `1px solid ${v4.border}`, borderBottom: `1px solid ${v4.border}` }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ color: v4.amber, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>wc2026 fantasy</div>
          <h2 style={{ color: v4.text, fontSize: isMobile ? 32 : 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, fontFamily: display }}>
            Let the model pick your team
          </h2>
          <p style={{ color: v4.textDim, fontSize: 16, marginTop: 16, maxWidth: 560, marginInline: 'auto', lineHeight: 1.55 }}>
            Dixon-Coles team ratings drive every projection. Set your budget, get an optimal squad — then see who to captain.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24, alignItems: 'start' }}>

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
                Top 10 players per matchday. Switch to a live matchday to see who's still to play — and whether a captain change makes sense.
              </div>
            </div>
            <CaptainPicks />
          </div>

        </div>
      </div>
    </div>
  );
}
