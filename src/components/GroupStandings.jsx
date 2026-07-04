import React from 'react';
import { fetchSimulation } from '../lib/api.js';

const v4 = {
  bg:          '#0d0118',
  bg2:         '#15032a',
  border:      'rgba(255,255,255,0.08)',
  text:        '#ffffff',
  textDim:     '#b9aed0',
  textVeryDim: '#796a93',
  electric:    '#00FF87',
  purple:      '#7B2EE3',
  amber:       '#FFB020',
};
const display = 'Space Grotesk, sans-serif';
const mono    = 'JetBrains Mono, monospace';

const TEAM_FLAGS = {
  'Mexico':'mx','South Africa':'za','South Korea':'kr','Czech Republic':'cz',
  'Canada':'ca','Bosnia and Herzegovina':'ba','Qatar':'qa','Switzerland':'ch',
  'Brazil':'br','Morocco':'ma','Haiti':'ht','Scotland':'gb-sct',
  'United States':'us','Paraguay':'py','Australia':'au','Turkey':'tr',
  'Germany':'de','Ivory Coast':'ci','Curaçao':'cw','Ecuador':'ec',
  'Netherlands':'nl','Japan':'jp','Sweden':'se','Tunisia':'tn',
  'Belgium':'be','Egypt':'eg','Iran':'ir','New Zealand':'nz',
  'Spain':'es','Saudi Arabia':'sa','Cape Verde':'cv','Uruguay':'uy',
  'France':'fr','Senegal':'sn','Iraq':'iq','Norway':'no',
  'Argentina':'ar','Austria':'at','Algeria':'dz','Jordan':'jo',
  'Portugal':'pt','Colombia':'co','DR Congo':'cd','Uzbekistan':'uz',
  'England':'gb-eng','Croatia':'hr','Ghana':'gh','Panama':'pa',
};

function useIsMobile() {
  const [mobile, setMobile] = React.useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  React.useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

function StatBar({ pct, color }) {
  return (
    <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 999,
        background: color, transition: 'width 0.5s ease',
      }} />
    </div>
  );
}

function TeamRow({ team, rank }) {
  const flag = TEAM_FLAGS[team.team] ?? null;
  const winPct = team.win_pct ?? 0;
  const finalPct = team.final_pct ?? 0;
  const sfPct = team.sf_pct ?? 0;
  const qfPct = team.qf_pct ?? 0;

  const isFavourite = winPct >= 8;
  const isContender = winPct >= 3 && !isFavourite;

  const rowColor = isFavourite ? v4.electric : isContender ? v4.textDim : v4.textVeryDim;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '32px 1fr 52px 52px 52px 60px',
      alignItems: 'center',
      gap: 8,
      padding: '10px 16px',
      borderBottom: `1px solid ${v4.border}`,
      background: rank % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
    }}>
      {/* Rank */}
      <span style={{ fontFamily: mono, fontSize: 11, color: v4.textVeryDim, textAlign: 'center' }}>
        {rank}
      </span>

      {/* Flag + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {flag && (
          <img
            src={`https://flagcdn.com/24x18/${flag}.png`}
            width={24} height={18} alt=""
            style={{ flexShrink: 0, borderRadius: 2, objectFit: 'cover' }}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: display, fontSize: 13, fontWeight: isFavourite ? 700 : 500,
            color: rowColor,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {team.team}
          </div>
          <div style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim, marginTop: 2 }}>
            Grp {team.group}
          </div>
        </div>
      </div>

      {/* QF% */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: qfPct >= 40 ? v4.electric : v4.textDim }}>
          {qfPct.toFixed(0)}%
        </div>
        <StatBar pct={qfPct} color="rgba(0,255,135,0.5)" />
      </div>

      {/* SF% */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: sfPct >= 20 ? v4.electric : v4.textVeryDim }}>
          {sfPct.toFixed(0)}%
        </div>
        <StatBar pct={sfPct} color="rgba(0,255,135,0.4)" />
      </div>

      {/* Final% */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: finalPct >= 10 ? v4.amber : v4.textVeryDim }}>
          {finalPct.toFixed(0)}%
        </div>
        <StatBar pct={finalPct} color={`rgba(255,176,32,0.5)`} />
      </div>

      {/* Win% */}
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: mono, fontSize: 13, fontWeight: 700,
          color: winPct >= 8 ? v4.electric : winPct >= 3 ? v4.amber : v4.textVeryDim,
        }}>
          {winPct.toFixed(1)}%
        </div>
        <StatBar pct={winPct * 4} color={winPct >= 8 ? v4.electric : v4.amber} />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 52px 52px 52px 60px', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${v4.border}` }}>
      <div style={{ height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
      <div style={{ height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 4, width: '60%' }} />
      {[0,1,2,3].map(i => <div key={i} style={{ height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />)}
    </div>
  );
}

export default function GroupStandings() {
  const isMobile = useIsMobile();
  const [teams,       setTeams]       = React.useState(null);
  const [nSim,        setNSim]        = React.useState(null);
  const [lastUpdated, setLastUpdated] = React.useState(null);

  React.useEffect(() => {
    fetchSimulation(20_000).then(data => {
      // Only active teams (win_pct > 0 = not yet eliminated), sorted by win probability
      const qualified = (data.teams || [])
        .filter(t => (t.win_pct ?? 0) > 0)
        .sort((a, b) => (b.win_pct ?? 0) - (a.win_pct ?? 0));
      setTeams(qualified);
      setNSim(data.n_sim);
      if (data.last_updated) setLastUpdated(data.last_updated);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ padding: isMobile ? '60px 16px' : '100px 56px', background: v4.bg, borderTop: `1px solid ${v4.border}` }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Heading */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ color: v4.electric, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>
            tournament odds
          </div>
          <h2 style={{ color: v4.text, fontSize: isMobile ? 30 : 44, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, fontFamily: display }}>
            Who lifts the trophy?
          </h2>
          <p style={{ color: v4.textDim, fontSize: 15, marginTop: 14, maxWidth: 520, lineHeight: 1.55 }}>
            DC model probabilities across {nSim ? `${(nSim / 1000).toFixed(0)}K` : '—'} simulated tournaments. Remaining teams ranked by win probability.
          </p>
        </div>

        {/* Table */}
        <div style={{
          background: v4.bg2,
          border: `1px solid ${v4.border}`,
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 52px 52px 52px 60px',
            gap: 8,
            padding: '10px 16px',
            borderBottom: `1px solid rgba(255,255,255,0.12)`,
            background: 'rgba(123,46,227,0.1)',
          }}>
            <span style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>#</span>
            <span style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Team</span>
            <span style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>QF%</span>
            <span style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>SF%</span>
            <span style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>Final%</span>
            <span style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>Win%</span>
          </div>

          {teams
            ? teams.map((t, i) => <TeamRow key={t.team} team={t} rank={i + 1} />)
            : Array.from({ length: 12 }, (_, i) => <SkeletonRow key={i} />)
          }
        </div>

        <p style={{ color: v4.textVeryDim, fontSize: 11, fontFamily: mono, textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          Dixon-Coles model · {nSim ? `${nSim.toLocaleString()}` : '20,000'} Monte Carlo simulations ·{' '}
          {lastUpdated ? `Updated ${new Date(lastUpdated).toUTCString()}` : 'Updated daily at 06:00 UTC'}
        </p>
      </div>
    </div>
  );
}
