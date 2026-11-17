/** On-screen virtual joystick, jump, action and emote buttons for phones and tablets. */
import { useEffect, useRef, useState } from 'react';
import { input, setTouchMove } from '../../systems/input';
import { useGame } from '../../systems/store';

export function useIsTouch() {
  const [touch, setTouch] = useState(() => typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window));
  useEffect(() => {
    const on = () => setTouch(true);
    window.addEventListener('touchstart', on, { once: true });
    return () => window.removeEventListener('touchstart', on);
  }, []);
  return touch;
}

export function TouchControls() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);
  const prompt = useGame((s) => s.prompt);

  const update = (cx: number, cy: number) => {
    const r = base.current!.getBoundingClientRect();
    const max = r.width / 2;
    let dx = cx - (r.left + max);
    let dy = cy - (r.top + max);
    const l = Math.hypot(dx, dy);
    if (l > max) {
      dx *= max / l;
      dy *= max / l;
    }
    knob.current!.style.transform = `translate(${dx}px, ${dy}px)`;
    setTouchMove(dx / max, -dy / max);
  };
  const end = () => {
    active.current = null;
    knob.current!.style.transform = '';
    setTouchMove(0, 0);
  };
  useEffect(() => () => setTouchMove(0, 0), []);

  const press = (fn: () => void) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <div className="touch">
      <div
        ref={base}
        className="joystick"
        onPointerDown={(e) => {
          e.stopPropagation();
          active.current = e.pointerId;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          update(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (active.current === e.pointerId) update(e.clientX, e.clientY);
        }}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div ref={knob} className="knob" />
      </div>
      <div className="touch-buttons">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <button className="tbtn small" aria-label="Wave" onPointerDown={press(() => (input.emote = 'wave'))}>
            👋
          </button>
          <button className="tbtn small" aria-label="Dance" onPointerDown={press(() => (input.emote = 'dance'))}>
            ♪
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <button className={'tbtn act' + (prompt ? ' ready' : '')} onPointerDown={press(() => (input.interactPressed = true))}>
            {prompt ? 'Talk' : 'Action'}
          </button>
          <button className="tbtn jump" onPointerDown={press(() => (input.jumpPressed = true))}>
            Jump
          </button>
        </div>
      </div>
    </div>
  );
}
