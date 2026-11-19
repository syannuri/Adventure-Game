/**
 * Anet's magic garden (World 1). Three raised beds east of the glade: a sunflower, a berry bush and a
 * rainbow flower. Plant a seed, water it with the watering can from the tree stump (fill it at the
 * pond), and the plant grows a stage. Each time it grows it is thirsty again: seed -> sprout -> bud ->
 * bloom. Growing takes a little while and keeps going while Anet is away (the garden is saved), so
 * there is a reason to come back. A blooming plant can be picked for golden acorns and planted again.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import type { GardenSave } from '../../../systems/save';
import { player } from '../../../systems/playerState';
import { registerInteractable } from '../interaction/interactions';
import { GARDEN, GARDEN_BEDS, GARDEN_STUMP, POND, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { forestDialogue as D } from '../../../data/forestDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { tr } from '../../../i18n';
import { damp } from '../../../utils/math';
import { rewardAcorns } from '../shop/KikiShopQuest';
import { setAnimalSpot } from '../../../systems/animalSpots';

export const PLANT_KINDS = ['sunflower', 'berry', 'rainbow'] as const;
type Kind = (typeof PLANT_KINDS)[number];
const BLOOM = 4;
const CAN_POURS = 3;
/** carried further than this from the garden, the can goes back to the stump (the pond is well inside) */
const CAN_RANGE = 30;
/** how long one growth step takes after watering (tests may shorten it) */
export const gardenTiming = { growMs: 20000 };
if (typeof window !== 'undefined') (window as unknown as { __anettGarden: typeof gardenTiming }).__anettGarden = gardenTiming;

const RAINBOW = ['#ff5a6e', '#ff9f43', '#ffd23f', '#5fd068', '#4aa8ff', '#8a6bff', '#ff7ad9'];

const freshGarden = (): GardenSave => ({ beds: PLANT_KINDS.map(() => ({ stage: 0, growUntil: null })), bloomed: [], harvests: 0, seen: false });
export const getGarden = (): GardenSave => useGame.getState().save.garden ?? freshGarden();
const saveGarden = (g: GardenSave) => useGame.getState().setGarden(g);
const thirsty = (b: GardenSave['beds'][number]) => b.stage >= 1 && b.stage < BLOOM && b.growUntil == null;
const plantName = (i: number) => tr().toasts.plants[PLANT_KINDS[i]];
const bedY = (i: number) => terrainHeight(GARDEN_BEDS[i].x, GARDEN_BEDS[i].z);

function toast(title: string, text: string, icon: string) {
  useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now() + Math.random(), title, text, icon }] }));
  const id = useGame.getState().toasts.at(-1)!.id;
  window.setTimeout(() => useGame.getState().dismissToast(id), 2600);
}

/** HUD line under the mission */
export function gardenStatus() {
  const g = useGame.getState();
  const gs = g.save.garden;
  if (!gs?.seen) return null;
  const n = gs.beds.filter(thirsty).length;
  if (n > 0) return g.level.hasCan && g.level.water === 0 ? '💧 ' + tr().hud.gardenFill : '🌱 ' + tr().hud.gardenThirsty(n);
  if (gs.beds.some((b) => b.stage === BLOOM)) return '🌻 ' + tr().hud.gardenBloom;
  if (gs.beds.some((b) => b.growUntil != null)) return '🌱 ' + tr().hud.gardenGrowing;
  return null;
}

/** time the last pour started (tilts the can) */
const pour = { t: -10 };

function updateBed(i: number, patch: Partial<GardenSave['beds'][number]>, extra: Partial<GardenSave> = {}) {
  const g = getGarden();
  saveGarden({ ...g, ...extra, beds: g.beds.map((b, k) => (k === i ? { ...b, ...patch } : b)) });
  useGame.setState((s) => ({ level: { ...s.level, lastProgressAt: performance.now() } }));
}

function interactBed(i: number) {
  const g = useGame.getState();
  const bed = getGarden().beds[i];
  const b = GARDEN_BEDS[i];
  const y = bedY(i) + 0.4;
  player.lookAt = { x: b.x, z: b.z };
  if (bed.stage === 0) {
    updateBed(i, { stage: 1, growUntil: null });
    audio.sfx('pop', { pitch: 0.8 });
    spawnBurst(b.x, y, b.z, '#8a5a32', 14, { speed: 1.2 });
    g.playEmote('collect', 1);
    return;
  }
  if (bed.stage === BLOOM) {
    const gs = getGarden();
    updateBed(i, { stage: 0, growUntil: null }, { harvests: gs.harvests + 1 });
    audio.sfx('star', { pitch: 1.2 });
    spawnBurst(b.x, y + 0.6, b.z, PLANT_KINDS[i] === 'berry' ? '#ff5a6e' : PLANT_KINDS[i] === 'sunflower' ? '#ffd23f' : '#d9a6ff', 40, { speed: 2.4 });
    g.playEmote('celebrate', 1.6);
    rewardAcorns(3);
    return;
  }
  if (!thirsty(bed)) return;
  if (!g.level.hasCan) return g.openDialogue(D().gardenNoCan);
  if (g.level.water <= 0) return g.openDialogue(D().gardenEmpty);
  useGame.setState((s) => ({ level: { ...s.level, water: s.level.water - 1 } }));
  updateBed(i, { growUntil: Date.now() + gardenTiming.growMs });
  pour.t = performance.now();
  audio.sfx('splash', { pitch: 1.5, volume: 0.45 });
  window.setTimeout(() => spawnBurst(b.x, y + 0.2, b.z, '#7fd6ff', 24, { speed: 1.4, up: 0.5 }), 250);
}

/** advance beds whose growing time is over */
function tickGarden(near: boolean) {
  const gs = useGame.getState().save.garden;
  if (!gs) return;
  const now = Date.now();
  if (!gs.beds.some((b) => b.growUntil != null && now >= b.growUntil)) return;
  const bloomedNow: Kind[] = [];
  const beds = gs.beds.map((b, i) => {
    if (b.growUntil == null || now < b.growUntil) return b;
    const stage = Math.min(BLOOM, b.stage + 1);
    if (stage === BLOOM) bloomedNow.push(PLANT_KINDS[i]);
    return { stage, growUntil: null };
  });
  const firstBloom = gs.bloomed.length === 0 && bloomedNow.length > 0;
  const bloomed = [...new Set([...gs.bloomed, ...bloomedNow])];
  const allNow = bloomed.length === PLANT_KINDS.length && gs.bloomed.length < PLANT_KINDS.length;
  saveGarden({ ...gs, beds, bloomed });
  const g = useGame.getState();
  if (firstBloom) g.unlockAchievement('green_thumb', ACHIEVEMENTS.green_thumb.title, ACHIEVEMENTS.green_thumb.icon);
  if (allNow) g.unlockAchievement('rainbow_garden', ACHIEVEMENTS.rainbow_garden.title, ACHIEVEMENTS.rainbow_garden.icon);
  if (!near) return;
  beds.forEach((b, i) => {
    if (b === gs.beds[i]) return;
    spawnBurst(GARDEN_BEDS[i].x, bedY(i) + 0.8, GARDEN_BEDS[i].z, b.stage === BLOOM ? '#fff3a0' : '#9df07a', b.stage === BLOOM ? 40 : 18, { speed: 2 });
  });
  audio.sfx(bloomedNow.length ? 'magic' : 'pop', { pitch: bloomedNow.length ? 1 : 1.3 });
  if (bloomedNow.length) {
    toast(tr().toasts.bloom, tr().toasts.plants[bloomedNow[0]], '✿');
    if (!g.dialogue && g.screen === 'playing') g.openDialogue(allNow ? D().gardenAll : D().gardenBloom[bloomedNow[0]]);
  } else toast(tr().toasts.grew, '', '❦');
}

export function MagicGarden() {
  const can = useRef<THREE.Group>(null!);
  const tilt = useRef<THREE.Group>(null!);
  const nextTick = useRef(0);

  useEffect(() => {
    const offs = GARDEN_BEDS.map((b, i) =>
      registerInteractable({
        id: `garden-bed-${i}`,
        x: b.x,
        z: b.z + 0.5,
        radius: 1.5,
        approach: 1.0,
        label: () => {
          const bed = getGarden().beds[i];
          if (bed.stage === 0) return tr().prompts.plant(plantName(i));
          if (bed.stage === BLOOM) return tr().prompts.pick(plantName(i));
          return tr().prompts.water(plantName(i));
        },
        verb: 'touch',
        enabled: () => {
          const bed = getGarden().beds[i];
          return bed.stage === 0 || bed.stage === BLOOM || thirsty(bed);
        },
        onInteract: () => interactBed(i),
      }),
    );
    offs.push(
      registerInteractable({
        id: 'garden-can',
        x: GARDEN_STUMP.x,
        z: GARDEN_STUMP.z,
        radius: 1.6,
        approach: 0.9,
        label: () => (useGame.getState().level.hasCan ? tr().prompts.putCan : tr().prompts.takeCan),
        verb: 'take',
        enabled: () => true,
        onInteract: () => {
          // pick the can up, or put it back on the stump (the water stays in it)
          const carrying = useGame.getState().level.hasCan;
          useGame.setState((s) => ({ level: { ...s.level, hasCan: !carrying, lastProgressAt: performance.now() } }));
          audio.sfx(carrying ? 'stepWood' : 'pop', { pitch: carrying ? 1.2 : 1.1 });
          useGame.getState().playEmote('collect', 1);
        },
      }),
    );
    return () => offs.forEach((f) => f());
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const g = useGame.getState();
    const l = g.level;
    const p = player.position;
    // the watering can: on the stump, or carried in Anet's right hand
    if (l.hasCan) {
      can.current.position.set(p.x, p.y, p.z);
      can.current.rotation.y = player.facing;
      const since = (performance.now() - pour.t) / 1000;
      const want = since < 1.1 ? 0.9 : 0;
      tilt.current.rotation.x += (want - tilt.current.rotation.x) * damp(since < 1.1 ? 10 : 5, dt);
      tilt.current.position.set(-0.3, 0.5, 0.18);
    } else {
      can.current.position.set(GARDEN_STUMP.x, terrainHeight(GARDEN_STUMP.x, GARDEN_STUMP.z) + 0.42, GARDEN_STUMP.z);
      can.current.rotation.y = 0.6;
      tilt.current.rotation.x = 0;
      tilt.current.position.set(0, 0.12, 0);
    }

    const t = performance.now();
    if (t < nextTick.current) return;
    nextTick.current = t + 400;
    if (g.screen !== 'playing' || g.paused || g.cinematic) return;
    const dGarden = Math.hypot(p.x - GARDEN.x, p.z - GARDEN.z);
    if (!g.dialogue) tickGarden(dGarden < 14);
    if (g.dialogue) return;
    const gs = getGarden();
    if (!gs.seen && dGarden < 5) {
      saveGarden({ ...gs, seen: true });
      g.openDialogue(D().gardenIntro);
      return;
    }
    // wandering far away with the can: it goes back to its stump by itself
    if (l.hasCan && dGarden > CAN_RANGE) {
      useGame.setState((s) => ({ level: { ...s.level, hasCan: false } }));
      toast(tr().toasts.canHome, tr().toasts.canHomeText, '🪣');
      return;
    }
    // fill the can at the pond
    if (l.hasCan && l.water < CAN_POURS && Math.hypot(p.x - POND.x, p.z - POND.z) < POND.r + 1.4) {
      useGame.setState((s) => ({ level: { ...s.level, water: CAN_POURS, lastProgressAt: performance.now() } }));
      audio.sfx('splash', { pitch: 1.2, volume: 0.7 });
      spawnBurst(p.x, p.y + 0.6, p.z, '#7fd6ff', 26, { speed: 1.8 });
      toast(tr().toasts.canFull, tr().toasts.canFullText, '💧');
    }
  });

  return (
    <group>
      {GARDEN_BEDS.map((_, i) => (
        <Bed key={i} i={i} />
      ))}
      <Stump />
      <group ref={can}>
        <group ref={tilt}>
          <WateringCan />
        </group>
      </group>
      <Bee />
    </group>
  );
}

// ------------------------------------------------------------------------------------- visuals

function Stump() {
  const y = terrainHeight(GARDEN_STUMP.x, GARDEN_STUMP.z);
  return (
    <group position={[GARDEN_STUMP.x, y, GARDEN_STUMP.z]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.44, 0.42, 12]} />
        <meshStandardMaterial color="#8a5a36" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.415, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.012, 16]} />
        <meshStandardMaterial color="#d9b07a" roughness={0.9} />
      </mesh>
      {/* basket of magic seeds beside the stump */}
      <group position={[0.62, 0, 0.2]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.15, 0.24, 12, 1, true]} />
          <meshStandardMaterial color="#c9915a" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <mesh key={k} position={[Math.cos(k * 1.1) * 0.09, 0.22, Math.sin(k * 1.1) * 0.09]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshStandardMaterial color={RAINBOW[k]} emissive={RAINBOW[k]} emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function WateringCan() {
  const water = useGame((s) => s.level.water);
  return (
    <group scale={0.85}>
      <mesh castShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.22, 16]} />
        <meshStandardMaterial color="#6fc3ff" roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.115, 0]}>
        <cylinderGeometry args={[0.1, 0.13, 0.03, 16]} />
        <meshStandardMaterial color={water > 0 ? '#b8ecff' : '#4d9bd6'} emissive={water > 0 ? '#7fd6ff' : '#000000'} emissiveIntensity={0.5} />
      </mesh>
      {/* spout points forward */}
      <mesh position={[0, 0.05, 0.2]} rotation={[Math.PI / 2 - 0.6, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.03, 0.26, 8]} />
        <meshStandardMaterial color="#5ab2f0" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.14, 0.3]} rotation={[Math.PI / 2 - 0.6, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.03, 0.04, 10]} />
        <meshStandardMaterial color="#ffd23f" />
      </mesh>
      <mesh position={[0, 0.09, -0.12]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.09, 0.018, 8, 16, Math.PI * 1.3]} />
        <meshStandardMaterial color="#ffd23f" />
      </mesh>
    </group>
  );
}

const wood = new THREE.MeshStandardMaterial({ color: '#a8743f', roughness: 0.9 });
const soilDry = '#6b4a2e';
const soilWet = '#3f2a1a';

function Bed({ i }: { i: number }) {
  const b = GARDEN_BEDS[i];
  const y = bedY(i);
  const kind = PLANT_KINDS[i];
  const stage = useGame((s) => s.save.garden?.beds[i]?.stage ?? 0);
  const growUntil = useGame((s) => s.save.garden?.beds[i]?.growUntil ?? null);
  const bed = useMemo(() => ({ stage, growUntil }), [stage, growUntil]);
  const plant = useRef<THREE.Group>(null!);
  const drop = useRef<THREE.Group>(null!);
  const soil = useMemo(() => new THREE.MeshStandardMaterial({ color: soilDry, roughness: 1 }), []);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  const dotOn = useMemo(() => new THREE.MeshBasicMaterial({ color: '#9df07a', toneMapped: false }), []);
  const dotOff = useMemo(() => new THREE.MeshBasicMaterial({ color: '#f4efe0', transparent: true, opacity: 0.55 }), []);
  const popAt = useRef(-10);
  const lastStage = useRef(bed.stage);
  if (lastStage.current !== bed.stage) {
    if (bed.stage > lastStage.current) popAt.current = performance.now();
    lastStage.current = bed.stage;
  }

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const since = (performance.now() - popAt.current) / 1000;
    const pop = since < 0.8 ? 1 - Math.exp(-since * 7) * Math.cos(since * 18) * 0.6 : 1;
    const isThirsty = thirsty(bed);
    if (plant.current) {
      plant.current.scale.setScalar(Math.max(0.2, pop));
      plant.current.rotation.z = isThirsty ? -0.12 + Math.sin(t * 1.5 + i) * 0.03 : Math.sin(t * 1.2 + i) * 0.04;
    }
    if (drop.current) {
      drop.current.visible = isThirsty;
      drop.current.position.y = (bed.stage === 3 ? 1.5 : 1.05) + Math.sin(t * 3 + i) * 0.08;
    }
    const growing = bed.growUntil != null;
    soil.color.set(growing ? soilWet : soilDry);
    const frac = growing ? 1 - Math.max(0, bed.growUntil! - Date.now()) / gardenTiming.growMs : 0;
    dots.current.forEach((d, k) => {
      if (!d) return;
      d.visible = growing;
      d.material = k < Math.round(frac * 12) ? dotOn : dotOff;
    });
  });

  return (
    <group position={[b.x, y, b.z]}>
      {/* wooden frame */}
      {[
        [0, 0.12, 0.55, 1.2, 0.08],
        [0, 0.12, -0.55, 1.2, 0.08],
        [0.55, 0.12, 0, 0.08, 1.2],
        [-0.55, 0.12, 0, 0.08, 1.2],
      ].map(([x, yy, z, w, d], k) => (
        <mesh key={k} position={[x, yy, z]} material={wood} castShadow receiveShadow>
          <boxGeometry args={[w, 0.24, d]} />
        </mesh>
      ))}
      <mesh position={[0, 0.17, 0]} material={soil} receiveShadow>
        <boxGeometry args={[1.02, 0.08, 1.02]} />
      </mesh>
      {/* little sign showing what grows here */}
      <group position={[0.42, 0, 0.72]}>
        <mesh position={[0, 0.25, 0]} material={wood}>
          <boxGeometry args={[0.04, 0.5, 0.04]} />
        </mesh>
        <mesh position={[0, 0.48, 0.01]} material={wood}>
          <boxGeometry args={[0.3, 0.2, 0.03]} />
        </mesh>
        <SignIcon kind={kind} />
      </group>
      {/* growth progress ring */}
      {Array.from({ length: 12 }, (_, k) => {
        const a = (k / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <mesh key={k} ref={(el) => (dots.current[k] = el)} position={[Math.cos(a) * 0.4, 0.23, Math.sin(a) * 0.4]} visible={false}>
            <sphereGeometry args={[0.035, 6, 5]} />
          </mesh>
        );
      })}
      <group ref={plant} position={[0, 0.21, 0]}>
        <Plant kind={kind} stage={bed.stage} />
      </group>
      {/* thirsty: a bobbing water drop */}
      <group ref={drop} visible={false}>
        <mesh>
          <sphereGeometry args={[0.11, 14, 10]} />
          <meshStandardMaterial color="#6fd0ff" emissive="#3fa8ff" emissiveIntensity={0.6} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <coneGeometry args={[0.078, 0.14, 14]} />
          <meshStandardMaterial color="#6fd0ff" emissive="#3fa8ff" emissiveIntensity={0.6} roughness={0.2} />
        </mesh>
      </group>
      {bed.growUntil != null && <Sparkles count={10} scale={[0.9, 0.8, 0.9]} position={[0, 0.6, 0]} size={3} speed={0.5} color="#c8ffb0" />}
    </group>
  );
}

function SignIcon({ kind }: { kind: Kind }) {
  if (kind === 'sunflower')
    return (
      <mesh position={[0, 0.48, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.01, 12]} />
        <meshStandardMaterial color="#ffd23f" />
      </mesh>
    );
  if (kind === 'berry')
    return (
      <group position={[0, 0.48, 0.03]}>
        {[-0.05, 0.05, 0].map((x, k) => (
          <mesh key={k} position={[x, k === 2 ? 0.05 : -0.01, 0]}>
            <sphereGeometry args={[0.04, 8, 6]} />
            <meshStandardMaterial color="#ff4d5e" />
          </mesh>
        ))}
      </group>
    );
  return (
    <group position={[0, 0.48, 0.03]}>
      {RAINBOW.slice(0, 5).map((c, k) => (
        <mesh key={k} position={[-0.1 + k * 0.05, 0, 0]}>
          <boxGeometry args={[0.045, 0.14, 0.01]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
    </group>
  );
}

const green = new THREE.MeshStandardMaterial({ color: '#4fae4a', roughness: 0.7 });
const leafGreen = new THREE.MeshStandardMaterial({ color: '#63c255', roughness: 0.6, side: THREE.DoubleSide });

function Leaf({ y, a, s = 1 }: { y: number; a: number; s?: number }) {
  return (
    <mesh position={[Math.cos(a) * 0.1 * s, y, Math.sin(a) * 0.1 * s]} rotation={[0, -a, 0.6]} scale={[0.18 * s, 0.04 * s, 0.09 * s]} material={leafGreen}>
      <sphereGeometry args={[1, 10, 6]} />
    </mesh>
  );
}

function Stem({ h, r = 0.03 }: { h: number; r?: number }) {
  return (
    <mesh position={[0, h / 2, 0]} material={green} castShadow>
      <cylinderGeometry args={[r * 0.8, r, h, 8]} />
    </mesh>
  );
}

function Plant({ kind, stage }: { kind: Kind; stage: number }) {
  if (stage === 0) return null;
  if (stage === 1)
    return (
      <group>
        <mesh scale={[1, 0.4, 1]}>
          <sphereGeometry args={[0.16, 12, 8]} />
          <meshStandardMaterial color="#5a3b22" roughness={1} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshStandardMaterial color={kind === 'rainbow' ? '#d9a6ff' : kind === 'berry' ? '#ff9a8a' : '#f2d27a'} emissive="#ffffff" emissiveIntensity={0.15} />
        </mesh>
      </group>
    );
  if (stage === 2)
    return (
      <group>
        <Stem h={0.22} r={0.025} />
        <Leaf y={0.22} a={0} />
        <Leaf y={0.22} a={Math.PI} />
      </group>
    );
  if (stage === 3) {
    const h = kind === 'sunflower' ? 0.95 : kind === 'berry' ? 0.45 : 0.65;
    const budColor = kind === 'sunflower' ? '#ffd23f' : kind === 'berry' ? '#ff6b7a' : '#c79bff';
    return (
      <group>
        <Stem h={h} r={0.035} />
        <Leaf y={h * 0.4} a={0.3} s={1.4} />
        <Leaf y={h * 0.6} a={Math.PI + 0.3} s={1.3} />
        <mesh position={[0, h + 0.08, 0]} scale={[1, 1.3, 1]}>
          <sphereGeometry args={[0.1, 12, 10]} />
          <meshStandardMaterial color="#5fb84f" />
        </mesh>
        <mesh position={[0, h + 0.19, 0]}>
          <coneGeometry args={[0.06, 0.1, 10]} />
          <meshStandardMaterial color={budColor} />
        </mesh>
      </group>
    );
  }
  if (kind === 'sunflower') return <Sunflower />;
  if (kind === 'berry') return <BerryBush />;
  return <RainbowFlower />;
}

function Sunflower() {
  const head = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    head.current.rotation.z = Math.sin(clock.elapsedTime * 0.9) * 0.08;
  });
  const h = 2.0;
  return (
    <group>
      <Stem h={h} r={0.05} />
      <Leaf y={0.6} a={0.2} s={2.2} />
      <Leaf y={1.0} a={Math.PI + 0.4} s={2.0} />
      <Leaf y={1.4} a={0.9} s={1.7} />
      <group ref={head} position={[0, h + 0.05, 0.06]} rotation={[0.25, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 20]} />
          <meshStandardMaterial color="#6b3d1e" roughness={0.9} />
        </mesh>
        {Array.from({ length: 16 }, (_, k) => {
          const a = (k / 16) * Math.PI * 2;
          return (
            <mesh key={k} position={[Math.cos(a) * 0.38, Math.sin(a) * 0.38, 0]} rotation={[0, 0, a]} scale={[0.17, 0.065, 0.025]}>
              <sphereGeometry args={[1, 10, 6]} />
              <meshStandardMaterial color={k % 2 ? '#ffc93c' : '#ffd84f'} emissive="#ffb300" emissiveIntensity={0.15} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function BerryBush() {
  const berries = useMemo(
    () =>
      Array.from({ length: 16 }, (_, k) => {
        const a = k * 2.399;
        const yy = 0.15 + (k % 5) * 0.11;
        const r = Math.sqrt(Math.max(0.05, 0.3 - (yy - 0.35) ** 2)) * 1.0;
        return [Math.cos(a) * r, yy, Math.sin(a) * r] as [number, number, number];
      }),
    [],
  );
  return (
    <group>
      {[
        [0, 0.32, 0, 0.42],
        [0.2, 0.22, 0.1, 0.3],
        [-0.22, 0.24, -0.06, 0.3],
        [0.02, 0.55, -0.05, 0.28],
      ].map(([x, y, z, r], k) => (
        <mesh key={k} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 16, 12]} />
          <meshStandardMaterial color={k % 2 ? '#3f9a45' : '#4fae4a'} roughness={0.8} />
        </mesh>
      ))}
      {berries.map((p, k) => (
        <mesh key={k} position={p}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial color={k % 4 === 0 ? '#7a3cff' : '#ff3b55'} roughness={0.25} emissive={k % 4 === 0 ? '#3a1a8a' : '#8a0a1a'} emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function RainbowFlower() {
  const head = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    head.current.rotation.y = clock.elapsedTime * 0.5;
  });
  const h = 1.15;
  return (
    <group>
      <Stem h={h} r={0.04} />
      <Leaf y={0.35} a={0.4} s={1.8} />
      <Leaf y={0.65} a={Math.PI + 0.2} s={1.6} />
      <group ref={head} position={[0, h + 0.05, 0]}>
        {RAINBOW.map((c, k) => {
          const a = (k / RAINBOW.length) * Math.PI * 2;
          return (
            <mesh key={k} position={[Math.cos(a) * 0.2, 0.04, Math.sin(a) * 0.2]} rotation={[0, -a, 0.35]} scale={[0.2, 0.035, 0.1]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.55} toneMapped={false} />
            </mesh>
          );
        })}
        <mesh position={[0, 0.07, 0]}>
          <sphereGeometry args={[0.08, 14, 10]} />
          <meshStandardMaterial color="#fffbe0" emissive="#fff3a0" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      </group>
      <Sparkles count={18} scale={[0.9, 0.9, 0.9]} position={[0, h + 0.1, 0]} size={4} speed={0.5} color="#ffe6ff" />
    </group>
  );
}

/** A little bee that visits the garden once something is in bloom (a sticker for the book). */
function Bee() {
  const ref = useRef<THREE.Group>(null!);
  const wings = useRef<THREE.Group>(null!);
  const any = useGame((s) => (s.save.garden?.beds ?? []).some((b) => b.stage === BLOOM));
  useFrame(({ clock }) => {
    if (!any) return;
    const t = clock.elapsedTime;
    const gs = getGarden();
    const open = gs.beds.map((b, i) => (b.stage === BLOOM ? i : -1)).filter((i) => i >= 0);
    if (!open.length) return;
    const i = open[Math.floor(t / 5) % open.length];
    const b = GARDEN_BEDS[i];
    const top = bedY(i) + (PLANT_KINDS[i] === 'sunflower' ? 2.35 : PLANT_KINDS[i] === 'berry' ? 0.95 : 1.5);
    const tx = b.x + Math.cos(t * 1.7) * 0.5;
    const tz = b.z + Math.sin(t * 2.3) * 0.5 + 0.2;
    const ty = top + Math.sin(t * 4) * 0.12;
    const dt = 0.05;
    const px = ref.current.position.x;
    const pz = ref.current.position.z;
    ref.current.position.x += (tx - px) * damp(2.5, dt);
    ref.current.position.y += (ty - ref.current.position.y) * damp(2.5, dt);
    ref.current.position.z += (tz - pz) * damp(2.5, dt);
    ref.current.rotation.y = Math.atan2(ref.current.position.x - px, ref.current.position.z - pz);
    wings.current.rotation.x = Math.sin(t * 60) * 0.6;
    setAnimalSpot('bee', 0, ref.current.position.x, ref.current.position.z);
  });
  if (!any) return null;
  return (
    <group ref={ref} position={[GARDEN.x, terrainHeight(GARDEN.x, GARDEN.z) + 1.5, GARDEN.z]} scale={1.3}>
      <mesh scale={[0.8, 0.8, 1.1]}>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshStandardMaterial color="#ffd23f" />
      </mesh>
      {[-0.03, 0.04].map((z, k) => (
        <mesh key={k} position={[0, 0, z]} scale={[0.82, 0.82, 0.25]}>
          <sphereGeometry args={[0.092, 12, 8]} />
          <meshStandardMaterial color="#2b1b14" />
        </mesh>
      ))}
      <group ref={wings} position={[0, 0.07, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.06, 0.02, 0]} rotation={[0, 0, s * 0.5]} scale={[0.07, 0.015, 0.05]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#e6f6ff" transparent opacity={0.75} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
