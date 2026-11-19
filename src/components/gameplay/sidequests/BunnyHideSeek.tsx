/**
 * World 1 side quest: Pip's three little brothers are playing hide-and-seek.
 *
 * Talk to Pip to start. Each little bunny hides behind something (a bush, a fallen log, the giant
 * lantern tree). The closer Anet gets, the louder and faster they giggle, and their ears peek out.
 * Walking up to one finds it: it hops out and follows Anet in a little line. Bring all three back
 * to Pip for a thank-you and the "Bunny Buddy" badge. No timer, no way to fail.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { Rabbit } from '../../characters/npc/Rabbit';
import { HERO_TREES, LOGS, RABBIT_POS, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { forestDialogue as D } from '../../../data/forestDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { tr } from '../../../i18n';
import { angleDelta, damp } from '../../../utils/math';
import { rewardAcorns } from '../shop/KikiShopQuest';

/** Hiding spots, worked out from the forest layout so they always sit right behind the object. */
function hidingSpots() {
  const log = LOGS.find((l) => l.x > 15) ?? LOGS[0];
  const tree = HERO_TREES[0];
  // tucked in at the side of the object, so ears and head peek out for sharp eyes
  const beside = (x: number, z: number, r: number, side: number) => {
    const d = Math.hypot(x, z) || 1;
    const ox = x / d, oz = z / d; // outward from the forest centre
    return { x: x + (-oz * side * 0.8 + ox * 0.6) * r, z: z + (ox * side * 0.8 + oz * 0.6) * r };
  };
  return [
    { id: 'bunny-bush', scarf: '#ff8fbf', ...beside(-12.5, 14.9, 0.95, 1) },
    // peeking out of the end of the fallen log
    { id: 'bunny-log', scarf: '#7ee081', x: log.x + Math.cos(log.rot) * log.len * 0.56, z: log.z - Math.sin(log.rot) * log.len * 0.56 },
    { id: 'bunny-tree', scarf: '#ffd23f', ...beside(tree.x, tree.z, 0.75 * tree.s + 0.45, -1) },
  ];
}

export const BUNNY_SPOTS = hidingSpots();
const FIND_DIST = 1.9;
const HEAR_DIST = 15;

/** Start the quest (called from Pip's dialogue). */
export function startBunnyQuest() {
  useGame.setState((s) => ({ level: { ...s.level, bunnyQuest: 'active', lastProgressAt: performance.now() } }));
}

/** What Pip says while the quest runs. */
export function pipBunnyLines() {
  const l = useGame.getState().level;
  const left = BUNNY_SPOTS.filter((b) => !l.bunnies.includes(b.id));
  if (!left.length) return [{ speaker: 'pip' as const, text: D().bunnyAllFound }];
  return [
    { speaker: 'pip' as const, text: D().bunnyReminder(l.bunnies.length, BUNNY_SPOTS.length) },
    { speaker: 'pip' as const, text: D().bunnyHints[left[0].id] },
  ];
}

function finishQuest() {
  const g = useGame.getState();
  g.openDialogue(D().bunnyThanks, () => {
    const s = useGame.getState();
    useGame.setState((st) => ({ level: { ...st.level, bunnyQuest: 'done', lastProgressAt: performance.now() } }));
    s.unlockAchievement('bunny_friend', ACHIEVEMENTS.bunny_friend.title, ACHIEVEMENTS.bunny_friend.icon);
    rewardAcorns(5);
    s.playEmote('dance', 2.4);
    audio.sfx('star', { pitch: 1.2 });
    for (let i = 0; i < 4; i++) spawnBurst(RABBIT_POS.x + (Math.random() - 0.5) * 2, terrainHeight(RABBIT_POS.x, RABBIT_POS.z) + 0.6, RABBIT_POS.z + (Math.random() - 0.5) * 2, ['#ff8fbf', '#7ee081', '#ffd23f', '#ffffff'][i], 26, { speed: 2.5 });
  });
}

/** Breadcrumb trail of where Anet walked, so the found bunnies hop along behind her. */
const TRAIL_N = 90;

export function BunnyHideSeek() {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const trail = useMemo(() => Array.from({ length: TRAIL_N }, () => new THREE.Vector3()), []);
  const trailHead = useRef(0);
  const trailInit = useRef(false);
  const lastSample = useRef(0);
  const nextGiggle = useRef(0);
  const hopT = useRef<number[]>(BUNNY_SPOTS.map(() => -10));
  const finishing = useRef(false);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const g = useGame.getState();
    const l = g.level;
    const p = player.position;

    // record the trail
    if (!trailInit.current) {
      trail.forEach((v) => v.copy(p));
      trailInit.current = true;
    }
    const head = trail[trailHead.current];
    if (t - lastSample.current > 0.05 && head.distanceTo(p) > 0.12) {
      lastSample.current = t;
      trailHead.current = (trailHead.current + 1) % TRAIL_N;
      trail[trailHead.current].copy(p);
    }

    const active = l.bunnyQuest === 'active';
    const busy = g.paused || !!g.dialogue || !!g.cinematic || g.screen !== 'playing';

    // giggles from the nearest bunny that is still hiding
    if (active && !busy) {
      let nearest = Infinity;
      for (const b of BUNNY_SPOTS) if (!l.bunnies.includes(b.id)) nearest = Math.min(nearest, Math.hypot(p.x - b.x, p.z - b.z));
      if (nearest < HEAR_DIST && t > nextGiggle.current) {
        const k = 1 - nearest / HEAR_DIST;
        audio.sfx('giggle', { volume: 0.25 + k * 0.85, pitch: 0.95 + Math.random() * 0.12 });
        nextGiggle.current = t + 3.6 - k * 2.8;
      }
    }

    let followIndex = 0;
    BUNNY_SPOTS.forEach((b, i) => {
      const grp = groups.current[i];
      if (!grp) return;
      const found = l.bunnies.includes(b.id);
      const gy = terrainHeight(b.x, b.z);
      if (!found) {
        // hiding: tucked down, ears peeking up when Anet is near
        const d = Math.hypot(p.x - b.x, p.z - b.z);
        const peek = active ? THREE.MathUtils.smoothstep(7, 2.5, d) : 0;
        const wiggle = Math.sin(t * 3 + i) > 0.6 ? 0.05 : 0;
        grp.position.set(b.x, gy - 0.14 + peek * 0.14 + wiggle * (0.3 + peek), b.z);
        grp.rotation.y += angleDelta(grp.rotation.y, Math.atan2(p.x - b.x, p.z - b.z)) * damp(3, dt);
        if (active && !busy && d < FIND_DIST) {
          // found! hop out and join the line
          useGame.setState((s) => ({ level: { ...s.level, bunnies: [...s.level.bunnies, b.id], lastProgressAt: performance.now() } }));
          hopT.current[i] = t;
          audio.sfx('star', { pitch: 1.35, volume: 0.8 });
          audio.sfx('giggle', { volume: 1, pitch: 1.1 });
          spawnBurst(b.x, gy + 0.5, b.z, b.scarf, 30, { speed: 2.6 });
          g.playEmote('surprise', 1.0);
          const n = useGame.getState().level.bunnies.length;
          useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now() + i, title: tr().toasts.bunny, text: tr().toasts.bunnyCount(n, BUNNY_SPOTS.length), icon: '♥' }] }));
          const id = useGame.getState().toasts.at(-1)!.id;
          window.setTimeout(() => useGame.getState().dismissToast(id), 2600);
        }
        return;
      }

      // found: follow Anet along her trail, or play around Pip once the quest is done
      const target = tmp;
      if (l.bunnyQuest === 'done') {
        const a = (i / BUNNY_SPOTS.length) * Math.PI * 2 + 0.6;
        target.set(RABBIT_POS.x + Math.cos(a) * 1.1, 0, RABBIT_POS.z + Math.sin(a) * 1.1);
      } else {
        const back = 14 + followIndex * 9;
        target.copy(trail[(trailHead.current - back + TRAIL_N * 4) % TRAIL_N]);
        followIndex++;
      }
      const prev = grp.position.clone();
      grp.position.x += (target.x - grp.position.x) * damp(5, dt);
      grp.position.z += (target.z - grp.position.z) * damp(5, dt);
      const moving = Math.hypot(grp.position.x - prev.x, grp.position.z - prev.z) / Math.max(dt, 1e-3);
      const ground = terrainHeight(grp.position.x, grp.position.z);
      // a big happy hop right after being found, little hops while running along
      const since = t - hopT.current[i];
      const bigHop = since < 0.6 ? Math.sin((since / 0.6) * Math.PI) * 0.7 : 0;
      const runHop = moving > 0.4 ? Math.abs(Math.sin(t * 9 + i)) * 0.16 : l.bunnyQuest === 'done' ? Math.abs(Math.sin(t * 5 + i * 1.3)) * 0.18 : 0;
      grp.position.y = ground + bigHop + runHop;
      const face = moving > 0.3 ? Math.atan2(grp.position.x - prev.x, grp.position.z - prev.z) : Math.atan2(p.x - grp.position.x, p.z - grp.position.z);
      grp.rotation.y += angleDelta(grp.rotation.y, face) * damp(6, dt);
    });

    // bringing everyone back to Pip
    if (active && !busy && !finishing.current && l.bunnies.length === BUNNY_SPOTS.length && Math.hypot(p.x - RABBIT_POS.x, p.z - RABBIT_POS.z) < 3.2) {
      finishing.current = true;
      player.lookAt = { x: RABBIT_POS.x, z: RABBIT_POS.z };
      finishQuest();
    }
  });

  return (
    <>
      {BUNNY_SPOTS.map((b, i) => (
        <group key={b.id} ref={(el) => (groups.current[i] = el)} position={[b.x, terrainHeight(b.x, b.z) - 0.14, b.z]}>
          <Rabbit x={0} y={0} z={0} npc={false} controlled scale={0.55} scarf={b.scarf} />
        </group>
      ))}
    </>
  );
}
