/** Leaf race overlay: the 3-2-1 countdown, then time, bubbles and a little race track bar. */
import { useRaceHud } from '../../systems/raceHud';
import { useT } from '../../i18n/useT';

export function RaceHud() {
  const hud = useRaceHud((s) => s.hud);
  const t = useT().race;
  if (!hud) return null;
  if (hud.phase === 'count') return <div className="race-count passthrough">{hud.count > 0 ? hud.count : t.go}</div>;
  const ahead = hud.me >= hud.duck;
  return (
    <div className="race-box passthrough">
      <div className="race-line">
        ⏱ {hud.time} {t.sec} · 🫧 {hud.n} / {hud.total}
      </div>
      <div className="race-track">
        <span className="race-flag">🏁</span>
        <span className="race-duck" style={{ left: `${hud.duck * 100}%` }}>
          🦆
        </span>
        <span className="race-leaf" style={{ left: `${hud.me * 100}%` }}>
          🍃
        </span>
      </div>
      <div className={ahead ? 'race-ahead' : 'race-behind'}>{ahead ? t.ahead : t.behind}</div>
    </div>
  );
}
