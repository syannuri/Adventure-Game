/**
 * Leaf race (World 1): a big leaf waits at the top of the forest stream. Anet hops on and races a
 * duck down the stream to the pond. Steer left and right to pop the bubbles, push forward to go
 * faster, and steer round the mossy rocks (bumping one only slows the leaf down). There is no way to
 * lose anything: the time, the bubbles and the best time are shown at the end.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../../systems/store';
import { player, cameraState } from '../../../systems/playerState';
import { input } from '../../../systems/input';
import { registerInteractable } from '../interaction/interactions';
import { POND, RACE_END_S, RACE_START_S, STREAM_HALF, streamAt, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { Duck } from '../../characters/npc/Duck';
import { Kusut } from '../../characters/npc/Kusut';
import { audio } from '../../audio/audioEngine';
import { spawnBurst, spawnDust } from '../../effects/Bursts';
import { forestDialogue as D } from '../../../data/forestDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { tr } from '../../../i18n';
import { angleDelta, damp } from '../../../utils/math';
import { rewardAcorns } from '../shop/KikiShopQuest';
import { setAnimalSpot } from '../../../systems/animalSpots';
import { useRaceHud, type RacePhase } from '../../../systems/raceHud';

const BASE = 2.7;
const FAST = 4.1;
const SLOW = 1.8;
const DUCK_SPEED = 2.85;
const LANE = STREAM_HALF - 0.45;
const COUNT = 3.2;
const RACE_LEN = RACE_END_S - RACE_START_S;

const BUBBLE_LATS = [0, 0.7, -0.7, 0.9, 0.2, -0.9, -0.3, 0.8, -0.6, 0.4, -0.9, 0];
const ROCKS = [
  { s: RACE_START_S + RACE_LEN * 0.3, lat: -0.55 },
  { s: RACE_START_S + RACE_LEN * 0.55, lat: 0.6 },
  { s: RACE_START_S + RACE_LEN * 0.8, lat: -0.1 },
];
export const BUBBLES = BUBBLE_LATS.map((lat, i) => {
  const s = RACE_START_S + 2.5 + (i / (BUBBLE_LATS.length - 1)) * (RACE_LEN - 3.5);
  // keep bubbles away from the rocks
  const rock = ROCKS.find((r) => Math.abs(r.s - s) < 1.2 && Math.abs(r.lat - lat) < 0.8);
  return { s, lat: rock ? (rock.lat > 0 ? rock.lat - 1.0 : rock.lat + 1.0) : lat };
});

/** a point of the stream at distance s, offset sideways by lat (+ is to the right looking downstream) */
function at(s: number, lat: number) {
  const p = streamAt(s);
  return { x: p.x - p.dz * lat, z: p.z + p.dx * lat, y: p.level, facing: Math.atan2(p.dx, p.dz), dx: p.dx, dz: p.dz };
}
/** the bank next to a point of the stream, on the side away from the pond */
function bankAt(s: number, off: number) {
  const a = at(s, STREAM_HALF + off);
  const b = at(s, -(STREAM_HALF + off));
  const pa = Math.hypot(a.x - POND.x, a.z - POND.z) + (Math.hypot(a.x, a.z) < 37 ? 0 : -50);
  const pb = Math.hypot(b.x - POND.x, b.z - POND.z) + (Math.hypot(b.x, b.z) < 37 ? 0 : -50);
  return pa >= pb ? a : b;
}
const DOCK = bankAt(RACE_START_S, 0.9);
const fmt = (t: number) => t.toFixed(1);

type Phase = RacePhase;
interface Race {
  phase: Phase;
  t: number;
  s: number;
  lat: number;
  speed: number;
  duckS: number;
  bubbles: boolean[];
  hitAt: number;
  time: number;
  duckTime: number | null;
}
const race: Race = { phase: 'idle', t: 0, s: RACE_START_S, lat: 0, speed: 0, duckS: RACE_START_S, bubbles: BUBBLES.map(() => false), hitAt: -10, time: 0, duckTime: null };
// automated tests read the race from here
if (typeof window !== 'undefined') Object.assign(window, { __anettRace: race, __anettRaceInfo: { dock: DOCK, bubbles: BUBBLES, rocks: ROCKS } });

/** set by the Si Kusut match: Grumble races instead of the duck and the result goes to the match */
export const raceControl = { rival: null as null | { speed: number; onFinish: (won: boolean) => void } };
const rivalSpeed = () => raceControl.rival?.speed ?? DUCK_SPEED;

function begin() {
  Object.assign(race, { phase: 'count', t: 0, s: RACE_START_S, lat: 0.35, speed: 0, duckS: RACE_START_S, bubbles: BUBBLES.map(() => false), hitAt: -10, time: 0, duckTime: null });
  audio.sfx('splash', { pitch: 1.3, volume: 0.5 });
}

/** start a race against Grumble right away (match game one) */
export function startMatchRace(speed: number, onFinish: (won: boolean) => void) {
  raceControl.rival = { speed, onFinish };
  begin();
}

function startRace() {
  const g = useGame.getState();
  if (!g.save.leafRace) {
    g.setLeafRace({ best: null, bubbles: 0, runs: 0, wins: 0 });
    g.openDialogue(D().raceIntro, begin);
  } else begin();
}

function finish() {
  const g = useGame.getState();
  if (raceControl.rival) {
    const cb = raceControl.rival.onFinish;
    const won = race.duckTime == null || race.time <= race.duckTime;
    raceControl.rival = null;
    const end = bankAt(RACE_END_S, 1.2);
    player.ride = null;
    player.teleport(end.x, terrainHeight(end.x, end.z), end.z, end.facing);
    g.playEmote(won ? 'celebrate' : 'wave', 2);
    race.phase = 'idle';
    cb(won);
    return;
  }
  const lr = g.save.leafRace ?? { best: null, bubbles: 0, runs: 0, wins: 0 };
  const n = race.bubbles.filter(Boolean).length;
  const won = race.duckTime == null || race.time <= race.duckTime;
  const record = lr.best == null || race.time < lr.best;
  g.setLeafRace({ best: record ? race.time : lr.best, bubbles: Math.max(lr.bubbles, n), runs: lr.runs + 1, wins: lr.wins + (won ? 1 : 0) });
  const end = bankAt(RACE_END_S, 1.2);
  player.ride = null;
  player.teleport(end.x, terrainHeight(end.x, end.z), end.z, end.facing);
  spawnBurst(end.x, end.y + 1.2, end.z, '#fff3a0', 50, { speed: 3 });
  audio.sfx(won ? 'achievement' : 'magic');
  g.playEmote(won ? 'celebrate' : 'wave', 2);
  if (lr.runs === 0) rewardAcorns(5);
  if (won) g.unlockAchievement('leaf_racer', ACHIEVEMENTS.leaf_racer.title, ACHIEVEMENTS.leaf_racer.icon);
  if (n === BUBBLES.length) g.unlockAchievement('bubble_catcher', ACHIEVEMENTS.bubble_catcher.title, ACHIEVEMENTS.bubble_catcher.icon);
  g.openDialogue([...D().raceResult(fmt(race.time), n, BUBBLES.length, record && lr.best != null), ...(won ? D().raceWin : D().raceLose)]);
  race.phase = 'idle';
}

export function LeafRace() {
  const leaf = useRef<THREE.Group>(null!);
  const duck = useRef<THREE.Group>(null!);
  const kusut = useRef<THREE.Group>(null!);
  const bubbleRefs = useRef<(THREE.Group | null)[]>([]);
  const lastHud = useRef(0);
  const BUBBLE_Y = useMemo(() => BUBBLES.map((b) => at(b.s, b.lat).y + 0.55), []);

  useEffect(() => {
    const off = registerInteractable({
      id: 'leaf-race',
      x: DOCK.x,
      z: DOCK.z,
      radius: 2.2,
      approach: 0.8,
      label: () => tr().prompts.leafRace,
      verb: 'touch',
      enabled: () => race.phase === 'idle' && useGame.getState().level.kusutStage !== 'match',
      onInteract: startRace,
    });
    return () => {
      off();
      useRaceHud.setState({ hud: null });
      race.phase = 'idle';
      player.ride = null;
    };
  }, []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const g = useGame.getState();
    const busy = g.paused || !!g.dialogue || !!g.cinematic || g.screen !== 'playing';

    if (!busy && race.phase !== 'idle') {
      race.t += dt;
      if (race.phase === 'count') {
        const before = Math.ceil(COUNT - (race.t - dt));
        const now = Math.ceil(COUNT - race.t);
        if (now !== before && now > 0) audio.sfx('tap', { pitch: 1.2 });
        if (race.t >= COUNT) {
          race.phase = 'race';
          race.t = 0;
          race.speed = BASE;
          audio.sfx('whoosh', { pitch: 1.1 });
        }
      } else if (race.phase === 'race' || race.phase === 'glide') {
        const racing = race.phase === 'race';
        if (racing) {
          race.time += dt;
          race.lat = THREE.MathUtils.clamp(race.lat + input.move.x * 2.6 * dt, -LANE, LANE);
          const want = input.move.y > 0.3 ? FAST : input.move.y < -0.3 ? SLOW : BASE;
          race.speed += (want - race.speed) * damp(performance.now() - race.hitAt < 600 ? 1 : 2.5, dt);
        } else race.speed += (0.6 - race.speed) * damp(2, dt);
        race.s += race.speed * dt;
        // the duck paddles along at a steady speed
        if (race.duckS < RACE_END_S) {
          race.duckS += rivalSpeed() * dt;
          if (race.duckS >= RACE_END_S && race.duckTime == null) race.duckTime = race.time;
        }
        if (racing) {
          for (const r of ROCKS) {
            if (Math.abs(race.s - r.s) < 0.5 && Math.abs(race.lat - r.lat) < 0.6 && performance.now() - race.hitAt > 900) {
              race.hitAt = performance.now();
              race.speed = 1.2;
              race.lat = THREE.MathUtils.clamp(race.lat + (race.lat >= r.lat ? 0.5 : -0.5), -LANE, LANE);
              audio.sfx('land', { pitch: 0.8, volume: 1 });
              const p = at(race.s, race.lat);
              spawnDust(p.x, p.y + 0.1, p.z, 10, 1);
            }
          }
          BUBBLES.forEach((b, i) => {
            if (race.bubbles[i] || Math.abs(race.s - b.s) > 0.7 || Math.abs(race.lat - b.lat) > 0.65) return;
            race.bubbles[i] = true;
            const n = race.bubbles.filter(Boolean).length;
            audio.sfx('pop', { pitch: 1 + n * 0.05 });
            const p = at(b.s, b.lat);
            spawnBurst(p.x, p.y + 0.6, p.z, '#bff2ff', 18, { speed: 1.8 });
          });
          if (race.s >= RACE_END_S) {
            race.phase = 'glide';
            race.t = 0;
            audio.sfx('star', { pitch: 1.1 });
          }
        } else if (race.t > 1.1) finish();
      }
    }

    // place the leaf (and Anet on it)
    const riding = race.phase !== 'idle';
    const lp = riding ? at(race.s, race.lat) : at(RACE_START_S, 0.35);
    const bob = Math.sin(t * 2.4) * 0.025;
    leaf.current.position.set(lp.x, lp.y + 0.02 + bob, lp.z);
    leaf.current.rotation.y += angleDelta(leaf.current.rotation.y, lp.facing) * damp(8, dt);
    leaf.current.rotation.z = riding ? -input.move.x * 0.12 : Math.sin(t * 1.3) * 0.04;
    if (riding) {
      player.ride = { x: lp.x, y: lp.y + 0.1 + bob, z: lp.z, facing: leaf.current.rotation.y };
      // camera behind the leaf, looking downstream
      const want = Math.atan2(-lp.dx, -lp.dz);
      cameraState.yaw += angleDelta(cameraState.yaw, want) * damp(3, dt);
      cameraState.pitch += (0.32 - cameraState.pitch) * damp(2, dt);
      cameraState.distance += (5.6 - cameraState.distance) * damp(2, dt);
      input.lastLookTime = performance.now();
    }

    // the duck: waiting by the dock, or racing
    const duckRacing = riding && race.phase !== 'count' && race.duckS < RACE_END_S + 3;
    const dp = duckRacing ? at(Math.min(race.duckS, RACE_END_S + 2.5), -0.7 + Math.sin(race.duckS * 0.8) * 0.25) : at(RACE_START_S - 0.2, -0.75);
    const vsKusut = !!raceControl.rival;
    duck.current.visible = !vsKusut;
    kusut.current.visible = vsKusut;
    if (vsKusut) {
      const kp = riding ? at(Math.min(race.duckS, RACE_END_S + 2.5), -0.7) : dp;
      kusut.current.position.set(kp.x, kp.y + 0.02 + Math.sin(t * 2.6) * 0.025, kp.z);
      kusut.current.rotation.y = kp.facing;
    } else {
      duck.current.position.set(dp.x, dp.y - 0.04 + Math.sin(t * 3) * 0.015, dp.z);
      duck.current.rotation.y = dp.facing;
      setAnimalSpot('duck', 5, dp.x, dp.z);
    }

    // bubbles float and wobble; popped ones are hidden until the next race
    bubbleRefs.current.forEach((b, i) => {
      if (!b) return;
      b.visible = !race.bubbles[i];
      b.position.y = BUBBLE_Y[i] + Math.sin(t * 2 + i) * 0.08;
      b.scale.setScalar(1 + Math.sin(t * 3 + i * 2) * 0.05);
    });

    // HUD (a few times a second)
    const now = performance.now();
    if (now - lastHud.current > 120) {
      lastHud.current = now;
      if (!riding) {
        if (useRaceHud.getState().hud) useRaceHud.setState({ hud: null });
      } else
        useRaceHud.setState({ hud: {
          phase: race.phase,
          count: Math.ceil(COUNT - race.t),
          time: fmt(race.time),
          n: race.bubbles.filter(Boolean).length,
          me: Math.min(1, (race.s - RACE_START_S) / RACE_LEN),
          duck: Math.min(1, (race.duckS - RACE_START_S) / RACE_LEN),
          total: BUBBLES.length,
        } });
    }
  });

  const bubbleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d6f6ff', emissive: '#7fd6ff', emissiveIntensity: 0.35, transparent: true, opacity: 0.45, roughness: 0.05, depthWrite: false }), []);
  const shineMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 }), []);

  return (
    <group>
      <group ref={leaf}>
        <BigLeaf />
      </group>
      <group ref={duck}>
        <Duck scale={0.9} />
      </group>
      <group ref={kusut} visible={false}>
        <group scale={0.8}>
          <BigLeaf />
        </group>
        <group position={[0, 0.08, 0]}>
          <Kusut scale={0.65} />
        </group>
      </group>
      {BUBBLES.map((b, i) => {
        const p = at(b.s, b.lat);
        return (
          <group key={i} ref={(el) => (bubbleRefs.current[i] = el)} position={[p.x, BUBBLE_Y[i], p.z]}>
            <mesh material={bubbleMat}>
              <sphereGeometry args={[0.28, 18, 14]} />
            </mesh>
            <mesh material={shineMat} position={[-0.1, 0.12, 0.17]}>
              <sphereGeometry args={[0.05, 8, 6]} />
            </mesh>
          </group>
        );
      })}
      {ROCKS.map((r, i) => {
        const p = at(r.s, r.lat);
        return (
          <group key={i} position={[p.x, p.y - 0.12, p.z]} rotation={[0, i * 2.1, 0]}>
            <mesh scale={[0.42, 0.32, 0.36]} castShadow>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#8f978d" roughness={0.95} flatShading />
            </mesh>
            <mesh position={[0, 0.22, 0]} scale={[0.32, 0.1, 0.28]}>
              <sphereGeometry args={[1, 10, 6]} />
              <meshStandardMaterial color="#5ea84c" roughness={1} />
            </mesh>
          </group>
        );
      })}
      <StartSign />
      <FinishArch />
    </group>
  );
}

// ------------------------------------------------------------------------------------- visuals

function BigLeaf() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.95);
    s.bezierCurveTo(0.62, -0.6, 0.62, 0.45, 0, 0.95);
    s.bezierCurveTo(-0.62, 0.45, -0.62, -0.6, 0, -0.95);
    return s;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[shape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 16 }]} />
        <meshStandardMaterial color="#5cb84e" roughness={0.6} />
      </mesh>
      {/* the leaf's middle vein and a curled-up stem at the back */}
      <mesh position={[0, 0.09, 0]} scale={[0.025, 0.012, 0.85]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#8fdc6e" />
      </mesh>
      <mesh position={[0, 0.16, -0.98]} rotation={[0.9, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.3, 8]} />
        <meshStandardMaterial color="#4a9a40" />
      </mesh>
    </group>
  );
}

function StartSign() {
  const y = terrainHeight(DOCK.x, DOCK.z);
  return (
    <group position={[DOCK.x, y, DOCK.z]} rotation={[0, DOCK.facing, 0]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 1.4, 8]} />
        <meshStandardMaterial color="#8a5a36" />
      </mesh>
      {/* little flag with a leaf on it */}
      <mesh position={[0.25, 1.22, 0]}>
        <boxGeometry args={[0.46, 0.3, 0.03]} />
        <meshStandardMaterial color="#ffd23f" />
      </mesh>
      <mesh position={[0.25, 1.22, 0.02]} rotation={[0, 0, 0.6]} scale={[0.12, 0.06, 0.02]}>
        <sphereGeometry args={[1, 10, 6]} />
        <meshStandardMaterial color="#4fae4a" />
      </mesh>
    </group>
  );
}

/** a flower arch over the stream at the finish */
function FinishArch() {
  const p = at(RACE_END_S, 0);
  const w = STREAM_HALF + 0.5;
  const pts = useMemo(() => Array.from({ length: 15 }, (_, i) => -Math.PI / 2 + (i / 14) * Math.PI), []);
  const colors = ['#ff7ab0', '#ffd23f', '#ffffff', '#b38cff', '#ff9f43'];
  return (
    <group position={[p.x, p.y, p.z]} rotation={[0, p.facing, 0]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * w, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 2.1, 8]} />
          <meshStandardMaterial color="#8a5a36" />
        </mesh>
      ))}
      {pts.map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * w, 1.9 + Math.cos(a) * 0.9, 0]}>
          <sphereGeometry args={[0.15, 10, 8]} />
          <meshStandardMaterial color={colors[i % colors.length]} emissive={colors[i % colors.length]} emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}
