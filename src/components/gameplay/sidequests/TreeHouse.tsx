/**
 * Anet's tree house (World 1). A big oak stands at the south end of the main path, with a plan
 * board at its foot. Each part is built with twig bundles (found lying around the forest) and golden
 * acorns from the pouch:
 *   1. floor and ladder  2. little house with a roof  3. railing, flag and fairy lights  4. a swing
 * The next part is always shown as a see-through "blueprint", so a child can see what comes next.
 * Climb the ladder (it takes you up and down), and swing on the swing once it is built.
 */
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { getWorldPhysics, type CircleCollider, type Platform } from '../../../systems/physics';
import { registerInteractable } from '../interaction/interactions';
import { TREEHOUSE, TWIGS, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst, spawnDust } from '../../effects/Bursts';
import { forestDialogue as D } from '../../../data/forestDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { tr } from '../../../i18n';

/** what each part costs (twigs, acorns) */
export const PARTS = [
  { id: 'floor', twigs: 2, acorns: 5 },
  { id: 'house', twigs: 3, acorns: 8 },
  { id: 'deck', twigs: 2, acorns: 5 },
  { id: 'swing', twigs: 0, acorns: 6 },
] as const;

const T = TREEHOUSE;
const GY = terrainHeight(T.x, T.z);
const TOP = GY + T.h;
const LADDER_FOOT = { x: T.x, z: T.z - 3.3 };
const LADDER_TOP = { x: T.x, z: T.z - 1.9 };
const SIGN = { x: T.x - 2.7, z: T.z - 3.5 };
/** climbing: number of steps, seconds per rung, time to step between ladder and deck */
const RUNGS = 7;
const STEP_T = 0.4;
const DECK_T = 0.45;
/** how far in front of the ladder Anet's feet are while she holds on */
const HOLD = 0.32;
/** the ladder leans on the deck: its z at a given height */
const ladderZ = (y: number) => LADDER_FOOT.z + ((y - GY) / T.h) * 1.4;
const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
const SWING = { x: T.x + 3.2, z: T.z, anchorY: GY + 4.4, len: 3.75 };

const fresh = () => ({ stage: 0, twigs: [] as string[], seen: false });
export const getTreehouse = () => useGame.getState().save.treehouse ?? fresh();
const twigsUsed = (stage: number) => PARTS.slice(0, stage).reduce((n, p) => n + p.twigs, 0);
export const twigsFree = () => {
  const th = getTreehouse();
  return th.twigs.length - twigsUsed(th.stage);
};

function toast(title: string, text: string, icon: string) {
  useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now() + Math.random(), title, text, icon }] }));
  const id = useGame.getState().toasts.at(-1)!.id;
  window.setTimeout(() => useGame.getState().dismissToast(id), 2600);
}

/** HUD line under the mission */
export function treehouseStatus() {
  const th = useGame.getState().save.treehouse;
  if (!th?.seen || th.stage >= PARTS.length) return null;
  const part = PARTS[th.stage];
  const acorns = useGame.getState().save.acorns ?? 0;
  return '🏠 ' + tr().hud.treehouse(tr().treehouse.parts[part.id], Math.min(twigsFree(), part.twigs), part.twigs, Math.min(acorns, part.acorns), part.acorns);
}

/** what the player is doing at the tree house right now (climbing / swinging) */
const act = { kind: null as null | 'up' | 'down' | 'swing', t: 0 };
let building = false;

function build() {
  const g = useGame.getState();
  const th = getTreehouse();
  if (th.stage >= PARTS.length || building) return;
  const part = PARTS[th.stage];
  const needT = Math.max(0, part.twigs - twigsFree());
  const needA = Math.max(0, part.acorns - (g.save.acorns ?? 0));
  player.lookAt = { x: T.x, z: T.z };
  if (needT || needA) {
    g.openDialogue(D().treeNeed(needT, needA));
    return;
  }
  building = true;
  g.addAcorns(-part.acorns);
  g.playEmote('collect', 1.4);
  const where = partSpot(part.id);
  for (let k = 0; k < 5; k++)
    window.setTimeout(() => {
      audio.sfx('stepWood', { volume: 1.2, pitch: 0.9 + k * 0.05 });
      spawnDust(where.x + (Math.random() - 0.5) * 1.5, where.y, where.z + (Math.random() - 0.5) * 1.5, 6, 0.8);
    }, k * 230);
  window.setTimeout(() => {
    building = false;
    const cur = getTreehouse();
    useGame.getState().setTreehouse({ ...cur, stage: cur.stage + 1 });
    useGame.setState((s) => ({ level: { ...s.level, lastProgressAt: performance.now() } }));
    audio.sfx('magic');
    spawnBurst(where.x, where.y + 0.8, where.z, '#fff3a0', 40, { speed: 2.6 });
    toast(tr().treehouse.built, tr().treehouse.parts[part.id], '🏠');
    if (cur.stage + 1 >= PARTS.length) {
      const s = useGame.getState();
      s.unlockAchievement('tree_house', ACHIEVEMENTS.tree_house.title, ACHIEVEMENTS.tree_house.icon);
      s.playEmote('celebrate', 2);
      window.setTimeout(() => useGame.getState().openDialogue(D().treeDone), 900);
    } else if (part.id === 'floor') window.setTimeout(() => useGame.getState().openDialogue(D().treeFloor), 700);
  }, 1300);
}

function partSpot(id: string) {
  if (id === 'swing') return { x: SWING.x, y: GY + 1, z: SWING.z };
  if (id === 'floor') return { x: T.x, y: GY + 1.5, z: T.z - 1.5 };
  return { x: T.x, y: TOP + 1, z: T.z };
}

export function TreeHouse() {
  const stage = useGame((s) => s.save.treehouse?.stage ?? 0);
  const twigs = useGame((s) => s.save.treehouse?.twigs);
  const swing = useRef<THREE.Group>(null!);
  const popAt = useRef(-10);
  const lastRung = useRef(-1);
  const lastStage = useRef(stage);
  const partRefs = useRef<(THREE.Group | null)[]>([]);
  if (lastStage.current !== stage) {
    if (stage > lastStage.current) popAt.current = performance.now();
    lastStage.current = stage;
  }

  // the floor (and the little house) become part of the world physics once built
  useEffect(() => {
    const w = getWorldPhysics();
    const plats: Platform[] = stage >= 1 ? [{ x: T.x, z: T.z, r: T.r, top: TOP }] : [];
    const cols: CircleCollider[] = stage >= 2 ? [-0.75, 0.75].map((dx) => ({ x: T.x + dx, z: T.z + 1.3, r: 0.85 })) : [];
    w.platforms.push(...plats);
    w.colliders.push(...cols);
    return () => {
      w.platforms = w.platforms.filter((p) => !plats.includes(p));
      w.colliders = w.colliders.filter((c) => !cols.includes(c));
    };
  }, [stage]);

  useEffect(() => {
    const low = () => player.position.y < TOP - 0.8;
    const offs = [
      registerInteractable({
        id: 'treehouse-plan',
        x: SIGN.x,
        z: SIGN.z,
        radius: 1.7,
        approach: 1.0,
        label: () => {
          const th = getTreehouse();
          const p = PARTS[th.stage];
          return tr().prompts.build(tr().treehouse.parts[p.id], p.twigs, p.acorns);
        },
        verb: 'touch',
        enabled: () => getTreehouse().stage < PARTS.length && low() && !act.kind,
        onInteract: build,
      }),
      registerInteractable({
        id: 'treehouse-up',
        x: LADDER_FOOT.x,
        z: LADDER_FOOT.z,
        radius: 1.3,
        approach: 0.5,
        label: () => tr().prompts.climbUp,
        verb: 'touch',
        enabled: () => getTreehouse().stage >= 1 && low() && !act.kind,
        onInteract: () => Object.assign(act, { kind: 'up', t: 0 }),
      }),
      registerInteractable({
        id: 'treehouse-down',
        x: LADDER_TOP.x,
        z: LADDER_TOP.z - 0.2,
        radius: 1.0,
        approach: 0.3,
        label: () => tr().prompts.climbDown,
        verb: 'touch',
        enabled: () => getTreehouse().stage >= 1 && player.position.y > TOP - 0.4 && !act.kind,
        onInteract: () => Object.assign(act, { kind: 'down', t: 0 }),
      }),
      registerInteractable({
        id: 'treehouse-swing',
        x: SWING.x,
        z: SWING.z,
        radius: 1.4,
        approach: 0.4,
        label: () => tr().prompts.swing,
        verb: 'touch',
        enabled: () => getTreehouse().stage >= 4 && low() && !act.kind,
        onInteract: () => {
          Object.assign(act, { kind: 'swing', t: 0 });
          audio.sfx('giggle', { volume: 0.7 });
        },
      }),
    ];
    return () => {
      offs.forEach((f) => f());
      act.kind = null;
      player.ride = null;
    };
  }, []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const g = useGame.getState();
    const busy = g.paused || !!g.dialogue || !!g.cinematic || g.screen !== 'playing';
    const p = player.position;

    // the newest part pops into place
    const since = (performance.now() - popAt.current) / 1000;
    const pop = since < 0.9 ? 1 - Math.exp(-since * 6) * Math.cos(since * 16) * 0.5 : 1;
    const newest = partRefs.current[stage - 1];
    if (newest) newest.scale.setScalar(Math.max(0.3, pop));

    // climbing and swinging (Anet is placed by the activity, like riding the leaf)
    let swingA = Math.sin(t * 0.9) * 0.05;
    if (act.kind && !busy) act.t += dt;
    if (act.kind === 'up' || act.kind === 'down') {
      // rung by rung: each step lifts (or lowers) the body one rung, with a little pause between steps;
      // up there she steps off onto the deck, and going down she first steps back onto the ladder
      const climbT = RUNGS * STEP_T;
      const up = act.kind === 'up';
      const tc = up ? act.t : act.t - DECK_T;
      const k = Math.min(1, Math.max(0, tc / climbT));
      const step = Math.min(RUNGS - 1, Math.floor(k * RUNGS));
      const within = k * RUNGS - step;
      const eased = smooth(0.2, 0.85, within);
      const f = up ? (step + eased) / RUNGS : 1 - (step + eased) / RUNGS;
      const y = GY + f * (TOP - GY);
      const phase = (step + within) * Math.PI;
      const onDeck = up ? act.t > climbT : act.t < DECK_T;
      if (onDeck) {
        // stepping between the top of the ladder and the deck
        const d = up ? Math.min(1, (act.t - climbT) / DECK_T) : 1 - Math.min(1, act.t / DECK_T);
        player.ride = { x: T.x, y: TOP, z: ladderZ(TOP) - HOLD + d * (LADDER_TOP.z - (ladderZ(TOP) - HOLD)), facing: up ? d * Math.PI : 0, pose: 'walk', phase: d * Math.PI * 2 };
      } else {
        player.ride = { x: T.x, y, z: ladderZ(y) - HOLD, facing: 0, pose: 'climb', phase };
      }
      if (!onDeck && Math.floor(k * RUNGS) !== lastRung.current) {
        lastRung.current = Math.floor(k * RUNGS);
        audio.sfx('stepWood', { volume: 0.55, pitch: 1.1 + Math.random() * 0.15 });
      }
      const total = climbT + DECK_T;
      if (act.t >= total) {
        player.ride = null;
        lastRung.current = -1;
        if (up) player.teleport(LADDER_TOP.x, TOP, LADDER_TOP.z, Math.PI);
        else player.teleport(LADDER_FOOT.x, GY, LADDER_FOOT.z - 0.55, Math.PI);
        act.kind = null;
      }
    } else if (act.kind === 'swing') {
      const env = Math.min(1, act.t / 1.5) * Math.min(1, Math.max(0, 7 - act.t) / 1.5);
      swingA = Math.sin(act.t * 1.7) * 0.6 * env;
      const L = SWING.len;
      player.ride = { x: SWING.x, y: SWING.anchorY - Math.cos(swingA) * L + 0.05, z: SWING.z + Math.sin(swingA) * L, facing: 0 };
      if (act.t >= 7) {
        player.ride = null;
        player.teleport(SWING.x - 0.9, GY, SWING.z, -Math.PI / 2);
        act.kind = null;
        g.unlockAchievement('swing_high', ACHIEVEMENTS.swing_high.title, ACHIEVEMENTS.swing_high.icon);
      }
    }
    if (swing.current) swing.current.rotation.x = -swingA;

    if (busy || act.kind) return;
    // first visit
    const th = getTreehouse();
    const d = Math.hypot(p.x - T.x, p.z - T.z);
    if (!th.seen && d < 6.5) {
      g.setTreehouse({ ...th, seen: true });
      g.openDialogue(D().treeIntro);
      return;
    }
    // pick up twig bundles by walking over them
    for (const tw of TWIGS) {
      if (th.twigs.includes(tw.id)) continue;
      if (Math.hypot(p.x - tw.x, p.z - tw.z) < 1.0 && p.y < terrainHeight(tw.x, tw.z) + 1) {
        const twigs = [...th.twigs, tw.id];
        g.setTreehouse({ ...th, twigs });
        audio.sfx('pop', { pitch: 0.9 });
        spawnBurst(tw.x, terrainHeight(tw.x, tw.z) + 0.4, tw.z, '#c9915a', 18, { speed: 1.6 });
        toast(tr().treehouse.twig, tr().treehouse.twigCount(twigs.length, TWIGS.length), '🪵');
        g.playEmote('collect', 1);
        break;
      }
    }
  });

  const ghost = useMemo(() => new THREE.MeshBasicMaterial({ color: '#9fd7ff', transparent: true, opacity: 0.32, depthWrite: false }), []);
  const parts = [Floor, House, Deck, Swing];

  return (
    <group>
      <group position={[T.x, GY, T.z]}>
        <Oak />
        {parts.map((Part, i) =>
          i < stage ? (
            <group key={i} ref={(el) => (partRefs.current[i] = el)}>
              <Part swingRef={swing} />
            </group>
          ) : i === stage ? (
            <group key={i}>
              <Part ghost={ghost} swingRef={swing} />
            </group>
          ) : null,
        )}
      </group>
      <PlanBoard />
      <Twigs collected={twigs ?? []} />
    </group>
  );
}

// ------------------------------------------------------------------------------------- visuals

type PartProps = { ghost?: THREE.Material; swingRef?: RefObject<THREE.Group | null> };
const M = {
  wood: new THREE.MeshStandardMaterial({ color: '#b07a45', roughness: 0.85 }),
  dark: new THREE.MeshStandardMaterial({ color: '#7d5236', roughness: 0.9 }),
  light: new THREE.MeshStandardMaterial({ color: '#e9c48a', roughness: 0.8 }),
  roof: new THREE.MeshStandardMaterial({ color: '#e0625a', roughness: 0.7 }),
  window: new THREE.MeshStandardMaterial({ color: '#bfe9ff', emissive: '#ffd27a', emissiveIntensity: 0.25, roughness: 0.2 }),
  rope: new THREE.MeshStandardMaterial({ color: '#d9c08a', roughness: 1 }),
  flag: new THREE.MeshStandardMaterial({ color: '#ffd23f', roughness: 0.6, side: THREE.DoubleSide }),
};
const pick = (ghost: THREE.Material | undefined, m: THREE.Material) => ghost ?? m;
const H = T.h;

function Oak() {
  const leaves = useMemo(
    () => [
      [0, 9.0, 0, 2.7],
      [2.0, 8.4, 0.6, 2.0],
      [-1.9, 8.5, -0.4, 2.1],
      [0.4, 8.3, -2.0, 1.9],
      [-0.5, 8.4, 2.0, 1.9],
      [0.2, 10.4, 0.2, 1.8],
    ],
    [],
  );
  return (
    <group>
      <mesh position={[0, 4.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 1.05, 8.4, 14]} />
        <meshStandardMaterial color="#7a5034" roughness={0.95} />
      </mesh>
      {[0, 1.6, 3.2, 4.7].map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 1.0, 0.2, Math.cos(a) * 1.0]} rotation={[Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9]} castShadow>
          <cylinderGeometry args={[0.16, 0.32, 1.1, 8]} />
          <meshStandardMaterial color="#7a5034" roughness={0.95} />
        </mesh>
      ))}
      {leaves.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={i % 2 ? '#4fa547' : '#5cb84e'} roughness={0.85} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Floor({ ghost }: PartProps) {
  const rungs = 7;
  return (
    <group>
      {/* round deck of planks around the trunk */}
      <mesh position={[0, H - 0.09, 0]} material={pick(ghost, M.wood)} castShadow receiveShadow>
        <cylinderGeometry args={[T.r, T.r, 0.18, 28]} />
      </mesh>
      {!ghost &&
        [-1.6, -0.8, 0, 0.8, 1.6].map((x, i) => (
          <mesh key={i} position={[x, H + 0.005, 0]} material={M.dark}>
            <boxGeometry args={[0.03, 0.01, Math.sqrt(Math.max(0.1, T.r * T.r - x * x)) * 2 - 0.1]} />
          </mesh>
        ))}
      {/* stilts */}
      {[0.8, 2.35, 3.9, 5.5].map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * (T.r - 0.3), H / 2, Math.cos(a) * (T.r - 0.3)]} material={pick(ghost, M.dark)} castShadow>
          <cylinderGeometry args={[0.12, 0.14, H, 8]} />
        </mesh>
      ))}
      {/* ladder leaning on the deck, facing the path */}
      <group position={[0, 0, -3.3]} rotation={[Math.atan2(1.4, H), 0, 0]}>
        {[-0.32, 0.32].map((x) => (
          <mesh key={x} position={[x, Math.hypot(H, 1.4) / 2, 0]} material={pick(ghost, M.dark)} castShadow>
            <boxGeometry args={[0.08, Math.hypot(H, 1.4), 0.08]} />
          </mesh>
        ))}
        {Array.from({ length: rungs }, (_, i) => (
          <mesh key={i} position={[0, 0.35 + (i * (Math.hypot(H, 1.4) - 0.5)) / (rungs - 1), 0]} material={pick(ghost, M.wood)}>
            <boxGeometry args={[0.64, 0.06, 0.1]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function House({ ghost }: PartProps) {
  const z = 1.3;
  return (
    <group position={[0, H, z]}>
      <mesh position={[0, 0.85, 0]} material={pick(ghost, M.light)} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.7, 1.6]} />
      </mesh>
      <mesh position={[0, 2.25, 0]} rotation={[0, Math.PI / 4, 0]} material={pick(ghost, M.roof)} castShadow>
        <coneGeometry args={[1.95, 1.1, 4]} />
      </mesh>
      {!ghost && (
        <>
          {/* door (west side) and round windows */}
          <mesh position={[-1.26, 0.6, 0.15]} material={M.dark}>
            <boxGeometry args={[0.03, 1.1, 0.6]} />
          </mesh>
          <mesh position={[-1.28, 0.62, 0.36]} material={M.flag}>
            <sphereGeometry args={[0.045, 8, 6]} />
          </mesh>
          {[-0.7, 0.7].map((x) => (
            <mesh key={x} position={[x, 1.0, -0.81]} rotation={[Math.PI / 2, 0, 0]} material={M.window}>
              <cylinderGeometry args={[0.24, 0.24, 0.03, 18]} />
            </mesh>
          ))}
          <mesh position={[1.26, 1.0, 0.1]} rotation={[0, 0, Math.PI / 2]} material={M.window}>
            <cylinderGeometry args={[0.26, 0.26, 0.03, 18]} />
          </mesh>
        </>
      )}
    </group>
  );
}

function Deck({ ghost }: PartProps) {
  const posts = useMemo(() => {
    const out: number[] = [];
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI))) < 0.4) continue; // gap for the ladder
      const z = Math.cos(a) * (T.r - 0.08);
      const x = Math.sin(a) * (T.r - 0.08);
      if (z > 0.4 && Math.abs(x) < 1.35) continue; // behind the little house
      out.push(a);
    }
    return out;
  }, []);
  const lights = ['#ff7ab0', '#ffd23f', '#7fd6ff', '#9df07a', '#c79bff'];
  return (
    <group position={[0, H, 0]}>
      {posts.map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * (T.r - 0.08), 0.38, Math.cos(a) * (T.r - 0.08)]} material={pick(ghost, M.dark)}>
          <boxGeometry args={[0.07, 0.76, 0.07]} />
        </mesh>
      ))}
      {/* the rail: a ring with a gap at the ladder */}
      <mesh position={[0, 0.76, 0]} rotation={[Math.PI / 2, 0, -Math.PI / 2 + 0.4]} material={pick(ghost, M.wood)}>
        <torusGeometry args={[T.r - 0.08, 0.05, 6, 48, Math.PI * 2 - 0.8]} />
      </mesh>
      {!ghost &&
        posts.map((a, i) => (
          <mesh key={'l' + i} position={[Math.sin(a) * (T.r - 0.08), 0.86, Math.cos(a) * (T.r - 0.08)]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshStandardMaterial color={lights[i % lights.length]} emissive={lights[i % lights.length]} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        ))}
      {/* flag on the roof */}
      <group position={[0, 2.8, 1.3]}>
        <mesh position={[0, 0.45, 0]} material={pick(ghost, M.dark)}>
          <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
        </mesh>
        <mesh position={[0.25, 0.72, 0]} material={pick(ghost, M.flag)}>
          <planeGeometry args={[0.46, 0.3]} />
        </mesh>
      </group>
    </group>
  );
}

function Swing({ ghost, swingRef }: PartProps) {
  const L = SWING.len;
  const ax = SWING.x - T.x;
  const ay = SWING.anchorY - GY;
  return (
    <group>
      {/* a strong branch reaching out from the trunk */}
      <mesh position={[ax / 2 + 0.2, ay + 0.05, 0]} rotation={[0, 0, Math.PI / 2 - 0.08]} material={pick(ghost, M.dark)} castShadow>
        <cylinderGeometry args={[0.13, 0.22, ax + 0.4, 8]} />
      </mesh>
      <group ref={ghost ? undefined : swingRef} position={[ax, ay, 0]}>
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, -L / 2, 0]} material={pick(ghost, M.rope)}>
            <cylinderGeometry args={[0.02, 0.02, L, 5]} />
          </mesh>
        ))}
        <mesh position={[0, -L, 0]} material={pick(ghost, M.wood)} castShadow>
          <boxGeometry args={[0.75, 0.07, 0.34]} />
        </mesh>
      </group>
    </group>
  );
}

function PlanBoard() {
  const y = terrainHeight(SIGN.x, SIGN.z);
  return (
    <group position={[SIGN.x, y, SIGN.z]} rotation={[0, Math.PI + 0.5, 0]}>
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]} material={M.dark} castShadow>
          <boxGeometry args={[0.08, 1.0, 0.08]} />
        </mesh>
      ))}
      <mesh position={[0, 0.95, 0]} material={M.light} castShadow>
        <boxGeometry args={[1.1, 0.7, 0.05]} />
      </mesh>
      {/* a little drawing of the tree house on the plan */}
      <mesh position={[0, 0.82, 0.03]}>
        <boxGeometry args={[0.5, 0.04, 0.01]} />
        <meshStandardMaterial color="#5a8ad0" />
      </mesh>
      <mesh position={[0.1, 0.98, 0.03]}>
        <boxGeometry args={[0.3, 0.22, 0.01]} />
        <meshStandardMaterial color="#5a8ad0" />
      </mesh>
      <mesh position={[0.1, 1.15, 0.03]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.2, 0.2, 0.01]} />
        <meshStandardMaterial color="#e0625a" />
      </mesh>
    </group>
  );
}

function Twigs({ collected }: { collected: string[] }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }) => {
    refs.current.forEach((r, i) => {
      if (r) r.rotation.y = Math.sin(clock.elapsedTime * 0.8 + i) * 0.3;
    });
  });
  return (
    <>
      {TWIGS.map((tw, i) =>
        collected.includes(tw.id) ? null : (
          <group key={tw.id} ref={(el) => (refs.current[i] = el)} position={[tw.x, terrainHeight(tw.x, tw.z) + 0.12, tw.z]}>
            {[-0.12, 0, 0.12].map((dz, k) => (
              <mesh key={k} position={[0, k === 1 ? 0.1 : 0, dz]} rotation={[0, (k - 1) * 0.15, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.045, 0.055, 0.9, 6]} />
                <meshStandardMaterial color={k === 1 ? '#9a6a3e' : '#8a5a36'} roughness={0.95} />
              </mesh>
            ))}
            <mesh position={[0, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.2, 0.04, 6, 14]} />
              <meshStandardMaterial color="#ff6fae" />
            </mesh>
            <Sparkles count={8} scale={[1.2, 0.8, 1.2]} position={[0, 0.4, 0]} size={4} speed={0.5} color="#fff3a0" />
          </group>
        ),
      )}
    </>
  );
}

