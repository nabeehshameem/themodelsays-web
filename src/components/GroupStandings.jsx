import React from 'react';
import { fetchSimulation } from '../lib/api.js';

const v4 = {
  bg:          '#0d0118',
  bg2:         '#15032a',
  surface:     'rgba(255,255,255,0.03)',
  border:      'rgba(255,255,255,0.08)',
  borderHi:    'rgba(255,255,255,0.16)',
  text:        '#ffffff',
  textDim:     '#b9aed0',
  textVeryDim: '#796a93',
  electric:    '#00FF87',
  pink:        '#FF2882',
  purple:      '#7B2EE3',
};
const display = 'Space Grotesk, sans-serif';
const mono    = 'JetBrains Mono, monospace';

function useIsMobile() {
  const [mobile, setMobile] = React.useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  React.useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

function GroupCard({ letter, teams }) {
  const sorted = [...teams].sort((a, b) => b.r32_pct - a.r32_pct);
  const max = sorted[0]?.r32_pct || 1;

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      border: `1px solid ${v4.border}`,
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Group header */}
      <div style={{
        padding: '10px 16px',
        borderBottom: `1px solid ${v4.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(0,255,135,0.04)',
      }}>
        <span style={{ color: v4.electric, fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
          GROUP {letter}
        </span>
        <span style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 9, letterSpacing: '0.08em' }}>ADVANCE %</span>
      </div>

      {/* Teams */}
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((t, i) => {
          const advances = i < 2;
          const mayAdvance = i === 2;
          return (
            <div key={t.team} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Rank indicator */}
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: advances
                  ? 'rgba(0,255,135,0.15)'
                  : mayAdvance
                    ? 'rgba(255,176,32,0.1)'
                    : 'rgba(255,255,255,0.04)',
                border: `1px solid ${advances ? 'rgba(0,255,135,0.35)' : mayAdvance ? 'rgba(255,176,32,0.2)' : 'rgba(255,255,255,0.08)'}`,
                fontSize: 9, fontFamily: mono, fontWeight: 700,
                color: advances ? v4.electric : mayAdvance ? '#FFB020' : v4.textVeryDim,
              }}>
                {i + 1}
              </div>

              {/* Team name + bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: advances ? v4.text : v4.textDim,
                  fontFamily: display, fontSize: 13, fontWeight: advances ? 600 : 400,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  marginBottom: 4,
                }}>
                  {t.team}
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(t.r32_pct / 100) * 100}%`,
                    height: '100%', borderRadius: 999,
                    background: advances ? v4.electric : mayAdvance ? '#FFB020' : v4.textVeryDim,
                    opacity: advances ? 1 : 0.5,
                  }} />
                </div>
              </div>

              {/* Advance % */}
              <div style={{
                fontFamily: mono, fontSize: 12, fontWeight: 700, flexShrink: 0,
                color: advances ? v4.electric : mayAdvance ? '#FFB020' : v4.textVeryDim,
                minWidth: 36, textAlign: 'right',
              }}>
                {t.r32_pct.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      border: `1px solid ${v4.border}`, borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${v4.border}`, background: 'rgba(0,255,135,0.04)' }}>
        <div style={{ width: 60, height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }} />
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: `${55 + i * 10}%`, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 6 }} />
              <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 999 }} />
            </div>
            <div style={{ width: 28, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GroupStandings() {
  const isMobile = useIsMobile();
  const [groups, setGroups] = React.useState(null);
  const [nSim,   setNSim]   = React.useState(null);

  React.useEffect(() => {
    fetchSimulation(50_000).then(data => {
      const map = {};
      for (const t of data.teams) {
        const g = t.group || '?';
        if (!map[g]) map[g] = [];
        map[g].push(t);
      }
      setGroups(map);
      setNSim(data.n_sim);
    }).catch(() => {});
  }, []);

  const groupLetters = groups ? Object.keys(groups).sort() : Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div style={{ padding: isMobile ? '60px 16px' : '100px 56px', background: v4.bg, borderTop: `1px solid ${v4.border}` }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        {/* Heading */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ color: v4.electric, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>
            group stage predictions
          </div>
          <h2 style={{ color: v4.text, fontSize: isMobile ? 32 : 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, fontFamily: display }}>
            Who advances from every group?
          </h2>
          <p style={{ color: v4.textDim, fontSize: 15, marginTop: 14, maxWidth: 560, lineHeight: 1.55 }}>
            Based on {nSim ? `${(nSim / 1000).toFixed(0)}K` : '50K'} Monte Carlo simulations. Green = model expects them to advance. Yellow = possible best third-place qualifier.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { color: v4.electric, label: 'Expected to advance (top 2)' },
            { color: '#FFB020',   label: 'Possible best 3rd' },
            { color: v4.textVeryDim, label: 'Expected to exit' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, letterSpacing: '0.06em' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Group grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: isMobile ? 10 : 14,
        }}>
          {groupLetters.map(letter => (
            groups
              ? <GroupCard key={letter} letter={letter} teams={groups[letter]} />
              : <SkeletonCard key={letter} />
          ))}
        </div>

        <p style={{ color: v4.textVeryDim, fontSize: 11, fontFamily: mono, textAlign: 'center', marginTop: 28, lineHeight: 1.6 }}>
          Percentages represent probability of advancing from the group stage across {nSim ? `${nSim.toLocaleString()}` : '50,000'} simulated tournaments. Updated daily after the 06:00 UTC model retrain.
        </p>
      </div>
    </div>
  );
}
