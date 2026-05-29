import React from 'react';
import { FPL_DATA, TEAM_COLORS } from '../data.js';
import { subscribeEmail } from '../lib/api.js';
import WorldCupPredictor from './WorldCupPredictor.jsx';
import WCFantasySection from './WCFantasySection.jsx';
import TournamentBracket from './TournamentBracket.jsx';

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
    @keyframes tmsMarquee {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-33.333%); }
    }
    .tms-marquee-inner { animation: tmsMarquee 28s linear infinite; }
    @media (max-width: 768px) {
      .tms-hero-grid   { grid-template-columns: 1fr !important; }
      .tms-feat-grid   { grid-template-columns: 1fr !important; }
      .tms-widget-grid { grid-template-columns: 1fr !important; }
      .tms-acc-grid    { grid-template-columns: 1fr !important; }
      .tms-quote-grid  { grid-template-columns: 1fr !important; }
      .tms-foot-grid   { grid-template-columns: 1fr 1fr !important; }
      .tms-hide-mobile { display: none !important; }
    }
  `;
  document.head.appendChild(s);
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
  const mobile = useIsMobile();
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(13,1,24,0.82)', backdropFilter: 'blur(14px)',
      borderBottom: `1px solid ${v4.border}`,
      padding: mobile ? '14px 20px' : '16px 56px',
      display: 'flex', alignItems: 'center', gap: 36,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <TmsLogo />
        <TmsBrand />
      </div>
      {!mobile && (
        <div style={{ display: 'flex', gap: 28, marginLeft: 12, fontFamily: display }}>
          {[
            ['World Cup 2026', '#'],
            ['Bracket', '#'],
            ['Fantasy', '#'],
          ].map(([label, href]) => (
            <a key={label} href={href} onClick={e => e.preventDefault()}
               style={{ color: v4.textDim, fontSize: 14, fontWeight: 500, textDecoration: 'none', cursor: 'not-allowed', opacity: 0.5 }}>
              {label}
            </a>
          ))}
        </div>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18 }}>
        {!mobile && (
          <span style={{ color: v4.textDim, fontSize: 14, fontWeight: 500, fontFamily: display, cursor: 'pointer' }}>Sign in</span>
        )}
        <span style={{
          background: 'rgba(0,255,135,0.12)', color: v4.textVeryDim, borderRadius: 999,
          padding: mobile ? '7px 14px' : '9px 18px',
          fontSize: 13, fontWeight: 700, cursor: 'not-allowed',
          letterSpacing: '0.03em', textTransform: 'uppercase', fontFamily: display,
          display: 'inline-block', opacity: 0.55,
        }}>Coming soon</span>
      </div>
    </div>
  );
}

// ── WC Favourites hero widget ────────────────────────────────────────
const WC_FAVS = [
  { name: 'France',      pct: 14.2, color: '#4F85D3' },
  { name: 'Brazil',      pct: 12.8, color: '#3DB56A' },
  { name: 'England',     pct: 11.4, color: '#E05252' },
  { name: 'Argentina',   pct: 10.9, color: '#74ACDF' },
  { name: 'Spain',       pct: 9.6,  color: '#D45353' },
  { name: 'Germany',     pct: 8.1,  color: '#aaaaaa' },
  { name: 'Portugal',    pct: 7.3,  color: '#D45353' },
  { name: 'Netherlands', pct: 5.8,  color: '#E07C2A' },
];

function V4BracketHero() {
  const max = WC_FAVS[0].pct;
  return (
    <div style={{
      position: 'relative', borderRadius: 14, overflow: 'hidden',
      background: 'linear-gradient(170deg, rgba(123,46,227,0.12) 0%, rgba(0,0,0,0.4) 100%)',
      border: `1px solid ${v4.border}`,
      boxShadow: '0 30px 80px -20px rgba(0,0,0,0.6)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>CHAMPIONSHIP RACE · MODEL ODDS</span>
        <span style={{
          color: v4.electric, fontFamily: mono, fontSize: 9, fontWeight: 700,
          background: 'rgba(0,255,135,0.08)', padding: '3px 8px', borderRadius: 6,
        }}>50K SIMS</span>
      </div>

      {/* Team bars */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
        {WC_FAVS.map((t, i) => (
          <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 16, color: v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 700, textAlign: 'right' }}>{i + 1}</span>
            <span style={{
              width: 100, color: i === 0 ? v4.text : v4.textDim,
              fontFamily: display, fontSize: 13, fontWeight: i === 0 ? 700 : 400,
            }}>{t.name}</span>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                width: `${(t.pct / max) * 100}%`, height: '100%', borderRadius: 999,
                background: i === 0 ? v4.electric : t.color,
                opacity: i === 0 ? 1 : 0.55,
              }} />
            </div>
            <span style={{
              width: 44, textAlign: 'right', fontFamily: mono, fontSize: 12, fontWeight: 700,
              color: i === 0 ? v4.electric : v4.textDim,
            }}>{t.pct}%</span>
          </div>
        ))}
      </div>

      {/* Predicted final */}
      <div style={{ margin: '0 14px 14px', padding: '12px 14px', background: 'rgba(0,255,135,0.06)', border: `1px solid rgba(0,255,135,0.18)`, borderRadius: 10 }}>
        <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Model's predicted final</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: v4.text, fontFamily: display, fontSize: 15, fontWeight: 700 }}>France</span>
          <span style={{ color: v4.electric, fontFamily: mono, fontSize: 13, fontWeight: 800, background: 'rgba(0,0,0,0.45)', padding: '3px 9px', borderRadius: 6 }}>57%</span>
          <span style={{ color: v4.textDim, fontFamily: display, fontSize: 15 }}>Brazil</span>
        </div>
        <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 9, marginTop: 6 }}>Updated June 2026 · Retrained after each matchday</div>
      </div>

      <div style={{ position: 'absolute', bottom: 12, right: 18, color: 'rgba(255,255,255,0.2)', fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>
        WC 2026 · THE MODEL
      </div>
    </div>
  );
}

// ── Hero ────────────────────────────────────────────────────────────
const SAYINGS = [
  'France lift the trophy.',
  'Mbappe: Golden Boot.',
  'England reach the final.',
  'Brazil beat Argentina.',
  'Spain win Group H.',
];

function V4Hero() {
  const [i, setI] = React.useState(0);
  const mobile = useIsMobile();
  React.useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % SAYINGS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 60%, rgba(123,46,227,0.38), transparent 55%)' }} />

      <div
        className="tms-hero-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : '1.05fr 1fr',
          gap: mobile ? 32 : 48,
          position: 'relative',
          padding: mobile ? '64px 20px 52px' : '110px 56px 90px',
        }}
      >
        {/* left */}
        <div>
          {/* WC pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 12px 5px 8px', borderRadius: 999,
            background: 'rgba(0,255,135,0.08)', border: `1px solid rgba(0,255,135,0.2)`,
            fontSize: 12, color: v4.electric, marginBottom: 28,
            fontFamily: mono, fontWeight: 600, letterSpacing: '0.04em',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: v4.electric, animation: 'tmsPulse 1.6s ease infinite', flexShrink: 0 }} />
            FIFA WORLD CUP 2026 · JUNE 11 – JULY 19
          </div>

          <h1 style={{
            color: v4.text,
            fontSize: mobile ? 56 : 96,
            fontWeight: 700, letterSpacing: '-0.045em',
            lineHeight: 0.96, margin: 0, fontFamily: display,
          }}>
            The model<br/>says.
          </h1>

          <div style={{ marginTop: 18, height: 64, position: 'relative' }}>
            <span key={i} style={{
              display: 'inline-block', fontFamily: display, fontWeight: 700,
              fontSize: mobile ? 26 : 44,
              letterSpacing: '-0.03em',
              background: `linear-gradient(120deg, ${v4.electric} 0%, #00e8c8 60%, ${v4.electric} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              animation: 'tmsFade 2.8s ease infinite',
            }}>
              "{SAYINGS[i]}"
            </span>
          </div>

          <p style={{ color: v4.textDim, fontSize: mobile ? 16 : 18, lineHeight: 1.55, marginTop: 22, maxWidth: 540, fontWeight: 400 }}>
            AI predictions for every 2026 World Cup match. 50,000 simulations per team, bracket builder, and fantasy squad optimizer.{' '}
            <span style={{ color: v4.text, fontWeight: 500 }}>Free, open beta.</span>
          </p>

          <div style={{ marginTop: 36 }}>
            <span style={{
              background: 'rgba(0,255,135,0.12)', color: v4.textVeryDim, borderRadius: 999,
              padding: '15px 24px', fontSize: 14.5, fontWeight: 700, cursor: 'not-allowed',
              letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: display,
              display: 'inline-block', opacity: 0.55,
            }}>App coming soon</span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, marginTop: 52, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: v4.electric, animation: 'tmsPulse 2s ease infinite' }} />
                <span style={{ color: v4.electric, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono }}>SIMULATIONS</span>
              </div>
              <div style={{ color: v4.text, fontSize: 30, fontWeight: 700, fontFamily: display, letterSpacing: '-0.02em', marginTop: 4 }}>50,000</div>
              <div style={{ color: v4.textDim, fontSize: 12 }}>per tournament run</div>
            </div>
            <div style={{ width: 1, height: 56, background: v4.border }} />
            <div>
              <div style={{ color: v4.textVeryDim, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono }}>COVERAGE</div>
              <div style={{ color: v4.text, fontSize: 30, fontWeight: 700, fontFamily: display, letterSpacing: '-0.02em', marginTop: 4 }}>48 teams</div>
              <div style={{ color: v4.textDim, fontSize: 12 }}>all 104 WC matches</div>
            </div>
          </div>
        </div>

        {/* right — bracket hero */}
        <V4BracketHero />
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

// ── Marquee ────────────────────────────────────────────────────────
function V4Marquee() {
  const items = ['WORLD CUP 2026', '48 TEAMS · 104 MATCHES', 'LIVE PREDICTIONS', 'BRACKET BUILDER', '50K SIMULATIONS', 'FANTASY OPTIMIZER', 'FREE OPEN BETA', 'JUNE 11 · USA MEXICO CANADA'];
  const all = [...items, ...items, ...items];
  return (
    <div style={{
      background: v4.bg2, padding: '14px 0', overflow: 'hidden',
      borderTop: `1px solid ${v4.electric}22`, borderBottom: `1px solid ${v4.electric}22`,
    }}>
      <div className="tms-marquee-inner" style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap', width: 'max-content' }}>
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

// ── Features — 3 tool cards ──────────────────────────────────────────
function V4FeatureCard({ tag, title, body, widget, widgetLabel, widgetStat }) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      border: `1px solid ${v4.border}`, borderRadius: 14, padding: 28,
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      <div>
        <span style={{ color: v4.electric, fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 10px', background: 'rgba(0,255,135,0.1)', borderRadius: 8 }}>{tag}</span>
        <div style={{ color: v4.text, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: display, marginTop: 14 }}>{title}</div>
        <div style={{ color: v4.textDim, fontSize: 13, marginTop: 6, lineHeight: 1.55 }}>{body}</div>
      </div>
      <V4WidgetBox label={widgetLabel} stat={widgetStat}>{widget}</V4WidgetBox>
    </div>
  );
}

function V4Features() {
  const mobile = useIsMobile();
  return (
    <div style={{ padding: mobile ? '64px 20px' : '100px 56px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 52 }}>
          <div style={{ color: v4.electric, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>what the model says</div>
          <h2 style={{ color: v4.text, fontSize: mobile ? 36 : 56, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.02, margin: 0, fontFamily: display }}>
            Every group. Every knockout. Every call.
          </h2>
        </div>

        <div className="tms-feat-grid" style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>
          <V4FeatureCard
            tag="SCORE PREDICTOR"
            title="Pick any match. Get the call."
            body="Dixon-Coles model trained on WC history and recent international form. Group stage and knockout."
            widget={<WidgetWCMatches />}
            widgetLabel="LATEST PICKS"
            widgetStat="Updated daily"
          />
          <V4FeatureCard
            tag="TOURNAMENT BRACKET"
            title="Every path to the final."
            body="50,000 Monte Carlo simulations. Win probabilities for all 48 teams, updated after each matchday."
            widget={<WidgetBracket />}
            widgetLabel="BRACKET CALL"
            widgetStat="48 teams · 104 matches"
          />
          <V4FeatureCard
            tag="FANTASY OPTIMIZER"
            title="Build the optimal squad."
            body="Captain picks, budget optimizer, and phase-by-phase EV for FIFA's official WC fantasy game."
            widget={<WidgetCaptain />}
            widgetLabel="CAPTAIN PICKS"
            widgetStat="Projected tournament pts"
          />
        </div>
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
    ['Mbappe',   9.4, v4.electric, '(C)'],
    ['Vinicius', 8.1, v4.text,     ''],
    ['Bellingham', 7.2, v4.textDim, ''],
    ['Salah',    5.9, v4.textVeryDim, ''],
  ];
  const max = rows[0][1];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {rows.map(([n, p, c, mark]) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 96, fontSize: 13, color: v4.text, fontWeight: 600, fontFamily: display }}>
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
  const phases = [
    { label: 'Group', dates: 'Jun 11–26', ev: '+9.4', hot: true },
    { label: 'R32',   dates: 'Jun 27–Jul 2', ev: '+5.2', hot: false },
    { label: 'QF',    dates: 'Jul 4–5', ev: '+3.1', hot: false },
    { label: 'SF',    dates: 'Jul 8–9', ev: '+2.8', hot: false },
    { label: 'Final', dates: 'Jul 19', ev: '+1.9', hot: false },
  ];
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {phases.map(g => (
        <div key={g.label} style={{ flex: 1, background: v4.bg, border: `1px solid ${g.hot ? 'rgba(0,255,135,0.35)' : v4.border}`, borderRadius: 8, padding: '7px 5px', position: 'relative' }}>
          <div style={{ fontSize: 9, color: v4.textVeryDim, fontFamily: mono, fontWeight: 600 }}>{g.label}</div>
          <div style={{ fontSize: 9, color: v4.text, fontWeight: 600, marginTop: 2, fontFamily: display, lineHeight: 1.2 }}>{g.dates}</div>
          <div style={{ fontSize: 10, color: v4.electric, fontFamily: mono, fontWeight: 700, marginTop: 5 }}>{g.ev}</div>
          {g.hot && (
            <div style={{ position: 'absolute', top: -7, right: -3, padding: '1px 4px', background: v4.electric, color: v4.bg, fontSize: 7, fontWeight: 800, borderRadius: 8, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              HOT
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function WidgetWCMatches() {
  const fixtures = [
    { home: 'ENG', away: 'ARG', group: 'L', pick: 'ENG 2-1' },
    { home: 'FRA', away: 'BRA', group: 'I', pick: 'Draw 1-1' },
    { home: 'ESP', away: 'GER', group: 'H', pick: 'ESP 2-0' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {fixtures.map((f, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '7px 0', borderBottom: i < fixtures.length - 1 ? `1px solid ${v4.border}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: v4.text, fontFamily: mono, fontSize: 11, fontWeight: 700 }}>{f.home}</span>
            <span style={{ color: v4.textVeryDim, fontSize: 10 }}>vs</span>
            <span style={{ color: v4.text, fontFamily: mono, fontSize: 11, fontWeight: 700 }}>{f.away}</span>
            <span style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, marginLeft: 4 }}>Grp {f.group}</span>
          </div>
          <div style={{ background: 'rgba(0,255,135,0.08)', color: v4.electric, padding: '3px 8px', borderRadius: 8, fontFamily: mono, fontSize: 11, fontWeight: 700 }}>{f.pick}</div>
        </div>
      ))}
    </div>
  );
}

function WidgetBracket() {
  const knockouts = [
    { round: 'QF',    a: 'France',  b: 'Spain',     score: '2-1', winner: 'France' },
    { round: 'QF',    a: 'Brazil',  b: 'England',   score: '1-1', winner: 'Brazil' },
    { round: 'SF',    a: 'France',  b: 'Brazil',    score: '2-0', winner: 'France' },
    { round: 'FINAL', a: 'France',  b: 'Argentina', score: '2-1', winner: 'France' },
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
        <span>FRANCE</span>
        <span>14.2% win prob</span>
      </div>
    </div>
  );
}

// ── Accuracy snapshot ─────────────────────────────────────────────
function V4Accuracy() {
  const mobile = useIsMobile();
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
    <div style={{ padding: mobile ? '64px 20px' : '100px 56px', background: v4.bg2, borderTop: `1px solid ${v4.border}`, borderBottom: `1px solid ${v4.border}` }}>
      <div className="tms-acc-grid" style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1.2fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ color: v4.electric, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>track record</div>
          <h2 style={{ color: v4.text, fontSize: mobile ? 36 : 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, fontFamily: display }}>
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

// ── Stats ──────────────────────────────────────────────────────────
function V4Quote() {
  const mobile = useIsMobile();
  return (
    <div style={{ padding: mobile ? '64px 20px' : '110px 56px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(123,46,227,0.15), transparent 60%)' }} />
      <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative' }}>
        <div style={{ color: v4.electric, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 32, textAlign: 'center' }}>by the numbers</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          {[
            ['50K',  'simulations',   'per tournament run'],
            ['104',  'WC fixtures',   'all predicted'],
            ['48',   'teams covered', 'every group stage'],
            ['£0',   'forever',       'open beta'],
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

// ── CTA ────────────────────────────────────────────────────────────
function V4CTA() {
  const [email,  setEmail]  = React.useState('');
  const [status, setStatus] = React.useState('idle'); // idle | loading | success | error | duplicate
  const mobile = useIsMobile();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await subscribeEmail(email.trim());
      setStatus(res?.status === 'already_subscribed' ? 'duplicate' : 'success');
    } catch {
      setStatus('error');
    }
  }

  const done = status === 'success' || status === 'duplicate';

  return (
    <div style={{ padding: mobile ? '80px 20px' : '120px 56px', position: 'relative', overflow: 'hidden', borderTop: `1px solid ${v4.border}` }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 65%, rgba(123,46,227,0.22), transparent 52%)' }} />
      <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ color: v4.electric, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 20 }}>WC 2026 KICKS OFF JUNE 11</div>
        <h2 style={{ color: v4.text, fontSize: mobile ? 48 : 72, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.95, margin: 0, fontFamily: display }}>
          Follow every<br/>call live.
        </h2>
        <p style={{ color: v4.textDim, fontSize: 16, marginTop: 20, marginBottom: 36, lineHeight: 1.5 }}>
          Get the model's picks for the group stage draw the moment they're ready.
        </p>
        {!done ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={status === 'loading'}
              style={{
                background: 'rgba(255,255,255,0.06)', color: v4.text,
                border: `1px solid ${status === 'error' ? 'rgba(255,85,119,0.5)' : v4.borderHi}`,
                borderRadius: 999,
                padding: '13px 20px', fontSize: 14, fontFamily: display,
                outline: 'none', width: 260, minWidth: 0,
                opacity: status === 'loading' ? 0.6 : 1,
              }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                background: v4.electric, color: v4.bg, border: 0, borderRadius: 999,
                padding: '13px 24px', fontSize: 14, fontWeight: 700,
                letterSpacing: '0.02em',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                fontFamily: display, opacity: status === 'loading' ? 0.7 : 1,
              }}
            >
              {status === 'loading' ? 'Saving…' : 'Notify me'}
            </button>
            {status === 'error' && (
              <div style={{ width: '100%', color: '#ff5577', fontFamily: mono, fontSize: 12, marginTop: 4 }}>
                Something went wrong — try again.
              </div>
            )}
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ color: v4.electric, fontFamily: mono, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em' }}>
              {status === 'duplicate' ? 'ALREADY ON THE LIST ✓' : 'YOU\'RE ON THE LIST ✓'}
            </div>
            <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 11 }}>
              We'll email you when match predictions go live.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Social links ──────────────────────────────────────────────────
const SOCIALS = [
  { name: 'TikTok',    handle: '@themodel.says', href: 'https://www.tiktok.com/@themodel.says',    icon: (
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

// ── Footer ────────────────────────────────────────────────────────
function V4Footer() {
  const mobile = useIsMobile();
  const cols = [
    ['App',   ['World Cup 2026', 'Bracket Builder', 'Fantasy Squad', 'Match Predictions', 'FPL (Aug 2026)']],
    ['Trust', ['Track record', 'Updates', 'Privacy', 'Contact']],
  ];
  return (
    <div style={{ borderTop: `1px solid ${v4.border}`, padding: mobile ? '48px 20px 28px' : '72px 56px 36px', background: v4.bg }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div className="tms-foot-grid" style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 48 }}>
          <div style={{ gridColumn: mobile ? '1 / -1' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <TmsLogo />
              <TmsBrand />
            </div>
            <p style={{ color: v4.textDim, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              AI predictions for every 2026 World Cup match. The same model, every matchday.
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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginTop: 56, paddingTop: 24, borderTop: `1px solid ${v4.border}`, color: v4.textVeryDim, fontSize: 11, fontFamily: mono, gap: 8 }}>
          <span>© 2026 THEMODELSAYS · NOT AFFILIATED WITH FIFA OR THE PREMIER LEAGUE</span>
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
      <TournamentBracket />
      <WorldCupPredictor />
      <WCFantasySection />
      <V4Features />
      <V4Accuracy />
      <V4Quote />
      <V4CTA />
      <V4Footer />
    </div>
  );
}

export default LandingV4Final;
