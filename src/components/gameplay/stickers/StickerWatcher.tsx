/** Takes a sticker photo the first time Anet walks up close to an animal. */
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { animalSpots, clearAnimalSpots, setAnimalSpot } from '../../../systems/animalSpots';
import { STICKERS } from '../../../data/stickers';
import { audio } from '../../audio/audioEngine';
import { tr } from '../../../i18n';
import { ACHIEVEMENTS } from '../../../data/achievements';

function flash() {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.className = 'snap-flash';
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 600);
}

/** statics: fixed characters of the current world */
export function StickerWatcher({ statics }: { statics: { id: string; x: number; z: number }[] }) {
  const cooldown = useRef(0);
  useEffect(() => {
    statics.forEach((s, i) => setAnimalSpot(s.id, 100 + i, s.x, s.z));
    return () => clearAnimalSpots();
  }, [statics]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (t < cooldown.current) return;
    const g = useGame.getState();
    if (g.screen !== 'playing' || g.paused || g.dialogue || g.cinematic || !g.worldReady) return;
    const have = g.save.stickers ?? [];
    for (const st of STICKERS) {
      if (have.includes(st.id)) continue;
      const spots = animalSpots[st.id];
      if (!spots) continue;
      for (const p of spots) {
        if (!p) continue;
        if (Math.hypot(player.position.x - p.x, player.position.z - p.z) < st.near) {
          if (!g.addSticker(st.id)) return;
          cooldown.current = t + 1.5;
          flash();
          audio.sfx('shutter');
          const [name] = tr().animals[st.id] ?? [st.id];
          useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now() + Math.random(), title: tr().toasts.sticker, text: name, icon: '▣' }] }));
          const id = useGame.getState().toasts.at(-1)!.id;
          window.setTimeout(() => useGame.getState().dismissToast(id), 2600);
          if ((useGame.getState().save.stickers ?? []).length >= STICKERS.length) g.unlockAchievement('sticker_collector', ACHIEVEMENTS.sticker_collector.title, ACHIEVEMENTS.sticker_collector.icon);
          return;
        }
      }
    }
  });
  return null;
}
