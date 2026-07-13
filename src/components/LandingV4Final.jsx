import React from 'react';
import { fetchSimulation, predictWorldCupMatch, wcFantasy } from '../lib/api.js';
import WorldCupPredictor from './WorldCupPredictor.jsx';
import WCFantasySection from './WCFantasySection.jsx';
import TournamentBracket from './TournamentBracket.jsx';
import GroupStandings from './GroupStandings.jsx';

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

// Single resize listener shared across all components in this file.
const _mobileListeners = new Set();
let _isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    const m = window.innerWidth < 768;
    if (m !== _isMobile) { _isMobile = m; _mobileListeners.forEach(fn => fn(m)); }
  }, { passive: true });
}

function useIsMobile() {
  const [mobile, setMobile] = React.useState(_isMobile);
  React.useEffect(() => {
    _mobileListeners.add(setMobile);
    return () => _mobileListeners.delete(setMobile);
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
  function scrollTo(id) {
    if (id === 'home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(13,1,24,0.82)', backdropFilter: 'blur(14px)',
      borderBottom: `1px solid ${v4.border}`,
      padding: mobile ? '14px 20px' : '16px 56px',
      display: 'flex', alignItems: 'center', gap: 24,
    }}>
      <a href="#" onClick={e => { e.preventDefault(); scrollTo('home'); }}
         style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <TmsLogo />
        <TmsBrand />
      </a>
      {!mobile && (
        <div style={{ display: 'flex', gap: 24, marginLeft: 8, fontFamily: display }}>
          {[
            ['World Cup 2026',  'home'],
            ['Bracket',         'bracket'],
            ['Groups',          'groups'],
            ['Score Predictor', 'predictor'],
            ['Fantasy',         'fantasy'],
            ['FPL',             'fpl'],
          ].map(([label, targetId]) => (
            <a key={label} href={`#${targetId}`}
               onClick={e => { e.preventDefault(); scrollTo(targetId); }}
               style={{ color: v4.textDim, fontSize: 14, fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }}>
              {label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// Shared promise so both V4BracketHero and WidgetBracket fire only one request.
let _simPromise = null;
function getSimulation() {
  if (!_simPromise) _simPromise = fetchSimulation(10_000);
  return _simPromise;
}

// ── WC Favourites hero widget ────────────────────────────────────────
const _TEAM_COLORS = {
  France: '#4F85D3', Brazil: '#3DB56A', England: '#E05252', Argentina: '#74ACDF',
  Spain: '#D45353', Germany: '#aaaaaa', Portugal: '#c8434a', Netherlands: '#E07C2A',
  Belgium: '#E08A2A', Uruguay: '#6ABFAD', Morocco: '#C4474A', Japan: '#E8384D',
  Croatia: '#CC4444', Mexico: '#3DB56A', Colombia: '#F4D03F', Senegal: '#3DB56A',
};

function V4BracketHero() {
  const [favs, setFavs] = React.useState(null);
  const [nSim, setNSim] = React.useState(null);
  const [err,  setErr]  = React.useState(false);

  React.useEffect(() => {
    // Reset cached promise on error so a re-mount retries
    getSimulation()
      .then(data => {
        const sorted = [...data.teams]
          .filter(t => t.win_pct > 0)
          .sort((a, b) => b.win_pct - a.win_pct)
          .slice(0, 8)
          .map(t => ({
            name: t.team,
            win:   parseFloat(t.win_pct.toFixed(1)),
            final: parseFloat(t.final_pct.toFixed(1)),
            sf:    parseFloat(t.sf_pct.toFixed(1)),
            qf:    parseFloat(t.qf_pct.toFixed(1)),
            color: _TEAM_COLORS[t.team] || '#7B2EE3',
          }));
        setFavs(sorted);
        setNSim(data.n_sim);
      })
      .catch(() => {
        _simPromise = null; // clear cache so next mount retries
        setErr(true);
      });
  }, []);

  const rows = favs || [];
  const loading = favs === null && !err;

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
        }}>{nSim ? `${(nSim / 1000).toFixed(0)}K SIMS` : 'LIVE'}</span>
      </div>

      {/* Team bars */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1, minHeight: 196 }}>
        {err
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: v4.textVeryDim, fontFamily: mono, fontSize: 11 }}>Model unavailable — check back soon</div>
          : loading
          ? Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 16, color: v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 700, textAlign: 'right' }}>{i + 1}</span>
                <div style={{ width: 90, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
                <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 999 }} />
                <div style={{ width: 36, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
              </div>
            ))
          : rows.map((t, i) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 16, color: v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                <span style={{
                  width: 76, color: i === 0 ? v4.text : v4.textDim,
                  fontFamily: display, fontSize: 12, fontWeight: i === 0 ? 700 : 400,
                  flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{t.name}</span>
                <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(t.win * 5, 100)}%`, height: '100%', background: t.color, borderRadius: 4, opacity: i === 0 ? 1 : 0.65 }} />
                </div>
                <span style={{
                  width: 38, textAlign: 'right', fontFamily: mono, fontSize: 12, fontWeight: 700, flexShrink: 0,
                  color: i === 0 ? v4.electric : v4.textDim,
                }}>{t.win}%</span>
              </div>
            ))
        }
      </div>

      {/* Tournament favourite */}
      <div style={{ margin: '0 14px 14px', padding: '12px 14px', background: 'rgba(0,255,135,0.06)', border: `1px solid rgba(0,255,135,0.18)`, borderRadius: 10 }}>
        <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Tournament favourite</div>
        {loading
          ? <div style={{ height: 20, width: 180, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
          : err || !rows[0]
          ? <span style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 11 }}>—</span>
          : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: v4.text, fontFamily: display, fontSize: 15, fontWeight: 700 }}>{rows[0].name}</span>
              <span style={{ color: v4.electric, fontFamily: mono, fontSize: 13, fontWeight: 800, background: 'rgba(0,0,0,0.45)', padding: '3px 9px', borderRadius: 6 }}>{rows[0].win}%</span>
              <span style={{ color: v4.textDim, fontFamily: display, fontSize: 13 }}>to win WC 2026</span>
            </div>
          )
        }
        <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 9, marginTop: 6 }}>Live · Updated after each matchday</div>
      </div>

      <div style={{ position: 'absolute', bottom: 12, right: 18, color: 'rgba(255,255,255,0.2)', fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>
        WC 2026 · THE MODEL
      </div>
    </div>
  );
}

// ── Hero ────────────────────────────────────────────────────────────
const HERO_DESCRIPTORS = [
  "The model's pick.",
  "Right behind them.",
  "The dark horse.",
  "Up against it.",
];

function buildSayings(teams) {
  const remaining = teams
    .filter(t => (t.win_pct ?? 0) > 0)
    .sort((a, b) => b.win_pct - a.win_pct)
    .slice(0, 4);
  return remaining.map((t, rank) =>
    `${t.team}: ${t.win_pct.toFixed(1)}%. ${HERO_DESCRIPTORS[rank] ?? ''}`
  );
}

function V4Hero() {
  const [i, setI] = React.useState(0);
  const [sayings, setSayings] = React.useState([
    "Loading odds…",
  ]);
  const mobile = useIsMobile();

  React.useEffect(() => {
    fetchSimulation(20_000).then(data => {
      const s = buildSayings(data.teams || []);
      if (s.length > 0) setSayings(s);
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % sayings.length), 2800);
    return () => clearInterval(t);
  }, [sayings.length]);

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
              "{sayings[i]}"
            </span>
          </div>

          <p style={{ color: v4.textDim, fontSize: mobile ? 16 : 18, lineHeight: 1.55, marginTop: 22, maxWidth: 540, fontWeight: 400 }}>
            AI predictions for every 2026 World Cup match. 50,000 simulations per team, bracket builder, and fantasy squad optimizer.{' '}
            <span style={{ color: v4.text, fontWeight: 500 }}>Free, open beta.</span>
          </p>

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

// ── Marquee ────────────────────────────────────────────────────────
function V4Marquee() {
  const items = ['WORLD CUP 2026', '48 TEAMS · 104 MATCHES', 'LIVE PREDICTIONS', 'BRACKET BUILDER', '50K SIMULATIONS', 'FANTASY OPTIMIZER', 'FREE OPEN BETA', 'JUNE 11 · USA MEXICO CANADA', 'MINI LEAGUE · CODE: 64T3EKYD'];
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

// ── Mini League Banner ───────────────────────────────────────────────
const MINI_LEAGUE_CODE = '64T3EKYD';

function V4MiniLeagueBanner() {
  const mobile = useIsMobile();
  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(MINI_LEAGUE_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,255,135,0.07) 0%, rgba(123,46,227,0.1) 100%)',
      borderBottom: `1px solid rgba(0,255,135,0.18)`,
      padding: mobile ? '20px 20px' : '22px 56px',
    }}>
      <div style={{
        maxWidth: 1180, margin: '0 auto',
        display: 'flex', flexDirection: mobile ? 'column' : 'row',
        alignItems: mobile ? 'flex-start' : 'center',
        gap: mobile ? 16 : 0,
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: v4.electric, animation: 'tmsPulse 1.6s ease infinite', flexShrink: 0 }} />
            <span style={{ color: v4.electric, fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>WC Fantasy Mini League</span>
          </div>
          <div style={{ color: v4.text, fontFamily: display, fontSize: mobile ? 15 : 17, fontWeight: 700 }}>
            Compete against everyone using the model's picks
          </div>
          <div style={{ color: v4.textDim, fontFamily: display, fontSize: 13, marginTop: 3 }}>
            Join the TheModelSays league and see how the model's squad performs against yours.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{
            background: 'rgba(0,0,0,0.45)',
            border: `1px solid rgba(0,255,135,0.28)`,
            borderRadius: 10, padding: '10px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          }}>
            <span style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>League code</span>
            <span style={{ color: v4.electric, fontFamily: mono, fontSize: 24, fontWeight: 800, letterSpacing: '0.1em' }}>{MINI_LEAGUE_CODE}</span>
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? 'rgba(0,255,135,0.18)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${copied ? 'rgba(0,255,135,0.5)' : v4.borderHi}`,
              borderRadius: 10, padding: '10px 18px',
              color: copied ? v4.electric : v4.textDim,
              fontFamily: mono, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 150ms ease', whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied' : 'Copy code'}
          </button>
        </div>
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
  const [picks, setPicks] = React.useState(null);

  React.useEffect(() => {
    wcFantasy.captains(4).then(data => setPicks(data.picks)).catch(() => {});
  }, []);

  if (!picks) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 96, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 999 }} />
            <div style={{ width: 32, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  const max = picks[0]?.projected_pts || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {picks.map((p, i) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 96, fontSize: 13, color: v4.text, fontWeight: i === 0 ? 700 : 400, fontFamily: display, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.name.split(' ').slice(-1)[0]}
            {i === 0 && <span style={{ color: v4.electric, fontFamily: mono, marginLeft: 5, fontSize: 10, fontWeight: 800 }}>(C)</span>}
          </div>
          <div style={{ flex: 1, height: 6, background: v4.border, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${(p.projected_pts / max) * 100}%`, height: '100%', background: i === 0 ? v4.electric : v4.textDim, borderRadius: 999, opacity: i === 0 ? 1 : 0.5 }} />
          </div>
          <div style={{ width: 48, textAlign: 'right', fontFamily: mono, fontSize: 12, color: i === 0 ? v4.electric : v4.textDim, fontWeight: 700 }}>{p.projected_pts.toFixed(1)}</div>
        </div>
      ))}
    </div>
  );
}

const _SAMPLE_MATCHUPS = [
  { home: 'France',   away: 'Brazil'    },
  { home: 'England',  away: 'Argentina' },
  { home: 'Spain',    away: 'Germany'   },
];

function WidgetWCMatches() {
  const [results, setResults] = React.useState(null);

  React.useEffect(() => {
    Promise.all(
      _SAMPLE_MATCHUPS.map(m => predictWorldCupMatch({ home: m.home, away: m.away }))
    ).then(setResults).catch(() => {});
  }, []);

  if (!results) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '7px 0', borderBottom: i < 2 ? `1px solid ${v4.border}` : 'none' }}>
            <div style={{ height: 10, width: '70%', background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
            <div style={{ width: 56, height: 22, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {results.map((r, i) => {
        const h = Math.round(r.home_xg);
        const a = Math.round(r.away_xg);
        const label = h > a ? `${r.home_name.split(' ')[0]} ${h}–${a}` : h < a ? `${r.away_name.split(' ')[0]} ${a}–${h}` : `Draw ${h}–${a}`;
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '7px 0', borderBottom: i < results.length - 1 ? `1px solid ${v4.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ color: v4.text, fontFamily: mono, fontSize: 11, fontWeight: 700 }}>{r.home_name.split(' ')[0].toUpperCase()}</span>
              <span style={{ color: v4.textVeryDim, fontSize: 10 }}>vs</span>
              <span style={{ color: v4.text, fontFamily: mono, fontSize: 11, fontWeight: 700 }}>{r.away_name.split(' ')[0].toUpperCase()}</span>
              <span style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, marginLeft: 4 }}>{r.win_pct.toFixed(0)}%</span>
            </div>
            <div style={{ background: 'rgba(0,255,135,0.08)', color: v4.electric, padding: '3px 8px', borderRadius: 8, fontFamily: mono, fontSize: 11, fontWeight: 700 }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function WidgetBracket() {
  const [teams, setTeams] = React.useState(null);

  React.useEffect(() => {
    getSimulation()
      .then(data => {
        const sorted = [...data.teams]
          .filter(t => t.win_pct > 0)
          .sort((a, b) => b.win_pct - a.win_pct)
          .slice(0, 5)
          .map(t => ({ name: t.team, win: parseFloat(t.win_pct.toFixed(1)), color: _TEAM_COLORS[t.team] || '#7B2EE3' }));
        setTeams(sorted);
      })
      .catch(() => {});
  }, []);

  if (!teams) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }} />
            <div style={{ width: 80, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }} />
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 999 }} />
            <div style={{ width: 32, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {teams.map((t, i) => (
        <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, color: v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
          <span style={{
            width: 76, color: i === 0 ? v4.text : v4.textDim,
            fontFamily: display, fontSize: 12, fontWeight: i === 0 ? 700 : 400,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0,
          }}>{t.name}</span>
          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(t.win * 5, 100)}%`, height: '100%', background: t.color, borderRadius: 4, opacity: i === 0 ? 1 : 0.65 }} />
          </div>
          <span style={{
            width: 44, textAlign: 'right', fontFamily: mono, fontSize: 11, fontWeight: 700, flexShrink: 0,
            color: i === 0 ? v4.electric : v4.textDim,
          }}>{t.win}%</span>
        </div>
      ))}
      <div style={{ marginTop: 2, fontSize: 10, color: v4.textVeryDim, fontFamily: mono }}>
        % chance to win WC 2026 · 50K sims
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
            Built on a proven forecasting engine.
          </h2>
          <p style={{ color: v4.textDim, fontSize: 15, lineHeight: 1.5, marginTop: 16, maxWidth: 420 }}>
            Our Dixon-Coles model outperformed FPL's own forecasts in six consecutive gameweeks last season — the same engine now predicts every WC 2026 fixture.
          </p>
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
  const mobile = useIsMobile();
  return (
    <div style={{ padding: mobile ? '80px 20px' : '120px 56px', position: 'relative', overflow: 'hidden', borderTop: `1px solid ${v4.border}` }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 65%, rgba(123,46,227,0.22), transparent 52%)' }} />
      <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ color: v4.electric, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 20 }}>WC 2026 · GROUP STAGE UNDERWAY</div>
        <h2 style={{ color: v4.text, fontSize: mobile ? 48 : 72, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.95, margin: 0, fontFamily: display }}>
          Follow every<br/>call live.
        </h2>
        <p style={{ color: v4.textDim, fontSize: 16, marginTop: 20, marginBottom: 40, lineHeight: 1.5 }}>
          Match predictions, squad picks, and bracket updates — every matchday on TikTok and YouTube.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {SOCIALS.map(s => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${v4.border}`,
              borderRadius: 12, padding: '12px 20px',
              color: v4.text, textDecoration: 'none', fontFamily: display, fontSize: 14, fontWeight: 600,
              transition: 'border-color 140ms ease',
            }}>
              <span style={{ color: v4.electric }}>{s.icon}</span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <span>{s.name}</span>
                <span style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10 }}>{s.handle}</span>
              </span>
            </a>
          ))}
        </div>
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

// ── FPL Section ───────────────────────────────────────────────────
function V4FPLSection() {
  const mobile = useIsMobile();
  const tools = [
    { icon: '⚡', title: 'GW Predictions',    body: 'Points projections for every Premier League player, every gameweek.' },
    { icon: '©',  title: 'Captain Picks',      body: 'Top captain options ranked by expected points for your squad.' },
    { icon: '↔',  title: 'Transfer Optimizer', body: 'Best transfers for your specific squad and remaining budget.' },
    { icon: '📊', title: 'Fixture Ticker',     body: 'Colour-coded difficulty ratings for the next 8 gameweeks.' },
  ];
  return (
    <div style={{ padding: mobile ? '64px 20px' : '100px 56px', background: v4.bg2, borderTop: `1px solid ${v4.border}` }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span style={{ color: v4.electric, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono }}>Fantasy Premier League</span>
            <span style={{ background: 'rgba(255,176,32,0.15)', color: v4.amber, fontFamily: mono, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, letterSpacing: '0.08em' }}>AUG 2026</span>
          </div>
          <h2 style={{ color: v4.text, fontSize: mobile ? 32 : 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, fontFamily: display }}>
            FPL tools, powered<br/>by the same model.
          </h2>
          <p style={{ color: v4.textDim, fontSize: 15, lineHeight: 1.55, marginTop: 14, maxWidth: 520 }}>
            The 2026/27 Premier League season starts in August. The Dixon-Coles engine powering WC predictions will drive weekly FPL recommendations — captains, transfers, and fixture analysis.
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 16 }}>
            {tools.map(t => (
              <div key={t.title} style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: `1px solid ${v4.border}`, borderRadius: 14, padding: 24,
                opacity: 0.5,
              }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{t.icon}</div>
                <div style={{ color: v4.text, fontSize: 16, fontWeight: 700, fontFamily: display, marginBottom: 6 }}>{t.title}</div>
                <div style={{ color: v4.textDim, fontSize: 13, lineHeight: 1.5 }}>{t.body}</div>
              </div>
            ))}
          </div>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(13,1,24,0.55)', backdropFilter: 'blur(1.5px)', borderRadius: 14,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: v4.amber, fontFamily: mono, fontSize: 14, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Coming August 2026</div>
              <div style={{ color: v4.textDim, fontFamily: display, fontSize: 14, marginTop: 8 }}>Launching with the new Premier League season</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── About / Methodology ──────────────────────────────────────────
function V4About() {
  const mobile = useIsMobile();
  const items = [
    {
      title: 'Dixon-Coles Poisson model',
      body: 'At the core is a Dixon-Coles model — the statistical standard for football prediction. It estimates each team\'s attack strength and defensive weakness from a weighted blend of WC 2018, WC 2022, and 2,000+ recent international results. A low-score tau correction improves accuracy on 0-0, 1-0, 0-1, and 1-1 scorelines, which a naïve Poisson model under-predicts.',
    },
    {
      title: 'ELO ratings + form adjustments',
      body: 'Alongside the DC model, ELO ratings are computed from the same match history, capturing momentum across time. Form adjustments then compare each team\'s actual goals scored and conceded in their last 8 matches against the DC baseline — if a team is consistently outperforming expectations, the model boosts their attack rating accordingly.',
    },
    {
      title: '50,000 Monte Carlo simulations',
      body: 'The tournament simulation draws 50,000 independent runs of the full World Cup — all 72 group-stage games, the Round of 32, Quarter-Finals, Semi-Finals, and Final. Group-stage results that have already been played are pinned to the actual result. The win probability shown for each team is simply how often they lift the trophy across those 50,000 paths.',
    },
    {
      title: 'Live retraining',
      body: 'After each matchday, the model is retrained using the actual WC 2026 results, which carry a 4× weight over the historical WC data. This means team strength estimates shift as the tournament progresses — a team that outperforms expectations in the group stage will be rated higher heading into the knockouts.',
    },
  ];
  return (
    <div id="about" style={{ padding: mobile ? '64px 20px' : '100px 56px', borderTop: `1px solid ${v4.border}`, background: v4.bg2 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ color: v4.electric, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>how the model works</div>
          <h2 style={{ color: v4.text, fontSize: mobile ? 32 : 48, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0, fontFamily: display }}>
            Built on football analytics,<br/>tuned to WC 2026.
          </h2>
          <p style={{ color: v4.textDim, fontSize: 16, marginTop: 16, maxWidth: 620, lineHeight: 1.6 }}>
            TheModelSays uses a Dixon-Coles Poisson model, the same statistical framework used in academic football research and professional betting markets. Here is how it works.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 20 }}>
          {items.map(({ title, body }) => (
            <div key={title} style={{
              background: v4.surface, border: `1px solid ${v4.border}`,
              borderRadius: 14, padding: 28,
            }}>
              <div style={{ color: v4.electric, fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>methodology</div>
              <h3 style={{ color: v4.text, fontFamily: display, fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
              <p style={{ color: v4.textDim, fontSize: 14, lineHeight: 1.65, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, padding: '22px 28px', background: 'rgba(0,255,135,0.04)', border: `1px solid rgba(0,255,135,0.14)`, borderRadius: 14 }}>
          <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>about the project</div>
          <p style={{ color: v4.textDim, fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            TheModelSays is an independent, free-to-use football prediction tool built for the 2026 FIFA World Cup.
            It is not affiliated with FIFA, any football association, or any official WC 2026 product.
            All predictions are generated by a statistical model and are provided for informational and entertainment purposes only.
            Follow updates on <a href="https://www.tiktok.com/@themodel.says" target="_blank" rel="noopener noreferrer" style={{ color: v4.electric }}>TikTok</a> and{' '}
            <a href="https://www.youtube.com/@themodelsays" target="_blank" rel="noopener noreferrer" style={{ color: v4.electric }}>YouTube</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────
const _FOOTER_LINKS = {
  'World Cup 2026':    { scroll: 'home' },
  'Score Predictor':   { scroll: 'predictor' },
  'Bracket Builder':   { scroll: 'bracket' },
  'Fantasy Squad':     { scroll: 'fantasy' },
  'Match Predictions': { scroll: 'predictor' },
  'FPL (Aug 2026)':   { scroll: 'fpl' },
  'Track record':      { scroll: 'accuracy' },
  'How it works':      { scroll: 'about' },
  'Updates':           { href: 'https://www.tiktok.com/@themodel.says', external: true },
  'Contact':           { scroll: 'cta' },
  'Privacy Policy':    { href: '/privacy', external: false },
};

function FooterLink({ label }) {
  const link = _FOOTER_LINKS[label];
  const linkStyle = { color: v4.textDim, fontSize: 14, textDecoration: 'none', cursor: link ? 'pointer' : 'default', fontFamily: display };
  if (!link) return <span style={linkStyle}>{label}</span>;
  if (link.scroll) {
    function handleScroll(e) {
      e.preventDefault();
      if (link.scroll === 'home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      document.getElementById(link.scroll)?.scrollIntoView({ behavior: 'smooth' });
    }
    return <a href={`#${link.scroll}`} onClick={handleScroll} style={linkStyle}>{label}</a>;
  }
  return <a href={link.href} target={link.external ? '_blank' : undefined} rel={link.external ? 'noopener noreferrer' : undefined} style={linkStyle}>{label}</a>;
}

function V4Footer() {
  const mobile = useIsMobile();
  const cols = [
    ['App',   ['World Cup 2026', 'Score Predictor', 'Bracket Builder', 'Fantasy Squad', 'FPL (Aug 2026)']],
    ['About', ['How it works', 'Track record', 'Updates', 'Contact', 'Privacy Policy']],
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
                {items.map(it => <FooterLink key={it} label={it} />)}
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
          <span style={{ display: 'flex', gap: 16 }}>
            <a href="/privacy" style={{ color: v4.textVeryDim, textDecoration: 'none', fontFamily: mono, fontSize: 11 }}>PRIVACY POLICY</a>
            <span>OPEN BETA · v0.5</span>
          </span>
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
      <div id="home"><V4Hero /></div>
      <V4Marquee />
      <V4MiniLeagueBanner />
      <div id="bracket"><TournamentBracket /></div>
      <div id="groups"><GroupStandings /></div>
      <div id="predictor"><WorldCupPredictor /></div>
      <div id="fantasy"><WCFantasySection /></div>
      <div id="fpl"><V4FPLSection /></div>
      <V4Features />
      <div id="accuracy"><V4Accuracy /></div>
      <V4About />
      <V4Quote />
      <div id="cta"><V4CTA /></div>
      <V4Footer />
    </div>
  );
}

export default LandingV4Final;
