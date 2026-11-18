/** On-screen virtual joystick, jump, action and emote buttons for phones and tablets. */
import { useEffect, useRef, useState } from 'react';
import { input, JOY_RUN, setTouchMove } from '../../systems/input';
import { useGame } from '../../systems/store';
import { useT } from '../../i18n/useT';
import { Icon } from './Icons';

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
  const verb = useGame((s) => s.promptVerb);
  const [running, setRunning] = useState(false);
  const t = useT();

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
    const run = Math.hypot(dx, dy) / max > JOY_RUN;
    setRunning((r) => (r === run ? r : run));
  };
  const end = () => {
    active.current = null;
    knob.current!.style.transform = '';
    setTouchMove(0, 0);
    setRunning(false);
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
        className={'joystick' + (running ? ' running' : '')}
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
        <div className="joy-run-zone" />
        <div ref={knob} className="knob">
          <Icon name="run" size={26} className={'knob-run' + (running ? ' on' : '')} />
        </div>
      </div>
      <div className="touch-buttons">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <button className="tbtn small wave" aria-label={t.touch.wave} onPointerDown={press(() => (input.emote = 'wave'))}>
            <Icon name="wave" size={24} />
          </button>
          <button className="tbtn small dance" aria-label={t.touch.dance} onPointerDown={press(() => (input.emote = 'dance'))}>
            <Icon name="music" size={22} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <button
            className={'tbtn act' + (prompt ? ' ready' : '')}
            aria-label={prompt ? (verb === 'take' ? t.touch.take : verb === 'open' ? t.touch.open : verb === 'touch' ? t.touch.touchFlower : t.touch.talk) : t.touch.action}
            onPointerDown={press(() => (input.interactPressed = true))}
          >
            <Icon name={prompt ? (verb === 'take' ? 'take' : verb === 'open' ? 'open' : verb === 'touch' ? 'flower' : 'talk') : 'sparkle'} size={30} />
          </button>
          <button className="tbtn jump" aria-label={t.touch.jump} onPointerDown={press(() => (input.jumpPressed = true))}>
            <Icon name="jump" size={42} />
          </button>
        </div>
      </div>
    </div>
  );
}
