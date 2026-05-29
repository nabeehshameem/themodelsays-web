import React from 'react';
import { fetchSimulation } from '../lib/api.js';

const v4 = {
  bg:          '#0d0118',
  bg2:         '#15032a',
  bg3:         '#1f0a3d',
  surface:     'rgba(255,255,255,0.03)',
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

// ── WC 2026 official groups (FIFA draw, December 2023) ────────────
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

// ── R32 bracket (matches 73-88, official FIFA schedule) ──────────
// t1/t2: '1A' = group A winner, '2B' = group B runner-up, '3rd_XYZ' = best 3rd from those groups
const R32 = [
  { id: '73', t1: '2A', t2: '2B' },
  { id: '74', t1: '1E', t2: '3rd_ABCDF' },
  { id: '75', t1: '1F', t2: '2C' },
  { id: '76', t1: '1C', t2: '2F' },
  { id: '77', t1: '1I', t2: '3rd_CDFGH' },
  { id: '78', t1: '2E', t2: '2I' },
  { id: '79', t1: '1A', t2: '3rd_CEFHI' },
  { id: '80', t1: '1L', t2: '3rd_EHIJK' },
  { id: '81', t1: '1D', t2: '3rd_BEFIJ' },
  { id: '82', t1: '1G', t2: '3rd_AEHIJ' },
  { id: '83', t1: '2K', t2: '2L' },
  { id: '84', t1: '1H', t2: '2J' },
  { id: '85', t1: '1B', t2: '3rd_EFGIJ' },
  { id: '86', t1: '1J', t2: '2H' },
  { id: '87', t1: '1K', t2: '3rd_DEIJL' },
  { id: '88', t1: '2D', t2: '2G' },
];

// R16: pairs of consecutive R32 matches
const R16 = [
  { id: 'R1', t1: 'W73', t2: 'W74' },
  { id: 'R2', t1: 'W75', t2: 'W76' },
  { id: 'R3', t1: 'W77', t2: 'W78' },
  { id: 'R4', t1: 'W79', t2: 'W80' },
  { id: 'R5', t1: 'W81', t2: 'W82' },
  { id: 'R6', t1: 'W83', t2: 'W84' },
  { id: 'R7', t1: 'W85', t2: 'W86' },
  { id: 'R8', t1: 'W87', t2: 'W88' },
];

const QF = [
  { id: 'Q1', t1: 'WR1', t2: 'WR2' },
  { id: 'Q2', t1: 'WR3', t2: 'WR4' },
  { id: 'Q3', t1: 'WR5', t2: 'WR6' },
  { id: 'Q4', t1: 'WR7', t2: 'WR8' },
];

const SF = [
  { id: 'S1', t1: 'WQ1', t2: 'WQ2' },
  { id: 'S2', t1: 'WQ3', t2: 'WQ4' },
];

const FINAL = [{ id: 'F', t1: 'WS1', t2: 'WS2' }];

// 3rd-place slot → which groups are eligible (for display label)
const THIRD_ELIGIBLE = {
  '3rd_ABCDF': 'A/B/C/D/F',
  '3rd_CDFGH': 'C/D/F/G/H',
  '3rd_CEFHI': 'C/E/F/H/I',
  '3rd_EHIJK': 'E/H/I/J/K',
  '3rd_BEFIJ': 'B/E/F/I/J',
  '3rd_AEHIJ': 'A/E/H/I/J',
  '3rd_EFGIJ': 'E/F/G/I/J',
  '3rd_DEIJL': 'D/E/I/J/L',
};

// ── Slot resolution ───────────────────────────────────────────────
function resolveSlot(src, groupPicks, picks) {
  if (/^[12][A-L]$/.test(src)) {
    const pos = src[0] === '1' ? 'first' : 'second';
    return groupPicks[src[1]]?.[pos] ?? null;
  }
  if (src.startsWith('3rd_')) {
    return picks['3_' + src.slice(4)] ?? null;
  }
  if (src.startsWith('W')) {
    return picks[src.slice(1)] ?? null;
  }
  return null;
}

// Slot label for empty state
function slotLabel(src) {
  if (/^[12][A-L]$/.test(src)) {
    const pos = src[0] === '1' ? '1st' : '2nd';
    return `${pos} Group ${src[1]}`;
  }
  if (src.startsWith('3rd_')) return `3rd (${THIRD_ELIGIBLE[src] ?? ''})`;
  return '· · ·';
}

// ── SimData helpers ───────────────────────────────────────────────
function simFor(simData, team) {
  return simData?.teams?.find(t => t.team === team || t.team.toLowerCase() === team?.toLowerCase());
}

// Model's predicted top-2 per group, by R32 advance probability
function modelGroupOrder(simData, group) {
  if (!simData) return GROUPS[group];
  return [...GROUPS[group]].sort((a, b) => {
    const pA = simFor(simData, a)?.r32_pct ?? 0;
    const pB = simFor(simData, b)?.r32_pct ?? 0;
    return pB - pA;
  });
}

// Pick winner between two teams using overall tournament win_pct from simulate
function modelWinner(simData, t1, t2) {
  if (!simData || !t1 || !t2) return null;
  const p1 = simFor(simData, t1)?.win_pct ?? 0;
  const p2 = simFor(simData, t2)?.win_pct ?? 0;
  return p1 >= p2 ? t1 : t2;
}

// ── Sub-components ────────────────────────────────────────────────

function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? v4.electric : 'transparent',
        color: active ? '#000' : v4.textDim,
        border: `1px solid ${active ? v4.electric : v4.border}`,
        borderRadius: 8,
        padding: '8px 20px',
        fontSize: 13,
        fontWeight: 700,
        fontFamily: display,
        cursor: 'pointer',
        letterSpacing: '0.01em',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function GroupCard({ letter, teams, picks, onPick, simData }) {
  // picks: { first: 'France', second: 'Senegal' }
  const ordered = modelGroupOrder(simData, letter);

  function handleClick(team) {
    const cur = picks.first === team ? 'first' : picks.second === team ? 'second' : null;
    if (cur === 'first') {
      // demote to second, clear first
      onPick({ ...picks, first: picks.second, second: null });
    } else if (cur === 'second') {
      // deselect
      onPick({ ...picks, second: null });
    } else if (!picks.first) {
      onPick({ ...picks, first: team });
    } else if (!picks.second && team !== picks.first) {
      onPick({ ...picks, second: team });
    } else {
      // swap out existing first
      onPick({ first: team, second: picks.first });
    }
  }

  return (
    <div style={{
      background: v4.bg2,
      border: `1px solid ${v4.border}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Group header */}
      <div style={{
        background: `rgba(123,46,227,0.15)`,
        borderBottom: `1px solid ${v4.border}`,
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ color: v4.purple, fontSize: 11, fontWeight: 700, fontFamily: mono, letterSpacing: '0.06em' }}>
          GROUP {letter}
        </span>
      </div>

      {/* Teams */}
      {ordered.map((team, idx) => {
        const isFirst  = picks.first  === team;
        const isSecond = picks.second === team;
        const rank     = isFirst ? 1 : isSecond ? 2 : null;
        const simTeam  = simFor(simData, team);
        const advPct   = simTeam?.r32_pct;

        return (
          <div
            key={team}
            onClick={() => handleClick(team)}
            style={{
              padding: '9px 14px',
              borderBottom: idx < 3 ? `1px solid ${v4.border}` : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              background: isFirst
                ? 'rgba(0,255,135,0.08)'
                : isSecond
                ? 'rgba(0,255,135,0.04)'
                : 'transparent',
              transition: 'background 0.1s',
            }}
          >
            {/* rank badge */}
            <span style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: rank === 1
                ? v4.electric
                : rank === 2
                ? 'rgba(0,255,135,0.3)'
                : 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 800,
              color: rank === 1 ? '#000' : rank === 2 ? v4.electric : v4.textVeryDim,
              fontFamily: mono,
              flexShrink: 0,
            }}>
              {rank ?? idx + 1}
            </span>

            {/* name */}
            <span style={{
              flex: 1,
              fontSize: 12.5,
              fontWeight: 600,
              color: rank ? v4.text : v4.textDim,
              fontFamily: display,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {team}
            </span>

            {/* model advance % */}
            {advPct != null && (
              <span style={{ fontSize: 10, color: v4.textVeryDim, fontFamily: mono, flexShrink: 0 }}>
                {advPct.toFixed(0)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GroupStageView({ groupPicks, onGroupPick, simData, onContinue }) {
  const filledCount = Object.values(groupPicks).filter(p => p.first && p.second).length;

  return (
    <div>
      {/* Instruction bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <p style={{ color: v4.textDim, fontSize: 13.5, margin: 0, fontFamily: display }}>
          Click teams to set <span style={{ color: v4.electric }}>1st</span> and{' '}
          <span style={{ color: 'rgba(0,255,135,0.5)' }}>2nd</span> place in each group.{' '}
          Numbers in green are the model's advance probability.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: v4.textVeryDim, fontFamily: mono }}>
            {filledCount}/12 groups set
          </span>
          <button
            onClick={onContinue}
            style={{
              background: filledCount === 12 ? v4.electric : 'rgba(0,255,135,0.12)',
              color: filledCount === 12 ? '#000' : v4.textVeryDim,
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 12.5,
              fontWeight: 700,
              fontFamily: display,
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Knockout Round →
          </button>
        </div>
      </div>

      {/* 4-column group grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
      }}>
        {Object.entries(GROUPS).map(([letter]) => (
          <GroupCard
            key={letter}
            letter={letter}
            teams={GROUPS[letter]}
            picks={groupPicks[letter]}
            onPick={(p) => onGroupPick(letter, p)}
            simData={simData}
          />
        ))}
      </div>
    </div>
  );
}

// ── Bracket match card ────────────────────────────────────────────

function MatchCard({ match, t1, t2, winner, onPick, simData }) {
  const canPick  = !!(t1 && t2);
  const t1sim    = simFor(simData, t1);
  const t2sim    = simFor(simData, t2);

  // Relative model probability bar (using win_pct ratio)
  let t1bar = 50, t2bar = 50;
  if (t1sim && t2sim && (t1sim.win_pct + t2sim.win_pct) > 0) {
    const total = t1sim.win_pct + t2sim.win_pct;
    t1bar = Math.round((t1sim.win_pct / total) * 100);
    t2bar = 100 - t1bar;
  }

  const slotRow = (team, src, isTop, pct) => {
    const isWinner = winner === team;
    const isLoser  = winner && winner !== team && !!team;
    return (
      <div
        onClick={() => canPick && team && onPick(team)}
        style={{
          padding: '7px 10px',
          borderTop: isTop ? 'none' : `1px solid ${v4.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: canPick && team ? 'pointer' : 'default',
          background: isWinner ? 'rgba(0,255,135,0.1)' : 'transparent',
          opacity: isLoser ? 0.45 : 1,
          transition: 'background 0.1s',
        }}
      >
        {/* winner check */}
        <span style={{ width: 12, flexShrink: 0, color: v4.electric, fontSize: 10, fontWeight: 800 }}>
          {isWinner ? '✓' : ''}
        </span>
        <span style={{
          flex: 1,
          fontSize: 11,
          fontWeight: 600,
          color: isWinner ? v4.electric : team ? v4.text : v4.textVeryDim,
          fontFamily: display,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}>
          {team ?? slotLabel(src)}
        </span>
        {pct != null && team && (
          <span style={{ fontSize: 9, color: v4.textVeryDim, fontFamily: mono, flexShrink: 0 }}>
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
      borderRadius: 8,
      overflow: 'hidden',
      width: 148,
      flexShrink: 0,
    }}>
      {slotRow(t1, match.t1, true, canPick ? t1bar : null)}
      {/* model probability bar */}
      {canPick && (
        <div style={{ height: 3, background: v4.border, position: 'relative' }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${t1bar}%`,
            background: `linear-gradient(90deg, ${v4.electric}, ${v4.purple})`,
          }} />
        </div>
      )}
      {slotRow(t2, match.t2, false, canPick ? t2bar : null)}
    </div>
  );
}

// ── Knockout bracket column ───────────────────────────────────────

function BracketColumn({ label, matches, groupPicks, picks, onPick, simData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Round label */}
      <div style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: v4.textVeryDim,
        fontFamily: mono,
        marginBottom: 12,
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      {/* Match slots, evenly distributed */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', width: '100%', alignItems: 'center' }}>
        {matches.map(match => {
          const t1 = resolveSlot(match.t1, groupPicks, picks);
          const t2 = resolveSlot(match.t2, groupPicks, picks);
          return (
            <div key={match.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MatchCard
                match={match}
                t1={t1}
                t2={t2}
                winner={picks[match.id]}
                onPick={(team) => onPick(match.id, team)}
                simData={simData}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ThirdPlaceSelector({ picks, onPick, groupPicks, simData }) {
  const [open, setOpen] = React.useState(false);

  // All 12 group 3rd-place teams (those not picked 1st or 2nd)
  const thirds = Object.entries(GROUPS).map(([letter, teams]) => {
    const p = groupPicks[letter];
    const third = teams.find(t => t !== p?.first && t !== p?.second);
    const sim = simFor(simData, third);
    return { team: third, group: letter, r32pct: sim?.r32_pct ?? 0 };
  }).filter(x => x.team).sort((a, b) => b.r32pct - a.r32pct);

  const pickedCount = Object.keys(picks).filter(k => k.startsWith('3_')).length;

  return (
    <div style={{
      background: v4.bg2,
      border: `1px solid ${v4.border}`,
      borderRadius: 10,
      padding: '12px 16px',
      marginBottom: 16,
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: v4.textDim, fontFamily: mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Best 3rd Place Teams
        </span>
        <span style={{ fontSize: 10, color: v4.textVeryDim, fontFamily: mono }}>
          ({pickedCount} / 8 selected)
        </span>
        <span style={{ marginLeft: 'auto', color: v4.textVeryDim, fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {thirds.map(({ team, group, r32pct }) => {
            // The 3rd-place slots in the bracket are keyed as '3_ABCDF' etc.
            // We store user's manual 3rd-place picks as picks['3_manual_GROUP'] = team
            // For bracket resolution, when a slot like '3rd_ABCDF' can't be resolved,
            // we'll just let user click the slot in the bracket directly.
            const key = `3_manual_${group}`;
            const isSelected = Object.values(picks).includes(team);
            const selCount = Object.keys(picks).filter(k => k.startsWith('3_')).length;
            const canSelect = isSelected || selCount < 8;

            return (
              <div
                key={team}
                onClick={() => {
                  if (isSelected) {
                    const entry = Object.entries(picks).find(([, v]) => v === team);
                    if (entry) onPick(entry[0], null);
                  } else if (canSelect) {
                    onPick(key, team);
                  }
                }}
                style={{
                  background: isSelected ? 'rgba(0,255,135,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isSelected ? 'rgba(0,255,135,0.3)' : v4.border}`,
                  borderRadius: 6,
                  padding: '5px 10px',
                  cursor: canSelect || isSelected ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: !canSelect && !isSelected ? 0.4 : 1,
                }}
              >
                <span style={{ fontSize: 10.5, fontWeight: 600, color: isSelected ? v4.electric : v4.text, fontFamily: display }}>
                  {team}
                </span>
                <span style={{ fontSize: 9, color: v4.textVeryDim, fontFamily: mono }}>
                  Grp {group} · {r32pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KnockoutView({ groupPicks, picks, onPick, simData }) {
  const BRACKET_HEIGHT = 860;

  const rounds = [
    { label: 'Round of 32', matches: R32, matchCount: 16 },
    { label: 'Round of 16', matches: R16, matchCount: 8 },
    { label: 'Quarter-finals', matches: QF, matchCount: 4 },
    { label: 'Semi-finals', matches: SF, matchCount: 2 },
    { label: 'Final', matches: FINAL, matchCount: 1 },
  ];

  return (
    <div>
      <ThirdPlaceSelector picks={picks} onPick={onPick} groupPicks={groupPicks} simData={simData} />

      {/* Scrollable bracket */}
      <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
        <div style={{
          display: 'flex',
          gap: 12,
          alignItems: 'stretch',
          minWidth: rounds.length * 172,
          height: BRACKET_HEIGHT,
        }}>
          {rounds.map(({ label, matches, matchCount }) => (
            <div key={label} style={{
              flex: '0 0 160px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <BracketColumn
                label={label}
                matches={matches}
                groupPicks={groupPicks}
                picks={picks}
                onPick={onPick}
                simData={simData}
              />
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 11, color: v4.textVeryDim, fontFamily: mono, marginTop: 12, textAlign: 'center' }}>
        % shown = relative model strength · click a team in any match to pick the winner
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function TournamentBracket() {
  const [tab, setTab]       = React.useState('groups');
  const [simData, setSimData]  = React.useState(null);
  const [simLoading, setSimLoading] = React.useState(false);

  const [groupPicks, setGroupPicks] = React.useState(
    Object.fromEntries(Object.keys(GROUPS).map(g => [g, { first: null, second: null }]))
  );
  // picks: { matchId: winnerName, '3_ABCDF': team, '3_manual_A': team, ... }
  const [picks, setPicks] = React.useState({});

  React.useEffect(() => {
    setSimLoading(true);
    fetchSimulation(20_000)
      .then(d => setSimData(d))
      .catch(() => {})
      .finally(() => setSimLoading(false));
  }, []);

  function handleGroupPick(letter, p) {
    setGroupPicks(prev => ({ ...prev, [letter]: p }));
    // Clear bracket picks that depended on this group's first/second
    setPicks(prev => {
      const next = { ...prev };
      // Clear any pick that now has an unresolvable slot
      R32.forEach(m => {
        const t1 = resolveSlot(m.t1, { ...groupPicks, [letter]: p }, next);
        const t2 = resolveSlot(m.t2, { ...groupPicks, [letter]: p }, next);
        if (next[m.id] && next[m.id] !== t1 && next[m.id] !== t2) delete next[m.id];
      });
      return next;
    });
  }

  function handlePick(matchId, team) {
    if (team === null) {
      setPicks(prev => { const n = { ...prev }; delete n[matchId]; return n; });
      return;
    }
    setPicks(prev => ({ ...prev, [matchId]: team }));
  }

  function fillWithModel() {
    if (!simData) return;
    // Fill group picks with model's top 2
    const newGroupPicks = Object.fromEntries(
      Object.entries(GROUPS).map(([letter]) => {
        const [first, second] = modelGroupOrder(simData, letter);
        return [letter, { first, second }];
      })
    );
    setGroupPicks(newGroupPicks);

    // Fill bracket picks by taking stronger team (by win_pct) at every stage
    const newPicks = {};
    function fillRound(matches) {
      matches.forEach(m => {
        const t1 = resolveSlot(m.t1, newGroupPicks, newPicks);
        const t2 = resolveSlot(m.t2, newGroupPicks, newPicks);
        const w  = modelWinner(simData, t1, t2);
        if (w) newPicks[m.id] = w;
      });
    }
    fillRound(R32);
    fillRound(R16);
    fillRound(QF);
    fillRound(SF);
    fillRound(FINAL);
    setPicks(newPicks);
  }

  function resetAll() {
    setGroupPicks(Object.fromEntries(Object.keys(GROUPS).map(g => [g, { first: null, second: null }])));
    setPicks({});
  }

  const champion = picks['F'] || null;
  const filledGroups = Object.values(groupPicks).filter(p => p.first && p.second).length;

  return (
    <section style={{
      padding: '72px 56px',
      background: v4.bg,
      borderTop: `1px solid ${v4.border}`,
    }}>
      {/* Section header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                background: 'rgba(123,46,227,0.15)',
                border: '1px solid rgba(123,46,227,0.3)',
                borderRadius: 6,
                padding: '3px 10px',
                fontSize: 10.5,
                fontWeight: 700,
                color: v4.purple,
                fontFamily: mono,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                BRACKET
              </span>
              {simLoading && (
                <span style={{ fontSize: 10.5, color: v4.textVeryDim, fontFamily: mono }}>
                  loading model data…
                </span>
              )}
            </div>
            <h2 style={{
              color: v4.text,
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              margin: 0,
              fontFamily: display,
            }}>
              Build your 2026 bracket
            </h2>
            <p style={{ color: v4.textDim, fontSize: 15, marginTop: 8, maxWidth: 540, fontFamily: display }}>
              Pick group stage results, advance 3rd-place teams, then click through every knockout round.
              The model's probabilities guide each matchup.
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {champion && (
              <div style={{
                background: 'rgba(0,255,135,0.1)',
                border: '1px solid rgba(0,255,135,0.25)',
                borderRadius: 8,
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ fontSize: 13, color: v4.electric }}>🏆</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: v4.electric, fontFamily: display }}>
                  {champion}
                </span>
              </div>
            )}
            <button
              onClick={fillWithModel}
              disabled={!simData}
              style={{
                background: 'rgba(123,46,227,0.15)',
                color: simData ? v4.purple : v4.textVeryDim,
                border: `1px solid ${simData ? 'rgba(123,46,227,0.4)' : v4.border}`,
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                fontFamily: display,
                cursor: simData ? 'pointer' : 'not-allowed',
              }}
            >
              Use model picks
            </button>
            <button
              onClick={resetAll}
              style={{
                background: 'transparent',
                color: v4.textVeryDim,
                border: `1px solid ${v4.border}`,
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                fontFamily: display,
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <TabBtn
            label={`Groups (${filledGroups}/12)`}
            active={tab === 'groups'}
            onClick={() => setTab('groups')}
          />
          <TabBtn
            label="Knockout bracket"
            active={tab === 'knockout'}
            onClick={() => setTab('knockout')}
          />
        </div>
      </div>

      {tab === 'groups' ? (
        <GroupStageView
          groupPicks={groupPicks}
          onGroupPick={handleGroupPick}
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
