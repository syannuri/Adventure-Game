/**
 * Olli's animal riddles (World 1). Talk to Olli: he asks a riddle ("I am white and round, I swim
 * on the pond and say quack!"). Walking up close to the right animal answers it; Olli calls out
 * the next one. Three riddles: duck, butterfly, squirrel.
 */
import { useFrame } from '@react-three/fiber';
import { useGame, type DialogueLine } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { animalSpots } from '../../../systems/animalSpots';
import { STICKERS } from '../../../data/stickers';
import { forestDialogue as D } from '../../../data/forestDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { tr } from '../../../i18n';
import { rewardAcorns } from '../shop/KikiShopQuest';

const ANSWERS = ['duck', 'butterfly', 'squirrel'];

const riddleLine = (i: number): DialogueLine => ({ speaker: 'olli', text: D().riddles[i] });

export function riddleStatus() {
  const r = useGame.getState().level.riddle;
  if (r < 0 || r >= ANSWERS.length) return null;
  return '🦉 ' + tr().hud.riddle(r + 1, ANSWERS.length);
}

/** Olli's lines when Anet talks to him (returns null when the riddles are all solved). */
export function olliRiddleLines(): DialogueLine[] | null {
  const g = useGame.getState();
  const r = g.level.riddle;
  if (r >= ANSWERS.length) return null;
  if (r < 0) {
    useGame.setState((s) => ({ level: { ...s.level, riddle: 0, lastProgressAt: performance.now() } }));
    return [...D().riddleIntro, riddleLine(0)];
  }
  return [riddleLine(r)];
}

export function OlliRiddles() {
  useFrame(() => {
    const g = useGame.getState();
    const r = g.level.riddle;
    if (r < 0 || r >= ANSWERS.length) return;
    if (g.screen !== 'playing' || g.paused || g.dialogue || g.cinematic) return;
    const id = ANSWERS[r];
    const near = STICKERS.find((s) => s.id === id)?.near ?? 3;
    const hit = (animalSpots[id] ?? []).some((p) => p && Math.hypot(player.position.x - p.x, player.position.z - p.z) < near + 0.4);
    if (!hit) return;
    // correct!
    const next = r + 1;
    useGame.setState((s) => ({ level: { ...s.level, riddle: next, lastProgressAt: performance.now() } }));
    audio.sfx('star', { pitch: 1.25, volume: 0.8 });
    spawnBurst(player.position.x, player.position.y + 1.6, player.position.z, '#c9a7ff', 30, { speed: 2.4 });
    g.playEmote('celebrate', 1.4);
    useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now(), title: tr().toasts.riddleRight, text: tr().hud.riddle(next, ANSWERS.length), icon: '?' }] }));
    const tid = useGame.getState().toasts.at(-1)!.id;
    window.setTimeout(() => useGame.getState().dismissToast(tid), 2600);
    const answer = D().riddleAnswers[r];
    if (next >= ANSWERS.length) {
      g.openDialogue([...D().riddleCorrect(answer), ...D().riddleDone], () => {
        const s = useGame.getState();
        s.unlockAchievement('riddle_solver', ACHIEVEMENTS.riddle_solver.title, ACHIEVEMENTS.riddle_solver.icon);
        rewardAcorns(5);
      });
    } else {
      g.openDialogue([...D().riddleRight(answer), riddleLine(next)]);
    }
  });
  return null;
}
