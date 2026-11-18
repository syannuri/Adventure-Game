/**
 * "How to move" card: shown automatically when a world starts (until the player closes it once),
 * and any time from the "?" button in the HUD. Shows touch or keyboard controls as appropriate.
 */
import { useEffect, useState } from 'react';
import { useT } from '../../i18n/useT';
import { input, onRunToggle } from '../../systems/input';
import { audio } from '../audio/audioEngine';

const SEEN_KEY = 'anet-controls-seen';
const seen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

export function ControlsCard({ isTouch }: { isTouch: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(() => !seen());
  const [running, setRunning] = useState(input.runToggle);
  useEffect(() => onRunToggle(setRunning), []);
  const close = () => {
    audio.sfx('click');
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* storage unavailable */
    }
  };
  const rows = isTouch ? t.controls.touchKeys : t.controls.keys;
  return (
    <>
      {running && !isTouch && <div className="run-badge passthrough">🏃 {t.controls.runningOn}</div>}
      <button className="help-btn" aria-label={t.controls.help} onClick={() => (audio.sfx('click'), setOpen(!open))}>
        ?
      </button>
      {open && (
        <div className="controls-card panel" role="dialog" aria-label={t.controls.title}>
          <h3>{t.controls.title}</h3>
          <div className="controls-grid">
            {rows.map(([k, v]) => (
              <div key={k} className="controls-row">
                <span className="kbd">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <button className="btn yellow" onClick={close}>
            {t.controls.close}
          </button>
        </div>
      )}
    </>
  );
}
