/** Ambient life: butterflies, ducks on the pond and a flock of birds overhead. */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from '../../../utils/math';
import { getWorldPhysics } from '../../../systems/physics';
import { setAnimalSpot } from '../../../systems/animalSpots';

const WING_COLORS = ['#ffb347', '#ff8fc8', '#9fd2ff', '#c8a2ff', '#fff07a'];

function wingShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.12, 0.16, 0.26, 0.12, 0.22, -0.02);
  s.bezierCurveTo(0.2, -0.1, 0.12, -0.16, 0, -0.02);
  return new THREE.ShapeGeometry(s, 8);
}

export function Butterflies({ count = 16 }) {
  const group = useRef<THREE.Group>(null!);
  const flies = useMemo(() => {
    const rnd = mulberry32(8);
    return Array.from({ length: count }, (_, i) => ({
      cx: (rnd() - 0.5) * 50,
      cz: (rnd() - 0.5) * 50,
      rx: 1.5 + rnd() * 3,
      rz: 1.5 + rnd() * 3,
      sp: 0.3 + rnd() * 0.4,
      ph: rnd() * 10,
      color: WING_COLORS[i % WING_COLORS.length],
    }));
  }, [count]);
  const wing = useMemo(wingShape, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    group.current.children.forEach((b, i) => {
      const f = flies[i];
      const a = t * f.sp + f.ph;
      const x = f.cx + Math.sin(a) * f.rx;
      const z = f.cz + Math.sin(a * 1.7) * f.rz;
      const y = getWorldPhysics().height(x, z) + 1.0 + Math.sin(a * 3.1) * 0.35; // works in every world
      const dx = Math.cos(a) * f.rx;
      const dz = Math.cos(a * 1.7) * 1.7 * f.rz;
      b.position.set(x, y, z);
      setAnimalSpot('butterfly', i, x, z);
      b.rotation.y = Math.atan2(dx, dz);
      const flap = Math.sin(t * 18 + f.ph) * 1.1;
      b.children[0].rotation.z = flap;
      b.children[1].rotation.z = -flap;
    });
  });
  return (
    <group ref={group}>
      {flies.map((f, i) => (
        <group key={i} scale={0.9}>
          <group>
            <mesh geometry={wing} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color={f.color} side={THREE.DoubleSide} emissive={f.color} emissiveIntensity={0.35} />
            </mesh>
          </group>
          <group scale={[-1, 1, 1]}>
            <mesh geometry={wing} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color={f.color} side={THREE.DoubleSide} emissive={f.color} emissiveIntensity={0.35} />
            </mesh>
          </group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.012, 0.08, 4, 6]} />
            <meshStandardMaterial color="#3a2a2a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Birds() {
  const group = useRef<THREE.Group>(null!);
  const birds = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ ox: (i % 3) * 1.4 - (i > 2 ? 0.7 : 0), oz: Math.floor(i / 3) * 1.4 + Math.abs(i % 3 - 1) * 0.8 })), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = t * 0.05;
    group.current.position.set(Math.cos(a) * 35, 22, Math.sin(a) * 35);
    group.current.rotation.y = -a;
    group.current.children.forEach((b, i) => {
      const f = Math.sin(t * 7 + i) * 0.6;
      b.children[0].rotation.z = f;
      b.children[1].rotation.z = -f;
    });
  });
  return (
    <group ref={group}>
      {birds.map((b, i) => (
        <group key={i} position={[b.ox, Math.sin(i) * 0.3, b.oz]}>
          {[1, -1].map((s) => (
            <group key={s}>
              <mesh position={[0.25 * s, 0, 0]} scale={[0.5, 0.04, 0.16]}>
                <boxGeometry />
                <meshBasicMaterial color="#3b4a63" />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
