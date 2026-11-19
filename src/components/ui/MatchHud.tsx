/** Si Kusut match overlay: the score board, and the firefly counter or the tug-of-war bar. */
import { useEffect } from 'react';
import { matchInput, useMatchHud } from '../../systems/matchHud';
import { useT } from '../../i18n/useT';

export function MatchHud() {
  const hud = useMatchHud((s) => s.hud);
  const T = useT();
  const t = T.kusut;
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'KeyE') && matchInput.pull && !e.repeat) {
        e.preventDefault();
        e.stopPropagation();
        matchInput.pull();
      }
    };
    window.addEventListener('keydown', down, true);
    return () => window.removeEventListener('keydown', down, true);
  }, []);
  if (!hud) return null;
  const g = hud.game;
  return (
    <>
      <div className="match-board passthrough">
        <span className="who anet">Anet</span>
        <span className="dots">
          {hud.results.map((r, i) => (
            <i key={i} className={r == null ? '' : r ? 'won' : 'lost'} />
          ))}
        </span>
        <span className="score">
          {hud.anet} – {hud.kusut}
        </span>
        <span className="who kusut">{T.dialogue.speakers.kusut}</span>
        <small>{t.round(hud.round + 1, t.rounds[hud.round] ?? '')}</small>
      </div>
      {g?.kind === 'count' && <div className="race-count passthrough">{g.n > 0 ? g.n : t.go}</div>}
      {g?.kind === 'fireflies' && (
        <div className="race-box low passthrough">
          <div className="race-line">
            ⏱ {Math.ceil(g.time)} · ✦ {t.caught(g.mine, g.theirs)}
          </div>
        </div>
      )}
      {g?.kind === 'tug' && (
        <>
          <div className="race-box low passthrough">
            <div className="race-line">⏱ {Math.ceil(g.time)}</div>
            <div className="tug-bar">
              <span className="tug-mid" />
              <span className="tug-knot" style={{ left: `${50 + g.v * 50}%` }} />
              <span className="tug-end left">Anet</span>
              <span className="tug-end right">👾</span>
            </div>
            <div className="race-ahead">{t.pullHint}</div>
          </div>
          <button
            className="tug-btn"
            onPointerDown={(e) => {
              e.preventDefault();
              matchInput.pull?.();
            }}
          >
            {t.pull}
          </button>
        </>
      )}
    </>
  );
}
