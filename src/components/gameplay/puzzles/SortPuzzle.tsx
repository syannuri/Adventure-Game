/**
 * Candy sorting puzzle (World 2). Six mixed-up candies sit on little stands in front of three glass
 * jars. Anet picks up a candy (it floats above her head) and puts it into a jar. Matching colour
 * (and shape: pink hearts, yellow stars, blue gumballs) -> it drops in with a happy sound; a wrong
 * jar is never a failure: the candy hops back to its stand and Anet says which jar it needs.
 * When every candy is sorted the candy machine starts working.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { registerInteractable } from '../interaction/interactions';
import { SORT, SORT_CANDIES, SORT_COLORS, SORT_JARS, terrainHeight } from '../../worlds/CandyVillage/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { starShapeGeometry } from '../collectibles/Wand';
import { tr } from '../../../i18n';
import { candyDialogue as D } from '../../../data/candyDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { damp } from '../../../utils/math';

const STAND_H = 0.7;
const JAR_H = 0.95;
const COUNTER_H = 0.8;

function heartGeometry(size: number) {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(-0.15, -0.65, -1, -0.2, -1, 0.3);
  s.bezierCurveTo(-1, 0.8, -0.45, 1.0, 0, 0.6);
  s.bezierCurveTo(0.45, 1.0, 1, 0.8, 1, 0.3);
  s.bezierCurveTo(1, -0.2, 0.15, -0.65, 0, -0.9);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.2, bevelSegments: 4, curveSegments: 16 });
  g.center();
  g.scale(size, size, size);
  return g;
}

/** The three candy shapes, by colour index: pink heart, yellow star, blue gumball. */
function useCandyGeometries() {
  return useMemo(
    () => [heartGeometry(0.13), starShapeGeometry(0.2, 0.09, 0.08), new THREE.SphereGeometry(0.15, 24, 18)],
    [],
  );
}

export function CandyShape({ color, geos }: { color: number; geos: THREE.BufferGeometry[] }) {
  return (
    <mesh geometry={geos[color]} castShadow>
      <meshPhysicalMaterial color={SORT_COLORS[color]} roughness={0.15} clearcoat={1} clearcoatRoughness={0.1} emissive={SORT_COLORS[color]} emissiveIntensity={0.15} />
    </mesh>
  );
}

/** Where a candy sits right now. */
function candyTarget(id: string, out: THREE.Vector3, t: number) {
  const l = useGame.getState().level;
  const c = SORT_CANDIES.find((k) => k.id === id)!;
  if (l.holding === id) {
    out.set(player.position.x, player.position.y + 1.95 + Math.sin(t * 4) * 0.05, player.position.z);
    return 'held';
  }
  const si = l.sorted.indexOf(id);
  if (si >= 0) {
    const jar = SORT_JARS[c.color];
    // stack inside the jar: count how many of this colour are already in
    const n = l.sorted.filter((s, i) => i < si && SORT_CANDIES.find((k) => k.id === s)!.color === c.color).length;
    out.set(jar.x + (n ? 0.08 : -0.08), terrainHeight(jar.x, jar.z) + COUNTER_H + 0.22 + n * 0.22, jar.z);
    return 'sorted';
  }
  out.set(c.x, terrainHeight(c.x, c.z) + STAND_H + 0.2 + Math.sin(t * 2 + c.x) * 0.04, c.z);
  return 'tray';
}

function Candy({ id, color, geos }: { id: string; color: number; geos: THREE.BufferGeometry[] }) {
  const g = useRef<THREE.Group>(null!);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const init = useRef(false);
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const where = candyTarget(id, tgt, clock.elapsedTime);
    if (!init.current) {
      g.current.position.copy(tgt);
      init.current = true;
    }
    // held candies follow tightly; others glide (and hop back when a jar was wrong)
    g.current.position.lerp(tgt, damp(where === 'held' ? 16 : 6, dt));
    g.current.rotation.y += dt * (where === 'sorted' ? 0.3 : 1.4);
  });
  return (
    <group ref={g}>
      <CandyShape color={color} geos={geos} />
    </group>
  );
}

function Jar({ k }: { k: number }) {
  const jar = SORT_JARS[k];
  const y = terrainHeight(jar.x, jar.z) + COUNTER_H;
  const geos = useCandyGeometries();
  const glow = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame(({ clock }) => {
    const l = useGame.getState().level;
    const held = l.holding ? SORT_CANDIES.find((c) => c.id === l.holding) : null;
    const hint = held && held.color === k;
    glow.current.emissiveIntensity = hint ? 0.6 + Math.sin(clock.elapsedTime * 6) * 0.35 : 0.15;
  });
  return (
    <group position={[jar.x, y, jar.z]}>
      <mesh position={[0, JAR_H / 2, 0]}>
        <cylinderGeometry args={[0.36, 0.33, JAR_H, 32, 1, true]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.05} transmission={0.85} thickness={0.05} transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.04, 32]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>
      {/* coloured lid + label with the jar's shape */}
      <mesh position={[0, JAR_H + 0.06, 0]}>
        <cylinderGeometry args={[0.39, 0.39, 0.12, 32]} />
        <meshStandardMaterial ref={glow} color={SORT_COLORS[k]} emissive={SORT_COLORS[k]} emissiveIntensity={0.15} roughness={0.35} />
      </mesh>
      <mesh position={[0, JAR_H + 0.16, 0]}>
        <sphereGeometry args={[0.08, 14, 10]} />
        <meshStandardMaterial color={SORT_COLORS[k]} roughness={0.3} />
      </mesh>
      <group position={[0, JAR_H * 0.5, 0.37]}>
        <mesh>
          <circleGeometry args={[0.2, 28]} />
          <meshStandardMaterial color="#fffaf2" roughness={0.8} />
        </mesh>
        <group position={[0, 0, 0.03]} scale={[0.8, 0.8, 0.3]}>
          <CandyShape color={k} geos={geos} />
        </group>
      </group>
    </group>
  );
}

/** Counter, candy stands and the candy machine (it rumbles and glows when the puzzle is solved). */
function Furniture({ solved }: { solved: boolean }) {
  const machine = useRef<THREE.Group>(null!);
  const bulbs = useRef<THREE.Group>(null!);
  const crank = useRef<THREE.Group>(null!);
  const y0 = terrainHeight(SORT.x, SORT.z);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const on = useGame.getState().level.stage === 'done' || solved;
    machine.current.position.x = on ? Math.sin(t * 40) * 0.02 : 0;
    crank.current.rotation.z = on ? t * 6 : t * 0.4;
    bulbs.current.children.forEach((b, i) => {
      const m = (b as THREE.Mesh).material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = on ? (Math.sin(t * 10 + i * 1.3) > 0 ? 2.2 : 0.4) : 0.3 + Math.sin(t * 2 + i) * 0.15;
    });
  });
  const gumballs = useMemo(() => Array.from({ length: 34 }, (_, i) => ({ p: new THREE.Vector3(Math.sin(i * 2.4) * 0.6 * Math.sqrt((i % 7) / 7 + 0.2), 0.15 + (i % 5) * 0.14, Math.cos(i * 2.4) * 0.6 * Math.sqrt((i % 7) / 7 + 0.2)), c: SORT_COLORS[i % 3] })), []);
  return (
    <group>
      {/* counter under the jars */}
      <mesh position={[SORT.x, y0 + COUNTER_H / 2, SORT.z - 0.9]} castShadow receiveShadow>
        <boxGeometry args={[4.4, COUNTER_H, 0.95]} />
        <meshStandardMaterial color="#ffd6ea" roughness={0.6} />
      </mesh>
      <mesh position={[SORT.x, y0 + COUNTER_H + 0.03, SORT.z - 0.9]}>
        <boxGeometry args={[4.55, 0.06, 1.05]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      {/* candy stands (little cake stands) */}
      {SORT_CANDIES.map((c) => (
        <group key={c.id} position={[c.x, terrainHeight(c.x, c.z), c.z]}>
          <mesh position={[0, STAND_H / 2, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.12, STAND_H, 12]} />
            <meshStandardMaterial color="#fff6fb" roughness={0.4} />
          </mesh>
          <mesh position={[0, STAND_H, 0]}>
            <cylinderGeometry args={[0.28, 0.24, 0.05, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* the candy machine */}
      <group ref={machine} position={[SORT.x, y0, SORT.z - 3]}>
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 1.8, 1.6]} />
          <meshStandardMaterial color="#ff8fbf" roughness={0.45} />
        </mesh>
        <mesh position={[0, 1.85, 0]}>
          <boxGeometry args={[2.3, 0.12, 1.7]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        {/* glass dome full of gumballs */}
        <group position={[0, 1.9, 0]}>
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.85, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshPhysicalMaterial color="#ffffff" roughness={0.05} transmission={0.9} transparent opacity={0.35} depthWrite={false} />
          </mesh>
          {gumballs.map((b, i) => (
            <mesh key={i} position={b.p}>
              <sphereGeometry args={[0.12, 12, 10]} />
              <meshStandardMaterial color={b.c} roughness={0.2} />
            </mesh>
          ))}
        </group>
        {/* blinking bulbs */}
        <group ref={bulbs}>
          {[-0.75, -0.25, 0.25, 0.75].map((x, i) => (
            <mesh key={i} position={[x, 1.55, 0.81]}>
              <sphereGeometry args={[0.08, 12, 10]} />
              <meshStandardMaterial color={['#fff27a', '#9ff2ff', '#ffb3d1', '#b5ff9e'][i]} emissive={['#ffe14a', '#4fd2ff', '#ff6fae', '#6fe36b'][i]} emissiveIntensity={0.3} toneMapped={false} />
            </mesh>
          ))}
        </group>
        {/* crank wheel on the side */}
        <group ref={crank} position={[1.15, 0.95, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <torusGeometry args={[0.32, 0.05, 8, 24]} />
            <meshStandardMaterial color="#5ab8ff" metalness={0.3} roughness={0.35} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} rotation={[0, 0, (k * Math.PI) / 3]}>
              <boxGeometry args={[0.62, 0.05, 0.05]} />
              <meshStandardMaterial color="#5ab8ff" />
            </mesh>
          ))}
        </group>
        {/* chute */}
        <mesh position={[0, 0.5, 0.86]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.6, 0.06, 0.5]} />
          <meshStandardMaterial color="#ffd23f" metalness={0.3} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

export function SortPuzzle({ onSolved }: { onSolved: () => void }) {
  const stage = useGame((s) => s.level.stage);
  const sortedN = useGame((s) => s.level.sorted.length);
  const geos = useCandyGeometries();
  const solvedRef = useRef(onSolved);
  solvedRef.current = onSolved;

  useEffect(() => {
    const lvl = () => useGame.getState().level;
    const colorName = (k: number) => tr().candyColors[k];
    const offs = [
      ...SORT_CANDIES.map((c) =>
        registerInteractable({
          id: c.id,
          x: c.x,
          z: c.z,
          radius: 1.0,
          approach: 0.6,
          label: () => tr().prompts.pickCandy(colorName(c.color)),
          verb: 'take',
          enabled: () => lvl().stage === 'sortCandy' && !lvl().holding && !lvl().sorted.includes(c.id),
          onInteract: () => {
            useGame.setState((s) => ({ level: { ...s.level, holding: c.id, lastProgressAt: performance.now() } }));
            audio.sfx('pop', { pitch: 1.2 });
            useGame.getState().playEmote('collect', 0.8);
          },
        }),
      ),
      ...SORT_JARS.map((j, k) =>
        registerInteractable({
          id: `jar-${k}`,
          x: j.x,
          z: j.z,
          radius: 1.25,
          approach: 0.9,
          label: () => tr().prompts.putCandy(colorName(k)),
          verb: 'take',
          enabled: () => lvl().stage === 'sortCandy' && !!lvl().holding,
          onInteract: () => {
            const l = lvl();
            const candy = SORT_CANDIES.find((c) => c.id === l.holding);
            if (!candy) return;
            const y = terrainHeight(j.x, j.z) + COUNTER_H + JAR_H;
            if (candy.color === k) {
              const sorted = [...l.sorted, candy.id];
              useGame.setState((s) => ({ level: { ...s.level, sorted, holding: null, lastProgressAt: performance.now() } }));
              audio.sfx('coin', { pitch: 0.9 + sorted.length * 0.08 });
              spawnBurst(j.x, y, j.z, SORT_COLORS[k], 28, { speed: 2.5 });
              if (sorted.length === SORT_CANDIES.length) {
                const g = useGame.getState();
                g.unlockAchievement('sorting_star', ACHIEVEMENTS.sorting_star.title, ACHIEVEMENTS.sorting_star.icon);
                g.playEmote('celebrate', 2);
                window.setTimeout(() => solvedRef.current(), 700);
              }
            } else {
              // wrong jar: the candy hops back to its stand, Anet says which jar it needs
              useGame.setState((s) => ({ level: { ...s.level, holding: null } }));
              audio.sfx('pop', { pitch: 0.6 });
              useGame.getState().openDialogue(D().wrongJar(colorName(candy.color), colorName(k)));
            }
          },
        }),
      ),
    ];
    return () => offs.forEach((f) => f());
  }, []);

  const active = stage === 'sortCandy';
  const solved = sortedN === SORT_CANDIES.length;
  return (
    <group>
      <Furniture solved={solved} />
      {SORT_JARS.map((_, k) => (
        <Jar key={k} k={k} />
      ))}
      {SORT_CANDIES.map((c) => (
        <Candy key={c.id} id={c.id} color={c.color} geos={geos} />
      ))}
      {active && !solved && <Sparkles count={30} scale={[5, 1.2, 1.6]} position={[SORT.x, terrainHeight(SORT.x, SORT.z) + 1.2, SORT.z + 1.5]} size={4} speed={0.5} color="#ffe6f3" />}
    </group>
  );
}
