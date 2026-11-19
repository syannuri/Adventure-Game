/**
 * Things Anet wears from Kiki's shop, attached to the HD model's neck bone (head items) and to
 * the backpack (bag charm). Positions are in the neck bone's space, measured on the sculpt.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../../systems/store';
import { cosmetic } from '../../../data/cosmetics';
import { starShapeGeometry } from '../../gameplay/collectibles/Wand';

function heartShapeGeometry(size: number, depth: number) {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(-0.15, -0.65, -1, -0.2, -1, 0.3);
  s.bezierCurveTo(-1, 0.8, -0.45, 1.0, 0, 0.6);
  s.bezierCurveTo(0.45, 1.0, 1, 0.8, 1, 0.3);
  s.bezierCurveTo(1, -0.2, 0.15, -0.65, 0, -0.9);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 14 });
  g.center();
  g.scale(size, size, 1);
  return g;
}

function StarClip({ color }: { color: string }) {
  const star = useMemo(() => starShapeGeometry(0.05, 0.022, 0.018), []);
  return (
    <group position={[0.122, 0.27, 0.03]} rotation={[0, 0.7, -0.35]} scale={0.42}>
      <mesh position={[-0.02, -0.035, -0.01]} rotation={[0, 0, 0.9]}>
        <boxGeometry args={[0.07, 0.012, 0.008]} />
        <meshStandardMaterial color="#c9a7ff" metalness={0.3} roughness={0.3} />
      </mesh>
      <mesh geometry={star}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} metalness={0.3} roughness={0.25} />
      </mesh>
    </group>
  );
}

function PinkBow({ color }: { color: string }) {
  return (
    <group position={[0.075, 0.345, -0.075]} rotation={[-0.5, 0.5, -0.3]}>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0.045 * s, 0, 0]} rotation={[0, 0, (s * Math.PI) / 2]} scale={[0.75, 1.15, 0.45]}>
          <sphereGeometry args={[0.045, 14, 10]} />
          <meshStandardMaterial color={color} roughness={0.45} />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.022, 12, 10]} />
        <meshStandardMaterial color="#e2508f" roughness={0.45} />
      </mesh>
    </group>
  );
}

function FlowerCrown() {
  const flowers = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2, c: ['#ff8fbf', '#ffffff', '#ffd23f', '#c9a7ff'][i % 4] })), []);
  return (
    <group position={[0, 0.28, -0.035]} rotation={[-0.42, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.135, 0.009, 6, 40]} />
        <meshStandardMaterial color="#5fae5c" />
      </mesh>
      {flowers.map((f, i) => (
        <group key={i} position={[Math.cos(f.a) * 0.135, 0.012, Math.sin(f.a) * 0.135]} rotation={[0, -f.a, 0]}>
          {[0, 1, 2, 3, 4].map((k) => (
            <mesh key={k} position={[0, Math.sin((k / 5) * Math.PI * 2) * 0.018, Math.cos((k / 5) * Math.PI * 2) * 0.018]}>
              <sphereGeometry args={[0.014, 8, 6]} />
              <meshStandardMaterial color={f.c} roughness={0.5} />
            </mesh>
          ))}
          <mesh position={[0.006, 0, 0]}>
            <sphereGeometry args={[0.01, 8, 6]} />
            <meshStandardMaterial color="#ffd34d" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function AcornCap({ color }: { color: string }) {
  return (
    <group position={[0, 0.28, -0.04]} rotation={[-0.38, 0, 0.12]}>
      <mesh scale={[1, 0.5, 1]} castShadow>
        <sphereGeometry args={[0.165, 28, 18]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <torusGeometry args={[0.158, 0.016, 8, 40]} />
        <meshStandardMaterial color="#6e4220" roughness={0.85} />
      </mesh>
      <mesh position={[0.01, 0.095, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.008, 0.012, 0.06, 8]} />
        <meshStandardMaterial color="#5a3018" />
      </mesh>
    </group>
  );
}

function HeartGlasses({ color }: { color: string }) {
  const heart = useMemo(() => heartShapeGeometry(0.032, 0.006), []);
  const rim = useMemo(() => heartShapeGeometry(0.038, 0.004), []);
  return (
    <group position={[0.001, 0.19, 0.128]}>
      {[0.05, -0.048].map((x) => (
        <group key={x} position={[x, 0, 0]} rotation={[0, x > 0 ? 0.28 : -0.28, 0]}>
          <mesh geometry={rim} position={[0, 0, -0.002]}>
            <meshStandardMaterial color={color} roughness={0.35} />
          </mesh>
          <mesh geometry={heart} position={[0, 0, 0.001]}>
            <meshStandardMaterial color="#ffc2d4" transparent opacity={0.55} roughness={0.1} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.012, 0.002]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.004, 0.004, 0.03, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/** Items worn on the head; mount under the HD model's neck bone. */
export function HeadAccessories() {
  const equipped = useGame((s) => s.save.equipped);
  const head = cosmetic(equipped.head);
  const face = cosmetic(equipped.face);
  return (
    <>
      {head?.id === 'clip-star' && <StarClip color={head.color} />}
      {head?.id === 'bow-pink' && <PinkBow color={head.color} />}
      {head?.id === 'crown-flower' && <FlowerCrown />}
      {head?.id === 'hat-acorn' && <AcornCap color={head.color} />}
      {face?.id === 'glasses-heart' && <HeartGlasses color={face.color} />}
    </>
  );
}

/** A little gold star dangling from the backpack (mount inside the backpack group). */
export function BagCharm() {
  const equipped = useGame((s) => s.save.equipped);
  const swing = useRef<THREE.Group>(null!);
  const star = useMemo(() => starShapeGeometry(0.05, 0.022, 0.016), []);
  useFrame(({ clock }) => {
    if (swing.current) swing.current.rotation.z = Math.sin(clock.elapsedTime * 3.2) * 0.35;
  });
  const c = cosmetic(equipped.charm);
  if (!c) return null;
  return (
    <group position={[0.15, 0.12, -0.02]}>
      <group ref={swing}>
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.1, 4]} />
          <meshStandardMaterial color="#8a86a8" />
        </mesh>
        <mesh geometry={star} position={[0, -0.11, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.38}>
          <meshStandardMaterial color={c.color} emissive={c.color} emissiveIntensity={0.35} metalness={0.4} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}
