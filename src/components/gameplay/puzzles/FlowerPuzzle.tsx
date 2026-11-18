/**
 * Colour flower puzzle (World 1). Lumi's wand is locked in magic vines.
 * A stone tablet shows three gems; the three magic flowers in front of it change colour each time
 * Anet touches them (red -> yellow -> blue). When every flower matches the gem above it, the vines
 * melt away and the wand can be taken. No fail state: kids can keep trying, matches glow right away.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { registerInteractable } from '../interaction/interactions';
import { PUZZLE_COLORS, PUZZLE_FLOWERS, PUZZLE_TABLET, PUZZLE_TARGET, WAND_POS, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { tr } from '../../../i18n';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { damp } from '../../../utils/math';

export const matchedCount = (flowers: number[]) => flowers.reduce((n, c, i) => n + (c === PUZZLE_TARGET[i] ? 1 : 0), 0);

function touchFlower(i: number) {
  const g = useGame.getState();
  const lvl = g.level;
  if (lvl.puzzleSolved || lvl.stage !== 'findWand') return;
  const flowers = [...lvl.flowers];
  flowers[i] = (flowers[i] + 1) % PUZZLE_COLORS.length;
  const f = PUZZLE_FLOWERS[i];
  const y = terrainHeight(f.x, f.z) + 0.6;
  const right = flowers[i] === PUZZLE_TARGET[i];
  audio.sfx(right ? 'coin' : 'pop', { pitch: 0.8 + flowers[i] * 0.2 });
  spawnBurst(f.x, y, f.z, PUZZLE_COLORS[flowers[i]], right ? 26 : 12, { speed: right ? 2.5 : 1.5 });
  const solved = matchedCount(flowers) === PUZZLE_TARGET.length;
  useGame.setState((s) => ({ level: { ...s.level, flowers, puzzleSolved: solved, lastProgressAt: performance.now() } }));
  if (solved) {
    window.setTimeout(() => {
      audio.sfx('magic');
      const wy = terrainHeight(WAND_POS.x, WAND_POS.z) + 0.8;
      spawnBurst(WAND_POS.x, wy, WAND_POS.z, '#9fff9f', 60, { speed: 4 });
      spawnBurst(WAND_POS.x, wy, WAND_POS.z, '#fff3a0', 50, { speed: 3 });
      const gs = useGame.getState();
      gs.playEmote('celebrate', 2);
      gs.unlockAchievement('puzzle_master', ACHIEVEMENTS.puzzle_master.title, ACHIEVEMENTS.puzzle_master.icon);
    }, 350);
  }
}

/** One magic flower: stem, leaves and a 6-petal bloom tinted with its current colour. */
function MagicFlower({ i }: { i: number }) {
  const f = PUZZLE_FLOWERS[i];
  const y = terrainHeight(f.x, f.z);
  const head = useRef<THREE.Group>(null!);
  const halo = useRef<THREE.Mesh>(null!);
  const petalMat = useMemo(() => new THREE.MeshStandardMaterial({ color: PUZZLE_COLORS[0], roughness: 0.45, emissive: PUZZLE_COLORS[0], emissiveIntensity: 0.25 }), []);
  const haloMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), []);
  const col = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const lvl = useGame.getState().level;
    const c = lvl.flowers[i] ?? 0;
    const right = c === PUZZLE_TARGET[i];
    col.set(PUZZLE_COLORS[c]);
    petalMat.color.lerp(col, damp(10, dt));
    petalMat.emissive.lerp(col, damp(10, dt));
    petalMat.emissiveIntensity += ((right ? 1.1 : 0.25) - petalMat.emissiveIntensity) * damp(6, dt);
    const t = clock.elapsedTime;
    head.current.rotation.y = t * 0.6 + i;
    head.current.position.y = 0.62 + Math.sin(t * 2 + i) * 0.03;
    haloMat.color.copy(col);
    haloMat.opacity += ((right ? 0.45 + Math.sin(t * 4) * 0.15 : 0) - haloMat.opacity) * damp(6, dt);
    halo.current.rotation.z = t * 0.8;
  });
  return (
    <group position={[f.x, y, f.z]} scale={1.55}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.02, 0.028, 0.6, 8]} />
        <meshStandardMaterial color="#4c9a3e" />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0.07 * s, 0.22, 0]} rotation={[0, 0, -0.9 * s]} scale={[1, 0.35, 0.6]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshStandardMaterial color="#5fb04a" />
        </mesh>
      ))}
      <group ref={head} position={[0, 0.62, 0]}>
        {Array.from({ length: 6 }, (_, k) => (
          <mesh key={k} material={petalMat} position={[Math.cos((k / 6) * Math.PI * 2) * 0.1, 0, Math.sin((k / 6) * Math.PI * 2) * 0.1]} rotation={[0, -(k / 6) * Math.PI * 2, 0.35]} scale={[1.3, 0.35, 0.8]}>
            <sphereGeometry args={[0.07, 12, 8]} />
          </mesh>
        ))}
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.055, 12, 10]} />
          <meshStandardMaterial color="#fff3b0" emissive="#ffe27a" emissiveIntensity={0.8} />
        </mesh>
      </group>
      {/* glowing ring when this flower matches its gem */}
      <mesh ref={halo} material={haloMat} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.24, 0.34, 32]} />
      </mesh>
    </group>
  );
}

/** Mossy stone tablet with the three target gems (each lights up when its flower matches). */
function Tablet() {
  const y = terrainHeight(PUZZLE_TABLET.x, PUZZLE_TABLET.z);
  const gemMats = useMemo(() => PUZZLE_TARGET.map((c) => new THREE.MeshStandardMaterial({ color: PUZZLE_COLORS[c], emissive: PUZZLE_COLORS[c], emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.1 })), []);
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const lvl = useGame.getState().level;
    const t = clock.elapsedTime;
    gemMats.forEach((m, i) => {
      const lit = lvl.flowers[i] === PUZZLE_TARGET[i];
      m.emissiveIntensity += ((lit ? 2.4 : 0.55 + Math.sin(t * 2 + i) * 0.2) - m.emissiveIntensity) * damp(6, dt);
    });
  });
  return (
    <group position={[PUZZLE_TABLET.x, y, PUZZLE_TABLET.z]} rotation={[0, PUZZLE_TABLET.rot, 0]}>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.95, 0.24]} />
        <meshStandardMaterial color="#9aa39a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.98, 0]} scale={[1.0, 0.16, 0.16]}>
        <sphereGeometry args={[1, 16, 8]} />
        <meshStandardMaterial color="#5ea84c" roughness={1} />
      </mesh>
      {/* flower carvings under each gem */}
      {PUZZLE_TARGET.map((_, i) => (
        <group key={i} position={[(i - 1) * 0.62, 0.55, 0.125]}>
          <mesh material={gemMats[i]} position={[0, 0.16, 0.02]}>
            <octahedronGeometry args={[0.11]} />
          </mesh>
          <mesh position={[0, -0.12, 0]}>
            <torusGeometry args={[0.07, 0.014, 6, 16]} />
            <meshStandardMaterial color="#7f877e" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Magic vine cage around the wand; shrinks away once the puzzle is solved. */
function VineCage() {
  const g = useRef<THREE.Group>(null!);
  const y = terrainHeight(WAND_POS.x, WAND_POS.z);
  const leaves = useMemo(() => Array.from({ length: 14 }, (_, k) => ({ a: (k / 14) * Math.PI * 2, h: 0.2 + (k % 5) * 0.22 })), []);
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const solved = useGame.getState().level.puzzleSolved;
    const target = solved ? 0.001 : 1;
    const s = g.current.scale.x + (target - g.current.scale.x) * damp(solved ? 3 : 8, dt);
    g.current.scale.setScalar(s);
    g.current.visible = s > 0.01;
    g.current.rotation.y = clock.elapsedTime * 0.25;
  });
  return (
    <group ref={g} position={[WAND_POS.x, y, WAND_POS.z]}>
      {[0.25, 0.6, 0.95].map((h, k) => (
        <mesh key={k} position={[0, h, 0]} rotation={[Math.PI / 2, 0, k]}>
          <torusGeometry args={[0.42 - k * 0.05, 0.035, 8, 24]} />
          <meshStandardMaterial color="#3f8f3a" emissive="#3fd06a" emissiveIntensity={0.25} roughness={0.8} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((k) => (
        <mesh key={'v' + k} position={[Math.cos(k * 1.57) * 0.38, 0.6, Math.sin(k * 1.57) * 0.38]}>
          <cylinderGeometry args={[0.025, 0.035, 1.2, 6]} />
          <meshStandardMaterial color="#3f8f3a" />
        </mesh>
      ))}
      {leaves.map((l, k) => (
        <mesh key={'l' + k} position={[Math.cos(l.a) * 0.44, l.h, Math.sin(l.a) * 0.44]} rotation={[0, -l.a, 0.6]} scale={[1, 0.3, 0.6]}>
          <sphereGeometry args={[0.08, 8, 6]} />
          <meshStandardMaterial color="#62c35a" emissive="#3fd06a" emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export function FlowerPuzzle() {
  const stage = useGame((s) => s.level.stage);
  const solved = useGame((s) => s.level.puzzleSolved);

  useEffect(() => {
    const offs = PUZZLE_FLOWERS.map((f, i) =>
      registerInteractable({
        id: `flower-${i}`,
        x: f.x,
        z: f.z,
        radius: 1.15,
        approach: 1.15,
        label: () => tr().prompts.flower,
        verb: 'touch',
        enabled: () => {
          const l = useGame.getState().level;
          return l.stage === 'findWand' && !l.puzzleSolved;
        },
        onInteract: () => touchFlower(i),
      }),
    );
    return () => offs.forEach((off) => off());
  }, []);

  const active = stage === 'findWand';
  return (
    <group>
      <Tablet />
      {PUZZLE_FLOWERS.map((_, i) => (
        <MagicFlower key={i} i={i} />
      ))}
      {active && <VineCage />}
      {active && !solved && <Sparkles count={24} scale={[3, 1.2, 1.5]} position={[PUZZLE_FLOWERS[1].x, terrainHeight(PUZZLE_FLOWERS[1].x, PUZZLE_FLOWERS[1].z) + 0.7, PUZZLE_FLOWERS[1].z]} size={4} speed={0.5} color="#fff3b0" />}
    </group>
  );
}
