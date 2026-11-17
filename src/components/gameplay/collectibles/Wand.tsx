/** Lumi's magic wand: a white-gold stick with a glowing star tip. */
import { useMemo } from 'react';
import * as THREE from 'three';

export function starShapeGeometry(outer = 0.5, inner = 0.22, depth = 0.18) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 3 });
  g.center();
  return g;
}

export function Wand() {
  const star = useMemo(() => starShapeGeometry(0.18, 0.08, 0.04), []);
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.02, 0.026, 0.6, 10]} />
        <meshStandardMaterial color="#fff6e0" metalness={0.3} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <torusGeometry args={[0.03, 0.01, 6, 14]} />
        <meshStandardMaterial color="#ffd36b" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh geometry={star} position={[0, 0.66, 0]}>
        <meshStandardMaterial color="#fff3a0" emissive="#ffd84a" emissiveIntensity={2.6} toneMapped={false} />
      </mesh>
    </group>
  );
}
