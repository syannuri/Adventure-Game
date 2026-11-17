import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../../systems/store';
import { Portrait, SPEAKERS } from './Portraits';
import { useT } from '../../i18n/useT';
import { audio } from '../audio/audioEngine';
import { input } from '../../systems/input';

const PITCH: Record<string, number> = { anett: 1.25, lumi: 1.6, pip: 1.05, olli: 0.7 };

/** Speech bubble with portrait and typewriter text. Click / tap / Space / E advances. */
export function DialogueBox() {
  const dialogue = useGame((s) => s.dialogue);
  const advance = useGame((s) => s.advanceDialogue);
  const t = useT();
  const line = dialogue ? dialogue.lines[dialogue.index] : null;
  const [shown, setShown] = useState(0);
  const lineKey = dialogue ? `${dialogue.index}-${line?.text}` : '';
  const shownRef = useRef(0);

  useEffect(() => {
    if (!line) return;
    setShown(0);
    shownRef.current = 0;
    const iv = setInterval(() => {
      shownRef.current += 1;
      setShown(shownRef.current);
      if (shownRef.current % 3 === 0) audio.sfx('talk', { pitch: PITCH[line.speaker] * (0.9 + Math.random() * 0.2), volume: 0.6 });
      if (shownRef.current >= line.text.length) clearInterval(iv);
    }, 24);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineKey]);

  const next = useCallback(() => {
    if (!line) return;
    if (shownRef.current < line.text.length) {
      shownRef.current = line.text.length;
      setShown(line.text.length);
      return;
    }
    audio.sfx('click', { volume: 0.6 });
    advance();
  }, [line, advance]);

  useEffect(() => {
    if (!dialogue) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
        // consume so the same key press doesn't make Anett jump or re-open the conversation
        input.jumpPressed = false;
        input.interactPressed = false;
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialogue, next]);

  if (!dialogue || !line) return null;
  const sp = { ...SPEAKERS[line.speaker], name: t.dialogue.speakers[line.speaker] };
  return (
    <div
      className="dialogue"
      onPointerDown={(e) => {
        e.stopPropagation();
        input.jumpPressed = false;
        input.interactPressed = false;
        next();
      }}
    >
      <div className="portrait">
        <Portrait speaker={line.speaker} />
      </div>
      <div className="bubble">
        <div className="name" style={{ color: sp.color }}>
          {sp.name}
        </div>
        <div className="line">{line.text.slice(0, shown)}</div>
        {shown >= line.text.length && <div className="next">{dialogue.index + 1 < dialogue.lines.length ? t.dialogue.next : t.dialogue.ok}</div>}
      </div>
    </div>
  );
}
