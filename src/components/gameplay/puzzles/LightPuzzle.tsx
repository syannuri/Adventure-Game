/**
 * Light-beam puzzle (World 3). Daylight falls through a hole in the cave roof onto a prism, which
 * sends a beam east. Three mirror crystals on stone stands each send the beam on in the direction
 * they face; touching one turns it a quarter turn. The beam is drawn as far as it goes right, so a
 * child sees each step work. When all three face the right way the beam reaches the Heart Crystal.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { registerInteractable } from '../interaction/interactions';
import { BEAM_Y, DIRS, HEART, MIRRORS, MIRROR_TARGET, SOURCE, terrainHeight } from '../../worlds/CrystalCave/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { tr } from '../../../i18n';
import { damp } from '../../../utils/math';

const STUB = 2.4;

/** How many mirrors in a row (from the source) already pass the light on correctly. */
export const beamReach = (mirrors: number[]) => {
  let n = 0;
  while (n < MIRRORS.length && mirrors[n] === MIRROR_TARGET[n]) n++;
  return n;
};

/** Beam segments for the current mirror directions: [from, to][] plus whether it hits the heart. */
function beamPath(mirrors: number[]) {
  const segs: [THREE.Vector3, THREE.Vector3][] = [];
  const at = (p: { x: number; z: number }) => new THREE.Vector3(p.x, terrainHeight(p.x, p.z) + BEAM_Y, p.z);
  segs.push([at(SOURCE), at(MIRRORS[0])]);
  const reach = beamReach(mirrors);
  for (let i = 0; i < MIRRORS.length; i++) {
    const from = at(MIRRORS[i]);
    if (i < reach) {
      const next = i + 1 < MIRRORS.length ? MIRRORS[i + 1] : HEART;
      segs.push([from, at(next)]);
    } else {
      const [dx, dz] = DIRS[mirrors[i]];
      segs.push([from, from.clone().add(new THREE.Vector3(dx * STUB, 0, dz * STUB))]);
      break;
    }
  }
  return { segs, hit: reach === MIRRORS.length };
}

function turnMirror(i: number) {
  const g = useGame.getState();
  if (g.level.stage !== 'lightPuzzle' || g.level.puzzleSolved) return;
  const before = beamReach(g.level.mirrors);
  const mirrors = [...g.level.mirrors];
  mirrors[i] = (mirrors[i] + 1) % 4;
  const after = beamReach(mirrors);
  const solved = after === MIRRORS.length;
  useGame.setState((s) => ({ level: { ...s.level, mirrors, puzzleSolved: solved, lastProgressAt: performance.now() } }));
  const m = MIRRORS[i];
  const y = terrainHeight(m.x, m.z) + BEAM_Y;
  audio.sfx(after > before ? 'coin' : 'pop', { pitch: after > before ? 1 + after * 0.15 : 0.9 });
  spawnBurst(m.x, y, m.z, after > before ? '#fff3a0' : '#c9a7ff', after > before ? 26 : 10, { speed: after > before ? 2.4 : 1.4 });
}

function Mirror({ i }: { i: number }) {
  const m = MIRRORS[i];
  const y = terrainHeight(m.x, m.z);
  const head = useRef<THREE.Group>(null!);
  const glowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d6c4ff', emissive: '#9b6bff', emissiveIntensity: 0.8, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.92 }), []);
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const l = useGame.getState().level;
    const d = l.mirrors[i] ?? 0;
    const [dx, dz] = DIRS[d];
    const want = Math.atan2(dx, dz);
    let cur = head.current.rotation.y;
    let diff = ((want - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    cur += diff * damp(10, dt);
    head.current.rotation.y = cur;
    const lit = beamReach(l.mirrors) > i;
    const active = l.stage === 'lightPuzzle' && !l.puzzleSolved;
    glowMat.emissiveIntensity += ((lit ? 2.2 : active ? 0.9 + Math.sin(clock.elapsedTime * 3 + i) * 0.3 : 0.6) - glowMat.emissiveIntensity) * damp(6, dt);
    void diff;
  });
  return (
    <group position={[m.x, y, m.z]}>
      {/* stone stand */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.42, 0.7, 8]} />
        <meshStandardMaterial color="#5e5388" roughness={0.95} flatShading />
      </mesh>
      <group ref={head} position={[0, BEAM_Y, 0]}>
        {/* the prism */}
        <mesh material={glowMat} scale={[0.75, 1.25, 0.75]} castShadow>
          <octahedronGeometry args={[0.32, 0]} />
        </mesh>
        {/* arrow showing where it sends the light */}
        <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.1, 0.24, 8]} />
          <meshBasicMaterial color="#fff3a0" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** The prism under the sunbeam that starts the light. */
function SourcePrism() {
  const y = terrainHeight(SOURCE.x, SOURCE.z);
  return (
    <group position={[SOURCE.x, y, SOURCE.z]}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.32, 0.42, 0.7, 8]} />
        <meshStandardMaterial color="#5e5388" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, BEAM_Y, 0]} rotation={[0, Math.PI / 4, 0]} scale={[0.8, 1.2, 0.8]}>
        <octahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color="#fff6d6" emissive="#ffe27a" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Up to four glowing beam segments, updated from the mirror directions. */
function Beams() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  const geo = useMemo(() => new THREE.CylinderGeometry(0.07, 0.07, 1, 10, 1, true).rotateX(Math.PI / 2), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const l = useGame.getState().level;
    const on = l.stage === 'lightPuzzle' || l.stage === 'done';
    const { segs } = beamPath(l.mirrors);
    mat.opacity = 0.7 + Math.sin(clock.elapsedTime * 6) * 0.15;
    meshes.current.forEach((m, k) => {
      if (!m) return;
      const s = segs[k];
      m.visible = on && !!s;
      if (!s) return;
      const [a, b] = s;
      tmp.subVectors(b, a);
      const len = tmp.length();
      m.position.copy(a).addScaledVector(tmp, 0.5);
      m.scale.set(1, 1, len);
      m.lookAt(b);
    });
  });
  return (
    <>
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} ref={(el) => (meshes.current[k] = el)} geometry={geo} material={mat} visible={false} />
      ))}
    </>
  );
}

export function LightPuzzle({ onSolved }: { onSolved: () => void }) {
  const stage = useGame((s) => s.level.stage);
  const solved = useGame((s) => s.level.puzzleSolved);
  const solvedRef = useRef(onSolved);
  solvedRef.current = onSolved;
  const fired = useRef(false);

  useEffect(() => {
    const offs = MIRRORS.map((m, i) =>
      registerInteractable({
        id: `mirror-${i}`,
        x: m.x,
        z: m.z,
        radius: 1.6,
        approach: 1.0,
        label: () => tr().prompts.turnMirror,
        verb: 'touch',
        enabled: () => {
          const l = useGame.getState().level;
          return l.stage === 'lightPuzzle' && !l.puzzleSolved;
        },
        onInteract: () => turnMirror(i),
      }),
    );
    return () => offs.forEach((f) => f());
  }, []);

  useEffect(() => {
    if (solved && stage === 'lightPuzzle' && !fired.current) {
      fired.current = true;
      const y = terrainHeight(HEART.x, HEART.z) + 1.4;
      window.setTimeout(() => {
        audio.sfx('magic');
        spawnBurst(HEART.x, y, HEART.z, '#fff3a0', 70, { speed: 4 });
        spawnBurst(HEART.x, y, HEART.z, '#c9a7ff', 50, { speed: 3 });
        window.setTimeout(() => solvedRef.current(), 900);
      }, 400);
    }
  }, [solved, stage]);

  return (
    <group>
      <SourcePrism />
      {MIRRORS.map((_, i) => (
        <Mirror key={i} i={i} />
      ))}
      <Beams />
      {stage === 'lightPuzzle' && !solved && <Sparkles count={30} scale={[16, 2, 10]} position={[-6, 1.4, -12]} size={4} speed={0.4} color="#fff3b0" />}
    </group>
  );
}
