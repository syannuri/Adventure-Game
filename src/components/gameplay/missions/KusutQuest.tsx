/**
 * Si Kusut chapter (Enchanted Forest, after World 1): Grumble the messy monster.
 *
 *  arrive    -> Lumi tells Anet that someone made a mess; Grumble shows up, laughs and runs off
 *  brambles  -> three thorny bushes block the paths: the magic wand's light shrinks them away
 *  chase     -> Grumble hides around the forest; catch him four times to win Lumi's bells back
 *  arena     -> he challenges Anet to the Great Forest Match in the flower meadow
 *  match     -> three games: leaf race, firefly catch, tug of war. Winning two makes Anet champion.
 *               Losing the match is never the end: a friendly rematch, and Grumble gets a bit slower
 *               every time Anet loses a game, so every child wins in the end.
 *  done      -> Grumble was only lonely: he becomes everyone's friend and there is a party
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { player, cameraState } from '../../../systems/playerState';
import { input } from '../../../systems/input';
import { getWorldPhysics, type CircleCollider } from '../../../systems/physics';
import { registerInteractable } from '../interaction/interactions';
import { ARENA, BRAMBLES, FAIRY_POS, KUSUT_SPOTS, KUSUT_START, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { Kusut } from '../../characters/npc/Kusut';
import { audio } from '../../audio/audioEngine';
import { spawnBurst, spawnDust } from '../../effects/Bursts';
import { glowTexture } from '../../effects/textures';
import { kusutDialogue as D } from '../../../data/kusutDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { tr } from '../../../i18n';
import { angleDelta, damp, mulberry32 } from '../../../utils/math';
import { startMatchRace } from '../sidequests/LeafRace';
import { matchInput, useMatchHud } from '../../../systems/matchHud';
import { setAnimalSpot } from '../../../systems/animalSpots';
import type { Objective } from './forestObjective';

const WORLD_ID = 'enchanted-forest';
const BELLS = KUSUT_SPOTS.length;
const CATCH_DIST = 2.6;
/** game lengths in seconds (automated tests shorten them) */
export const matchTiming = { ff: 30, tug: 15 };
const FF_COUNT = 8;
const COUNT = 3.2;
const TUG_A = { x: ARENA.x - 1.7, z: ARENA.z };
const TUG_K = { x: ARENA.x + 1.7, z: ARENA.z };
const gy = (x: number, z: number) => terrainHeight(x, z);

const level = () => useGame.getState().level;
const setLevel = (patch: Partial<ReturnType<typeof level>>) => useGame.setState((s) => ({ level: { ...s.level, ...patch, lastProgressAt: performance.now() } }));

function toast(title: string, text: string, icon: string) {
  useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now() + Math.random(), title, text, icon }] }));
  const id = useGame.getState().toasts.at(-1)!.id;
  window.setTimeout(() => useGame.getState().dismissToast(id), 2400);
}

/** how much easier Grumble gets after each game Anet loses */
const ease = () => Math.max(0.68, 1 - level().match.losses * 0.1);

export function kusutObjective(): Objective {
  const l = level();
  const o = tr().kusut.objectives;
  switch (l.kusutStage) {
    case 'arrive':
      return { text: o.arrive, target: FAIRY_POS };
    case 'brambles': {
      const p = player.position;
      const left = BRAMBLES.filter((b) => !l.brambles.includes(b.id)).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
      return { text: o.brambles(l.brambles.length, BRAMBLES.length), target: left[0] ?? null };
    }
    case 'chase':
      return { text: o.chase(l.bells, BELLS), target: KUSUT_SPOTS[Math.min(l.bells, BELLS - 1)] };
    case 'arena':
      return { text: o.arena, target: ARENA };
    case 'match':
      return { text: o.match(l.match.anet, l.match.kusut), target: null };
    case 'done':
      return { text: o.done, target: null };
  }
}

/** Lumi during the chapter (called from ForestQuest's talkLumi) */
export function kusutTalkLumi() {
  const g = useGame.getState();
  g.openDialogue(D().lumiHint[g.level.kusutStage] ?? D().lumiHint.done);
}

// ------------------------------------------------------------------------------------- the match

type Game =
  | { kind: 'none' }
  | { kind: 'race' }
  | { kind: 'ffCount' | 'tugCount'; t: number }
  | { kind: 'ff'; t: number; mine: number; theirs: number }
  | { kind: 'tug'; t: number; v: number };
/** shared with the 3D components below (mutable, read every frame) */
const match = {
  game: { kind: 'none' } as Game,
  flies: [] as { x: number; z: number; born: number }[],
  kx: ARENA.x,
  kz: ARENA.z,
};
const rnd = mulberry32(99);
// automated tests read and shorten the match from here
if (typeof window !== 'undefined') Object.assign(window, { __anettMatch: { match, timing: matchTiming, begin: (r: number) => beginRound(r) } });
function newFly() {
  const a = rnd() * Math.PI * 2;
  const r = Math.sqrt(rnd()) * ARENA.r;
  return { x: ARENA.x + Math.cos(a) * r, z: ARENA.z + Math.sin(a) * r, born: performance.now() };
}

function pushHud() {
  const m = level().match;
  const g = match.game;
  useMatchHud.setState({
    hud: {
      round: m.round,
      anet: m.anet,
      kusut: m.kusut,
      results: m.results,
      game:
        g.kind === 'ffCount' || g.kind === 'tugCount'
          ? { kind: 'count', n: Math.ceil(COUNT - g.t) }
          : g.kind === 'ff'
            ? { kind: 'fireflies', time: Math.max(0, matchTiming.ff - g.t), mine: g.mine, theirs: g.theirs }
            : g.kind === 'tug'
              ? { kind: 'tug', v: g.v, time: Math.max(0, matchTiming.tug - g.t) }
              : null,
    },
  });
}

function beginRound(round: number) {
  const g = useGame.getState();
  setLevel({ match: { ...level().match, round } });
  if (round === 0) {
    match.game = { kind: 'race' };
    pushHud();
    startMatchRace(2.95 * ease(), (won) => endRound(won));
    return;
  }
  // games two and three are played in the meadow
  player.teleport(round === 2 ? TUG_A.x : ARENA.x - 1, gy(ARENA.x, ARENA.z), round === 2 ? TUG_A.z : ARENA.z + 2.5, round === 2 ? Math.PI / 2 : Math.PI);
  spawnBurst(player.position.x, player.position.y + 1, player.position.z, '#c9a7ff', 24, { speed: 2 });
  g.openDialogue(round === 1 ? D().round2 : D().round3, () => {
    if (round === 1) {
      match.flies = Array.from({ length: FF_COUNT }, newFly);
      match.kx = ARENA.x + 1.5;
      match.kz = ARENA.z - 1.5;
      match.game = { kind: 'ffCount', t: 0 };
    } else {
      match.game = { kind: 'tugCount', t: 0 };
      matchInput.pull = () => {
        const gm = match.game;
        if (gm.kind !== 'tug') return;
        gm.v = Math.min(1, gm.v + 0.1);
        audio.sfx('tap', { pitch: 0.9 + gm.v * 0.2 });
        spawnDust(player.position.x, player.position.y, player.position.z, 3, 0.5);
      };
    }
    pushHud();
  });
}

function endRound(won: boolean) {
  const g = useGame.getState();
  const m = level().match;
  const results = m.results.map((r, i) => (i === m.round ? won : r));
  const next = { ...m, results, anet: m.anet + (won ? 1 : 0), kusut: m.kusut + (won ? 0 : 1), losses: m.losses + (won ? 0 : 1) };
  setLevel({ match: next });
  match.game = { kind: 'none' };
  matchInput.pull = null;
  player.ride = null;
  pushHud();
  audio.sfx(won ? 'achievement' : 'pop', { pitch: won ? 1 : 0.8 });
  g.playEmote(won ? 'celebrate' : 'wave', 1.8);
  // first, second, third win (or loss) of the match gets its own line
  const line = won ? D().roundWin[Math.min(2, next.anet - 1)] : D().roundLose[Math.min(2, next.kusut - 1)];
  g.openDialogue([line], () => {
    if (m.round < 2) beginRound(m.round + 1);
    else if (next.anet >= 2) victory();
    else rematch();
  });
}

function rematch() {
  const g = useGame.getState();
  g.openDialogue(D().rematch, () => {
    setLevel({ match: { round: 0, anet: 0, kusut: 0, losses: level().match.losses, results: [null, null, null] } });
    beginRound(0);
  });
}

function victory() {
  const g = useGame.getState();
  player.teleport(ARENA.x - 1.2, gy(ARENA.x - 1.2, ARENA.z + 1.5), ARENA.z + 1.5, Math.PI * 0.75);
  match.kx = ARENA.x + 0.6;
  match.kz = ARENA.z - 0.6;
  g.unlockAchievement('forest_champion', ACHIEVEMENTS.forest_champion.title, ACHIEVEMENTS.forest_champion.icon);
  g.openDialogue(D().victory, () => {
    const s = useGame.getState();
    setLevel({ kusutStage: 'done' });
    useMatchHud.setState({ hud: null });
    s.unlockAchievement('kusut_friend', ACHIEVEMENTS.kusut_friend.title, ACHIEVEMENTS.kusut_friend.icon);
    s.playCinematic({ kind: 'finale', duration: 1600 });
    s.playEmote('celebrate', 3);
    audio.sfx('magic');
    const colors = ['#c9a7ff', '#ffd23f', '#ff7ab0', '#7fd6ff', '#9df07a'];
    let n = 0;
    const iv = window.setInterval(() => {
      const a = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 6;
      const x = ARENA.x + Math.cos(a) * r;
      const z = ARENA.z + Math.sin(a) * r;
      spawnBurst(x, gy(x, z) + 1 + Math.random() * 3, z, colors[n % colors.length], 30, { speed: 3 });
      if (n % 3 === 0) audio.sfx('pop', { pitch: 0.8 + Math.random() * 0.6, volume: 0.5 });
      if (++n > 30) window.clearInterval(iv);
    }, 170);
    window.setTimeout(() => {
      const st = useGame.getState();
      if (st.screen === 'playing' && st.worldId === WORLD_ID && st.kusut) st.completeWorld(WORLD_ID, st.level.coins.length);
    }, 6400);
  });
}

// ------------------------------------------------------------------------------------- component

export function KusutQuest() {
  const kusut = useRef<THREE.Group>(null!);
  const stage = useGame((s) => s.level.kusutStage);
  const cleared = useGame((s) => s.level.brambles);
  const arrived = useRef(false);
  const busyCatch = useRef(false);
  const shown = useRef(true);
  const pos = useRef({ x: KUSUT_START.x, z: KUSUT_START.z });

  // thorny bushes are solid until shrunk away
  useEffect(() => {
    const w = getWorldPhysics();
    const cols: CircleCollider[] = BRAMBLES.filter((b) => !cleared.includes(b.id)).map((b) => ({ x: b.x, z: b.z, r: 1.0 }));
    w.colliders.push(...cols);
    return () => {
      w.colliders = w.colliders.filter((c) => !cols.includes(c));
    };
  }, [cleared]);

  useEffect(() => {
    const offs = BRAMBLES.map((b) =>
      registerInteractable({
        id: b.id,
        x: b.x,
        z: b.z,
        radius: 2.6,
        approach: 1.7,
        label: () => tr().kusut.bramble,
        verb: 'touch',
        enabled: () => level().kusutStage === 'brambles' && !level().brambles.includes(b.id),
        onInteract: () => {
          const g = useGame.getState();
          const list = [...level().brambles, b.id];
          setLevel({ brambles: list });
          g.playEmote('collect', 1.2);
          audio.sfx('magic', { pitch: 1.2 });
          spawnBurst(b.x, gy(b.x, b.z) + 1, b.z, '#fff3a0', 50, { speed: 3 });
          spawnBurst(b.x, gy(b.x, b.z) + 0.6, b.z, '#9df07a', 30, { speed: 2 });
          toast(tr().kusut.brambleGone, tr().kusut.brambleCount(list.length, BRAMBLES.length), '✦');
          if (list.length >= BRAMBLES.length)
            window.setTimeout(
              () =>
                useGame.getState().openDialogue(D().bramblesDone, () => {
                  setLevel({ kusutStage: 'chase' });
                  poof(KUSUT_SPOTS[0]);
                }),
              900,
            );
          else if (list.length === 1) window.setTimeout(() => useGame.getState().openDialogue(D().bramble), 700);
        },
      }),
    );
    return () => {
      offs.forEach((f) => f());
      useMatchHud.setState({ hud: null });
      matchInput.pull = null;
      match.game = { kind: 'none' };
    };
  }, []);

  /** Grumble vanishes in a puff of purple smoke and appears somewhere else */
  const poof = (to: { x: number; z: number } | null) => {
    const p = pos.current;
    spawnBurst(p.x, gy(p.x, p.z) + 0.7, p.z, '#b48cff', 40, { speed: 2.6 });
    audio.sfx('giggle', { pitch: 0.75, volume: 0.9 });
    audio.sfx('whoosh', { pitch: 0.8 });
    if (to) {
      pos.current = { ...to };
      spawnBurst(to.x, gy(to.x, to.z) + 0.7, to.z, '#b48cff', 30, { speed: 2 });
    }
    shown.current = !!to;
  };

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const g = useGame.getState();
    const l = g.level;
    const busy = g.paused || !!g.dialogue || !!g.cinematic || g.screen !== 'playing' || !g.worldReady;
    const p = player.position;

    // ---- story steps
    if (!busy) {
      if (!arrived.current && l.kusutStage === 'arrive' && Math.hypot(p.x - FAIRY_POS.x, p.z - FAIRY_POS.z) < 9) {
        arrived.current = true;
        player.lookAt = { x: KUSUT_START.x, z: KUSUT_START.z };
        g.openDialogue(D().arrive, () => {
          poof(null);
          setLevel({ kusutStage: 'brambles' });
        });
      } else if (l.kusutStage === 'chase' && shown.current && !busyCatch.current && Math.hypot(p.x - pos.current.x, p.z - pos.current.z) < CATCH_DIST) {
        busyCatch.current = true;
        player.lookAt = { ...pos.current };
        const n = l.bells;
        audio.sfx('giggle', { pitch: 0.8 });
        const last = n + 1 >= BELLS;
        g.openDialogue(last ? D().challenge : [D().caught[Math.min(n, D().caught.length - 1)]], () => {
          setLevel({ bells: n + 1 });
          audio.sfx('note', { pitch: 1.5 });
          spawnBurst(p.x, p.y + 1.2, p.z, '#ffd23f', 30, { speed: 2 });
          toast(tr().kusut.bell, tr().kusut.bellCount(n + 1, BELLS), '🔔');
          if (last) {
            setLevel({ kusutStage: 'arena' });
            poof({ x: ARENA.x + 1.5, z: ARENA.z - 1.5 });
          } else poof(KUSUT_SPOTS[n + 1]);
          busyCatch.current = false;
        });
      } else if (l.kusutStage === 'arena' && Math.hypot(p.x - ARENA.x, p.z - ARENA.z) < 4.5) {
        player.lookAt = { ...pos.current };
        setLevel({ kusutStage: 'match', match: { round: 0, anet: 0, kusut: 0, losses: 0, results: [null, null, null] } });
        g.openDialogue(D().matchStart, () => beginRound(0));
      }
    }

    // ---- match games
    const gm = match.game;
    if (!busy && gm.kind !== 'none' && gm.kind !== 'race') {
      if (gm.kind === 'ffCount' || gm.kind === 'tugCount') {
        const before = Math.ceil(COUNT - gm.t);
        gm.t += dt;
        if (Math.ceil(COUNT - gm.t) !== before && Math.ceil(COUNT - gm.t) > 0) audio.sfx('tap', { pitch: 1.2 });
        if (gm.kind === 'tugCount') player.ride = { x: TUG_A.x, y: gy(TUG_A.x, TUG_A.z), z: TUG_A.z, facing: Math.PI / 2 };
        if (gm.t >= COUNT) {
          audio.sfx('whoosh', { pitch: 1.1 });
          match.game = gm.kind === 'ffCount' ? { kind: 'ff', t: 0, mine: 0, theirs: 0 } : { kind: 'tug', t: 0, v: 0 };
        }
      } else if (gm.kind === 'ff') {
        gm.t += dt;
        // Anet catches a firefly by walking into it; Grumble zips to the nearest one
        match.flies.forEach((f, i) => {
          if (Math.hypot(p.x - f.x, p.z - f.z) < 1.2) {
            gm.mine++;
            audio.sfx('star', { pitch: 1 + gm.mine * 0.03, volume: 0.7 });
            spawnBurst(f.x, gy(f.x, f.z) + 1, f.z, '#d6ff7a', 16, { speed: 1.6 });
            match.flies[i] = newFly();
          }
        });
        let bi = 0;
        let bd = Infinity;
        match.flies.forEach((f, i) => {
          const d = Math.hypot(f.x - match.kx, f.z - match.kz);
          if (d < bd) {
            bd = d;
            bi = i;
          }
        });
        const f = match.flies[bi];
        const sp = 2.5 * ease() * dt;
        if (bd < 0.6) {
          gm.theirs++;
          audio.sfx('pop', { pitch: 0.8, volume: 0.6 });
          spawnBurst(f.x, gy(f.x, f.z) + 1, f.z, '#b48cff', 12, { speed: 1.4 });
          match.flies[bi] = newFly();
        } else {
          match.kx += ((f.x - match.kx) / bd) * Math.min(sp, bd);
          match.kz += ((f.z - match.kz) / bd) * Math.min(sp, bd);
        }
        if (gm.t >= matchTiming.ff) endRound(gm.mine >= gm.theirs);
      } else if (gm.kind === 'tug') {
        gm.t += dt;
        // Anet's pulls count first, so reaching her side is a win straight away
        if (gm.v < 1) gm.v -= 0.28 * ease() * (1 + 0.45 * Math.sin(gm.t * 2.3)) * dt;
        player.ride = { x: TUG_A.x + gm.v * 1.1, y: gy(TUG_A.x, TUG_A.z), z: TUG_A.z, facing: Math.PI / 2 };
        if (gm.v >= 1 || gm.v <= -1 || gm.t >= matchTiming.tug) {
          const won = gm.v >= 0;
          match.game = { kind: 'none' };
          endRound(won);
        }
      }
    }
    if (gm.kind === 'tug' || gm.kind === 'tugCount') {
      // camera from the side so the rope goes left to right
      cameraState.yaw += angleDelta(cameraState.yaw, 0) * damp(3, dt);
      cameraState.pitch += (0.28 - cameraState.pitch) * damp(2, dt);
      cameraState.distance += (7 - cameraState.distance) * damp(2, dt);
      input.lastLookTime = performance.now();
    }
    if (gm.kind !== 'none' && gm.kind !== 'race' && Math.floor(t * 8) !== Math.floor((t - dt) * 8)) pushHud();

    // ---- place Grumble
    const k = kusut.current;
    let kx = pos.current.x;
    let kz = pos.current.z;
    let face = Math.atan2(p.x - kx, p.z - kz);
    if (l.kusutStage === 'match' || l.kusutStage === 'done') {
      if (gm.kind === 'ff' || gm.kind === 'ffCount') {
        kx = match.kx;
        kz = match.kz;
      } else if (gm.kind === 'tug' || gm.kind === 'tugCount') {
        kx = TUG_K.x + (gm.kind === 'tug' ? gm.v * 1.1 : 0);
        kz = TUG_K.z;
        face = -Math.PI / 2;
      } else {
        kx = match.kx;
        kz = match.kz;
      }
    }
    k.visible = shown.current && match.game.kind !== 'race';
    k.position.set(kx, gy(kx, kz), kz);
    k.rotation.y += angleDelta(k.rotation.y, face) * damp(6, dt);
    if (k.visible) setAnimalSpot('kusut', 0, kx, kz);
  });

  const lively = stage === 'chase' || stage === 'done' || stage === 'match';
  return (
    <group>
      <group ref={kusut} position={[KUSUT_START.x, gy(KUSUT_START.x, KUSUT_START.z), KUSUT_START.z]}>
        <Kusut happy={stage === 'done'} lively={lively} scale={1.1} />
      </group>
      {BRAMBLES.map((b) => (
        <Bramble key={b.id} id={b.id} x={b.x} z={b.z} />
      ))}
      <Arena />
      <Fireflies />
      <Rope />
      {stage === 'done' && <Sparkles count={80} scale={[12, 5, 12]} position={[ARENA.x, gy(ARENA.x, ARENA.z) + 2, ARENA.z]} size={6} speed={0.7} color="#ffe6ff" />}
    </group>
  );
}

// ------------------------------------------------------------------------------------- visuals

const thorn = new THREE.MeshStandardMaterial({ color: '#3f6b3a', roughness: 0.9, flatShading: true });
const spike = new THREE.MeshStandardMaterial({ color: '#7a4a2e', roughness: 0.8 });
const berry = new THREE.MeshStandardMaterial({ color: '#8a4fd0', emissive: '#4b2a7a', emissiveIntensity: 0.4 });

function Bramble({ id, x, z }: { id: string; x: number; z: number }) {
  const ref = useRef<THREE.Group>(null!);
  const goneAt = useRef<number | null>(null);
  const parts = useMemo(() => {
    const r = mulberry32(id.length * 31 + x * 7);
    return {
      blobs: Array.from({ length: 6 }, () => [(r() - 0.5) * 1.4, 0.35 + r() * 0.5, (r() - 0.5) * 1.4, 0.45 + r() * 0.3] as const),
      spikes: Array.from({ length: 26 }, () => {
        const u = r() * Math.PI * 2;
        const v = 0.3 + r() * 0.9;
        const n = new THREE.Vector3(Math.cos(u), v, Math.sin(u)).normalize();
        return { p: n.clone().multiplyScalar(0.85).add(new THREE.Vector3(0, 0.45, 0)), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n) };
      }),
      berries: Array.from({ length: 7 }, () => [(r() - 0.5) * 1.5, 0.5 + r() * 0.6, (r() - 0.5) * 1.5] as const),
    };
  }, [id, x]);
  useFrame(({ clock }) => {
    const gone = level().brambles.includes(id);
    if (gone && goneAt.current == null) goneAt.current = clock.elapsedTime;
    const s = goneAt.current == null ? 1 + Math.sin(clock.elapsedTime * 2 + x) * 0.03 : Math.max(0, 1 - (clock.elapsedTime - goneAt.current) * 1.4);
    ref.current.scale.setScalar(Math.max(0.001, s));
    ref.current.visible = s > 0.01;
  });
  return (
    <group ref={ref} position={[x, gy(x, z), z]}>
      {parts.blobs.map(([bx, by, bz, br], i) => (
        <mesh key={i} position={[bx, by, bz]} material={thorn} castShadow>
          <icosahedronGeometry args={[br, 1]} />
        </mesh>
      ))}
      {parts.spikes.map((s, i) => (
        <mesh key={i} position={s.p} quaternion={s.q} material={spike}>
          <coneGeometry args={[0.05, 0.28, 5]} />
        </mesh>
      ))}
      {parts.berries.map(([bx, by, bz], i) => (
        <mesh key={i} position={[bx, by, bz]} material={berry}>
          <sphereGeometry args={[0.07, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/** bunting flags around the flower meadow (the match arena) */
function Arena() {
  const flags = useMemo(() => {
    const out: { x: number; z: number; a: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      out.push({ x: ARENA.x + Math.cos(a) * (ARENA.r + 1.2), z: ARENA.z + Math.sin(a) * (ARENA.r + 1.2), a });
    }
    return out;
  }, []);
  const colors = ['#ff7ab0', '#ffd23f', '#7fd6ff', '#9df07a', '#c9a7ff'];
  return (
    <group>
      {flags.map((f, i) => (
        <group key={i} position={[f.x, gy(f.x, f.z), f.z]} rotation={[0, -f.a, 0]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 2.2, 6]} />
            <meshStandardMaterial color="#8a5a36" />
          </mesh>
          <mesh position={[0, 1.9, 0.22]} rotation={[0, Math.PI / 2, 0]}>
            <coneGeometry args={[0.22, 0.45, 3]} />
            <meshStandardMaterial color={colors[i % colors.length]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Fireflies() {
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const tex = useMemo(() => glowTexture(), []);
  const mat = useMemo(() => new THREE.SpriteMaterial({ map: tex, color: '#e6ff8a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), [tex]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const on = match.game.kind === 'ff' || match.game.kind === 'ffCount';
    refs.current.forEach((s, i) => {
      if (!s) return;
      const f = match.flies[i];
      s.visible = on && !!f;
      if (!f) return;
      s.position.set(f.x + Math.sin(t * 2 + i) * 0.15, gy(f.x, f.z) + 1.0 + Math.sin(t * 3 + i * 1.7) * 0.2, f.z + Math.cos(t * 2.3 + i) * 0.15);
      s.scale.setScalar(0.55 + Math.sin(t * 6 + i) * 0.12);
    });
  });
  return (
    <>
      {Array.from({ length: FF_COUNT }, (_, i) => (
        <sprite key={i} ref={(el) => (refs.current[i] = el)} material={mat} visible={false} />
      ))}
    </>
  );
}

/** the tug-of-war rope with a red ribbon in the middle */
function Rope() {
  const ref = useRef<THREE.Group>(null!);
  const knot = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    const gm = match.game;
    const on = gm.kind === 'tug' || gm.kind === 'tugCount';
    ref.current.visible = on;
    if (!on) return;
    const v = gm.kind === 'tug' ? gm.v : 0;
    ref.current.position.set(ARENA.x + v * 1.1, gy(ARENA.x, ARENA.z) + 0.75, ARENA.z);
    knot.current.rotation.x += 0.02;
  });
  return (
    <group ref={ref} visible={false}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 3.2, 8]} />
        <meshStandardMaterial color="#d9c08a" roughness={1} />
      </mesh>
      <mesh ref={knot}>
        <torusGeometry args={[0.1, 0.05, 6, 12]} />
        <meshStandardMaterial color="#e0625a" />
      </mesh>
    </group>
  );
}
