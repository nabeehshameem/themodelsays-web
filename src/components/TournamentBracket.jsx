import React from 'react';
import { fetchSimulation, fetchStandings } from '../lib/api.js';

const v4 = {
  bg:          '#0d0118',
  bg2:         '#15032a',
  border:      'rgba(255,255,255,0.08)',
  borderHi:    'rgba(255,255,255,0.16)',
  text:        '#ffffff',
  textDim:     '#b9aed0',
  textVeryDim: '#796a93',
  electric:    '#00FF87',
  purple:      '#7B2EE3',
  amber:       '#FFB020',
};
const display = 'Space Grotesk, sans-serif';
const mono    = 'JetBrains Mono, monospace';

function useBracketScale(naturalWidth) {
  const sectionPad = 56 * 2; // padding: '72px 56px' → 56px each side
  const compute = () =>
    typeof window !== 'undefined'
      ? Math.min(1, (Math.min(window.innerWidth, 1440) - sectionPad) / naturalWidth)
      : 1;
  const [scale, setScale] = React.useState(compute);
  React.useEffect(() => {
    const handler = () => setScale(compute());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [naturalWidth]);
  return scale;
}

function useIsMobile() {
  const [mobile, setMobile] = React.useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  );
  React.useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

// ── WC 2026 official groups (FIFA draw, Dec 2023) ─────────────────
const GROUPS = {
  A: ['Mexico',        'South Africa',          'South Korea',   'Czech Republic'],
  B: ['Canada',        'Bosnia and Herzegovina','Qatar',         'Switzerland'],
  C: ['Brazil',        'Morocco',               'Haiti',         'Scotland'],
  D: ['United States', 'Paraguay',              'Australia',     'Turkey'],
  E: ['Germany',       'Ivory Coast',           'Curaçao',       'Ecuador'],
  F: ['Netherlands',   'Japan',                 'Sweden',        'Tunisia'],
  G: ['Belgium',       'Egypt',                 'Iran',          'New Zealand'],
  H: ['Spain',         'Saudi Arabia',          'Cape Verde',    'Uruguay'],
  I: ['France',        'Senegal',               'Iraq',          'Norway'],
  J: ['Argentina',     'Austria',               'Algeria',       'Jordan'],
  K: ['Portugal',      'Colombia',              'DR Congo',      'Uzbekistan'],
  L: ['England',       'Croatia',               'Ghana',         'Panama'],
};

// ── Bracket structure (official FIFA WC 2026 schedule) ────────────
// SF-101 ← QF-97 (R32: 73,74,75,77) + QF-98 (R32: 81,82,83,84) → left display side
// SF-102 ← QF-99 (R32: 76,78,79,80) + QF-100 (R32: 85,86,87,88) → right display side
//
// R32 ordering within each side groups adjacent pairs that feed the same R16 match:
//   Left positions 1-2: M73+M75 → R16-90 (W73 v W75)
//   Left positions 3-4: M74+M77 → R16-89 (W74 v W77)  → QF-97 → SF-101
//   Left positions 5-6: M83+M84 → R16-93 (W83 v W84)
//   Left positions 7-8: M81+M82 → R16-94 (W81 v W82)  → QF-98 → SF-101
//
//   Right positions 1-2: M76+M78 → R16-91 (W76 v W78)
//   Right positions 3-4: M79+M80 → R16-92 (W79 v W80)  → QF-99 → SF-102
//   Right positions 5-6: M86+M88 → R16-95 (W86 v W88)
//   Right positions 7-8: M85+M87 → R16-96 (W85 v W87)  → QF-100 → SF-102
const R32_L = [
  { id: '73', t1: '2A',  t2: '2B' },
  { id: '75', t1: '1F',  t2: '2C' },
  { id: '74', t1: '1E',  t2: '3rd_ABCDF' },
  { id: '77', t1: '1I',  t2: '3rd_CDFGH' },
  { id: '83', t1: '2K',  t2: '2L' },
  { id: '84', t1: '1H',  t2: '2J' },
  { id: '81', t1: '1D',  t2: '3rd_BEFIJ' },
  { id: '82', t1: '1G',  t2: '3rd_AEHIJ' },
];
const R32_R = [
  { id: '76', t1: '1C',  t2: '2F' },
  { id: '78', t1: '2E',  t2: '2I' },
  { id: '79', t1: '1A',  t2: '3rd_CEFHI' },
  { id: '80', t1: '1L',  t2: '3rd_EHIJK' },
  { id: '86', t1: '1J',  t2: '2H' },
  { id: '88', t1: '2D',  t2: '2G' },
  { id: '85', t1: '1B',  t2: '3rd_EFGIJ' },
  { id: '87', t1: '1K',  t2: '3rd_DEIJL' },
];
const R16_L = [
  { id: 'R1', t1: 'W73', t2: 'W75' },  // R16-90
  { id: 'R2', t1: 'W74', t2: 'W77' },  // R16-89
  { id: 'R3', t1: 'W83', t2: 'W84' },  // R16-93
  { id: 'R4', t1: 'W81', t2: 'W82' },  // R16-94
];
const R16_R = [
  { id: 'R5', t1: 'W76', t2: 'W78' },  // R16-91
  { id: 'R6', t1: 'W79', t2: 'W80' },  // R16-92
  { id: 'R7', t1: 'W86', t2: 'W88' },  // R16-95
  { id: 'R8', t1: 'W85', t2: 'W87' },  // R16-96
];
const QF_L  = [{ id: 'Q1', t1: 'WR1', t2: 'WR2' }, { id: 'Q2', t1: 'WR3', t2: 'WR4' }];
const QF_R  = [{ id: 'Q3', t1: 'WR5', t2: 'WR6' }, { id: 'Q4', t1: 'WR7', t2: 'WR8' }];
const SF_L        = [{ id: 'S1', t1: 'WQ1', t2: 'WQ2' }];
const SF_R        = [{ id: 'S2', t1: 'WQ3', t2: 'WQ4' }];
const FINAL       = [{ id: 'F',  t1: 'WS1', t2: 'WS2' }];
const THIRD_PLACE = [{ id: '3P', t1: 'LS1', t2: 'LS2' }];

const THIRD_LABELS = {
  '3rd_ABCDF': 'A/B/C/D/F', '3rd_CDFGH': 'C/D/F/G/H',
  '3rd_CEFHI': 'C/E/F/H/I', '3rd_EHIJK': 'E/H/I/J/K',
  '3rd_BEFIJ': 'B/E/F/I/J', '3rd_AEHIJ': 'A/E/H/I/J',
  '3rd_EFGIJ': 'E/F/G/I/J', '3rd_DEIJL': 'D/E/I/J/L',
};

// ── URL share encode/decode ────────────────────────────────────────
const ALL_TEAMS   = Object.values(GROUPS).flat();
const TEAM_TO_IDX = Object.fromEntries(ALL_TEAMS.map((t, i) => [t, i]));

function encodeState(groupPicks, picks) {
  const g = {};
  for (const [letter, order] of Object.entries(groupPicks)) {
    g[letter] = order.map(t => GROUPS[letter].indexOf(t));
  }
  const p = {};
  for (const [k, v] of Object.entries(picks)) {
    if (v != null) p[k] = TEAM_TO_IDX[v] ?? v;
  }
  return btoa(unescape(encodeURIComponent(JSON.stringify({ g, p }))));
}

function decodeState(encoded) {
  try {
    const { g, p } = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    const groupPicks = Object.fromEntries(
      Object.entries(g).map(([letter, idxs]) => [letter, idxs.map(i => GROUPS[letter][i])])
    );
    const picks = Object.fromEntries(
      Object.entries(p).map(([k, v]) => [k, typeof v === 'number' ? ALL_TEAMS[v] : v])
    );
    return { groupPicks, picks };
  } catch { return null; }
}

// Parsed once at module load — null if no ?b= param in URL
const _urlState = (() => {
  if (typeof window === 'undefined') return null;
  const b = new URLSearchParams(window.location.search).get('b');
  return b ? decodeState(b) : null;
})();

// ── Helpers ────────────────────────────────────────────────────────
function resolveSlot(src, groupPicks, picks) {
  if (/^[12][A-L]$/.test(src)) {
    const idx = src[0] === '1' ? 0 : 1;
    return groupPicks[src[1]]?.[idx] ?? null;
  }
  if (src.startsWith('3rd_')) return picks['3_' + src.slice(4)] ?? null;
  if (src.startsWith('W'))    return picks[src.slice(1)] ?? null;
  if (src.startsWith('L')) {
    const matchId = src.slice(1);
    const winner  = picks[matchId];
    if (!winner) return null;
    const sfMatch = [...SF_L, ...SF_R].find(m => m.id === matchId);
    if (!sfMatch) return null;
    const t1 = resolveSlot(sfMatch.t1, groupPicks, picks);
    const t2 = resolveSlot(sfMatch.t2, groupPicks, picks);
    return t1 === winner ? t2 : t1;
  }
  return null;
}

function slotLabel(src) {
  if (/^[12][A-L]$/.test(src)) return src[0] === '1' ? `1st Grp ${src[1]}` : `2nd Grp ${src[1]}`;
  if (src.startsWith('3rd_'))  return `3rd (${THIRD_LABELS[src] ?? ''})`;
  return '· · ·';
}

function simFor(simData, team) {
  if (!simData?.teams || !team) return null;
  return simData.teams.find(t => t.team.toLowerCase() === team.toLowerCase()) ?? null;
}

function modelGroupOrder(simData, group) {
  if (!simData) return GROUPS[group];
  return [...GROUPS[group]].sort((a, b) =>
    (simFor(simData, b)?.r32_pct ?? 0) - (simFor(simData, a)?.r32_pct ?? 0)
  );
}

function modelWinner(simData, t1, t2) {
  if (!simData || !t1 || !t2) return null;
  return (simFor(simData, t1)?.win_pct ?? 0) >= (simFor(simData, t2)?.win_pct ?? 0) ? t1 : t2;
}

// ── Country flag codes → flagcdn.com ISO codes ─────────────────────
const TEAM_FLAGS = {
  'Mexico':                 'mx', 'South Africa':          'za',
  'South Korea':            'kr', 'Czech Republic':        'cz',
  'Canada':                 'ca', 'Bosnia and Herzegovina':'ba',
  'Qatar':                  'qa', 'Switzerland':           'ch',
  'Brazil':                 'br', 'Morocco':               'ma',
  'Haiti':                  'ht', 'Scotland':              'gb-sct',
  'United States':          'us', 'Paraguay':              'py',
  'Australia':              'au', 'Turkey':                'tr',
  'Germany':                'de', 'Ivory Coast':           'ci',
  'Curaçao':                'cw', 'Ecuador':               'ec',
  'Netherlands':            'nl', 'Japan':                 'jp',
  'Sweden':                 'se', 'Tunisia':               'tn',
  'Belgium':                'be', 'Egypt':                 'eg',
  'Iran':                   'ir', 'New Zealand':           'nz',
  'Spain':                  'es', 'Saudi Arabia':          'sa',
  'Cape Verde':             'cv', 'Uruguay':               'uy',
  'France':                 'fr', 'Senegal':               'sn',
  'Iraq':                   'iq', 'Norway':                'no',
  'Argentina':              'ar', 'Austria':               'at',
  'Algeria':                'dz', 'Jordan':                'jo',
  'Portugal':               'pt', 'Colombia':              'co',
  'DR Congo':               'cd', 'Uzbekistan':            'uz',
  'England':                'gb-eng', 'Croatia':           'hr',
  'Ghana':                  'gh', 'Panama':                'pa',
};

// ── Match card ─────────────────────────────────────────────────────
const CARD_W = 158;

function MatchCard({ match, t1, t2, winner, onPick, simData, flip, fillWidth }) {
  const canPick = !!(t1 && t2);
  const s1 = simFor(simData, t1);
  const s2 = simFor(simData, t2);
  let bar1 = 50, bar2 = 50;
  if (s1 && s2 && s1.win_pct + s2.win_pct > 0) {
    const tot = s1.win_pct + s2.win_pct;
    bar1 = Math.min(99, Math.max(1, Math.round(s1.win_pct / tot * 100)));
    bar2 = 100 - bar1;
  }

  const slot = (team, src, isTop, pct) => {
    const won  = winner === team;
    const lost = winner && !won && !!team;
    const flag = team ? (TEAM_FLAGS[team] ?? null) : null;
    return (
      <div
        onClick={() => canPick && team && onPick(team)}
        style={{
          padding: '7px 9px',
          borderTop: isTop ? 'none' : `1px solid ${v4.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: canPick && team ? 'pointer' : 'default',
          background: won ? 'rgba(0,255,135,0.1)' : 'transparent',
          opacity: lost ? 0.4 : 1,
          transition: 'background 0.12s',
          minWidth: 0,
        }}
      >
        {/* winner tick — collapses to 0 width when not needed */}
        <span style={{ width: won ? 10 : 0, flexShrink: 0, fontSize: 8.5, color: v4.electric, overflow: 'hidden', transition: 'width 0.1s' }}>
          {won ? '✓' : ''}
        </span>
        {/* flag — primary visual identifier */}
        {flag ? (
          <img
            src={`https://flagcdn.com/32x24/${flag}.png`}
            width={32}
            height={24}
            alt=""
            style={{ flexShrink: 0, display: 'block', borderRadius: 2, objectFit: 'cover' }}
          />
        ) : null}
        {/* name — secondary, truncates for long names */}
        <span style={{
          flex: 1, fontSize: team ? 11.5 : 11, fontWeight: team ? 500 : 600, minWidth: 0,
          color: won ? v4.electric : team ? v4.textDim : v4.textVeryDim,
          fontFamily: display,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {team ?? slotLabel(src)}
        </span>
        {pct != null && team && (
          <span style={{ fontSize: 10, color: v4.textVeryDim, fontFamily: mono, flexShrink: 0 }}>
            {pct}%
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{
      background: v4.bg2,
      border: `1px solid ${winner ? 'rgba(0,255,135,0.25)' : v4.border}`,
      borderRadius: 7,
      overflow: 'hidden',
      width: fillWidth ? '100%' : CARD_W,
      flexShrink: 0,
    }}>
      {slot(t1, match.t1, true,  canPick ? bar1 : null)}
      {canPick && (
        <div style={{ height: 2, background: v4.border, position: 'relative' }}>
          <div style={{
            position: 'absolute', left: flip ? 'auto' : 0, right: flip ? 0 : 'auto',
            top: 0, height: '100%', width: `${bar1}%`,
            background: `linear-gradient(90deg, ${v4.electric}, ${v4.purple})`,
          }} />
        </div>
      )}
      {slot(t2, match.t2, false, canPick ? bar2 : null)}
    </div>
  );
}

// ── SVG connector lines between bracket columns ────────────────────
// Draws the ├─ connector from "from" matches to "to" matches (to = from/2).
// flip=true mirrors horizontally (for right half).
function BracketConnector({ from, height, flip }) {
  const to = from / 2;
  const W  = 14;
  const LINE = 'rgba(255,255,255,0.14)';

  const srcCenter = i => (i + 0.5) * (height / from);
  const dstCenter = i => (i + 0.5) * (height / to);

  return (
    <svg
      width={W}
      height={height}
      style={{ flexShrink: 0, display: 'block', transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      {Array.from({ length: to }, (_, i) => {
        const top = srcCenter(i * 2);
        const bot = srcCenter(i * 2 + 1);
        const mid = dstCenter(i);
        return (
          <g key={i}>
            <line x1={0} y1={top} x2={W / 2} y2={top} stroke={LINE} strokeWidth={1} />
            <line x1={0} y1={bot} x2={W / 2} y2={bot} stroke={LINE} strokeWidth={1} />
            <line x1={W / 2} y1={top} x2={W / 2} y2={bot} stroke={LINE} strokeWidth={1} />
            <line x1={W / 2} y1={mid} x2={W} y2={mid} stroke={LINE} strokeWidth={1} />
          </g>
        );
      })}
    </svg>
  );
}

// ── Bracket column (one round) ─────────────────────────────────────
function BracketColumn({ label, matches, groupPicks, picks, onPick, simData, height, flip, labelSide }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: CARD_W, flexShrink: 0 }}>
      <div style={{
        textAlign: labelSide === 'right' ? 'right' : 'center',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: v4.textVeryDim,
        fontFamily: mono,
        padding: '0 0 8px',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        height,
      }}>
        {matches.map(match => {
          const t1 = resolveSlot(match.t1, groupPicks, picks);
          const t2 = resolveSlot(match.t2, groupPicks, picks);
          return (
            <div key={match.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MatchCard
                match={match}
                t1={t1} t2={t2}
                winner={picks[match.id]}
                onPick={team => onPick(match.id, team)}
                simData={simData}
                flip={flip}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Group stage components ─────────────────────────────────────────
const RANK_COLORS = [v4.electric, 'rgba(0,255,135,0.55)', v4.textDim, v4.textVeryDim];
const RANK_BGS    = ['rgba(0,255,135,0.18)', 'rgba(0,255,135,0.08)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)'];

function GroupCard({ letter, order, onReorder, simData, lockedData }) {
  const mobile = useIsMobile();
  const [dragIdx,  setDragIdx]  = React.useState(null);
  const [dragOver, setDragOver] = React.useState(null);

  const lockMap = React.useMemo(
    () => Object.fromEntries((lockedData || []).map(t => [t.team, t])),
    [lockedData]
  );
  const isLocked = team => lockMap[team]?.pos_locked ?? false;

  function handleDragStart(e, idx) {
    if (isLocked(order[idx])) return;
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleDragOver(e, idx) {
    e.preventDefault();
    setDragOver(idx);
  }
  function handleDrop(e, targetIdx) {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== targetIdx) {
      if (!isLocked(order[targetIdx]) && !isLocked(order[dragIdx])) {
        const next = [...order];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(targetIdx, 0, moved);
        onReorder(next);
      }
    }
    setDragIdx(null); setDragOver(null);
  }
  function handleDragEnd() { setDragIdx(null); setDragOver(null); }

  function promoteToFirst(idx) {
    if (idx === 0 || isLocked(order[idx]) || isLocked(order[0])) return;
    const next = [...order];
    const [moved] = next.splice(idx, 1);
    next.unshift(moved);
    onReorder(next);
  }
  function moveUp(idx) {
    if (idx === 0 || isLocked(order[idx]) || isLocked(order[idx - 1])) return;
    const next = [...order];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onReorder(next);
  }
  function moveDown(idx) {
    if (idx >= order.length - 1 || isLocked(order[idx]) || isLocked(order[idx + 1])) return;
    const next = [...order];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onReorder(next);
  }

  return (
    <div style={{ background: v4.bg2, border: `1px solid ${v4.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{
        background: 'rgba(123,46,227,0.15)', borderBottom: `1px solid ${v4.border}`,
        padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: v4.purple, fontSize: 11, fontWeight: 700, fontFamily: mono, letterSpacing: '0.06em' }}>
          GROUP {letter}
        </span>
        {!mobile && (
          <span style={{ color: v4.textVeryDim, fontSize: 8, fontFamily: mono }}>drag · click→1st</span>
        )}
      </div>
      {order.map((team, idx) => {
        const advPct       = simFor(simData, team)?.r32_pct;
        const locked       = isLocked(team);
        const isDragging   = dragIdx === idx;
        const isDragTarget = dragOver === idx && dragIdx !== null && dragIdx !== idx && !locked;
        const upBlocked    = idx === 0 || isLocked(order[idx - 1]);
        const downBlocked  = idx >= order.length - 1 || isLocked(order[idx + 1]);
        return (
          <div
            key={team}
            draggable={!mobile && !locked}
            onDragStart={!mobile && !locked ? e => handleDragStart(e, idx) : undefined}
            onDragOver={!mobile  ? e => handleDragOver(e, idx)  : undefined}
            onDrop={!mobile      ? e => handleDrop(e, idx)      : undefined}
            onDragEnd={!mobile   ? handleDragEnd                : undefined}
            onClick={() => !mobile && !locked && promoteToFirst(idx)}
            style={{
              padding: '8px 10px 8px 12px',
              borderBottom: idx < order.length - 1 ? `1px solid ${v4.border}` : 'none',
              borderLeft: isDragTarget ? `2px solid ${v4.electric}` : locked ? `2px solid rgba(0,255,135,0.3)` : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: mobile || locked ? 'default' : 'grab',
              background: isDragTarget
                ? 'rgba(0,255,135,0.1)'
                : idx === 0 ? 'rgba(0,255,135,0.06)'
                : idx === 1 ? 'rgba(0,255,135,0.02)'
                : 'transparent',
              opacity: isDragging ? 0.3 : 1,
              transition: 'background 0.15s, opacity 0.12s',
            }}
          >
            <span style={{
              width: 17, height: 17, borderRadius: 3, flexShrink: 0,
              background: RANK_BGS[idx],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8.5, fontWeight: 800, color: RANK_COLORS[idx], fontFamily: mono,
            }}>
              {idx + 1}
            </span>
            <span style={{
              flex: 1, fontSize: 12, fontWeight: 600,
              color: idx < 2 ? v4.text : v4.textDim, fontFamily: display,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {team}
            </span>
            {advPct != null && (
              <span style={{ fontSize: 9, color: v4.electric, fontFamily: mono, flexShrink: 0 }}>
                {Math.min(99, advPct).toFixed(0)}%
              </span>
            )}
            {mobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                <button
                  onClick={e => { e.stopPropagation(); moveUp(idx); }}
                  disabled={locked || upBlocked}
                  style={{
                    width: 18, height: 14, padding: 0, border: 'none', borderRadius: 3,
                    background: locked || upBlocked ? 'transparent' : 'rgba(255,255,255,0.1)',
                    color: locked || upBlocked ? 'transparent' : v4.textDim,
                    fontSize: 7, cursor: locked || upBlocked ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >▲</button>
                <button
                  onClick={e => { e.stopPropagation(); moveDown(idx); }}
                  disabled={locked || downBlocked}
                  style={{
                    width: 18, height: 14, padding: 0, border: 'none', borderRadius: 3,
                    background: locked || downBlocked ? 'transparent' : 'rgba(255,255,255,0.1)',
                    color: locked || downBlocked ? 'transparent' : v4.textDim,
                    fontSize: 7, cursor: locked || downBlocked ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >▼</button>
              </div>
            ) : (
              <span style={{ fontSize: 11, flexShrink: 0, userSelect: 'none',
                color: locked ? v4.electric : v4.textVeryDim,
                opacity: locked ? 0.7 : 0.4,
              }}>
                {locked ? '🔒' : '⠿'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GroupStageView({ groupPicks, onGroupReorder, simData, standingsData, onContinue }) {
  const mobile = useIsMobile();
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ color: v4.textDim, fontSize: 13.5, margin: 0, fontFamily: display }}>
          {mobile
            ? <>Use <span style={{ color: v4.electric }}>▲▼</span> to reorder teams. 🔒 = position locked by results.</>
            : <>Drag or click to reorder. <span style={{ color: v4.electric }}>🔒</span> = mathematically locked. Green % = model advance probability.</>
          }
        </p>
        <button
          onClick={onContinue}
          style={{
            background: v4.electric, color: '#000',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            fontSize: 12.5, fontWeight: 700, fontFamily: display, cursor: 'pointer',
          }}
        >
          Knockout Round →
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
        {Object.keys(GROUPS).map(letter => (
          <GroupCard
            key={letter}
            letter={letter}
            order={groupPicks[letter]}
            onReorder={newOrder => onGroupReorder(letter, newOrder)}
            simData={simData}
            lockedData={standingsData?.groups?.[letter]}
          />
        ))}
      </div>
    </div>
  );
}

// ── 3rd place picker ───────────────────────────────────────────────
// These are the 8 official bracket slot keys that resolveSlot expects
const THIRD_SLOTS = ['3_ABCDF','3_CDFGH','3_CEFHI','3_EHIJK','3_BEFIJ','3_AEHIJ','3_EFGIJ','3_DEIJL'];

function ThirdPlacePicker({ onPick, groupPicks, simData, selected, onSelectionChange }) {

  const thirds = Object.keys(GROUPS).map(letter => ({
    team:  groupPicks[letter]?.[2],
    group: letter,
    pct:   simFor(simData, groupPicks[letter]?.[2])?.r32_pct ?? 0,
  })).filter(x => x.team).sort((a, b) => b.pct - a.pct);

  const validTeams = new Set(thirds.map(t => t.team));

  function pushAssignments(sel) {
    THIRD_SLOTS.forEach(slot => onPick(slot, null));
    const sorted = [...sel]
      .filter(t => validTeams.has(t))
      .sort((a, b) => (simFor(simData, b)?.r32_pct ?? 0) - (simFor(simData, a)?.r32_pct ?? 0));
    sorted.forEach((team, i) => { if (THIRD_SLOTS[i]) onPick(THIRD_SLOTS[i], team); });
  }

  function toggle(team) {
    const next = new Set(selected);
    if (next.has(team)) { next.delete(team); }
    else if (next.size < 8) { next.add(team); }
    else { return; }
    onSelectionChange(next);
    pushAssignments(next);
  }

  // Prune selections if group reorder changes who is 3rd
  const thirdsKey = thirds.map(t => t.team).join(',');
  React.useEffect(() => {
    const pruned = new Set([...selected].filter(t => validTeams.has(t)));
    if (pruned.size !== selected.size) {
      onSelectionChange(pruned);
      pushAssignments(pruned);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thirdsKey]);

  return (
    <div style={{
      background: v4.bg2, border: `1px solid ${v4.border}`,
      borderRadius: 10, padding: '12px 14px', marginBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: v4.textDim, fontFamily: mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Best 3rd-Place Qualifiers
        </span>
        <span style={{ fontSize: 10, color: selected.size === 8 ? v4.electric : v4.textVeryDim, fontFamily: mono }}>
          {selected.size}/8
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {thirds.map(({ team, group, pct }) => {
          const isSel   = selected.has(team);
          const canPick = isSel || selected.size < 8;
          return (
            <div
              key={team}
              onClick={() => canPick && toggle(team)}
              style={{
                background: isSel ? 'rgba(0,255,135,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isSel ? 'rgba(0,255,135,0.3)' : v4.border}`,
                borderRadius: 6, padding: '5px 10px',
                cursor: canPick ? 'pointer' : 'not-allowed',
                opacity: canPick ? 1 : 0.35,
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <span style={{ fontSize: 10.5, fontWeight: 600, color: isSel ? v4.electric : v4.text, fontFamily: display }}>{team}</span>
              <span style={{ fontSize: 9, color: v4.textVeryDim, fontFamily: mono }}>Group {group} · {Math.min(99, pct).toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
      <p style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim, margin: '8px 0 0' }}>
        Pick 8 · assigned to bracket slots by model strength · picks auto-propagate
      </p>
    </div>
  );
}

// ── Symmetric knockout bracket ─────────────────────────────────────
function KnockoutView({ groupPicks, picks, onPick, simData, thirdSelected, onThirdSelectionChange }) {
  const H   = 800;
  const GAP = 14;
  const NATURAL_W = CARD_W * 9 + GAP * 8 + 40;
  const LABEL_H   = 28; // approx height of round-label row

  const scale = useBracketScale(NATURAL_W);

  const colProps = { groupPicks, picks, onPick, simData, height: H };

  React.useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('champ-glow-kf')) {
      const s = document.createElement('style');
      s.id = 'champ-glow-kf';
      s.textContent = `
        @keyframes champPulse {
          0%,100% { box-shadow: 0 0 20px rgba(255,176,32,0.15), 0 0 60px rgba(255,176,32,0.06); border-color: rgba(255,176,32,0.35); }
          50%      { box-shadow: 0 0 40px rgba(255,176,32,0.35), 0 0 80px rgba(255,176,32,0.14); border-color: rgba(255,176,32,0.65); }
        }
        @keyframes champFadeIn {
          from { opacity: 0; transform: scale(0.88) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes trophySpin {
          0%   { transform: rotate(-8deg) scale(1); }
          30%  { transform: rotate(8deg) scale(1.12); }
          60%  { transform: rotate(-4deg) scale(1.06); }
          100% { transform: rotate(0deg) scale(1); }
        }
      `;
      document.head.appendChild(s);
    }
  }, []);

  // Round labels for each column (left side, right side)
  const LEFT_LABELS  = ['R. of 32', 'R. of 16', 'Quarter-finals', 'Semi-finals'];
  const RIGHT_LABELS = ['Semi-finals', 'Quarter-finals', 'R. of 16', 'R. of 32'];

  return (
    <div>
      <ThirdPlacePicker onPick={onPick} groupPicks={groupPicks} simData={simData}
        selected={thirdSelected} onSelectionChange={onThirdSelectionChange} />

      {/* Scaled bracket — shrinks to fit container, never overflows horizontally */}
      <div style={{ width: '100%' }}>
        <div style={{ height: Math.round((H + LABEL_H) * scale), position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0,
          transform: `scale(${scale})`, transformOrigin: 'top left',
          width: NATURAL_W,
        }}>
        {/* Round labels row */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 0,
          marginBottom: 0,
          width: NATURAL_W,
        }}>
          {/* Left labels */}
          {LEFT_LABELS.map(l => (
            <React.Fragment key={l}>
              <div style={{ width: CARD_W, flexShrink: 0, textAlign: 'center', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: v4.textVeryDim, fontFamily: mono, paddingBottom: 8, whiteSpace: 'nowrap' }}>
                {l}
              </div>
              <div style={{ width: GAP, flexShrink: 0 }} />
            </React.Fragment>
          ))}
          {/* Final label */}
          <div style={{ width: CARD_W + 40, flexShrink: 0, textAlign: 'center', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: v4.electric, fontFamily: mono, paddingBottom: 8 }}>
            FINAL
          </div>
          {/* Right labels */}
          {RIGHT_LABELS.map(l => (
            <React.Fragment key={'r-' + l}>
              <div style={{ width: GAP, flexShrink: 0 }} />
              <div style={{ width: CARD_W, flexShrink: 0, textAlign: 'center', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: v4.textVeryDim, fontFamily: mono, paddingBottom: 8, whiteSpace: 'nowrap' }}>
                {l}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Bracket body */}
        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          height: H,
          width: NATURAL_W,
        }}>
          {/* ── LEFT HALF: R32 → R16 → QF → SF ── */}
          <BracketColumn label="" matches={R32_L} {...colProps} />
          <BracketConnector from={8} height={H} />
          <BracketColumn label="" matches={R16_L} {...colProps} />
          <BracketConnector from={4} height={H} />
          <BracketColumn label="" matches={QF_L} {...colProps} />
          <BracketConnector from={2} height={H} />
          <BracketColumn label="" matches={SF_L} {...colProps} />
          <BracketConnector from={1} height={H} />

          {/* ── FINAL + 3rd place (center) ── */}
          <div style={{
            width: CARD_W + 40,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 0,
          }}>
            {/* Final */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                background: 'rgba(0,255,135,0.06)',
                border: `1px solid rgba(0,255,135,0.2)`,
                borderRadius: 10,
                padding: '4px 10px',
                fontSize: 9.5,
                fontWeight: 700,
                color: v4.electric,
                fontFamily: mono,
                letterSpacing: '0.08em',
              }}>
                🏆 FINAL
              </div>
              {(() => {
                const t1 = resolveSlot('WS1', groupPicks, picks);
                const t2 = resolveSlot('WS2', groupPicks, picks);
                return (
                  <MatchCard
                    match={FINAL[0]}
                    t1={t1} t2={t2}
                    winner={picks['F']}
                    onPick={team => onPick('F', team)}
                    simData={simData}
                  />
                );
              })()}
            </div>

            {/* Champion reveal */}
            {picks['F'] && (
              <div style={{
                margin: '22px 0 4px',
                textAlign: 'center',
                padding: '18px 24px 16px',
                background: 'linear-gradient(180deg, rgba(255,176,32,0.13) 0%, rgba(255,176,32,0.04) 100%)',
                border: '1px solid rgba(255,176,32,0.35)',
                borderRadius: 16,
                animation: 'champFadeIn 0.45s cubic-bezier(0.2,0.8,0.3,1) both, champPulse 2.8s ease-in-out 0.5s infinite',
                width: '100%',
                boxSizing: 'border-box',
              }}>
                <div style={{ fontSize: 32, animation: 'trophySpin 0.7s cubic-bezier(0.2,0.8,0.3,1) 0.4s both', display: 'inline-block', marginBottom: 10 }}>🏆</div>
                {TEAM_FLAGS[picks['F']] && (
                  <div style={{ marginBottom: 10 }}>
                    <img
                      src={`https://flagcdn.com/80x60/${TEAM_FLAGS[picks['F']]}.png`}
                      width={80}
                      height={60}
                      alt={picks['F']}
                      style={{ display: 'block', margin: '0 auto', borderRadius: 5, boxShadow: '0 0 18px rgba(255,208,32,0.35)' }}
                    />
                  </div>
                )}
                <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: v4.amber, textTransform: 'uppercase', marginBottom: 7 }}>
                  World Champion 2026
                </div>
                <div style={{
                  fontFamily: display, fontSize: 19, fontWeight: 800,
                  color: '#FFD060', letterSpacing: '-0.02em', lineHeight: 1.1,
                  textShadow: '0 0 20px rgba(255,208,32,0.55)',
                }}>
                  {picks['F']}
                </div>
              </div>
            )}

            {/* 3rd place */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: picks['F'] ? 16 : 28 }}>
              <div style={{
                background: 'rgba(255,176,32,0.06)',
                border: `1px solid rgba(255,176,32,0.2)`,
                borderRadius: 10,
                padding: '4px 10px',
                fontSize: 9.5,
                fontWeight: 700,
                color: v4.amber,
                fontFamily: mono,
                letterSpacing: '0.08em',
              }}>
                🥉 3RD PLACE
              </div>
              {(() => {
                const t1 = resolveSlot('LS1', groupPicks, picks);
                const t2 = resolveSlot('LS2', groupPicks, picks);
                return (
                  <MatchCard
                    match={THIRD_PLACE[0]}
                    t1={t1} t2={t2}
                    winner={picks['3P']}
                    onPick={team => onPick('3P', team)}
                    simData={simData}
                  />
                );
              })()}
            </div>
          </div>

          {/* ── RIGHT HALF: SF → QF → R16 → R32 ── */}
          <BracketConnector from={1} height={H} flip />
          <BracketColumn label="" matches={SF_R} {...colProps} flip />
          <BracketConnector from={2} height={H} flip />
          <BracketColumn label="" matches={QF_R} {...colProps} flip />
          <BracketConnector from={4} height={H} flip />
          <BracketColumn label="" matches={R16_R} {...colProps} flip />
          <BracketConnector from={8} height={H} flip />
          <BracketColumn label="" matches={R32_R} {...colProps} flip />
        </div>
        </div>
        </div>
      </div>

      <p style={{ fontSize: 10.5, color: v4.textVeryDim, fontFamily: mono, marginTop: 10, textAlign: 'center' }}>
        bar = relative model strength &nbsp;·&nbsp; click a team to pick the winner &nbsp;·&nbsp; picks propagate forward
      </p>
    </div>
  );
}

// ── Mobile round-by-round view ─────────────────────────────────────
const MOBILE_ROUNDS = [
  { id: 'R32',   label: 'R32',   fullLabel: 'Round of 32',         matches: [...R32_L, ...R32_R] },
  { id: 'R16',   label: 'R16',   fullLabel: 'Round of 16',         matches: [...R16_L, ...R16_R] },
  { id: 'QF',    label: 'QF',    fullLabel: 'Quarter-finals',      matches: [...QF_L,  ...QF_R]  },
  { id: 'SF',    label: 'SF',    fullLabel: 'Semi-finals',         matches: [...SF_L,  ...SF_R]  },
  { id: 'Final', label: 'Final', fullLabel: 'Final & 3rd Place',   matches: [...FINAL, ...THIRD_PLACE] },
];

function MobileKnockoutView({ groupPicks, picks, onPick, simData, thirdSelected, onThirdSelectionChange }) {
  const [round, setRound] = React.useState('R32');
  const ridx     = MOBILE_ROUNDS.findIndex(r => r.id === round);
  const current  = MOBILE_ROUNDS[ridx];
  const champion = picks['F'] ?? null;

  React.useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('champ-glow-kf')) {
      const s = document.createElement('style');
      s.id = 'champ-glow-kf';
      s.textContent = `
        @keyframes champPulse { 0%,100% { box-shadow:0 0 20px rgba(255,176,32,.15),0 0 60px rgba(255,176,32,.06); border-color:rgba(255,176,32,.35); } 50% { box-shadow:0 0 40px rgba(255,176,32,.35),0 0 80px rgba(255,176,32,.14); border-color:rgba(255,176,32,.65); } }
        @keyframes champFadeIn { from { opacity:0; transform:scale(.88) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes trophySpin  { 0% { transform:rotate(-8deg) scale(1); } 30% { transform:rotate(8deg) scale(1.12); } 60% { transform:rotate(-4deg) scale(1.06); } 100% { transform:rotate(0deg) scale(1); } }
      `;
      document.head.appendChild(s);
    }
  }, []);

  const pickedCount = current.matches.filter(m => picks[m.id]).length;

  return (
    <div>
      <ThirdPlacePicker onPick={onPick} groupPicks={groupPicks} simData={simData}
        selected={thirdSelected} onSelectionChange={onThirdSelectionChange} />

      {/* Round tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
        {MOBILE_ROUNDS.map(r => {
          const isActive = r.id === round;
          return (
            <button key={r.id} onClick={() => setRound(r.id)} style={{
              flexShrink: 0,
              background: isActive ? v4.electric : 'transparent',
              color: isActive ? '#000' : v4.textDim,
              border: `1px solid ${isActive ? v4.electric : v4.border}`,
              borderRadius: 7, padding: '7px 14px',
              fontSize: 12, fontWeight: 700, fontFamily: mono, cursor: 'pointer',
              letterSpacing: '0.04em', transition: 'all 0.15s',
            }}>
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Round header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: display, fontSize: 15, fontWeight: 700, color: v4.text }}>
          {current.fullLabel}
        </span>
        <span style={{ fontFamily: mono, fontSize: 10, color: pickedCount === current.matches.length ? v4.electric : v4.textVeryDim }}>
          {pickedCount}/{current.matches.length} picked
        </span>
      </div>

      {/* Match list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {current.matches.map(match => {
          const t1 = resolveSlot(match.t1, groupPicks, picks);
          const t2 = resolveSlot(match.t2, groupPicks, picks);
          return (
            <MatchCard key={match.id} match={match} t1={t1} t2={t2}
              winner={picks[match.id]}
              onPick={team => onPick(match.id, team)}
              simData={simData}
              fillWidth
            />
          );
        })}
      </div>

      {/* Champion reveal */}
      {round === 'Final' && champion && (
        <div style={{
          marginTop: 20, textAlign: 'center', padding: '18px 24px 16px',
          background: 'linear-gradient(180deg, rgba(255,176,32,0.13) 0%, rgba(255,176,32,0.04) 100%)',
          border: '1px solid rgba(255,176,32,0.35)', borderRadius: 16,
          animation: 'champFadeIn 0.45s cubic-bezier(0.2,0.8,0.3,1) both, champPulse 2.8s ease-in-out 0.5s infinite',
        }}>
          <div style={{ fontSize: 32, animation: 'trophySpin 0.7s cubic-bezier(0.2,0.8,0.3,1) 0.4s both', display: 'inline-block', marginBottom: 10 }}>🏆</div>
          {TEAM_FLAGS[champion] && (
            <div style={{ marginBottom: 10 }}>
              <img
                src={`https://flagcdn.com/80x60/${TEAM_FLAGS[champion]}.png`}
                width={80} height={60} alt={champion}
                style={{ display: 'block', margin: '0 auto', borderRadius: 5, boxShadow: '0 0 18px rgba(255,208,32,0.35)' }}
              />
            </div>
          )}
          <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: v4.amber, textTransform: 'uppercase', marginBottom: 7 }}>World Champion 2026</div>
          <div style={{ fontFamily: display, fontSize: 22, fontWeight: 800, color: '#FFD060', letterSpacing: '-0.02em', textShadow: '0 0 20px rgba(255,208,32,0.55)' }}>
            {champion}
          </div>
        </div>
      )}

      {/* Prev / Next navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, gap: 8 }}>
        <button
          onClick={() => ridx > 0 && setRound(MOBILE_ROUNDS[ridx - 1].id)}
          disabled={ridx === 0}
          style={{
            flex: 1, padding: '11px 0', borderRadius: 8,
            background: 'transparent',
            color: ridx === 0 ? v4.textVeryDim : v4.textDim,
            border: `1px solid ${ridx === 0 ? 'transparent' : v4.border}`,
            fontFamily: display, fontSize: 13, fontWeight: 700,
            cursor: ridx === 0 ? 'default' : 'pointer',
          }}
        >
          {ridx > 0 ? `← ${MOBILE_ROUNDS[ridx - 1].label}` : ''}
        </button>
        <button
          onClick={() => ridx < MOBILE_ROUNDS.length - 1 && setRound(MOBILE_ROUNDS[ridx + 1].id)}
          disabled={ridx === MOBILE_ROUNDS.length - 1}
          style={{
            flex: 1, padding: '11px 0', borderRadius: 8,
            background: ridx === MOBILE_ROUNDS.length - 1 ? 'transparent' : v4.electric,
            color: ridx === MOBILE_ROUNDS.length - 1 ? v4.textVeryDim : '#000',
            border: `1px solid ${ridx === MOBILE_ROUNDS.length - 1 ? 'transparent' : v4.electric}`,
            fontFamily: display, fontSize: 13, fontWeight: 700,
            cursor: ridx === MOBILE_ROUNDS.length - 1 ? 'default' : 'pointer',
          }}
        >
          {ridx < MOBILE_ROUNDS.length - 1 ? `${MOBILE_ROUNDS[ridx + 1].label} →` : ''}
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function TournamentBracket() {
  const mobile = useIsMobile();
  const [simData,       setSimData]      = React.useState(null);
  const [simLoading,    setSimLoading]   = React.useState(false);
  const [simError,      setSimError]     = React.useState(false);
  const [standingsData, setStandingsData]= React.useState(null);

  const [groupPicks, setGroupPicks] = React.useState(
    _urlState?.groupPicks ?? Object.fromEntries(Object.keys(GROUPS).map(g => [g, [...GROUPS[g]]]))
  );
  const [picks, setPicks] = React.useState(_urlState?.picks ?? {});
  const [copied, setCopied] = React.useState(false);
  const [thirdSelected, setThirdSelected] = React.useState(() => {
    if (!_urlState?.picks) return new Set();
    const sel = new Set();
    THIRD_SLOTS.forEach(slot => { if (_urlState.picks[slot]) sel.add(_urlState.picks[slot]); });
    return sel;
  });

  React.useEffect(() => {
    setSimLoading(true);
    fetchSimulation(20_000)
      .then(d => setSimData(d))
      .catch(() => setSimError(true))
      .finally(() => setSimLoading(false));

    // Fetch live standings to lock positions and seed correct group order
    fetchStandings()
      .then(d => {
        setStandingsData(d);
        if (!_urlState) {
          // Fresh load: seed all groups from actual standings
          setGroupPicks(
            Object.fromEntries(
              Object.entries(d.groups).map(([letter, teams]) => [letter, teams.map(t => t.team)])
            )
          );
        } else {
          // Shared URL: only override groups where every position is mathematically locked
          // (i.e. all 3 games played and standings are final facts, not predictions)
          setGroupPicks(prev => {
            const next = { ...prev };
            for (const [letter, teams] of Object.entries(d.groups)) {
              if (teams.every(t => t.pos_locked)) {
                next[letter] = teams.map(t => t.team);
              }
            }
            return next;
          });
        }
      })
      .catch(() => {}); // silently fail — falls back to original draw order
  }, []);

  function handleGroupReorder(letter, newOrder) {
    setGroupPicks(prev => {
      const next = { ...prev, [letter]: newOrder };
      setPicks(cur => {
        const cleared = { ...cur };
        const oldOrder = prev[letter];
        const stale = new Set([
          ...(newOrder[0] !== oldOrder[0] ? [oldOrder[0]] : []),
          ...(newOrder[1] !== oldOrder[1] ? [oldOrder[1]] : []),
        ].filter(Boolean));
        if (stale.size > 0) {
          Object.keys(cleared).forEach(id => {
            if (stale.has(cleared[id])) delete cleared[id];
          });
        }
        return cleared;
      });
      return next;
    });
  }

  function handlePick(matchId, team) {
    if (team === null) {
      setPicks(prev => { const n = { ...prev }; delete n[matchId]; return n; });
    } else {
      setPicks(prev => ({ ...prev, [matchId]: team }));
    }
  }

  function fillWithModel() {
    if (!simData) return;
    const newGroups = Object.fromEntries(
      Object.keys(GROUPS).map(g => {
        // For fully locked groups, use actual standings (facts > model predictions)
        const standing = standingsData?.groups?.[g];
        if (standing && standing.every(t => t.pos_locked)) {
          return [g, standing.map(t => t.team)];
        }
        return [g, modelGroupOrder(simData, g)];
      })
    );
    setGroupPicks(newGroups);

    const p = {};

    // Auto-pick top-8 third-place teams by model advance %
    const thirds = Object.keys(GROUPS)
      .map(g => newGroups[g][2])
      .filter(Boolean)
      .sort((a, b) => (simFor(simData, b)?.r32_pct ?? 0) - (simFor(simData, a)?.r32_pct ?? 0))
      .slice(0, 8);
    thirds.forEach((team, i) => { if (THIRD_SLOTS[i]) p[THIRD_SLOTS[i]] = team; });
    setThirdSelected(new Set(thirds));

    const fill = matches => matches.forEach(m => {
      const t1 = resolveSlot(m.t1, newGroups, p);
      const t2 = resolveSlot(m.t2, newGroups, p);
      const w  = modelWinner(simData, t1, t2);
      if (w) p[m.id] = w;
    });
    fill(R32_L); fill(R32_R);
    fill(R16_L); fill(R16_R);
    fill(QF_L);  fill(QF_R);
    fill(SF_L);  fill(SF_R);
    fill(FINAL);
    // 3rd place: losers of each SF
    const sf1Winner = p['S1'];
    const sf2Winner = p['S2'];
    if (sf1Winner && sf2Winner) {
      const sf1T1 = resolveSlot(SF_L[0].t1, newGroups, p);
      const sf1T2 = resolveSlot(SF_L[0].t2, newGroups, p);
      const sf2T1 = resolveSlot(SF_R[0].t1, newGroups, p);
      const sf2T2 = resolveSlot(SF_R[0].t2, newGroups, p);
      const l1 = sf1T1 === sf1Winner ? sf1T2 : sf1T1;
      const l2 = sf2T1 === sf2Winner ? sf2T2 : sf2T1;
      const w3p = modelWinner(simData, l1, l2);
      if (w3p) p['3P'] = w3p;
    }
    setPicks(p);
  }

  function resetAll() {
    setGroupPicks(Object.fromEntries(Object.keys(GROUPS).map(g => [g, [...GROUPS[g]]])));
    setPicks({});
    setThirdSelected(new Set());
    window.history.replaceState(null, '', window.location.pathname);
  }

  function shareUrl() {
    const encoded = encodeState(groupPicks, picks);
    const url = `${window.location.origin}${window.location.pathname}?b=${encoded}`;
    window.history.replaceState(null, '', `?b=${encoded}`);
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const champion    = picks['F']  ?? null;
  const thirdPlace  = picks['3P'] ?? null;

  return (
    <section style={{ padding: mobile ? '56px 20px' : '72px 56px', background: v4.bg, borderTop: `1px solid ${v4.border}` }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                background: 'rgba(123,46,227,0.15)', border: '1px solid rgba(123,46,227,0.3)',
                borderRadius: 6, padding: '3px 10px',
                fontSize: 10.5, fontWeight: 700, color: v4.purple,
                fontFamily: mono, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                BRACKET
              </span>
              {simLoading && <span style={{ fontSize: 10.5, color: v4.textVeryDim, fontFamily: mono }}>loading model…</span>}
            </div>
            <h2 style={{ color: v4.text, fontSize: mobile ? 26 : 34, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, fontFamily: display }}>
              2026 Knockout Bracket
            </h2>
            <p style={{ color: v4.textDim, fontSize: 15, marginTop: 8, maxWidth: 520, fontFamily: display }}>
              Group stage complete. Pick your 3rd-place qualifiers, then click through every knockout round.
              Model win probabilities shown at every step.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={fillWithModel}
              disabled={!simData}
              style={{
                background: simError ? 'rgba(255,85,119,0.1)' : 'rgba(123,46,227,0.15)',
                color: simData ? v4.purple : simError ? '#ff5577' : v4.textVeryDim,
                border: `1px solid ${simData ? 'rgba(123,46,227,0.4)' : simError ? 'rgba(255,85,119,0.3)' : v4.border}`,
                borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700,
                fontFamily: display, cursor: simData ? 'pointer' : 'not-allowed',
              }}
            >
              {simError ? 'Model unavailable' : simLoading ? 'Loading model…' : 'Use model picks'}
            </button>
            <button
              onClick={shareUrl}
              style={{
                background: copied ? 'rgba(0,255,135,0.12)' : 'transparent',
                color: copied ? v4.electric : v4.textDim,
                border: `1px solid ${copied ? 'rgba(0,255,135,0.35)' : v4.border}`,
                borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700,
                fontFamily: display, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {copied ? '✓ Link copied' : 'Share bracket'}
            </button>
            <button
              onClick={resetAll}
              style={{
                background: 'transparent', color: v4.textVeryDim,
                border: `1px solid ${v4.border}`, borderRadius: 8,
                padding: '8px 14px', fontSize: 12.5, fontWeight: 700,
                fontFamily: display, cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
        </div>

      </div>

      {mobile ? (
        <MobileKnockoutView
          groupPicks={groupPicks}
          picks={picks}
          onPick={handlePick}
          simData={simData}
          thirdSelected={thirdSelected}
          onThirdSelectionChange={setThirdSelected}
        />
      ) : (
        <KnockoutView
          groupPicks={groupPicks}
          picks={picks}
          onPick={handlePick}
          simData={simData}
          thirdSelected={thirdSelected}
          onThirdSelectionChange={setThirdSelected}
        />
      )}
      </div>
    </section>
  );
}
