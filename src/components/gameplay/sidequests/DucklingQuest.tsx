/**
 * Duckling escort (World 1): Mama Duck waits on the south shore of the pond. Her four ducklings
 * wandered into the forest and peep louder as Anet gets close. A found duckling waddles along
 * behind Anet in a little line; bring all four back and the whole family goes for a swim.
 * Papa Duck is always swimming on the pond.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { registerInteractable } from '../interaction/interactions';
import { DUCK_SWIM, DUCKLING_SPOTS, MAMA_DUCK, WATER_LEVEL, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { Duck } from '../../characters/npc/Duck';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { forestDialogue as D } from '../../../data/forestDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { tr } from '../../../i18n';
import { angleDelta, damp } from '../../../utils/math';
import { rewardAcorns } from '../shop/KikiShopQuest';
import { setAnimalSpot } from '../../../systems/animalSpots';

const TOTAL = DUCKLING_SPOTS.length;
const FIND_DIST = 1.7;
const HEAR_DIST = 14;
const TRAIL_N = 80;

export function duckStatus() {
  const l = useGame.getState().level;
  if (l.duckQuest === 'done' || (l.duckQuest === 'none' && !l.ducklings.length)) return null;
  return '🐥 ' + tr().hud.ducklings(l.ducklings.length, TOTAL);
}

function talkMama() {
  const g = useGame.getState();
  const l = g.level;
  if (l.duckQuest === 'done') return;
  if (l.ducklings.length === TOTAL) return thanks();
  if (l.duckQuest === 'none') {
    g.openDialogue(D().duckIntro, () => useGame.setState((s) => ({ level: { ...s.level, duckQuest: 'active', lastProgressAt: performance.now() } })));
    return;
  }
  const next = DUCKLING_SPOTS.find((d) => !l.ducklings.includes(d.id));
  g.openDialogue([...D().duckReminder(l.ducklings.length, TOTAL), ...(next ? [{ speaker: 'duck' as const, text: D().duckHints[next.id] }] : [])]);
}

function thanks() {
  const g = useGame.getState();
  g.openDialogue(D().duckThanks, () => {
    const s = useGame.getState();
    useGame.setState((st) => ({ level: { ...st.level, duckQuest: 'done', lastProgressAt: performance.now() } }));
    s.unlockAchievement('duck_helper', ACHIEVEMENTS.duck_helper.title, ACHIEVEMENTS.duck_helper.icon);
    s.playEmote('dance', 2.4);
    audio.sfx('quack', { volume: 1 });
    window.setTimeout(() => audio.sfx('peep', { volume: 0.9, pitch: 1.1 }), 250);
    spawnBurst(MAMA_DUCK.x, terrainHeight(MAMA_DUCK.x, MAMA_DUCK.z) + 0.6, MAMA_DUCK.z, '#ffe27a', 40, { speed: 2.6 });
    rewardAcorns(5);
  });
}

export function DucklingQuest() {
  const mama = useRef<THREE.Group>(null!);
  const papa = useRef<THREE.Group>(null!);
  const babies = useRef<(THREE.Group | null)[]>([]);
  const trail = useMemo(() => Array.from({ length: TRAIL_N }, () => new THREE.Vector3()), []);
  const head = useRef(0);
  const trailInit = useRef(false);
  const lastSample = useRef(0);
  const nextPeep = useRef(0);
  const finishing = useRef(false);
  const hopT = useRef(DUCKLING_SPOTS.map(() => -10));
  const swimA = useRef(0);

  useEffect(
    () =>
      registerInteractable({
        id: 'mama-duck',
        x: MAMA_DUCK.x,
        z: MAMA_DUCK.z - 0.8,
        radius: 2.6,
        approach: 1.0,
        label: () => tr().prompts.talkDuck,
        verb: 'talk',
        enabled: () => useGame.getState().level.duckQuest !== 'done',
        onInteract: talkMama,
      }),
    [],
  );

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const g = useGame.getState();
    const l = g.level;
    const p = player.position;
    const busy = g.paused || !!g.dialogue || !!g.cinematic || g.screen !== 'playing';
    const done = l.duckQuest === 'done';

    // Papa swims in a slow circle; Mama joins him once the family is home
    swimA.current += dt * 0.35;
    const a = swimA.current;
    papa.current.position.set(DUCK_SWIM.x + Math.cos(a) * DUCK_SWIM.r, WATER_LEVEL - 0.06 + Math.sin(t * 2) * 0.015, DUCK_SWIM.z + Math.sin(a) * DUCK_SWIM.r);
    papa.current.rotation.y = -a;
    setAnimalSpot('duck', 0, papa.current.position.x, papa.current.position.z);
    if (done) {
      const am = a - 0.9;
      const tx = DUCK_SWIM.x + Math.cos(am) * DUCK_SWIM.r;
      const tz = DUCK_SWIM.z + Math.sin(am) * DUCK_SWIM.r;
      mama.current.position.x += (tx - mama.current.position.x) * damp(1.5, dt);
      mama.current.position.z += (tz - mama.current.position.z) * damp(1.5, dt);
      mama.current.position.y += (WATER_LEVEL - 0.06 - mama.current.position.y) * damp(2, dt);
      mama.current.rotation.y += angleDelta(mama.current.rotation.y, -am) * damp(3, dt);
    } else {
      // waiting on the shore, looking around (and toward Anet when she is close)
      const gy = terrainHeight(MAMA_DUCK.x, MAMA_DUCK.z);
      mama.current.position.set(MAMA_DUCK.x, gy + Math.abs(Math.sin(t * 3)) * (l.duckQuest === 'active' ? 0 : 0.03), MAMA_DUCK.z);
      const look = Math.hypot(p.x - MAMA_DUCK.x, p.z - MAMA_DUCK.z) < 6 ? Math.atan2(p.x - MAMA_DUCK.x, p.z - MAMA_DUCK.z) : Math.PI + Math.sin(t * 0.7) * 0.8;
      mama.current.rotation.y += angleDelta(mama.current.rotation.y, look) * damp(3, dt);
    }
    setAnimalSpot('duck', 1, mama.current.position.x, mama.current.position.z);

    // trail of Anet's steps for the ducklings to follow
    if (!trailInit.current) {
      trail.forEach((v) => v.copy(p));
      trailInit.current = true;
    }
    // a jump in position (game start, splash, teleport) restarts the trail right here
    if (trail[head.current].distanceTo(p) > 3) trail.forEach((v) => v.copy(p));
    if (t - lastSample.current > 0.05 && trail[head.current].distanceTo(p) > 0.12) {
      lastSample.current = t;
      head.current = (head.current + 1) % TRAIL_N;
      trail[head.current].copy(p);
    }

    // peeping from the nearest lost duckling
    if (!busy && !done) {
      let nearest = Infinity;
      for (const d of DUCKLING_SPOTS) if (!l.ducklings.includes(d.id)) nearest = Math.min(nearest, Math.hypot(p.x - d.x, p.z - d.z));
      if (nearest < HEAR_DIST && t > nextPeep.current) {
        const k = 1 - nearest / HEAR_DIST;
        audio.sfx('peep', { volume: 0.2 + k * 0.8, pitch: 0.95 + Math.random() * 0.15 });
        nextPeep.current = t + 3.2 - k * 2.4;
      }
    }

    let follow = 0;
    DUCKLING_SPOTS.forEach((d, i) => {
      const grp = babies.current[i];
      if (!grp) return;
      const found = l.ducklings.includes(d.id);
      if (!found) {
        // lost: little turns and hops on the spot
        const gy = terrainHeight(d.x, d.z);
        grp.position.set(d.x, gy + Math.max(0, Math.sin(t * 6 + i)) * 0.05, d.z);
        grp.rotation.y = Math.sin(t * 0.8 + i * 2) * 1.5;
        setAnimalSpot('duckling', i, d.x, d.z);
        if (!busy && Math.hypot(p.x - d.x, p.z - d.z) < FIND_DIST) {
          useGame.setState((s) => ({ level: { ...s.level, ducklings: [...s.level.ducklings, d.id], duckQuest: s.level.duckQuest === 'none' ? 'active' : s.level.duckQuest, lastProgressAt: performance.now() } }));
          hopT.current[i] = t;
          audio.sfx('peep', { volume: 1, pitch: 1.2 });
          spawnBurst(d.x, gy + 0.4, d.z, '#ffe27a', 24, { speed: 2.2 });
          const n = useGame.getState().level.ducklings.length;
          useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now() + i, title: tr().toasts.duckling, text: tr().toasts.ducklingCount(n, TOTAL), icon: '◒' }] }));
          const id = useGame.getState().toasts.at(-1)!.id;
          window.setTimeout(() => useGame.getState().dismissToast(id), 2600);
        }
        return;
      }
      const target = new THREE.Vector3();
      let swimming = false;
      if (done) {
        // swim behind Mama in a little row
        const ab = swimA.current - 1.3 - i * 0.35;
        target.set(DUCK_SWIM.x + Math.cos(ab) * DUCK_SWIM.r, 0, DUCK_SWIM.z + Math.sin(ab) * DUCK_SWIM.r);
        swimming = true;
      } else {
        target.copy(trail[(head.current - (9 + follow * 6) + TRAIL_N * 4) % TRAIL_N]);
        follow++;
      }
      const prev = grp.position.clone();
      grp.position.x += (target.x - grp.position.x) * damp(swimming ? 1.6 : 5, dt);
      grp.position.z += (target.z - grp.position.z) * damp(swimming ? 1.6 : 5, dt);
      const ground = swimming ? WATER_LEVEL - 0.04 : terrainHeight(grp.position.x, grp.position.z);
      const since = t - hopT.current[i];
      const moving = Math.hypot(grp.position.x - prev.x, grp.position.z - prev.z) / Math.max(dt, 1e-3);
      const hop = since < 0.5 ? Math.sin((since / 0.5) * Math.PI) * 0.5 : !swimming && moving > 0.4 ? Math.abs(Math.sin(t * 12 + i)) * 0.06 : 0;
      grp.position.y += (ground + hop - grp.position.y) * damp(swimming ? 2 : 20, dt);
      if (moving > 0.2) grp.rotation.y += angleDelta(grp.rotation.y, Math.atan2(grp.position.x - prev.x, grp.position.z - prev.z)) * damp(8, dt);
      setAnimalSpot('duckling', i, grp.position.x, grp.position.z);
    });

    // bringing all of them home
    if (!busy && !done && !finishing.current && l.ducklings.length === TOTAL && Math.hypot(p.x - MAMA_DUCK.x, p.z - MAMA_DUCK.z) < 3.2) {
      finishing.current = true;
      player.lookAt = { x: MAMA_DUCK.x, z: MAMA_DUCK.z };
      thanks();
    }
  });

  return (
    <>
      <Duck ref={papa} scale={1.1} />
      <Duck ref={mama} scale={1.1} />
      {DUCKLING_SPOTS.map((d, i) => (
        <group key={d.id} ref={(el) => (babies.current[i] = el)} position={[d.x, terrainHeight(d.x, d.z), d.z]}>
          <Duck baby />
        </group>
      ))}
    </>
  );
}
