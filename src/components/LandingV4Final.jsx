import React from 'react';
import { FPL_DATA, TEAM_COLORS } from '../data.js';
import WorldCupPredictor from './WorldCupPredictor.jsx';
import WCFantasySection from './WCFantasySection.jsx';

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
  purple:      '#7B2EE3',
  amber:       '#FFB020',
};

const display = 'Space Grotesk, sans-serif';
const mono    = 'JetBrains Mono, monospace';

if (typeof document !== 'undefined' && !document.getElementById('tms-anim')) {
  const s = document.createElement('style');
  s.id = 'tms-anim';
  s.textContent = `
    @keyframes tmsFade {
      0%   { opacity: 0; transform: translateY(8px); }
      15%  { opacity: 1; transform: translateY(0); }
      85%  { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-6px); }
    }
    @keyframes tmsPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
  `;
  document.head.appendChild(s);
}

function TmsLogo({ size = 32 }) {
  return (
    <img
      src="/assets/logo.png"
      width={size} height={size}
      alt="TheModelSays"
      style={{ display: 'block', borderRadius: '50%' }}
    />
  );
}

function TmsBrand({ size = 18 }) {
  return (
    <span style={{ color: v4.text, fontSize: size, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: display }}>
      TheModel<span style={{ color: v4.electric }}>Says</span>
    </span>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────
function V4Nav() {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(13,1,24,0.82)', backdropFilter: 'blur(14px)',
      borderBottom: `1px solid ${v4.border}`,
      padding: '16px 56px', display: 'flex', alignItems: 'center', gap: 36,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <TmsLogo />
        <TmsBrand />
      </div>
      <div style={{ display: 'flex', gap: 28, marginLeft: 12, fontFamily: display }}>
        {[
          ['World Cup', '#'],
          ['Track record', '#'],
          ['Updates', '#'],
        ].map(([label, href]) => (
          <a key={label} href={href} onClick={e => e.preventDefault()}
             style={{ color: v4.textDim, fontSize: 14, fontWeight: 500, textDecoration: 'none', cursor: 'not-allowed', opacity: 0.5 }}>
            {label}
          </a>
        ))}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18 }}>
        <span style={{ color: v4.textDim, fontSize: 14, fontWeight: 500, fontFamily: display, cursor: 'pointer' }}>Sign in</span>
        <span style={{
          background: 'rgba(0,255,135,0.12)', color: v4.textVeryDim, borderRadius: 999,
          padding: '9px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'not-allowed',
          letterSpacing: '0.03em', textTransform: 'uppercase', fontFamily: display,
          display: 'inline-block', opacity: 0.55,
        }}>Coming soon</span>
      </div>
    </div>
  );
}

// ── Hero ────────────────────────────────────────────────────────────
const SAYINGS = [
  'Take Haaland (C).',
  'Captain Salah away.',
  'Sell Foden. Buy Palmer.',
  'Arsenal beat Chelsea.',
  'Back England to lift it.',
];

function V4Hero() {
  const { squad } = FPL_DATA;
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % SAYINGS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Single purple wash */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 60%, rgba(123,46,227,0.38), transparent 55%)' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 48, position: 'relative', padding: '110px 56px 90px' }}>
        {/* left */}
        <div>
          {/* WC pill with blinking dot */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 12px 5px 8px', borderRadius: 999,
            background: 'rgba(0,255,135,0.08)', border: `1px solid rgba(0,255,135,0.2)`,
            fontSize: 12, color: v4.electric, marginBottom: 28,
            fontFamily: mono, fontWeight: 600, letterSpacing: '0.04em',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: v4.electric, animation: 'tmsPulse 1.6s ease infinite', flexShrink: 0 }} />
            WC 2026 LIVE SOON · FPL GW28 FRIDAY
          </div>

          <h1 style={{
            color: v4.text, fontSize: 96, fontWeight: 700, letterSpacing: '-0.045em',
            lineHeight: 0.96, margin: 0, fontFamily: display,
          }}>
            The model<br/>says.
          </h1>

          <div style={{ marginTop: 18, height: 64, position: 'relative' }}>
            <span key={i} style={{
              display: 'inline-block', fontFamily: display, fontWeight: 700, fontSize: 44, letterSpacing: '-0.03em',
              background: `linear-gradient(120deg, ${v4.electric} 0%, #00e8c8 60%, ${v4.electric} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              animation: 'tmsFade 2.8s ease infinite',
            }}>
              "{SAYINGS[i]}"
            </span>
          </div>

          <p style={{ color: v4.textDim, fontSize: 18, lineHeight: 1.55, marginTop: 22, maxWidth: 540, fontWeight: 400 }}>
            AI picks for FPL, every Premier League match, and the 2026 World Cup.
            One model. Every call. <span style={{ color: v4.text, fontWeight: 500 }}>Free, open beta.</span>
          </p>

          <div style={{ marginTop: 36 }}>
            <span style={{
              background: 'rgba(0,255,135,0.12)', color: v4.textVeryDim, borderRadius: 999,
              padding: '15px 24px', fontSize: 14.5, fontWeight: 700, cursor: 'not-allowed',
              letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: display,
              display: 'inline-block', opacity: 0.55,
            }}>App coming soon</span>
          </div>

          {/* 2 stats */}
          <div style={{ display: 'flex', gap: 32, marginTop: 52, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: v4.electric, animation: 'tmsPulse 2s ease infinite' }} />
                <span style={{ color: v4.electric, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono }}>ACCURACY</span>
              </div>
              <div style={{ color: v4.text, fontSize: 30, fontWeight: 700, fontFamily: display, letterSpacing: '-0.02em', marginTop: 4 }}>+11%</div>
              <div style={{ color: v4.textDim, fontSize: 12 }}>vs FPL's own picks</div>
            </div>
            <div style={{ width: 1, height: 56, background: v4.border }} />
            <div>
              <div style={{ color: v4.textVeryDim, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono }}>COVERAGE</div>
              <div style={{ color: v4.text, fontSize: 30, fontWeight: 700, fontFamily: display, letterSpacing: '-0.02em', marginTop: 4 }}>Every match</div>
              <div style={{ color: v4.textDim, fontSize: 12 }}>PL season + WC 2026</div>
            </div>
          </div>
        </div>

        {/* right — pitch */}
        <V4PitchHero squad={squad} />
      </div>
    </div>
  );
}

function V4PitchHero({ squad }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'relative', borderRadius: 14, overflow: 'hidden', height: 700,
        background: `linear-gradient(170deg, #0a4f2e 0%, #0d6839 50%, #0a4f2e 100%)`,
        boxShadow: '0 30px 80px -20px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.08)',
      }}>
        <V4PitchLines />

        {/* top HUD — formation + budget only, no floating score box */}
        <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 5 }}>
          <V4Tag>3-4-3</V4Tag>
          <V4Tag accent>£99.6 / £100.0m</V4Tag>
        </div>

        {/* players */}
        <div style={{ position: 'absolute', inset: '76px 20px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <V4PitchRow players={squad.fwd} />
          <V4PitchRow players={squad.mid} />
          <V4PitchRow players={squad.def} />
          <V4PitchRow players={squad.gk} />
        </div>

        <div style={{ position: 'absolute', bottom: 14, left: 16, color: 'rgba(255,255,255,0.4)', fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>
          GW28 · THE MODEL'S XV
        </div>
      </div>
    </div>
  );
}

function V4PitchLines() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.16 }} viewBox="0 0 400 700" preserveAspectRatio="none">
      <rect x="20" y="20" width="360" height="660" stroke="white" strokeWidth="1.5" fill="none" />
      <line x1="20" y1="350" x2="380" y2="350" stroke="white" strokeWidth="1.5" />
      <circle cx="200" cy="350" r="56" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="200" cy="350" r="2" fill="white" />
      <rect x="100" y="20" width="200" height="96" stroke="white" strokeWidth="1.5" fill="none" />
      <rect x="100" y="584" width="200" height="96" stroke="white" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function V4PitchRow({ players }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
      {players.map((p, i) => <V4PlayerCard key={i} player={p} />)}
    </div>
  );
}

// Flat colored chip: team badge + name + EV
function V4PlayerCard({ player }) {
  const tc = TEAM_COLORS[player.team] || '#555';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{
        background: 'rgba(0,0,0,0.6)', border: `1px solid rgba(255,255,255,0.12)`,
        borderRadius: 8, padding: '5px 8px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 52,
      }}>
        <span style={{ background: tc, color: 'white', fontSize: 8, fontWeight: 800, fontFamily: mono, letterSpacing: '0.05em', padding: '1px 5px', borderRadius: 4 }}>
          {player.team}
        </span>
        <span style={{ color: v4.text, fontSize: 10, fontWeight: 700, fontFamily: display }}>{player.name}</span>
        <span style={{ color: v4.electric, fontSize: 10, fontWeight: 800, fontFamily: mono }}>{player.ev.toFixed(1)}</span>
      </div>
    </div>
  );
}

function V4Tag({ children, accent }) {
  return (
    <span style={{
      background: accent ? 'rgba(0,255,135,0.12)' : 'rgba(0,0,0,0.5)',
      color: accent ? v4.electric : v4.text,
      backdropFilter: 'blur(8px)',
      border: `1px solid ${accent ? 'rgba(0,255,135,0.25)' : v4.borderHi}`,
      borderRadius: 8, padding: '6px 10px',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      fontFamily: mono,
    }}>{children}</span>
  );
}

// ── Marquee — dark with electric-green hairlines ────────────────────
function V4Marquee() {
  const items = ['PICKED BY THE MODEL', 'EVERY FPL GAMEWEEK', 'EVERY PL MATCH', 'WORLD CUP 2026', 'BEATS FPL’S OWN PICKS', 'FREE FOREVER'];
  const all = [...items, ...items, ...items];
  return (
    <div style={{
      background: v4.bg2, padding: '14px 0', overflow: 'hidden',
      borderTop: `1px solid ${v4.electric}22`, borderBottom: `1px solid ${v4.electric}22`,
    }}>
      <div style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap' }}>
        {all.map((it, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 48, fontFamily: mono, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', color: v4.electric }}>
            {it}
            <span style={{ width: 3, height: 3, borderRadius: 999, background: v4.electric, opacity: 0.5, display: 'inline-block' }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Features — 2 wide cards ─────────────────────────────────────────
function V4Features() {
  return (
    <div style={{ padding: '100px 56px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 52 }}>
          <div style={{ color: v4.electric, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>// what the model says</div>
          <h2 style={{ color: v4.text, fontSize: 56, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.02, margin: 0, fontFamily: display }}>
            Every gameweek. Every match. Every call.
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <V4WideCard
            tag="WORLD CUP 2026"
            title="From group stage to lifting the trophy."
            body="50,000 simulations. Live as games are played."
            leftWidget={<WidgetBracket />}
            leftLabel="BRACKET CALL"
            leftStat="48 teams · 64 matches"
            rightWidget={<WidgetMatches />}
            rightLabel="THIS WEEKEND"
            rightStat="Updated Friday"
          />
          <V4WideCard
            tag="FPL"
            title="The optimal XV. Every gameweek."
            body="Captain, transfers, the full squad under FPL's rules."
            leftWidget={<WidgetCaptain />}
            leftLabel="CAPTAIN PICK"
            leftStat="GW28 · expected pts"
            rightWidget={<WidgetPlanner />}
            rightLabel="GW28 → GW33 OUTLOOK"
            rightStat="chip windows flagged"
          />
        </div>
      </div>
    </div>
  );
}

function V4WideCard({ tag, title, body, leftWidget, leftLabel, leftStat, rightWidget, rightLabel, rightStat }) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      border: `1px solid ${v4.border}`, borderRadius: 14, padding: 32,
    }}>
      {/* card header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 24, flexWrap: 'wrap' }}>
        <span style={{ color: v4.electric, fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 10px', background: 'rgba(0,255,135,0.1)', borderRadius: 8 }}>{tag}</span>
        <span style={{ color: v4.text, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: display }}>{title}</span>
        <span style={{ color: v4.textDim, fontSize: 14 }}>{body}</span>
      </div>
      {/* two widgets side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <V4WidgetBox label={leftLabel} stat={leftStat}>{leftWidget}</V4WidgetBox>
        <V4WidgetBox label={rightLabel} stat={rightStat}>{rightWidget}</V4WidgetBox>
      </div>
    </div>
  );
}

function V4WidgetBox({ label, stat, children }) {
  return (
    <div style={{ background: v4.bg2, border: `1px solid ${v4.border}`, borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ color: v4.textVeryDim, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono, fontWeight: 700 }}>{label}</span>
        <span style={{ color: v4.electric, fontFamily: mono, fontSize: 10, fontWeight: 700 }}>{stat}</span>
      </div>
      {children}
    </div>
  );
}

// ── Widgets ────────────────────────────────────────────────────────
function WidgetCaptain() {
  const rows = [
    ['Haaland', 9.8, v4.electric, '(C)'],
    ['Salah',   8.4, v4.text,     ''],
    ['Palmer',  6.9, v4.textDim,  ''],
    ['Saka',    5.2, v4.textVeryDim, ''],
  ];
  const max = rows[0][1];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {rows.map(([n, p, c, mark]) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 86, fontSize: 13, color: v4.text, fontWeight: 600, fontFamily: display }}>
            {n}{mark && <span style={{ color: v4.electric, fontFamily: mono, marginLeft: 5, fontSize: 10, fontWeight: 800 }}>{mark}</span>}
          </div>
          <div style={{ flex: 1, height: 6, background: v4.border, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${(p / max) * 100}%`, height: '100%', background: c, borderRadius: 999 }} />
          </div>
          <div style={{ width: 48, textAlign: 'right', fontFamily: mono, fontSize: 12, color: c === v4.electric ? v4.electric : v4.textDim, fontWeight: 700 }}>{p.toFixed(1)}</div>
        </div>
      ))}
    </div>
  );
}

function WidgetPlanner() {
  const gws = FPL_DATA.gws;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {gws.map((g, i) => (
          <div key={i} style={{ flex: 1, background: v4.bg, border: `1px solid ${g.action !== 'hold' ? 'rgba(0,255,135,0.35)' : v4.border}`, borderRadius: 8, padding: '7px 5px', position: 'relative' }}>
            <div style={{ fontSize: 9, color: v4.textVeryDim, fontFamily: mono, fontWeight: 600 }}>GW{g.gw}</div>
            <div style={{ fontSize: 10, color: v4.text, fontWeight: 700, marginTop: 2, fontFamily: display }}>{g.fix}</div>
            <div style={{ display: 'flex', gap: 1, marginTop: 5 }}>
              {Array.from({ length: 5 }).map((_, k) => (
                <div key={k} style={{ flex: 1, height: 3, background: k < g.diff ? (g.diff <= 2 ? v4.electric : g.diff <= 3 ? v4.amber : '#ff7055') : v4.border, borderRadius: 1 }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: v4.electric, fontFamily: mono, fontWeight: 700, marginTop: 5 }}>{g.ev}</div>
            {g.action !== 'hold' && (
              <div style={{ position: 'absolute', top: -7, right: -3, padding: '1px 4px', background: v4.electric, color: v4.bg, fontSize: 7, fontWeight: 800, borderRadius: 8, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                {g.action.split(' ')[0].toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Confidence % removed — pick + score only
function WidgetMatches() {
  const fixtures = [
    { home: 'ARS', away: 'CHE', time: 'Sat 17:30', pick: 'ARS 2-1' },
    { home: 'LIV', away: 'MCI', time: 'Sun 16:30', pick: 'Draw 1-1' },
    { home: 'NEW', away: 'TOT', time: 'Sun 14:00', pick: 'NEW 2-0' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {fixtures.map((f, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '7px 0', borderBottom: i < fixtures.length - 1 ? `1px solid ${v4.border}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 14, height: 14, background: TEAM_COLORS[f.home], borderRadius: 4 }} />
            <span style={{ color: v4.text, fontFamily: mono, fontSize: 11, fontWeight: 700 }}>{f.home}</span>
            <span style={{ color: v4.textVeryDim, fontSize: 10 }}>vs</span>
            <span style={{ color: v4.text, fontFamily: mono, fontSize: 11, fontWeight: 700 }}>{f.away}</span>
            <div style={{ width: 14, height: 14, background: TEAM_COLORS[f.away], borderRadius: 4 }} />
            <span style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, marginLeft: 4 }}>{f.time}</span>
          </div>
          <div style={{ background: 'rgba(0,255,135,0.08)', color: v4.electric, padding: '3px 8px', borderRadius: 8, fontFamily: mono, fontSize: 11, fontWeight: 700 }}>{f.pick}</div>
        </div>
      ))}
    </div>
  );
}

function WidgetBracket() {
  const knockouts = [
    { round: 'QF',    a: 'Spain',   b: 'Brazil',    score: '2-1', winner: 'Spain' },
    { round: 'QF',    a: 'England', b: 'Germany',   score: '2-1', winner: 'England' },
    { round: 'SF',    a: 'Spain',   b: 'England',   score: '1-2', winner: 'England' },
    { round: 'FINAL', a: 'England', b: 'Argentina', score: '2-1', winner: 'England' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {knockouts.map((k, i) => {
        const last = i === knockouts.length - 1;
        return (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '40px 1fr auto 1fr', gap: 10, alignItems: 'center',
            padding: '5px 8px', borderRadius: 8,
            background: last ? 'rgba(0,255,135,0.07)' : 'transparent',
            border: last ? `1px solid rgba(0,255,135,0.2)` : '1px solid transparent',
          }}>
            <span style={{ color: last ? v4.electric : v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em' }}>{k.round}</span>
            <span style={{ color: k.winner === k.a ? v4.text : v4.textDim, fontFamily: display, fontWeight: k.winner === k.a ? 700 : 400, fontSize: 12, textAlign: 'right' }}>{k.a}</span>
            <span style={{ color: v4.electric, fontFamily: mono, fontSize: 11, fontWeight: 700, padding: '2px 7px', background: 'rgba(0,0,0,0.4)', borderRadius: 8 }}>{k.score}</span>
            <span style={{ color: k.winner === k.b ? v4.text : v4.textDim, fontFamily: display, fontWeight: k.winner === k.b ? 700 : 400, fontSize: 12 }}>{k.b}</span>
          </div>
        );
      })}
      <div style={{ marginTop: 4, fontSize: 11, color: v4.textVeryDim, fontFamily: mono, display: 'flex', justifyContent: 'space-between' }}>
        <span>ENGLAND</span>
        <span>32% win prob</span>
      </div>
    </div>
  );
}

// ── Accuracy snapshot ─────────────────────────────────────────────
function V4Accuracy() {
  const bars = [
    { gw: 22, model: 2.05, fpl: 2.19 },
    { gw: 23, model: 1.83, fpl: 2.11 },
    { gw: 24, model: 1.84, fpl: 2.12 },
    { gw: 25, model: 1.91, fpl: 2.07 },
    { gw: 26, model: 1.71, fpl: 2.08 },
    { gw: 27, model: 1.86, fpl: 2.13 },
  ];
  const max = 2.4;
  return (
    <div style={{ padding: '100px 56px', background: v4.bg2, borderTop: `1px solid ${v4.border}`, borderBottom: `1px solid ${v4.border}` }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ color: v4.electric, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>// track record</div>
          <h2 style={{ color: v4.text, fontSize: 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, fontFamily: display }}>
            The model beats FPL's own forecasts.
          </h2>
          <p style={{ color: v4.textDim, fontSize: 15, lineHeight: 1.5, marginTop: 16, maxWidth: 420 }}>
            Beat FPL's official forecast in six of the last six gameweeks last season.
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20,
            color: v4.textVeryDim, fontFamily: display, fontWeight: 700, fontSize: 13,
            letterSpacing: '0.02em', cursor: 'not-allowed', opacity: 0.45,
          }}>Track record coming soon</span>
        </div>

        <div style={{ background: v4.surface, border: `1px solid ${v4.border}`, borderRadius: 14, padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
            <div>
              <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' }}>last 6 gameweeks</div>
              <div style={{ color: v4.text, fontFamily: display, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>Lower bar = closer to reality</div>
            </div>
            <div style={{ display: 'flex', gap: 12, fontFamily: mono, fontSize: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: v4.text }}>
                <span style={{ width: 8, height: 8, background: v4.electric, borderRadius: 2 }} />The model
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: v4.textDim }}>
                <span style={{ width: 8, height: 8, background: v4.textVeryDim, borderRadius: 2 }} />FPL
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 190 }}>
            {bars.map(r => (
              <div key={r.gw} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, width: '100%', justifyContent: 'center' }}>
                  <div style={{ width: 16, height: `${(r.model / max) * 100}%`, background: v4.electric, borderRadius: '2px 2px 0 0' }} />
                  <div style={{ width: 16, height: `${(r.fpl / max) * 100}%`, background: v4.textVeryDim, borderRadius: '2px 2px 0 0' }} />
                </div>
                <div style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim, fontWeight: 600 }}>GW{r.gw}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quote ──────────────────────────────────────────────────────────
function V4Quote() {
  return (
    <div style={{ padding: '110px 56px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(123,46,227,0.15), transparent 60%)' }} />
      <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ color: v4.electric, fontSize: 180, fontFamily: display, fontWeight: 700, lineHeight: 0.8, letterSpacing: '-0.05em', height: 90, overflow: 'hidden' }}>"</div>
          <div style={{ color: v4.text, fontSize: 28, lineHeight: 1.35, fontWeight: 600, fontFamily: display, letterSpacing: '-0.02em', marginTop: 20 }}>
            I built TheModelSays because I was tired of guessing. Now every Friday morning, I just open the app and see what the model says.
          </div>
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${v4.electric}, ${v4.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: v4.bg, fontFamily: display, fontWeight: 800, fontSize: 16 }}>NS</div>
            <div>
              <div style={{ color: v4.text, fontSize: 14, fontWeight: 700, fontFamily: display }}>Nabeeh Shameem</div>
              <div style={{ color: v4.textDim, fontSize: 12, fontFamily: mono }}>creator</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['+11%', 'better picks',  'than FPL’s own'],
            ['32',   'PL matches',    'called every week'],
            ['64',   'WC fixtures',   'all predicted'],
            ['£0',    'forever',       'open beta'],
          ].map(([n, l, s]) => (
            <div key={l} style={{ background: v4.surface, border: `1px solid ${v4.border}`, borderRadius: 14, padding: 22 }}>
              <div style={{ color: v4.text, fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em', fontFamily: display, lineHeight: 1 }}>{n}</div>
              <div style={{ color: v4.electric, fontSize: 11, marginTop: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: mono }}>{l}</div>
              <div style={{ color: v4.textDim, fontSize: 12, marginTop: 4 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CTA — email capture for August PL return ───────────────────────
function V4CTA() {
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  }

  return (
    <div style={{ padding: '120px 56px', position: 'relative', overflow: 'hidden', borderTop: `1px solid ${v4.border}` }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 65%, rgba(123,46,227,0.22), transparent 52%)' }} />
      <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ color: v4.electric, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 20 }}>PL RETURNS AUGUST 2025</div>
        <h2 style={{ color: v4.text, fontSize: 72, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.95, margin: 0, fontFamily: display }}>
          Don't miss<br/>the first call.
        </h2>
        <p style={{ color: v4.textDim, fontSize: 16, marginTop: 20, marginBottom: 36, lineHeight: 1.5 }}>
          Get the model's GW1 picks the moment they're ready.
        </p>
        {!submitted ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)', color: v4.text,
                border: `1px solid ${v4.borderHi}`, borderRadius: 999,
                padding: '13px 20px', fontSize: 14, fontFamily: display,
                outline: 'none', width: 260, minWidth: 0,
              }}
            />
            <button type="submit" style={{
              background: v4.electric, color: v4.bg, border: 0, borderRadius: 999,
              padding: '13px 24px', fontSize: 14, fontWeight: 700,
              letterSpacing: '0.02em', cursor: 'pointer', fontFamily: display,
            }}>Notify me</button>
          </form>
        ) : (
          <div style={{ color: v4.electric, fontFamily: mono, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em' }}>
            YOU'RE ON THE LIST
          </div>
        )}
      </div>
    </div>
  );
}

// ── Social links ──────────────────────────────────────────────────
const SOCIALS = [
  { name: 'TikTok',    handle: '@themodelsays', href: 'https://www.tiktok.com/@themodelsays',    icon: (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
        <path d="M19.6 6.3a5.4 5.4 0 01-3.2-1V15a5.8 5.8 0 11-5-5.7v3.1a2.7 2.7 0 102 2.6V2h3a5.4 5.4 0 003.2 4z"/>
      </svg>
  )},
  { name: 'YouTube',   handle: '@themodelsays', href: 'https://www.youtube.com/@themodelsays',   icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
        <path d="M23 7.2a3 3 0 00-2.1-2.1C19 4.5 12 4.5 12 4.5s-7 0-8.9.6A3 3 0 001 7.2 31 31 0 00.5 12 31 31 0 001 16.8 3 3 0 003.1 19c1.9.5 8.9.5 8.9.5s7 0 8.9-.6a3 3 0 002.1-2.1A31 31 0 0023.5 12 31 31 0 0023 7.2zM9.8 15.5v-7l6 3.5z"/>
      </svg>
  )},
  { name: 'Instagram', handle: '@themodelsays', href: 'https://www.instagram.com/themodelsays',  icon: (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
  )},
];

function V4SocialLink({ s }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a href={s.href} target="_blank" rel="noopener noreferrer"
       onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
       style={{
         display: 'flex', alignItems: 'center', gap: 11,
         color: hover ? v4.electric : v4.textDim,
         textDecoration: 'none', fontFamily: display, fontSize: 14, fontWeight: 500,
         transition: 'color 140ms ease',
       }}>
      <span style={{
        width: 32, height: 32, borderRadius: 8,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: hover ? 'rgba(0,255,135,0.08)' : v4.surface,
        border: `1px solid ${hover ? 'rgba(0,255,135,0.28)' : v4.border}`,
        transition: 'all 140ms ease',
      }}>{s.icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span>{s.name}</span>
        <span style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10 }}>{s.handle}</span>
      </span>
    </a>
  );
}

// ── Footer — 4 equal columns ──────────────────────────────────────
function V4Footer() {
  const cols = [
    ['App',   ['FPL Squad', 'Transfers', 'Captain', 'PL Matches', 'World Cup 2026']],
    ['Trust', ['Track record', 'Updates', 'Privacy', 'Contact']],
  ];
  return (
    <div style={{ borderTop: `1px solid ${v4.border}`, padding: '72px 56px 36px', background: v4.bg }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <TmsLogo />
              <TmsBrand />
            </div>
            <p style={{ color: v4.textDim, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              AI picks for FPL, every Premier League match, and the World Cup. The same model, every weekend.
            </p>
          </div>
          {cols.map(([title, items]) => (
            <div key={title}>
              <div style={{ color: v4.electric, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, fontWeight: 700, marginBottom: 16 }}>{title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(it => <a key={it} style={{ color: v4.textDim, fontSize: 14, textDecoration: 'none', cursor: 'pointer', fontFamily: display }}>{it}</a>)}
              </div>
            </div>
          ))}
          <div>
            <div style={{ color: v4.electric, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, fontWeight: 700, marginBottom: 16 }}>Follow</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {SOCIALS.map(s => <V4SocialLink key={s.name} s={s} />)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 56, paddingTop: 24, borderTop: `1px solid ${v4.border}`, color: v4.textVeryDim, fontSize: 11, fontFamily: mono }}>
          <span>© 2026 THEMODELSAYS · NOT AFFILIATED WITH THE PREMIER LEAGUE OR FIFA</span>
          <span>OPEN BETA · v0.5</span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
function LandingV4Final() {
  return (
    <div style={{ background: v4.bg, color: v4.text, fontFamily: display, width: '100%', minHeight: '100%' }}>
      <V4Nav />
      <V4Hero />
      <V4Marquee />
      <V4Features />
      <WorldCupPredictor />
      <WCFantasySection />
      <V4Accuracy />
      <V4Quote />
      <V4CTA />
      <V4Footer />
    </div>
  );
}

export default LandingV4Final;
