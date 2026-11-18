import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { interactables, type Interactable } from './interactions';
import { input } from '../../../systems/input';
import { player } from '../../../systems/playerState';
import { useGame } from '../../../systems/store';
import { audio } from '../../audio/audioEngine';

export function InteractionSystem() {
  const current = useRef<Interactable | null>(null);
  useFrame(() => {
    const g = useGame.getState();
    if (g.paused) return;
    const busy = !!g.dialogue || (!!g.cinematic && g.cinematic.kind !== 'finale') || g.screen !== 'playing' || g.level.stage === 'done';
    if (busy) {
      input.interactPressed = false;
      if (current.current) {
        current.current = null;
        g.setPrompt(null);
      }
      return;
    }
    let best: Interactable | null = null;
    let bestD = Infinity;
    for (const it of interactables.values()) {
      if (!it.enabled()) continue;
      const d = Math.hypot(it.x - player.position.x, it.z - player.position.z);
      if (d < it.radius && d < bestD) {
        best = it;
        bestD = d;
      }
    }
    current.current = best;
    g.setPrompt(best ? best.label() : null, best?.verb ?? 'talk');
    if (input.interactPressed) {
      input.interactPressed = false;
      if (!best) return;
      const target = best;
      const go = () => {
        player.lookAt = { x: target.x, z: target.z };
        audio.sfx('pop');
        target.onInteract();
      };
      // act right away whenever the prompt is showing (no auto-walk that a held joystick could cancel)
      player.autoTarget = null;
      go();
    }
  });
  return null;
}
