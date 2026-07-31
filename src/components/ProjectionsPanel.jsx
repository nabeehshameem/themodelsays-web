// ProjectionsPanel.jsx
//
// The pre-deadline view. Everything else in the FPL section is retrospective —
// what the model picked, how it scored — and none of it helps a manager who is
// still deciding. This is the one panel that does, so it is the reason anyone
// returns weekly rather than reading a post-mortem.
//
// It renders the model's projections for a gameweek: a captain shortlist, the
// top projected players in each position, and the players the model has ruled
// out. It does NOT show the model's own squad — that stays hash-committed until
// the deadline, and the endpoint behind this panel carries neither the squad nor
// the hash.
//
// 404 is a normal state, not an error: projections appear when the lock runs,
// roughly ten hours before the deadline. Before that the panel says so.

import { useEffect, useState } from 'react';
import { fpl, ApiError } from '../lib/api';

const v4 = {
  surface: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)',
  text: '#ffffff', textDim: '#b9aed0', textVeryDim: '#796a93',
  electric: '#00FF87', amber: '#FFB020',
};
const display = 'Space Grotesk, sans-serif';
const mono = 'JetBrains Mono, monospace';

const card = {
  background: v4.surface, border: `1px solid ${v4.border}`,
  borderRadius: 14, padding: 24,
};
const label = {
  color: v4.textVeryDim, fontFamily: mono, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.1em', textTransform: 'uppercase',
};

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];

function Row({ p, rank, highlight }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 10, padding: '7px 0',
      borderBottom: `1px solid ${v4.border}`,
    }}>
      {rank != null && (
        <span style={{ ...label, minWidth: 16 }}>{rank}</span>
      )}
      <span style={{
        color: highlight ? v4.electric : v4.text, fontSize: 14,
        fontWeight: highlight ? 700 : 400, flex: 1,
      }}>{p.name}</span>
      <span style={{ ...label, letterSpacing: 0 }}>
        {p.team}{p.opponent ? ` ${p.venue === 'H' ? 'v' : '@'} ${p.opponent}` : ''}
      </span>
      <span style={{ ...label, letterSpacing: 0, minWidth: 42, textAlign: 'right' }}>
        £{p.price?.toFixed(1)}m
      </span>
      <span style={{
        fontFamily: mono, fontSize: 14, fontWeight: 700,
        color: highlight ? v4.electric : v4.textDim,
        minWidth: 40, textAlign: 'right',
      }}>{p.projected_points?.toFixed(1)}</span>
    </div>
  );
}

export function ProjectionsPanel({ gameweek }) {
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');
  const [pos, setPos] = useState('MID');

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        // The gameweek prop is optional: the panel is dropped into the page as
        // <ProjectionsPanel /> with no arguments, so it has to work out which
        // gameweek is current by itself. Previously a missing prop short-
        // circuited straight to the "not published yet" state, which meant the
        // panel would have gone on saying that after the lock had published
        // real projections.
        let gw = gameweek;
        if (!gw) {
          const season = await fpl.season({ signal: ac.signal });
          const graded = season?.gameweeks ?? [];
          gw = graded.length
            ? graded[graded.length - 1].gameweek + 1
            : 1;
        }
        setData(await fpl.projections(gw, { signal: ac.signal }));
        setState('ready');
      } catch (e) {
        if (e.name === 'AbortError') return;
        // 404 means "not published yet", which is the normal state for most of
        // the week — not something to show as a failure.
        setState(e instanceof ApiError && e.status === 404 ? 'pending' : 'error');
      }
    })();
    return () => ac.abort();
  }, [gameweek]);

  if (state === 'loading') {
    return <div style={{ ...card, ...label, letterSpacing: 0 }}>
      Loading the model's projections…
    </div>;
  }

  if (state === 'pending') {
    return (
      <div style={card}>
        <div style={label}>projections</div>
        <p style={{ color: v4.textDim, fontSize: 14, lineHeight: 1.6, margin: '12px 0 0' }}>
          The model publishes its projections when it locks its squad, about ten
          hours before each deadline — captain shortlist, the best projected
          player in every position, and anyone it has ruled out. The squad
          itself is published at the same time.
        </p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{ ...card, borderColor: 'rgba(255,176,32,0.3)' }}>
        <div style={{ ...label, color: v4.amber }}>projections unavailable</div>
        <p style={{ color: v4.textDim, fontSize: 14, margin: '10px 0 0' }}>
          Can't reach the projections right now. They're also committed in the
          public repo, so nothing depends on this page being up.
        </p>
      </div>
    );
  }

  const list = data.by_position?.[pos] || [];

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={label}>gw{data.gameweek} projections</div>
        <div style={{ ...label, letterSpacing: 0 }}>
          model: {data.model}
        </div>
      </div>

      {data.captain_candidates?.length > 0 && (
        <>
          <div style={{ ...label, marginTop: 18, color: v4.electric }}>
            captain shortlist
          </div>
          <div style={{ marginTop: 6 }}>
            {data.captain_candidates.map((p, i) => (
              <Row key={p.player_id} p={p} rank={i + 1} highlight={i === 0} />
            ))}
          </div>
          <p style={{ ...label, marginTop: 8, textTransform: 'none', letterSpacing: 0 }}>
            Highest projected points, doubled if captained. The model's squad
            and captain are published alongside these projections.
          </p>
        </>
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 22, marginBottom: 4 }}>
        {POSITIONS.map(p => (
          <button key={p} onClick={() => setPos(p)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
            fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            color: pos === p ? v4.electric : v4.textVeryDim,
            borderBottom: `2px solid ${pos === p ? v4.electric : 'transparent'}`,
          }}>{p}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <p style={{ ...label, marginTop: 10, textTransform: 'none', letterSpacing: 0 }}>
          No {pos} projections for this gameweek.
        </p>
      ) : (
        <div>{list.map((p, i) => <Row key={p.player_id} p={p} rank={i + 1} />)}</div>
      )}

      {data.excluded?.length > 0 && (
        <>
          <div style={{ ...label, marginTop: 20, color: v4.amber }}>
            ruled out ({data.excluded.length})
          </div>
          <p style={{ color: v4.textDim, fontSize: 13, lineHeight: 1.55, marginTop: 6 }}>
            {data.excluded.map(p => `${p.name} (${p.team})`).join(' · ')}
          </p>
          <p style={{ ...label, marginTop: 6, textTransform: 'none', letterSpacing: 0 }}>
            Confirmed non-starters and flagged players, excluded from selection.
            The list is public in the repo — disagree with it freely.
          </p>
        </>
      )}

      <p style={{ ...label, marginTop: 18, textTransform: 'none', letterSpacing: 0 }}>
        {data.note}
      </p>
    </div>
  );
}
