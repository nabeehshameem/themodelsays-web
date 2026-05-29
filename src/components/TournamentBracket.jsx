import React from 'react';
import { fetchSimulation } from '../lib/api.js';

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
// Left half: matches 73-80 → R16 R1-R4 → QF Q1-Q2 → SF S1
// Right half: matches 81-88 → R16 R5-R8 → QF Q3-Q4 → SF S2
const R32_L = [
  { id: '73', t1: '2A', t2: '2B' },
  { id: '74', t1: '1E', t2: '3rd_ABCDF' },
  { id: '75', t1: '1F', t2: '2C' },
  { id: '76', t1: '1C', t2: '2F' },
  { id: '77', t1: '1I', t2: '3rd_CDFGH' },
  { id: '78', t1: '2E', t2: '2I' },
  { id: '79', t1: '1A', t2: '3rd_CEFHI' },
  { id: '80', t1: '1L', t2: '3rd_EHIJK' },
];
const R32_R = [
  { id: '81', t1: '1D', t2: '3rd_BEFIJ' },
  { id: '82', t1: '1G', t2: '3rd_AEHIJ' },
  { id: '83', t1: '2K', t2: '2L' },
  { id: '84', t1: '1H', t2: '2J' },
  { id: '85', t1: '1B', t2: '3rd_EFGIJ' },
  { id: '86', t1: '1J', t2: '2H' },
  { id: '87', t1: '1K', t2: '3rd_DEIJL' },
  { id: '88', t1: '2D', t2: '2G' },
];
const R16_L = [
  { id: 'R1', t1: 'W73', t2: 'W74' },
  { id: 'R2', t1: 'W75', t2: 'W76' },
  { id: 'R3', t1: 'W77', t2: 'W78' },
  { id: 'R4', t1: 'W79', t2: 'W80' },
];
const R16_R = [
  { id: 'R5', t1: 'W81', t2: 'W82' },
  { id: 'R6', t1: 'W83', t2: 'W84' },
  { id: 'R7', t1: 'W85', t2: 'W86' },
  { id: 'R8', t1: 'W87', t2: 'W88' },
];
const QF_L  = [{ id: 'Q1', t1: 'WR1', t2: 'WR2' }, { id: 'Q2', t1: 'WR3', t2: 'WR4' }];
const QF_R  = [{ id: 'Q3', t1: 'WR5', t2: 'WR6' }, { id: 'Q4', t1: 'WR7', t2: 'WR8' }];
const SF_L  = [{ id: 'S1', t1: 'WQ1', t2: 'WQ2' }];
const SF_R  = [{ id: 'S2', t1: 'WQ3', t2: 'WQ4' }];
const FINAL = [{ id: 'F',  t1: 'WS1', t2: 'WS2' }];

const THIRD_LABELS = {
  '3rd_ABCDF': 'A/B/C/D/F', '3rd_CDFGH': 'C/D/F/G/H',
  '3rd_CEFHI': 'C/E/F/H/I', '3rd_EHIJK': 'E/H/I/J/K',
  '3rd_BEFIJ': 'B/E/F/I/J', '3rd_AEHIJ': 'A/E/H/I/J',
  '3rd_EFGIJ': 'E/F/G/I/J', '3rd_DEIJL': 'D/E/I/J/L',
};

// ── Helpers ────────────────────────────────────────────────────────
function resolveSlot(src, groupPicks, picks) {
  if (/^[12][A-L]$/.test(src)) {
    const idx = src[0] === '1' ? 0 : 1;
    return groupPicks[src[1]]?.[idx] ?? null;
  }
  if (src.startsWith('3rd_')) return picks['3_' + src.slice(4)] ?? null;
  if (src.startsWith('W'))    return picks[src.slice(1)] ?? null;
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

// ── Match card ─────────────────────────────────────────────────────
const CARD_W = 122;

function MatchCard({ match, t1, t2, winner, onPick, simData, flip }) {
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
    return (
      <div
        onClick={() => canPick && team && onPick(team)}
        style={{
          padding: '6px 8px',
          borderTop: isTop ? 'none' : `1px solid ${v4.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          cursor: canPick && team ? 'pointer' : 'default',
          background: won ? 'rgba(0,255,135,0.1)' : 'transparent',
          opacity: lost ? 0.4 : 1,
          transition: 'background 0.12s',
          minWidth: 0,
        }}
      >
        <span style={{ width: 10, flexShrink: 0, fontSize: 8.5, color: v4.electric }}>
          {won ? '✓' : ''}
        </span>
        <span style={{
          flex: 1, fontSize: 10.5, fontWeight: 600, minWidth: 0,
          color: won ? v4.electric : team ? v4.text : v4.textVeryDim,
          fontFamily: display,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {team ?? slotLabel(src)}
        </span>
        {pct != null && team && (
          <span style={{ fontSize: 8.5, color: v4.textVeryDim, fontFamily: mono, flexShrink: 0 }}>
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
      width: CARD_W,
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

function GroupCard({ letter, order, onReorder, simData }) {
  const mobile = useIsMobile();
  const [dragIdx,  setDragIdx]  = React.useState(null);
  const [dragOver, setDragOver] = React.useState(null);

  function handleDragStart(e, idx) {
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
      const next = [...order];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(targetIdx, 0, moved);
      onReorder(next);
    }
    setDragIdx(null); setDragOver(null);
  }
  function handleDragEnd() { setDragIdx(null); setDragOver(null); }

  function promoteToFirst(idx) {
    if (idx === 0) return;
    const next = [...order];
    const [moved] = next.splice(idx, 1);
    next.unshift(moved);
    onReorder(next);
  }
  function moveUp(idx) {
    if (idx === 0) return;
    const next = [...order];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onReorder(next);
  }
  function moveDown(idx) {
    if (idx >= order.length - 1) return;
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
        const isDragging   = dragIdx === idx;
        const isDragTarget = dragOver === idx && dragIdx !== null && dragIdx !== idx;
        return (
          <div
            key={team}
            draggable={!mobile}
            onDragStart={!mobile ? e => handleDragStart(e, idx) : undefined}
            onDragOver={!mobile  ? e => handleDragOver(e, idx)  : undefined}
            onDrop={!mobile      ? e => handleDrop(e, idx)      : undefined}
            onDragEnd={!mobile   ? handleDragEnd                : undefined}
            onClick={() => !mobile && promoteToFirst(idx)}
            style={{
              padding: '8px 10px 8px 12px',
              borderBottom: idx < order.length - 1 ? `1px solid ${v4.border}` : 'none',
              borderLeft: isDragTarget ? `2px solid ${v4.electric}` : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: mobile ? 'default' : 'grab',
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
              <span style={{ fontSize: 9, color: v4.textVeryDim, fontFamily: mono, flexShrink: 0 }}>
                {Math.min(99, advPct).toFixed(0)}%
              </span>
            )}
            {mobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                <button
                  onClick={e => { e.stopPropagation(); moveUp(idx); }}
                  disabled={idx === 0}
                  style={{
                    width: 18, height: 14, padding: 0, border: 'none', borderRadius: 3,
                    background: idx === 0 ? 'transparent' : 'rgba(255,255,255,0.1)',
                    color: idx === 0 ? 'transparent' : v4.textDim,
                    fontSize: 7, cursor: idx === 0 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >▲</button>
                <button
                  onClick={e => { e.stopPropagation(); moveDown(idx); }}
                  disabled={idx >= order.length - 1}
                  style={{
                    width: 18, height: 14, padding: 0, border: 'none', borderRadius: 3,
                    background: idx >= order.length - 1 ? 'transparent' : 'rgba(255,255,255,0.1)',
                    color: idx >= order.length - 1 ? 'transparent' : v4.textDim,
                    fontSize: 7, cursor: idx >= order.length - 1 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >▼</button>
              </div>
            ) : (
              <span style={{ fontSize: 11, color: v4.textVeryDim, opacity: 0.4, flexShrink: 0, userSelect: 'none' }}>⠿</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GroupStageView({ groupPicks, onGroupReorder, simData, onContinue }) {
  const mobile = useIsMobile();
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ color: v4.textDim, fontSize: 13.5, margin: 0, fontFamily: display }}>
          {mobile
            ? <>Use <span style={{ color: v4.electric }}>▲▼</span> to reorder all 4 teams. Green % = model advance probability.</>
            : <>Drag rows or click a team to promote to <span style={{ color: v4.electric }}>1st</span>. Green % = model advance probability.</>
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
          />
        ))}
      </div>
    </div>
  );
}

// ── 3rd place picker ───────────────────────────────────────────────
// These are the 8 official bracket slot keys that resolveSlot expects
const THIRD_SLOTS = ['3_ABCDF','3_CDFGH','3_CEFHI','3_EHIJK','3_BEFIJ','3_AEHIJ','3_EFGIJ','3_DEIJL'];

function ThirdPlacePicker({ onPick, groupPicks, simData }) {
  const [selected, setSelected] = React.useState(new Set());

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
    setSelected(next);
    pushAssignments(next);
  }

  // Prune selections if group reorder changes who is 3rd
  const thirdsKey = thirds.map(t => t.team).join(',');
  React.useEffect(() => {
    const pruned = new Set([...selected].filter(t => validTeams.has(t)));
    if (pruned.size !== selected.size) {
      setSelected(pruned);
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
              <span style={{ fontSize: 9, color: v4.textVeryDim, fontFamily: mono }}>G{group} · {Math.min(99, pct).toFixed(0)}%</span>
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
function KnockoutView({ groupPicks, picks, onPick, simData }) {
  const H  = 800; // bracket height in px
  const GAP = 14;  // connector width

  const colProps = { groupPicks, picks, onPick, simData, height: H };

  // Round labels for each column (left side, right side)
  const LEFT_LABELS  = ['R. of 32', 'R. of 16', 'Quarter-finals', 'Semi-finals'];
  const RIGHT_LABELS = ['Semi-finals', 'Quarter-finals', 'R. of 16', 'R. of 32'];

  return (
    <div>
      <ThirdPlacePicker onPick={onPick} groupPicks={groupPicks} simData={simData} />

      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        {/* Round labels row */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 0,
          marginBottom: 0,
          minWidth: (CARD_W * 9) + (GAP * 8) + 40,
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
          minWidth: (CARD_W * 9) + (GAP * 8) + 40,
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

          {/* ── FINAL (center) ── */}
          <div style={{
            width: CARD_W + 40,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
          }}>
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
              marginBottom: 6,
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

      <p style={{ fontSize: 10.5, color: v4.textVeryDim, fontFamily: mono, marginTop: 10, textAlign: 'center' }}>
        bar = relative model strength &nbsp;·&nbsp; click a team to pick the winner &nbsp;·&nbsp; picks propagate forward
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function TournamentBracket() {
  const mobile = useIsMobile();
  const [tab,        setTab]       = React.useState('groups');
  const [simData,    setSimData]   = React.useState(null);
  const [simLoading, setSimLoading]= React.useState(false);

  const [groupPicks, setGroupPicks] = React.useState(
    Object.fromEntries(Object.keys(GROUPS).map(g => [g, [...GROUPS[g]]]))
  );
  const [picks, setPicks] = React.useState({});

  React.useEffect(() => {
    setSimLoading(true);
    fetchSimulation(20_000)
      .then(d => setSimData(d))
      .catch(() => {})
      .finally(() => setSimLoading(false));
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
      Object.keys(GROUPS).map(g => [g, modelGroupOrder(simData, g)])
    );
    setGroupPicks(newGroups);
    const p = {};
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
    setPicks(p);
  }

  function resetAll() {
    setGroupPicks(Object.fromEntries(Object.keys(GROUPS).map(g => [g, [...GROUPS[g]]])));
    setPicks({});
  }

  const champion = picks['F'] ?? null;

  return (
    <section style={{ padding: mobile ? '56px 20px' : '72px 56px', background: v4.bg, borderTop: `1px solid ${v4.border}` }}>
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
              Build your 2026 bracket
            </h2>
            <p style={{ color: v4.textDim, fontSize: 15, marginTop: 8, maxWidth: 520, fontFamily: display }}>
              Pick group results, choose your 3rd-place qualifiers, then click through every knockout round.
              Model probabilities shown at every step.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {champion && (
              <div style={{
                background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)',
                borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>🏆</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: v4.electric, fontFamily: display }}>{champion}</span>
              </div>
            )}
            <button
              onClick={fillWithModel}
              disabled={!simData}
              style={{
                background: 'rgba(123,46,227,0.15)', color: simData ? v4.purple : v4.textVeryDim,
                border: `1px solid ${simData ? 'rgba(123,46,227,0.4)' : v4.border}`,
                borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700,
                fontFamily: display, cursor: simData ? 'pointer' : 'not-allowed',
              }}
            >
              Use model picks
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'groups',   label: 'Groups' },
            { id: 'knockout', label: 'Knockout bracket' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                background: tab === id ? v4.electric : 'transparent',
                color: tab === id ? '#000' : v4.textDim,
                border: `1px solid ${tab === id ? v4.electric : v4.border}`,
                borderRadius: 8, padding: '8px 20px',
                fontSize: 13, fontWeight: 700, fontFamily: display,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'groups' ? (
        <GroupStageView
          groupPicks={groupPicks}
          onGroupReorder={handleGroupReorder}
          simData={simData}
          onContinue={() => setTab('knockout')}
        />
      ) : (
        <KnockoutView
          groupPicks={groupPicks}
          picks={picks}
          onPick={handlePick}
          simData={simData}
        />
      )}
    </section>
  );
}
