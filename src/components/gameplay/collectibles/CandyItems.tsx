/** 3D models of the Candy Village collectibles: the five ingredients, peppermints and gift boxes. */
import { useMemo } from 'react';
import * as THREE from 'three';
import { strawberryTexture } from '../../worlds/CandyVillage/candyTextures';

export const INGREDIENT_GLOW: Record<string, string> = {
  'ing-strawberry': '#ff8fa8',
  'ing-choco': '#ffc28a',
  'ing-honey': '#ffd36b',
  'ing-sugar': '#e8f4ff',
  'ing-mint': '#9effc4',
};

function Strawberry() {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      pts.push(new THREE.Vector2(Math.sin(t * Math.PI) * (0.14 + t * 0.12) + 0.004, t * 0.42 - 0.21));
    }
    return new THREE.LatheGeometry(pts, 24);
  }, []);
  return (
    <group>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial map={strawberryTexture()} roughness={0.3} emissive="#ff3355" emissiveIntensity={0.15} />
      </mesh>
      {[0, 1, 2, 3, 4].map((k) => (
        <mesh key={k} position={[Math.cos((k / 5) * Math.PI * 2) * 0.09, 0.22, Math.sin((k / 5) * Math.PI * 2) * 0.09]} rotation={[0, -(k / 5) * Math.PI * 2, 0.9]} scale={[1, 0.3, 0.55]}>
          <sphereGeometry args={[0.08, 10, 8]} />
          <meshStandardMaterial color="#3fae4a" />
        </mesh>
      ))}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.012, 0.016, 0.1, 6]} />
        <meshStandardMaterial color="#2f8a3a" />
      </mesh>
    </group>
  );
}

function ChocolateBar() {
  return (
    <group rotation={[0.25, 0, 0.15]}>
      <mesh castShadow>
        <boxGeometry args={[0.44, 0.07, 0.3]} />
        <meshStandardMaterial color="#5a2e16" roughness={0.35} />
      </mesh>
      {[-1, 0, 1].map((i) =>
        [-0.5, 0.5].map((j) => (
          <mesh key={i + ':' + j} position={[i * 0.14, 0.045, j * 0.14]}>
            <boxGeometry args={[0.12, 0.03, 0.12]} />
            <meshStandardMaterial color="#6b3a1c" roughness={0.3} />
          </mesh>
        )),
      )}
      {/* pink wrapper on one half */}
      <mesh position={[0.13, -0.002, 0]}>
        <boxGeometry args={[0.2, 0.085, 0.32]} />
        <meshStandardMaterial color="#ff6fae" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0.13, 0.045, 0]}>
        <boxGeometry args={[0.2, 0.004, 0.06]} />
        <meshStandardMaterial color="#ffd23f" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function HoneyJar() {
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.13, 0.3, 24]} />
        <meshPhysicalMaterial color="#ffb21f" roughness={0.15} transmission={0.4} thickness={0.3} emissive="#ff9a00" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.165, 0.165, 0.06, 24]} />
        <meshStandardMaterial color="#ff6fae" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.2, 0]} scale={[1, 0.35, 1]}>
        <sphereGeometry args={[0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ff8fbf" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.146]}>
        <planeGeometry args={[0.16, 0.12]} />
        <meshStandardMaterial color="#fff6dc" roughness={0.8} />
      </mesh>
      {/* a little honey drip */}
      <mesh position={[0.1, 0.08, 0.09]} scale={[0.6, 1.4, 0.6]}>
        <sphereGeometry args={[0.03, 10, 8]} />
        <meshStandardMaterial color="#ffb21f" roughness={0.1} />
      </mesh>
    </group>
  );
}

function SugarCrystals() {
  const bits = useMemo(
    () => [
      [0, 0, 0, 0.13, 0],
      [0.12, -0.05, 0.04, 0.09, 0.6],
      [-0.11, -0.06, 0.02, 0.08, 1.2],
      [0.03, -0.07, -0.11, 0.08, 2.1],
      [-0.03, 0.1, 0.06, 0.07, 2.8],
    ],
    [],
  );
  return (
    <group>
      {bits.map(([x, y, z, r, a], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[a, a * 1.7, a * 0.5]} castShadow>
          <octahedronGeometry args={[r]} />
          <meshPhysicalMaterial color={i % 2 ? '#ffd6ea' : '#ffffff'} roughness={0.05} transmission={0.3} thickness={0.2} emissive="#ffffff" emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function MintLeaf() {
  return (
    <group rotation={[0.3, 0, 0]}>
      {[1, -1].map((s) => (
        <group key={s} rotation={[0, 0, s * 0.55]}>
          <mesh position={[0, 0.12, 0]} scale={[0.5, 1, 0.12]} castShadow>
            <sphereGeometry args={[0.15, 18, 12]} />
            <meshStandardMaterial color="#3ccf7a" roughness={0.5} emissive="#1f9a52" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0, 0.12, 0.018]} scale={[0.04, 1, 0.04]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshStandardMaterial color="#a9f5c8" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[0.012, 0.015, 0.1, 6]} />
        <meshStandardMaterial color="#2f8a3a" />
      </mesh>
    </group>
  );
}

export function IngredientModel({ id }: { id: string }) {
  switch (id) {
    case 'ing-strawberry':
      return <Strawberry />;
    case 'ing-choco':
      return <ChocolateBar />;
    case 'ing-honey':
      return <HoneyJar />;
    case 'ing-sugar':
      return <SugarCrystals />;
    default:
      return <MintLeaf />;
  }
}

/** Peppermint candy: a red-and-white swirl disc in a twisted wrapper. */
export function Peppermint() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 128, 128);
    g.translate(64, 64);
    g.fillStyle = '#e8344c';
    for (let k = 0; k < 6; k++) {
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, 64, (k / 6) * Math.PI * 2, (k / 6) * Math.PI * 2 + 0.5);
      g.closePath();
      g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.07, 28]} />
        <meshStandardMaterial map={tex} roughness={0.2} emissive="#ff6b7d" emissiveIntensity={0.12} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0.2 * s, 0, 0]} rotation={[0, 0, (-Math.PI / 2) * s]}>
          <coneGeometry args={[0.07, 0.1, 10]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.75} roughness={0.15} />
        </mesh>
      ))}
    </group>
  );
}

const GIFT_COLORS: Record<string, [string, string]> = {
  'gift-west': ['#ff6fae', '#ffd23f'],
  'gift-east': ['#5ab8ff', '#ff6fae'],
  'gift-north': ['#9b6bff', '#7ee081'],
};

/** Gift box body and lid (the lid group is animated by the caller). */
export function giftColors(id: string) {
  return GIFT_COLORS[id] ?? ['#ff6fae', '#ffd23f'];
}
