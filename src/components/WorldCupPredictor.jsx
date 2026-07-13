import React from 'react';
import { fetchWcTeams, predictWorldCupMatch } from '../lib/api.js';

const v4 = {
  bg:          '#0d0118',
  bg2:         '#15032a',
  bg3:         '#1f0a3d',
  surface:     'rgba(255,255,255,0.03)',
  surfaceHi:   'rgba(255,255,255,0.06)',
  border:      'rgba(255,255,255,0.08)',
  borderHi:    'rgba(255,255,255,0.16)',
  text:        '#ffffff',
  textDim:     '#b9aed0',
  textVeryDim: '#796a93',
  electric:    '#00FF87',
  green:       '#02EFFF',
  pink:        '#FF2882',
  purple:      '#7B2EE3',
  amber:       '#FFB020',
  red:         '#ff5577',
};
const display = 'Space Grotesk, sans-serif';
const mono    = 'JetBrains Mono, monospace';

function SelectTeam({ value, onChange, teams, placeholder, disabled }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: '100%',
        background: v4.bg2,
        color: value ? v4.text : v4.textVeryDim,
        border: `1px solid ${v4.borderHi}`,
        borderRadius: 10,
        padding: '13px 16px',
        fontSize: 15,
        fontFamily: display,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23796a93' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
        outline: 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {teams.map(t => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
}

function ProbBar({ label, pct, color }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{ width: '100%', height: 6, background: v4.border, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 99,
          background: color,
          boxShadow: color === v4.electric ? `0 0 10px ${v4.electric}60` : 'none',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color }}>{pct.toFixed(0)}%</div>
      <div style={{ fontFamily: mono, fontSize: 10, color: v4.textVeryDim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function Spinner() {
  React.useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('wcp-spin')) {
      const s = document.createElement('style');
      s.id = 'wcp-spin';
      s.textContent = `@keyframes wcpSpin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(s);
    }
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '40px 0' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: `3px solid ${v4.border}`,
        borderTopColor: v4.electric,
        animation: 'wcpSpin 0.75s linear infinite',
      }} />
      <div style={{ color: v4.textDim, fontFamily: mono, fontSize: 12, letterSpacing: '0.08em' }}>RUNNING MODEL…</div>
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

const POS_COLOR = { GK: '#FFB020', DEF: '#02EFFF', MID: '#7B2EE3', FWD: '#FF2882' };

function FirstScorerSection({ result }) {
  if (!result || (!result.home_scorers?.length && !result.away_scorers?.length)) return null;

  const allScorers = [
    ...(result.home_scorers || []).map(s => ({ ...s, side: 'home' })),
    ...(result.away_scorers || []).map(s => ({ ...s, side: 'away' })),
  ].sort((a, b) => b.first_scorer_pct - a.first_scorer_pct).slice(0, 6);

  const homeName = result.home_name;
  const awayName = result.away_name;

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      border: `1px solid ${v4.border}`, borderRadius: 16, padding: '20px 24px',
      marginBottom: 16,
    }}>
      <div style={{ color: v4.textVeryDim, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>
        First to score
      </div>

      {/* First team to score */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { label: homeName, pct: result.home_first_pct ?? 0, color: v4.electric },
          { label: 'No goal', pct: result.no_goal_pct ?? 0, color: v4.textDim },
          { label: awayName, pct: result.away_first_pct ?? 0, color: v4.pink },
        ].map(({ label, pct, color }) => (
          <div key={label} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              height: 3, background: v4.border, borderRadius: 99, marginBottom: 6, overflow: 'hidden',
            }}>
              <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 99 }} />
            </div>
            <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color }}>{pct.toFixed(0)}%</div>
            <div style={{ fontFamily: mono, fontSize: 9, color: v4.textVeryDim, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Top first scorers */}
      {allScorers.length > 0 && (
        <>
          <div style={{ color: v4.textVeryDim, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 8 }}>
            Most likely first scorer
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {allScorers.map((s, i) => (
              <div key={`${s.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  background: `${POS_COLOR[s.pos] ?? v4.textDim}22`,
                  border: `1px solid ${POS_COLOR[s.pos] ?? v4.textDim}55`,
                  color: POS_COLOR[s.pos] ?? v4.textDim,
                  fontFamily: mono, fontSize: 8, fontWeight: 700,
                  letterSpacing: '0.08em', padding: '1px 5px', borderRadius: 3,
                  textTransform: 'uppercase', flexShrink: 0,
                }}>{s.pos}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: display, fontSize: 12, fontWeight: 600, color: i === 0 ? v4.text : v4.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{s.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div style={{ width: 60, height: 3, background: v4.border, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, s.first_scorer_pct * 5)}%`, height: '100%', background: s.side === 'home' ? v4.electric : v4.pink, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: i === 0 ? (s.side === 'home' ? v4.electric : v4.pink) : v4.textDim, minWidth: 36, textAlign: 'right' }}>
                    {s.first_scorer_pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function WorldCupPredictor() {
  const isMobile = useIsMobile();
  const [teams,  setTeams]  = React.useState([]);
  const [home,   setHome]   = React.useState('');
  const [away,   setAway]   = React.useState('');
  const [status, setStatus] = React.useState('idle');   // idle | loading | success | error
  const [result, setResult] = React.useState(null);
  const [errMsg, setErrMsg] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    fetchWcTeams()
      .then(d => setTeams(d.teams))
      .catch(() => {});
  }, []);

  const canPredict = home && away && home !== away && status !== 'loading';

  function handleShare() {
    if (!result) return;
    const { home_goals: h, away_goals: a } = result.most_likely[0];
    const text = `The model predicts: ${result.home_name} ${h}–${a} ${result.away_name}\n${result.win_pct.toFixed(0)}% chance of a ${result.home_name} win\n\nthemodelsays.com`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handlePredict() {
    setStatus('loading');
    setResult(null);
    setErrMsg('');
    try {
      const data = await predictWorldCupMatch({ home, away });
      setResult(data);
      setStatus('success');
    } catch (e) {
      setErrMsg(e.message || 'Prediction failed — try again.');
      setStatus('error');
    }
  }

  return (
    <div style={{ padding: isMobile ? '60px 16px' : '100px 56px', background: v4.bg2, borderTop: `1px solid ${v4.border}`, borderBottom: `1px solid ${v4.border}` }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* heading */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ color: v4.electric, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>world cup 2026</div>
          <h2 style={{ color: v4.text, fontSize: isMobile ? 32 : 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, fontFamily: display }}>
            Who does the model back?
          </h2>
          <p style={{ color: v4.textDim, fontSize: 16, marginTop: 16, maxWidth: 560, marginInline: 'auto', lineHeight: 1.55 }}>
            Pick any two nations. The Dixon-Coles model scores them.
          </p>
        </div>

        {/* selectors + button */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: `1px solid ${v4.border}`, borderRadius: 20, padding: 32,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 48px 1fr', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ color: v4.textVeryDim, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 8 }}>Home team</div>
              <SelectTeam value={home} onChange={setHome} teams={teams} placeholder="Select team…" disabled={status === 'loading'} />
            </div>
            {!isMobile && <div style={{ textAlign: 'center', color: v4.textVeryDim, fontFamily: mono, fontWeight: 700, fontSize: 13, marginTop: 20 }}>vs</div>}
            <div>
              <div style={{ color: v4.textVeryDim, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 8 }}>Away team</div>
              <SelectTeam value={away} onChange={setAway} teams={teams} placeholder="Select team…" disabled={status === 'loading'} />
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={!canPredict}
            style={{
              width: '100%', padding: '14px 0',
              background: canPredict ? v4.electric : 'rgba(0,255,135,0.15)',
              color: canPredict ? v4.bg : v4.textVeryDim,
              border: 0, borderRadius: 10,
              fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              fontFamily: display, cursor: canPredict ? 'pointer' : 'not-allowed',
              boxShadow: canPredict ? `0 4px 20px rgba(0,255,135,0.28)` : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {status === 'loading' ? 'Running model…' : 'Predict →'}
          </button>
        </div>

        {/* result area */}
        {status === 'loading' && <Spinner />}

        {status === 'error' && (
          <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(255,85,119,0.1)', border: `1px solid rgba(255,85,119,0.3)`, borderRadius: 12, color: v4.red, fontFamily: mono, fontSize: 13 }}>
            {errMsg}
          </div>
        )}

        {status === 'success' && result && (
          <div style={{ marginTop: 24 }}>
            {/* scoreline */}
            <div style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              border: `1px solid ${v4.border}`, borderRadius: 20, padding: isMobile ? '24px 16px' : '32px 40px',
              display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr', gap: isMobile ? 8 : 16, alignItems: 'center',
              marginBottom: 16,
            }}>
              <div style={{ textAlign: isMobile ? 'center' : 'right' }}>
                <div style={{ color: v4.textVeryDim, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 8 }}>Home</div>
                <div style={{ color: v4.text, fontSize: 22, fontWeight: 700, fontFamily: display }}>{result.home_name}</div>
                <div style={{ color: v4.textDim, fontFamily: mono, fontSize: 12, marginTop: 6 }}>xG {result.home_xg.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  color: v4.electric, fontFamily: display, fontSize: isMobile ? 48 : 56, fontWeight: 700,
                  letterSpacing: '-0.04em', lineHeight: 1,
                  textShadow: `0 0 30px rgba(0,255,135,0.35)`,
                }}>
                  {result.most_likely[0].home_goals}–{result.most_likely[0].away_goals}
                </div>
                <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, letterSpacing: '0.08em', marginTop: 8 }}>
                  EXPECTED SCORE
                </div>
              </div>
              <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                <div style={{ color: v4.textVeryDim, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 8 }}>Away</div>
                <div style={{ color: v4.text, fontSize: 22, fontWeight: 700, fontFamily: display }}>{result.away_name}</div>
                <div style={{ color: v4.textDim, fontFamily: mono, fontSize: 12, marginTop: 6 }}>xG {result.away_xg.toFixed(2)}</div>
              </div>
            </div>

            {/* win/draw/loss bars */}
            <div style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              border: `1px solid ${v4.border}`, borderRadius: 16, padding: '24px 32px',
              display: 'flex', gap: 24, alignItems: 'flex-end',
              marginBottom: 16,
            }}>
              <ProbBar label={`${result.home_name} win`} pct={result.win_pct}  color={v4.electric} />
              <ProbBar label="Draw"                      pct={result.draw_pct} color={v4.textDim}  />
              <ProbBar label={`${result.away_name} win`} pct={result.loss_pct} color={v4.pink}     />
            </div>

            {/* top scorelines */}
            <div style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              border: `1px solid ${v4.border}`, borderRadius: 16, padding: '20px 24px',
              marginBottom: 16,
            }}>
              <div style={{ color: v4.textVeryDim, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: mono, marginBottom: 14 }}>Top scorelines</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {result.most_likely.slice(0, 6).map((s, i) => (
                  <div key={i} style={{
                    background: i === 0 ? 'rgba(0,255,135,0.12)' : v4.bg,
                    border: `1px solid ${i === 0 ? 'rgba(0,255,135,0.3)' : v4.border}`,
                    borderRadius: 8, padding: '8px 14px', textAlign: 'center',
                  }}>
                    <div style={{ color: i === 0 ? v4.electric : v4.text, fontFamily: mono, fontSize: 16, fontWeight: 700 }}>
                      {s.home_goals}–{s.away_goals}
                    </div>
                    <div style={{ color: v4.textVeryDim, fontFamily: mono, fontSize: 10, marginTop: 3 }}>
                      {s.probability_pct.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* first scorer */}
            <FirstScorerSection result={result} />

            {/* share */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <button
                onClick={handleShare}
                style={{
                  background: copied ? 'rgba(0,255,135,0.15)' : v4.surface,
                  border: `1px solid ${copied ? 'rgba(0,255,135,0.4)' : v4.borderHi}`,
                  borderRadius: 10, padding: '10px 24px',
                  color: copied ? v4.electric : v4.textDim,
                  fontFamily: mono, fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.06em', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {copied ? 'COPIED ✓' : 'SHARE THIS PREDICTION'}
              </button>
            </div>

            {/* disclaimer */}
            <p style={{ color: v4.textVeryDim, fontSize: 12, fontFamily: mono, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
              Statistical model projection, not a forecast. Dixon-Coles Poisson model trained on WC2018/2022 data
              and recent international form. International football is genuinely noisy — treat probabilities as a
              distribution of outcomes, not a prediction.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
