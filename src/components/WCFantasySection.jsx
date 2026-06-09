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

// ── Team Builder ─────────────────────────────────────────────────────────────

const SQUAD_LIMITS = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const BUDGET_TOTAL = 1000;

function canAddPlayer(player, locked) {
  if (locked.find(p => p.id === player.id)) return { ok: false, reason: 'Already in squad' };
  if (locked.length >= 15)                  return { ok: false, reason: 'Squad full (15)' };
  const posCount = locked.filter(p => p.pos === player.pos).length;
  if (posCount >= SQUAD_LIMITS[player.pos]) return { ok: false, reason: `${player.pos} slots full` };
  const teamCount = locked.filter(p => p.team === player.team).length;
  if (teamCount >= 3)                       return { ok: false, reason: 'Max 3 per nation' };
  const spent = locked.reduce((s, p) => s + p.price, 0);
  if (spent + player.price > BUDGET_TOTAL)  return { ok: false, reason: 'Over budget' };
  return { ok: true };
}

// ── Pitch view helpers ──────────────────────────────────────────────────────

function shortName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

function circleText(fullName) {
  return shortName(fullName).slice(0, 4).toUpperCase();
}

// ── Pitch token ─────────────────────────────────────────────────────────────

function PitchToken({ player, pos, isModelPick, onRemove, isEmpty }) {
  const col = POS_COLOR[pos || player?.pos];

  if (isEmpty) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0, flex: 1 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '2px dashed rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.14)', fontSize: 18, lineHeight: 1 }}>+</span>
        </div>
        <div style={{ fontFamily: mono, fontSize: 8, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.05em', textAlign: 'center' }}>{pos}</div>
      </div>
    );
  }

  const isYou = !isModelPick;
  const isCap = player.is_captain;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0, flex: 1 }}>
      <div style={{ position: 'relative', margin: '0 auto' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: isYou ? `${col}2e` : 'rgba(0,0,0,0.42)',
          border: `2px solid ${isYou ? col : 'rgba(255,255,255,0.28)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isYou ? `0 0 12px ${col}55` : 'none',
        }}>
          <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, color: isYou ? '#fff' : 'rgba(255,255,255,0.5)', letterSpacing: '0.01em', userSelect: 'none' }}>
            {circleText(player.name)}
          </span>
        </div>
        {isCap && (
          <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: v4.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontFamily: mono, fontWeight: 700, color: '#000', zIndex: 2 }}>C</div>
        )}
        {isYou && !isCap && (
          <div style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: v4.electric, zIndex: 2 }} />
        )}
        {onRemove && (
          <button onClick={() => onRemove(player.id)} style={{
            position: 'absolute', top: -4, left: -4, width: 16, height: 16, borderRadius: '50%',
            background: 'rgba(255,40,130,0.85)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontFamily: mono, fontWeight: 700, color: '#fff',
            cursor: 'pointer', padding: 0, lineHeight: 1, zIndex: 2,
          }}>×</button>
        )}
      </div>
      <div style={{
        fontFamily: display, fontSize: 9, fontWeight: isYou ? 700 : 400,
        color: isYou ? '#fff' : 'rgba(255,255,255,0.45)',
        textAlign: 'center', lineHeight: 1,
        maxWidth: 60, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        textShadow: '0 1px 4px rgba(0,0,0,0.9)',
      }}>{shortName(player.name)}</div>
      <div style={{ fontFamily: mono, fontSize: 8, fontWeight: 700, color: isYou ? col : 'rgba(255,255,255,0.35)', lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
        {player.projected_pts?.toFixed(1)}
      </div>
    </div>
  );
}

// ── Pitch view ──────────────────────────────────────────────────────────────

function PitchView({ locked, result, lockedIds, onRemove }) {
  const squad  = result ? result.squad : locked;
  const canRem = !result ? onRemove : null;

  function renderRow(pos) {
    const players = squad.filter(p => p.pos === pos);
    const total   = SQUAD_LIMITS[pos];
    const tokens  = [];
    for (let i = 0; i < total; i++) {
      if (i < players.length) {
        const p = players[i];
        tokens.push(
          <PitchToken key={p.id} player={p} pos={pos}
            isModelPick={result ? !lockedIds.has(p.id) : false}
            onRemove={canRem} />
        );
      } else {
        tokens.push(<PitchToken key={`empty-${pos}-${i}`} pos={pos} isEmpty />);
      }
    }
    return tokens;
  }

  const row = (topPct) => ({
    position: 'absolute', left: '3%', right: '3%', top: `${topPct}%`,
    transform: 'translateY(-50%)',
    display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
  });

  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: '118%', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Grass */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1a5533 0%,#1f6b3d 35%,#1c6238 65%,#175030 100%)' }} />
        {/* Pitch markings */}
        <svg viewBox="0 0 300 354" preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleY(-1)' }}>
          {/* Alternating grass stripes */}
          {[0,1,2,3,4,5].map(i =>
            <rect key={i} x="0" y={i*59} width="300" height="59" fill={i%2===0?'rgba(255,255,255,0.025)':'transparent'} />
          )}
          {/* Outer border */}
          <rect x="8" y="5" width="284" height="344" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
          {/* Penalty box */}
          <rect x="72" y="5" width="156" height="82" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
          {/* Goal box */}
          <rect x="113" y="5" width="74" height="27" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
          {/* Goal */}
          <rect x="124" y="1" width="52" height="6" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.28)" strokeWidth="1"/>
          {/* Penalty spot */}
          <circle cx="150" cy="71" r="2.5" fill="rgba(255,255,255,0.32)"/>
          {/* Penalty arc */}
          <path d="M 106,87 A 44,44 0 0 0 194,87" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
          {/* Halfway line */}
          <line x1="8" y1="349" x2="292" y2="349" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
          {/* Centre circle half */}
          <path d="M 108,349 A 42,42 0 0 1 192,349" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
          {/* Centre spot */}
          <circle cx="150" cy="349" r="2.5" fill="rgba(255,255,255,0.32)"/>
        </svg>
        {/* Player rows: FWD at top → GK at bottom (SVG flipped so GK penalty area is at bottom) */}
        <div style={row(14)}>{renderRow('FWD')}</div>
        <div style={row(38)}>{renderRow('MID')}</div>
        <div style={row(62)}>{renderRow('DEF')}</div>
        <div style={row(83)}>{renderRow('GK')}</div>
      </div>
    </div>
  );
}

function BudgetBar({ locked }) {
  const spent   = locked.reduce((s, p) => s + p.price, 0);
  const pct     = Math.min(100, (spent / BUDGET_TOTAL) * 100);
  const rem     = BUDGET_TOTAL - spent;
  const low     = rem < 100;
  const barColor = low ? v4.red : v4.electric;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: mono, fontSize: 10, color: v4.textVeryDim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Budget</span>
        <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: low ? v4.red : v4.electric }}>
          ${(rem / 10).toFixed(1)}m left
        </span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: barColor, transition: 'width 0.2s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim }}>${(spent / 10).toFixed(1)}m spent</span>
        <span style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim }}>${(BUDGET_TOTAL / 10).toFixed(1)}m total</span>
      </div>
    </div>
  );
}

function SlotSummary({ locked }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
      {Object.entries(SQUAD_LIMITS).map(([pos, max]) => {
        const count = locked.filter(p => p.pos === pos).length;
        const full  = count >= max;
        return (
          <div key={pos} style={{
            padding: '3px 9px', borderRadius: 5,
            background: full ? `${POS_COLOR[pos]}22` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${full ? POS_COLOR[pos] + '55' : v4.border}`,
            fontFamily: mono, fontSize: 10, fontWeight: 700,
            color: full ? POS_COLOR[pos] : v4.textVeryDim,
          }}>
            {pos} {count}/{max}
          </div>
        );
      })}
      <div style={{
        padding: '3px 9px', borderRadius: 5,
        background: locked.length === 15 ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${locked.length === 15 ? 'rgba(0,255,135,0.3)' : v4.border}`,
        fontFamily: mono, fontSize: 10, fontWeight: 700,
        color: locked.length === 15 ? v4.electric : v4.textVeryDim,
      }}>
        {locked.length}/15
      </div>
    </div>
  );
}

function LockedPlayerRow({ player, onRemove, isModelPick }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderBottom: `1px solid ${v4.border}`,
      background: isModelPick ? 'transparent' : 'rgba(0,255,135,0.04)',
    }}>
      <PosBadge pos={player.pos} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: display, fontSize: 13, fontWeight: 600, color: isModelPick ? v4.textDim : v4.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {player.name}
          </span>
          {!isModelPick && (
            <span style={{ fontFamily: mono, fontSize: 8, color: v4.electric, background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.25)', padding: '1px 5px', borderRadius: 3, letterSpacing: '0.06em', flexShrink: 0 }}>YOU</span>
          )}
          {player.is_captain && (
            <span style={{ fontFamily: mono, fontSize: 8, color: v4.amber, background: 'rgba(255,176,32,0.12)', border: '1px solid rgba(255,176,32,0.25)', padding: '1px 5px', borderRadius: 3, letterSpacing: '0.06em', flexShrink: 0 }}>C</span>
          )}
        </div>
        <div style={{ fontFamily: mono, fontSize: 10, color: v4.textVeryDim, marginTop: 1 }}>{player.team}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, marginRight: onRemove ? 8 : 0 }}>
        <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: player.is_captain ? v4.amber : (isModelPick ? v4.textDim : v4.text) }}>
          {player.projected_pts?.toFixed(1)}<span style={{ fontSize: 9, color: v4.textVeryDim, fontWeight: 400 }}> pts</span>
        </div>
        <div style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim }}>${player.price_m?.toFixed(1)}m</div>
      </div>
      {onRemove && (
        <button onClick={() => onRemove(player.id)} style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,85,119,0.1)', border: '1px solid rgba(255,85,119,0.2)',
          color: v4.red, fontFamily: mono, fontSize: 12, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
        }}>×</button>
      )}
    </div>
  );
}

function PlayerBrowserRow({ player, locked, onAdd }) {
  const { ok, reason } = canAddPlayer(player, locked);
  const alreadyIn = !!locked.find(p => p.id === player.id);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderBottom: `1px solid ${v4.border}`,
      opacity: alreadyIn ? 0.4 : 1,
    }}>
      <PosBadge pos={player.pos} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: display, fontSize: 13, fontWeight: 600, color: v4.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</div>
        <div style={{ fontFamily: mono, fontSize: 10, color: v4.textVeryDim, marginTop: 1 }}>{player.team}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 8 }}>
        <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: v4.text }}>{player.projected_pts?.toFixed(1)}<span style={{ fontSize: 9, color: v4.textVeryDim, fontWeight: 400 }}> pts</span></div>
        <div style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim }}>${player.price_m?.toFixed(1)}m</div>
      </div>
      <button
        onClick={() => ok && onAdd(player)}
        title={ok ? `Add ${player.name}` : reason}
        disabled={!ok}
        style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          background: ok ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${ok ? 'rgba(0,255,135,0.3)' : v4.border}`,
          color: ok ? v4.electric : v4.textVeryDim,
          fontFamily: mono, fontSize: 14, fontWeight: 700,
          cursor: ok ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
        }}
      >+</button>
    </div>
  );
}

function WCTeamBuilder({ isMobile }) {
  const [allPlayers,    setAllPlayers]    = React.useState([]);
  const [loadingPool,   setLoadingPool]   = React.useState(true);
  const [locked,        setLocked]        = React.useState([]);
  const [posFilter,     setPosFilter]     = React.useState('ALL');
  const [search,        setSearch]        = React.useState('');
  const [status,        setStatus]        = React.useState('idle');
  const [result,        setResult]        = React.useState(null);
  const [errMsg,        setErrMsg]        = React.useState('');

  React.useEffect(() => {
    wcFantasy.players()
      .then(d => { setAllPlayers(d.players); setLoadingPool(false); })
      .catch(() => setLoadingPool(false));
  }, []);

  const lockedIds = new Set(locked.map(p => p.id));

  function addPlayer(player) {
    setLocked(prev => [...prev, player]);
    setResult(null); setStatus('idle');
  }
  function removePlayer(id) {
    setLocked(prev => prev.filter(p => p.id !== id));
    setResult(null); setStatus('idle');
  }
  function clearAll() {
    setLocked([]); setResult(null); setStatus('idle');
  }

  async function handleFill() {
    setStatus('loading'); setResult(null); setErrMsg('');
    try {
      const data = await wcFantasy.optimise({ budget: BUDGET_TOTAL, locked_player_ids: locked.map(p => p.id) });
      setResult(data);
      setStatus('success');
    } catch (e) {
      setErrMsg(e.message || 'Optimisation failed — try again.');
      setStatus('error');
    }
  }

  // Filtered player pool
  const filtered = allPlayers.filter(p => {
    if (posFilter !== 'ALL' && p.pos !== posFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q);
    }
    return true;
  });

  // Result squad grouped by position
  const resultByPos = pos => (result?.squad || []).filter(p => p.pos === pos);

  // Squad to show in left panel
  const displaySquad = result
    ? result.squad
    : locked;

  const displayByPos = pos => displaySquad.filter(p => p.pos === pos);

  const canFill  = locked.length > 0 && locked.length < 15 && status !== 'loading';
  const canFull  = locked.length === 15 && status !== 'loading';

  return (
    <div style={{ marginTop: 48 }}>
      {/* Section header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ color: v4.purple, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 10 }}>
          Squad Builder
        </div>
        <h3 style={{ color: v4.text, fontSize: isMobile ? 24 : 32, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, fontFamily: display }}>
          Pick your players, let the model fill the gaps
        </h3>
        <p style={{ color: v4.textDim, fontSize: 14, marginTop: 10, maxWidth: 560, lineHeight: 1.55 }}>
          Choose any players you want — the optimizer locks them in and builds the best possible squad around them within budget and squad rules.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left — My Squad */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: `1px solid ${v4.border}`, borderRadius: 20, padding: 22,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: v4.purple, textTransform: 'uppercase' }}>
              My Squad {locked.length > 0 && `· ${locked.length} picked`}
            </div>
            {locked.length > 0 && !result && (
              <button onClick={clearAll} style={{ background: 'none', border: 'none', color: v4.textVeryDim, fontFamily: mono, fontSize: 10, cursor: 'pointer', padding: 0, letterSpacing: '0.05em' }}>
                Clear all
              </button>
            )}
            {result && (
              <button onClick={clearAll} style={{ background: 'none', border: 'none', color: v4.textVeryDim, fontFamily: mono, fontSize: 10, cursor: 'pointer', padding: 0, letterSpacing: '0.05em' }}>
                Start over
              </button>
            )}
          </div>

          <BudgetBar locked={result ? result.squad : locked} />
          <SlotSummary locked={result ? result.squad : locked} />

          {/* Result summary bar */}
          {result && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', marginBottom: 12, background: 'rgba(123,46,227,0.08)', border: '1px solid rgba(123,46,227,0.25)', borderRadius: 10 }}>
              <div>
                <div style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Projected pts</div>
                <div style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, color: v4.purple }}>{result.total_pts.toFixed(1)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Cost</div>
                <div style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, color: v4.text }}>${result.total_cost_m.toFixed(1)}m</div>
              </div>
            </div>
          )}

          <PitchView locked={locked} result={result} lockedIds={lockedIds} onRemove={removePlayer} />

          {/* Action button */}
          {!result && (
            <div style={{ marginTop: 16 }}>
              {canFill && (
                <button onClick={handleFill} style={{
                  width: '100%', padding: '12px 0',
                  background: v4.purple, color: '#fff',
                  border: 0, borderRadius: 10,
                  fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  fontFamily: display, cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(123,46,227,0.35)', transition: 'opacity 0.2s',
                }}>
                  {status === 'loading' ? 'Filling…' : `Fill remaining ${15 - locked.length} slots →`}
                </button>
              )}
              {canFull && (
                <button onClick={handleFill} style={{
                  width: '100%', padding: '12px 0',
                  background: v4.electric, color: v4.bg,
                  border: 0, borderRadius: 10,
                  fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  fontFamily: display, cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,255,135,0.28)', transition: 'opacity 0.2s',
                }}>
                  Analyse my squad →
                </button>
              )}
              {locked.length === 0 && (
                <div style={{ textAlign: 'center', fontFamily: mono, fontSize: 10, color: v4.textVeryDim, lineHeight: 1.6 }}>
                  Add at least 1 player to get started.
                </div>
              )}
              {status === 'loading' && <Spinner />}
              {status === 'error' && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,85,119,0.1)', border: '1px solid rgba(255,85,119,0.3)', borderRadius: 8, color: v4.red, fontFamily: mono, fontSize: 11 }}>
                  {errMsg}
                </div>
              )}
            </div>
          )}

          {result && (
            <p style={{ color: v4.textVeryDim, fontSize: 10, fontFamily: mono, textAlign: 'center', lineHeight: 1.6, marginTop: 14 }}>
              Green "YOU" = your picks · Grey = model-filled · C = recommended captain
            </p>
          )}
        </div>

        {/* Right — Player Browser */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: `1px solid ${v4.border}`, borderRadius: 20, padding: 22,
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: v4.textVeryDim, textTransform: 'uppercase', marginBottom: 14 }}>
            Player Pool
          </div>

          {/* Position filter */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
            {['ALL', 'GK', 'DEF', 'MID', 'FWD'].map(pos => {
              const active = pos === posFilter;
              const col    = pos === 'ALL' ? v4.textDim : POS_COLOR[pos];
              return (
                <button key={pos} onClick={() => setPosFilter(pos)} style={{
                  flex: 1, padding: '5px 0',
                  background: active ? `${col}22` : 'transparent',
                  border: `1px solid ${active ? col : v4.border}`,
                  borderRadius: 6, color: active ? col : v4.textVeryDim,
                  fontFamily: mono, fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {pos}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search player or team…"
            style={{
              width: '100%', padding: '9px 12px', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${v4.border}`,
              borderRadius: 8, color: v4.text, fontFamily: mono, fontSize: 12,
              outline: 'none', marginBottom: 10,
            }}
          />

          {/* Player list */}
          {loadingPool ? (
            <Spinner />
          ) : (
            <div style={{ maxHeight: 480, overflowY: 'auto', border: `1px solid ${v4.border}`, borderRadius: 10, overflowX: 'hidden' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: v4.textVeryDim, fontFamily: mono, fontSize: 11 }}>No players match.</div>
              ) : (
                filtered.map(p => (
                  <PlayerBrowserRow key={p.id} player={p} locked={locked} onAdd={addPlayer} />
                ))
              )}
            </div>
          )}

          <p style={{ color: v4.textVeryDim, fontSize: 10, fontFamily: mono, textAlign: 'center', lineHeight: 1.6, marginTop: 12 }}>
            Sorted by projected pts · max 3 per nation · $100m budget
          </p>
        </div>

      </div>
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

const MINI_LEAGUE_CODE = '64T3EKYD';

function MiniLeagueBanner({ isMobile }) {
  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(MINI_LEAGUE_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      marginBottom: 40,
      background: 'linear-gradient(135deg, rgba(0,255,135,0.08) 0%, rgba(123,46,227,0.12) 100%)',
      border: `1px solid rgba(0,255,135,0.25)`,
      borderRadius: 16,
      padding: isMobile ? '20px 20px' : '20px 28px',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'flex-start' : 'center',
      gap: isMobile ? 16 : 24,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: v4.electric, flexShrink: 0 }} />
          <span style={{ color: v4.electric, fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mini League</span>
        </div>
        <div style={{ color: v4.text, fontFamily: display, fontSize: isMobile ? 15 : 16, fontWeight: 700, lineHeight: 1.4 }}>
          Compete against everyone using the model's picks
        </div>
        <div style={{ color: v4.textDim, fontFamily: display, fontSize: 13, marginTop: 4 }}>
          Join the TheModelSays WC Fantasy mini league — see how you stack up.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          border: `1px solid rgba(0,255,135,0.3)`,
          borderRadius: 10,
          padding: '10px 18px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <span style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>League code</span>
          <span style={{ color: v4.electric, fontFamily: mono, fontSize: 22, fontWeight: 800, letterSpacing: '0.08em' }}>{MINI_LEAGUE_CODE}</span>
        </div>

        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(0,255,135,0.2)' : 'rgba(0,255,135,0.1)',
            border: `1px solid ${copied ? 'rgba(0,255,135,0.6)' : 'rgba(0,255,135,0.3)'}`,
            borderRadius: 10,
            padding: '10px 16px',
            color: copied ? v4.electric : v4.textDim,
            fontFamily: mono, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            whiteSpace: 'nowrap',
          }}
        >
          {copied ? '✓ Copied' : 'Copy code'}
        </button>
      </div>
    </div>
  );
}

export default function WCFantasySection() {
  const isMobile = useIsMobile();
  return (
    <div style={{ padding: isMobile ? '60px 16px' : '100px 56px', background: v4.bg, borderTop: `1px solid ${v4.border}`, borderBottom: `1px solid ${v4.border}` }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ color: v4.amber, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>wc2026 fantasy</div>
          <h2 style={{ color: v4.text, fontSize: isMobile ? 32 : 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, fontFamily: display }}>
            Let the model pick your team
          </h2>
          <p style={{ color: v4.textDim, fontSize: 16, marginTop: 16, maxWidth: 560, marginInline: 'auto', lineHeight: 1.55 }}>
            Dixon-Coles team ratings drive every projection. Set your budget, get an optimal squad — then see who to captain.
          </p>
        </div>

        <MiniLeagueBanner isMobile={isMobile} />

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

        <WCTeamBuilder isMobile={isMobile} />

      </div>
    </div>
  );
}
