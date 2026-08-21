import React from 'react';
import { fpl, subscribeEmail } from '../lib/api.js';
import { FPLSeasonPanel, ReceiptFlow } from './FPLLive.jsx';
import { ProjectionsPanel } from './ProjectionsPanel.jsx';
import { ToolsPanel } from './ToolsPanel.jsx';

// WCFantasySection, GroupStandings, WorldCupPredictor removed — WC2026 complete.
// See /wc2026-record for the full archive.

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
    @media (max-width: 768px) {
      .tms-hero-grid   { grid-template-columns: 1fr !important; }
      .tms-feat-grid   { grid-template-columns: 1fr !important; }
      .tms-acc-grid    { grid-template-columns: 1fr !important; }
      .tms-hide-mobile { display: none !important; }
    }
  `;
  document.head.appendChild(s);
}

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
            { label: 'FPL Tools',    anchor: 'fpl'         },
            { label: 'FPL Guide',    href: '/fpl-preview'  },
            { label: 'WC Record',    href: '/wc2026-record' },
            { label: 'How it works', href: '/methodology'  },
          ].map(({ label, anchor, href }) => (
            anchor
              ? <a key={label} href={`#${anchor}`}
                   onClick={e => { e.preventDefault(); scrollTo(anchor); }}
                   style={{ color: v4.textDim, fontSize: 14, fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }}>
                  {label}
                </a>
              : <a key={label} href={href}
                   style={{ color: v4.textDim, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                  {label}
                </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hero right panel: live captain preview from GW tools ─────────────
function WidgetFPLCaptain({ onDeadline }) {
  const [captains, setCaptains] = React.useState(null);
  const [gameweek, setGameweek] = React.useState(null);
  const [err, setErr] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => { if (!cancelled) setErr(true); }, 10_000);
    fpl.season()
      .then(s => {
        const nextGw = s.gameweeks?.length
          ? s.gameweeks[s.gameweeks.length - 1].gameweek + 1
          : 1;
        return fpl.tools(nextGw);
      })
      .then(data => {
        if (cancelled) return;
        clearTimeout(timer);
        setCaptains((data.captain || []).slice(0, 5));
        setGameweek(data.gameweek);
        if (onDeadline && data.deadline_utc) onDeadline(data.gameweek, data.deadline_utc);
      })
      .catch(() => { if (!cancelled) setErr(true); });
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const loading = captains === null && !err;
  const rows = captains || [];

  return (
    <div style={{
      position: 'relative', borderRadius: 14, overflow: 'hidden',
      background: 'linear-gradient(170deg, rgba(0,255,135,0.06) 0%, rgba(0,0,0,0.4) 100%)',
      border: `1px solid ${v4.border}`,
      boxShadow: '0 30px 80px -20px rgba(0,0,0,0.6)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          CAPTAIN SHORTLIST · GW{gameweek || '1'}
        </span>
        <span style={{
          color: v4.electric, fontFamily: mono, fontSize: 9, fontWeight: 700,
          background: 'rgba(0,255,135,0.08)', padding: '3px 8px', borderRadius: 6,
        }}>DC MODEL</span>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1, minHeight: 196 }}>
        {err
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: v4.textVeryDim, fontFamily: mono, fontSize: 11 }}>
              Captain picks committed in the repo
            </div>
          : loading
          ? Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 16, color: v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 700, textAlign: 'right' }}>{i + 1}</span>
                <div style={{ width: 100, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
                <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 999 }} />
                <div style={{ width: 44, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
              </div>
            ))
          : rows.map((p, i) => {
              const maxDelta = rows[0]?.captain_delta || 1;
              return (
                <div key={p.player_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, color: v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{
                    width: 96, color: i === 0 ? v4.text : v4.textDim,
                    fontFamily: display, fontSize: 12, fontWeight: i === 0 ? 700 : 400,
                    flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{p.name}</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(p.captain_delta / maxDelta) * 100}%`, height: '100%', background: v4.electric, borderRadius: 4, opacity: i === 0 ? 1 : 0.5 }} />
                  </div>
                  <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: i === 0 ? v4.electric : v4.textDim, minWidth: 48, textAlign: 'right' }}>
                    +{p.captain_delta?.toFixed(1)}
                  </span>
                </div>
              );
            })
        }
      </div>

      {!loading && !err && rows[0] && (
        <div style={{ margin: '0 14px 14px', padding: '12px 14px', background: 'rgba(0,255,135,0.06)', border: `1px solid rgba(0,255,135,0.18)`, borderRadius: 10 }}>
          <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Top captain pick</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: v4.text, fontFamily: display, fontSize: 15, fontWeight: 700 }}>{rows[0].name}</span>
            <span style={{ color: v4.electric, fontFamily: mono, fontSize: 13, fontWeight: 800, background: 'rgba(0,0,0,0.45)', padding: '3px 9px', borderRadius: 6 }}>
              +{rows[0].captain_delta?.toFixed(1)} xPts
            </span>
          </div>
          <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 9, marginTop: 4 }}>
            {rows[0].team}{rows[0].opponent ? ` · ${rows[0].venue === 'H' ? 'vs' : '@'} ${rows[0].opponent}` : ''} · doubling gain
          </div>
        </div>
      )}
    </div>
  );
}

const MINI_LEAGUE_CODE = 'tj22cy';

// ── Hero — FPL 2026/27 ────────────────────────────────────────────────
const FPL_SAYINGS = [
  "Captain the fixture.",
  "Trust the projection.",
  "The squad is locked.",
  "Projections. Not hunches.",
];

const HERO_FEATURES = [
  { label: 'Player projections', anchor: 'fpl', desc: 'xPts for every player' },
  { label: 'Captain picks',      anchor: 'fpl', desc: 'Safe · balanced · differential' },
  { label: 'Optimal XI',         anchor: 'fpl', desc: 'Best 11 within FPL rules' },
  { label: 'Model squad',        anchor: 'fpl', desc: 'Committed before deadline' },
  { label: 'Beat the Model',     anchor: 'fpl', desc: 'Your GW receipt vs ours' },
];

function V4Hero() {
  const [i, setI] = React.useState(0);
  const [badge, setBadge] = React.useState('FPL 2026/27 · SEASON LIVE');
  const [ctaGw, setCtaGw] = React.useState(null);
  const mobile = useIsMobile();

  React.useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % FPL_SAYINGS.length), 2800);
    return () => clearInterval(t);
  }, []);

  function handleDeadline(gw, deadlineUtc) {
    setCtaGw(gw);
    const d = new Date(deadlineUtc);
    const now = new Date();
    if (d > now) {
      const opts = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false };
      setBadge(`FPL 2026/27 · GW${gw} DEADLINE ${d.toLocaleDateString('en-GB', opts).toUpperCase()} UTC`);
    } else {
      setBadge(`FPL 2026/27 · GW${gw} LIVE`);
    }
  }

  function scrollTo(anchor) {
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 60%, rgba(0,255,135,0.12), transparent 55%)' }} />

      <div
        className="tms-hero-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : '1.05fr 1fr',
          gap: mobile ? 32 : 48,
          position: 'relative',
          padding: mobile ? '64px 20px 52px' : '100px 56px 80px',
        }}
      >
        {/* left */}
        <div>
          {/* Live deadline badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 12px 5px 8px', borderRadius: 999,
            background: 'rgba(0,255,135,0.08)', border: `1px solid rgba(0,255,135,0.2)`,
            fontSize: 12, color: v4.electric, marginBottom: 28,
            fontFamily: mono, fontWeight: 600, letterSpacing: '0.04em',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: v4.electric, flexShrink: 0, animation: 'tmsPulse 2s ease infinite' }} />
            {badge}
          </div>

          {/* Primary headline — FPL first */}
          <h1 style={{
            color: v4.text,
            fontSize: mobile ? 48 : 80,
            fontWeight: 700, letterSpacing: '-0.04em',
            lineHeight: 0.96, margin: 0, fontFamily: display,
          }}>
            FPL predictions.<br />
            <span style={{
              background: `linear-gradient(120deg, ${v4.electric} 0%, #00e8c8 70%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>On the record.</span>
          </h1>

          {/* Rotating FPL-specific sayings */}
          <div style={{ marginTop: 20, height: 40, position: 'relative', overflow: 'hidden' }}>
            <span key={i} style={{
              display: 'inline-block', fontFamily: mono, fontWeight: 600,
              fontSize: mobile ? 14 : 15, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: v4.textDim,
              animation: 'tmsFade 2.8s ease infinite',
            }}>
              {FPL_SAYINGS[i]}
            </span>
          </div>

          {/* Honest sub-copy — what the site does, no overclaiming */}
          <p style={{ color: v4.textDim, fontSize: mobile ? 15 : 17, lineHeight: 1.6, marginTop: 16, maxWidth: 520, fontWeight: 400 }}>
            Model estimates — not guarantees — for every FPL player. Captain picks with reasoning.
            A 15-man squad committed before each deadline and graded in public, including the bad weeks.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
            <a
              href="#fpl"
              onClick={e => { e.preventDefault(); scrollTo('fpl'); }}
              style={{
                padding: '13px 28px', borderRadius: 999,
                background: v4.electric, color: v4.bg,
                fontFamily: display, fontSize: 14, fontWeight: 700,
                textDecoration: 'none', letterSpacing: '-0.01em',
              }}>
              See GW{ctaGw || 1} tools
            </a>
            <a
              href="/methodology"
              style={{
                padding: '13px 28px', borderRadius: 999,
                background: 'rgba(255,255,255,0.05)', color: v4.text,
                border: `1px solid ${v4.border}`,
                fontFamily: display, fontSize: 14, fontWeight: 600,
                textDecoration: 'none',
              }}>
              How it works
            </a>
          </div>

          {/* Feature navigation strip */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28,
          }}>
            {HERO_FEATURES.map(f => (
              <a
                key={f.label}
                href={`#${f.anchor}`}
                onClick={e => { e.preventDefault(); scrollTo(f.anchor); }}
                title={f.desc}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${v4.border}`,
                  color: v4.textDim, fontFamily: mono, fontSize: 11,
                  fontWeight: 600, letterSpacing: '0.04em',
                  textDecoration: 'none', cursor: 'pointer',
                  transition: 'border-color 160ms, color 160ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,255,135,0.4)'; e.currentTarget.style.color = v4.electric; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = v4.border; e.currentTarget.style.color = v4.textDim; }}
              >
                {f.label}
              </a>
            ))}
          </div>
        </div>

        {/* right — live captain preview */}
        <WidgetFPLCaptain onDeadline={handleDeadline} />
      </div>
    </div>
  );
}

// ── Mini League ───────────────────────────────────────────────────
function V4MiniLeague() {
  const mobile = useIsMobile();
  const [copied, setCopied] = React.useState(false);

  function copyCode() {
    navigator.clipboard?.writeText(MINI_LEAGUE_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, rgba(0,255,135,0.08) 0%, rgba(13,1,24,0) 60%)',
      borderTop: `1px solid rgba(0,255,135,0.25)`,
      borderBottom: `1px solid rgba(0,255,135,0.12)`,
      padding: mobile ? '52px 20px' : '72px 56px',
    }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: -80, left: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,135,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
          gap: mobile ? 36 : 64,
          alignItems: 'center',
        }}>
          {/* Left: copy */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,255,135,0.1)', border: `1px solid rgba(0,255,135,0.3)`,
              borderRadius: 999, padding: '4px 14px', marginBottom: 20,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: v4.electric, animation: 'tmsPulse 2s ease infinite' }} />
              <span style={{ color: v4.electric, fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>FPL Mini League 2026/27</span>
            </div>

            <h2 style={{
              color: v4.text, fontFamily: display,
              fontSize: mobile ? 36 : 54,
              fontWeight: 700, letterSpacing: '-0.035em',
              lineHeight: 1.05, margin: '0 0 16px',
            }}>
              Beat the Model.<br />
              <span style={{ color: v4.electric }}>One season.</span>
            </h2>

            <p style={{ color: v4.textDim, fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: '0 0 32px' }}>
              The model's squad is committed before every deadline. Track it head-to-head against yours — and everyone else who joins — over the full 38 gameweeks.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Join code
              </div>

              {/* Big code display */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                background: 'rgba(0,0,0,0.5)',
                border: `2px solid rgba(0,255,135,0.4)`,
                borderRadius: 14, overflow: 'hidden',
                maxWidth: 380,
              }}>
                <span style={{
                  flex: 1,
                  fontFamily: mono, fontSize: mobile ? 40 : 52, fontWeight: 800,
                  color: v4.electric, letterSpacing: '0.15em',
                  padding: mobile ? '16px 20px' : '18px 28px',
                  textTransform: 'uppercase',
                }}>{MINI_LEAGUE_CODE}</span>
                <button
                  onClick={copyCode}
                  style={{
                    background: copied ? 'rgba(0,255,135,0.2)' : 'rgba(0,255,135,0.08)',
                    border: 'none', borderLeft: `1px solid rgba(0,255,135,0.25)`,
                    color: copied ? v4.electric : v4.textDim,
                    fontFamily: mono, fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '0 20px', cursor: 'pointer',
                    alignSelf: 'stretch', transition: 'all 160ms ease',
                    whiteSpace: 'nowrap',
                  }}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              <p style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                FPL app → Leagues → Join a league → enter code above
              </p>
            </div>
          </div>

          {/* Right: how it works */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { n: '01', title: 'Model locks first', body: 'Squad published before every deadline, git-timestamped. The model can\'t change its picks after seeing your team.' },
              { n: '02', title: 'Same rules as you', body: '£100m budget, 3 per club, real FPL transfers and hits. No oracle. No hindsight. Just the model playing the game.' },
              { n: '03', title: 'Full season on the record', body: '38 gameweeks, every score graded in public on this site. The model\'s results are live the moment FPL publishes them.' },
            ].map(({ n, title, body }) => (
              <div key={n} style={{
                display: 'flex', gap: 16,
                padding: '18px 20px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${v4.border}`,
                borderRadius: 12,
              }}>
                <span style={{
                  fontFamily: mono, fontSize: 12, fontWeight: 800,
                  color: v4.electric, minWidth: 24, paddingTop: 2,
                }}>{n}</span>
                <div>
                  <div style={{ color: v4.text, fontFamily: display, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{title}</div>
                  <div style={{ color: v4.textDim, fontSize: 13, lineHeight: 1.55 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Email capture ─────────────────────────────────────────────────
function V4EmailCapture() {
  const mobile = useIsMobile();
  const [email, setEmail] = React.useState('');
  const [state, setState] = React.useState('idle'); // idle | busy | done | error

  async function submit(e) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setState('busy');
    try {
      await subscribeEmail(email);
      setState('done');
    } catch {
      setState('error');
    }
  }

  return (
    <div style={{
      borderTop: `1px solid ${v4.border}`,
      borderBottom: `1px solid ${v4.border}`,
      background: v4.bg,
      padding: mobile ? '36px 20px' : '44px 56px',
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: v4.text, fontFamily: display, fontSize: mobile ? 18 : 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Get notified when the squad locks.
          </div>
          <div style={{ color: v4.textDim, fontFamily: mono, fontSize: 12 }}>
            One email per gameweek, ~10 hours before each deadline. No spam.
          </div>
        </div>

        {state === 'done' ? (
          <div style={{
            padding: '12px 24px', borderRadius: 10,
            background: 'rgba(0,255,135,0.1)', border: `1px solid rgba(0,255,135,0.3)`,
            color: v4.electric, fontFamily: mono, fontSize: 13, fontWeight: 700,
          }}>
            ✓ You're on the list
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${state === 'error' ? 'rgba(255,176,32,0.5)' : v4.border}`,
                borderRadius: 10, padding: '11px 16px',
                color: v4.text, fontFamily: mono, fontSize: 13,
                outline: 'none', width: 220,
              }}
            />
            <button type="submit" disabled={state === 'busy'} style={{
              padding: '11px 24px', borderRadius: 10,
              background: state === 'busy' ? 'rgba(0,255,135,0.4)' : v4.electric,
              color: v4.bg, border: 'none',
              fontFamily: display, fontWeight: 700, fontSize: 14,
              cursor: state === 'busy' ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
            }}>
              {state === 'busy' ? 'Subscribing…' : 'Notify me'}
            </button>
          </form>
        )}

        {state === 'error' && (
          <div style={{ color: v4.amber, fontFamily: mono, fontSize: 12, width: '100%' }}>
            Something went wrong — try again in a moment.
          </div>
        )}
      </div>
    </div>
  );
}

// ── FPL Section ───────────────────────────────────────────────────
function V4FPLSection() {
  const mobile = useIsMobile();
  return (
    <div style={{ padding: mobile ? '64px 20px' : '100px 56px', background: v4.bg2, borderTop: `1px solid ${v4.border}` }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span style={{ color: v4.electric, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono }}>Fantasy Premier League</span>
            <span style={{ background: 'rgba(0,255,135,0.12)', color: v4.electric, fontFamily: mono, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, letterSpacing: '0.08em' }}>SEASON LIVE</span>
          </div>
          <h2 style={{ color: v4.text, fontSize: mobile ? 32 : 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, fontFamily: display }}>
            The model's FPL tools.
          </h2>
          <p style={{ color: v4.textDim, fontSize: 15, lineHeight: 1.55, marginTop: 14, maxWidth: 560 }}>
            Player projections, captain shortlist, optimal XI, fixture ticker — model estimates updated before each deadline.
            All projections are labelled as such: the model has uncertainty and will be wrong sometimes.
            That's why every decision is committed to the public repo before you can see it.
          </p>
        </div>
        <ToolsPanel />
        <div style={{ marginTop: 20 }}>
          <ProjectionsPanel />
        </div>
        <div style={{ marginTop: 20 }}>
          <FPLSeasonPanel />
        </div>
        <div style={{ marginTop: 20 }}>
          <ReceiptFlow />
        </div>
        <div style={{ marginTop: 28, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://www.tiktok.com/@themodel.says" target="_blank" rel="noopener noreferrer" style={{
            padding: '11px 24px', background: 'rgba(0,255,135,0.1)', border: `1px solid rgba(0,255,135,0.28)`,
            borderRadius: 999, color: v4.electric, fontFamily: mono, fontSize: 12, fontWeight: 700,
            letterSpacing: '0.06em', textDecoration: 'none', textTransform: 'uppercase',
          }}>Follow for weekly picks</a>
        </div>
      </div>
    </div>
  );
}

// ── UCL Section Stub ─────────────────────────────────────────────
function V4UCLStub() {
  const mobile = useIsMobile();
  return (
    <div style={{ padding: mobile ? '56px 20px' : '80px 56px', borderTop: `1px solid ${v4.border}` }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ color: v4.purple, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono }}>Champions League</span>
          <span style={{ background: 'rgba(123,46,227,0.15)', color: v4.purple, fontFamily: mono, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, letterSpacing: '0.08em' }}>COMING SEP 2026</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>
          {[
            { event: 'League phase draw',   date: 'Late August 2026',    note: 'Group seedings confirmed' },
            { event: 'MD1 predictions',     date: 'Mid-September 2026',  note: 'DC model trained on UCL history' },
            { event: 'Bracket simulation',  date: 'After league phase',  note: 'Play-off draw → full win probabilities' },
          ].map(({ event, date, note }) => (
            <div key={event} style={{
              background: v4.surface, border: `1px solid ${v4.border}`, borderRadius: 14, padding: 22,
            }}>
              <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                {event}
              </div>
              <div style={{ color: v4.text, fontFamily: display, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{date}</div>
              <div style={{ color: v4.textDim, fontSize: 13 }}>{note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── WC 2026 Archive Strip ─────────────────────────────────────────
// Numbers from the committed wc-fantasy record — not typed from memory.
function V4WCArchive() {
  const mobile = useIsMobile();
  const stats = [
    { n: '727',   label: 'Fantasy pts',  sub: '#10,600 worldwide · 8 GWs' },
    { n: '67%',   label: 'Spain to win', sub: 'Backed from group stage · called it' },
    { n: '104',   label: 'Matches',      sub: 'All predicted on the record' },
    { n: '59.6%', label: 'W/D/L rate',   sub: 'Across all 104 WC predictions' },
  ];
  return (
    <div style={{
      padding: mobile ? '48px 20px' : '64px 56px',
      background: v4.bg2, borderTop: `1px solid ${v4.border}`,
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        {/* Bridge copy — connect WC credibility to FPL offering */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Why trust it?
          </div>
          <p style={{ color: v4.textDim, fontSize: mobile ? 14 : 16, lineHeight: 1.6, maxWidth: 620, margin: 0 }}>
            The same Dixon-Coles model — the same commitment to transparent, pre-deadline forecasts — now
            runs for FPL. Here's what it did when every prediction was already on the record:
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              WC 2026 · COMPLETE
            </div>
            <div style={{ color: v4.textDim, fontFamily: display, fontSize: mobile ? 20 : 24, fontWeight: 700 }}>
              Spain. 1–0 AET. The model called it.
            </div>
          </div>
          <a href="/wc2026-record" style={{
            padding: '10px 22px', borderRadius: 999,
            border: `1px solid ${v4.border}`, color: v4.textDim,
            fontFamily: display, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>Full record →</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 12 }}>
          {stats.map(({ n, label, sub }) => (
            <div key={label} style={{
              background: v4.surface, border: `1px solid ${v4.border}`,
              borderRadius: 12, padding: '18px 20px',
            }}>
              <div style={{ color: v4.text, fontFamily: display, fontSize: mobile ? 28 : 34, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>{n}</div>
              <div style={{ color: v4.electric, fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 6 }}>{label}</div>
              <div style={{ color: v4.textVeryDim, fontSize: 11, fontFamily: mono, marginTop: 3 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Track record ──────────────────────────────────────────────────
function V4Accuracy() {
  const mobile = useIsMobile();
  const models = [
    { name: 'Dixon-Coles', label: 'The model', result: 'Winner', note: 'Best overall accuracy + top-pick accuracy', highlight: true },
    { name: 'Gradient-boosted ML', label: 'LightGBM', result: '2nd', note: 'Statistically indistinguishable from the baseline', highlight: false },
    { name: 'Naive baseline', label: 'Recent form', result: '3rd', note: 'Prior-season rates with no fixture adjustment', highlight: false },
  ];
  return (
    <div style={{ padding: mobile ? '64px 20px' : '100px 56px', background: v4.bg2, borderTop: `1px solid ${v4.border}`, borderBottom: `1px solid ${v4.border}` }}>
      <div className="tms-acc-grid" style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1.2fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ color: v4.electric, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>track record</div>
          <h2 style={{ color: v4.text, fontSize: mobile ? 36 : 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, fontFamily: display }}>
            Built on a proven forecasting engine.
          </h2>
          <p style={{ color: v4.textDim, fontSize: 15, lineHeight: 1.5, marginTop: 16, maxWidth: 420 }}>
            We tested three models on GWs 29–34 of 2025/26 — weeks no model trained on. The Dixon-Coles projection won. The ML model performed no better than a naive baseline on an honest out-of-sample test, so we didn't ship it. The same engine ran all 104 WC2026 fixtures and now runs FPL 2026/27.
          </p>
        </div>

        <div style={{ background: v4.surface, border: `1px solid ${v4.border}`, borderRadius: 14, padding: 28 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>held-out evaluation · GW29–34 · 2025/26</div>
            <div style={{ color: v4.text, fontFamily: display, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Three models, one honest test</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {models.map(m => (
              <div key={m.name} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: m.highlight ? 'rgba(0,255,135,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${m.highlight ? 'rgba(0,255,135,0.2)' : v4.border}`,
                borderRadius: 10,
              }}>
                <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: m.highlight ? v4.electric : v4.textVeryDim, minWidth: 48 }}>{m.result}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: m.highlight ? v4.text : v4.textDim, fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                  <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, marginTop: 2 }}>{m.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Methodology ──────────────────────────────────────────────────
function V4About() {
  const mobile = useIsMobile();
  const items = [
    {
      title: 'Dixon-Coles Poisson model',
      body: 'At the core is a Dixon-Coles model — the statistical standard for football prediction. It estimates each team\'s attack strength and defensive weakness from weighted historical fixtures. A low-score tau correction improves accuracy on 0-0, 1-0, 0-1, and 1-1 scorelines, which a naïve Poisson model under-predicts.',
    },
    {
      title: 'FPL-specific feature engineering',
      body: 'Player rates (goals, assists, clean sheets, xG, xA) are computed from rolling history. A cold-start path bootstraps from the prior season\'s archive when live history is thin — no player projects 0.0 in GW1. Positional priors handle promoted-side players and new signings.',
    },
    {
      title: '50,000 Monte Carlo simulations (WC) / per-fixture matrices (FPL)',
      body: 'The WC tournament simulation ran 50,000 bracket paths. For FPL, the DC matrix runs per fixture: scoreline probabilities convert to expected goals, assists, and clean-sheet rates per position — no black-box ML, every number traceable to the model.',
    },
    {
      title: 'Walk-forward retraining — tested and dropped',
      body: 'We retrained after each WC matchday, weighting 2026 results at 4×. It made things worse: the frozen pre-tournament model called 66.3% of outcomes correctly vs the retrained version\'s 59.6%. Walk-forward retraining is dropped. The same decision logic applies to FPL: refit only on sufficient held-out evidence.',
    },
  ];
  return (
    <div id="about" style={{ padding: mobile ? '64px 20px' : '100px 56px', borderTop: `1px solid ${v4.border}`, background: v4.bg2 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ color: v4.electric, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>how the model works</div>
          <h2 style={{ color: v4.text, fontSize: mobile ? 32 : 48, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0, fontFamily: display }}>
            Built on football analytics.
          </h2>
          <p style={{ color: v4.textDim, fontSize: 16, marginTop: 16, maxWidth: 620, lineHeight: 1.6 }}>
            TheModelSays uses a Dixon-Coles Poisson model — the same statistical framework used in academic football research and professional betting markets.
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
            TheModelSays is an independent, free-to-use football prediction tool. The WC2026 model is complete — 104 matches, all on the record at{' '}
            <a href="/wc2026-record" style={{ color: v4.electric }}>themodelsays.com/wc2026-record</a>.
            FPL 2026/27 is live. Not affiliated with FIFA or the Premier League. All predictions are generated by a statistical model for informational and entertainment purposes only.
            Follow on <a href="https://www.tiktok.com/@themodel.says" target="_blank" rel="noopener noreferrer" style={{ color: v4.electric }}>TikTok</a> and{' '}
            <a href="https://www.youtube.com/@themodelsays" target="_blank" rel="noopener noreferrer" style={{ color: v4.electric }}>YouTube</a>.
          </p>
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

// ── Footer ────────────────────────────────────────────────────────
const _FOOTER_LINKS = {
  'FPL Tools':     { scroll: 'fpl'        },
  'FPL Guide':     { href: '/fpl-preview', external: false },
  'How it works':  { href: '/methodology', external: false },
  'WC 2026 Record':{ href: '/wc2026-record', external: false },
  'Track record':  { scroll: 'accuracy'   },
  'Updates':       { href: 'https://www.tiktok.com/@themodel.says', external: true },
  'Privacy Policy':{ href: '/privacy',    external: false },
};

function FooterLink({ label }) {
  const link = _FOOTER_LINKS[label];
  const linkStyle = { color: v4.textDim, fontSize: 14, textDecoration: 'none', cursor: link ? 'pointer' : 'default', fontFamily: display };
  if (!link) return <span style={linkStyle}>{label}</span>;
  if (link.scroll) {
    function handleScroll(e) {
      e.preventDefault();
      document.getElementById(link.scroll)?.scrollIntoView({ behavior: 'smooth' });
    }
    return <a href={`#${link.scroll}`} onClick={handleScroll} style={linkStyle}>{label}</a>;
  }
  return <a href={link.href} target={link.external ? '_blank' : undefined} rel={link.external ? 'noopener noreferrer' : undefined} style={linkStyle}>{label}</a>;
}

function V4Footer() {
  const mobile = useIsMobile();
  const cols = [
    ['App',   ['FPL Tools', 'FPL Guide', 'How it works']],
    ['About', ['WC 2026 Record', 'Track record', 'Updates', 'Privacy Policy']],
  ];
  return (
    <div style={{ borderTop: `1px solid ${v4.border}`, padding: mobile ? '48px 20px 28px' : '72px 56px 36px', background: v4.bg }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 48 }}>
          <div style={{ gridColumn: mobile ? '1 / -1' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <TmsLogo />
              <TmsBrand />
            </div>
            <p style={{ color: v4.textDim, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Dixon-Coles predictions for FPL 2026/27. Every squad committed before the deadline. Every score graded in public.
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
            <span>OPEN BETA · v0.6</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
// Render order: live product leads; WC becomes a one-screen archive.
// 1. Nav  2. Hero (FPL-focused)  3. FPL section  4. UCL stub
// 5. WC archive strip  6. Track record  7. Methodology  8. Footer
function LandingV4Final() {
  return (
    <div style={{ background: v4.bg, color: v4.text, fontFamily: display, width: '100%', minHeight: '100%' }}>
      <V4Nav />
      <div id="home"><V4Hero /></div>
      <V4MiniLeague />
      <V4EmailCapture />
      <div id="fpl"><V4FPLSection /></div>
      <V4UCLStub />
      <V4WCArchive />
      <div id="accuracy"><V4Accuracy /></div>
      <V4About />
      <V4Footer />
    </div>
  );
}

export default LandingV4Final;
