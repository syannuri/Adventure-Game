/** Jump platforms, the fairy glade (mushroom house, glowing ring) and magical path stones. */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FAIRY_POS, HOUSE, PATHS, PLATFORM_DEFS, PLATFORMS, terrainHeight } from './layout';
import { lumpy, prep } from './Trees';
import { mulberry32 } from '../../../utils/math';
import { useGame } from '../../../systems/store';

export function Platforms() {
  const rockGeo = useMemo(() => {
    const g = prep(new THREE.DodecahedronGeometry(1, 2));
    lumpy(g, 12, 0.08);
    return g;
  }, []);
  return (
    <group>
      {PLATFORM_DEFS.map((d, i) => {
        const p = PLATFORMS[i];
        const ground = terrainHeight(p.x, p.z);
        const h = p.top - ground;
        if (d.kind === 'mushroom') return <BigMushroom key={i} x={p.x} z={p.z} r={p.r} ground={ground} top={p.top} seed={i} />;
        if (d.kind === 'stump')
          return (
            <group key={i} position={[p.x, ground, p.z]}>
              <mesh position={[0, h / 2 - 0.05, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[p.r * 0.95, p.r * 1.08, h + 0.1, 18]} />
                <meshStandardMaterial color="#8b5d3d" roughness={0.95} />
              </mesh>
              <mesh position={[0, h, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[p.r * 0.95, 24]} />
                <meshStandardMaterial color="#e2b884" roughness={0.9} />
              </mesh>
              {[0.35, 0.6, 0.82].map((rr) => (
                <mesh key={rr} position={[0, h + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[p.r * rr - 0.02, p.r * rr, 28]} />
                  <meshBasicMaterial color="#b98b5c" />
                </mesh>
              ))}
            </group>
          );
        return (
          <mesh key={i} geometry={rockGeo} position={[p.x, p.top - p.r * 0.55, p.z]} scale={[p.r * 1.05, p.r * 0.55 + h * 0.5, p.r * 1.05]} castShadow receiveShadow>
            <meshStandardMaterial color="#9ba596" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function BigMushroom({ x, z, r, ground, top, seed }: { x: number; z: number; r: number; ground: number; top: number; seed: number }) {
  const spots = useMemo(() => {
    const rnd = mulberry32(seed + 300);
    return Array.from({ length: 9 }, () => {
      const a = rnd() * Math.PI * 2;
      const t = 0.3 + rnd() * 1.0;
      return { a, t, s: 0.1 + rnd() * 0.1 };
    });
  }, [seed]);
  const capH = 0.5;
  const colors = ['#ef6a5a', '#f59a4e', '#d96bd1'];
  const capColor = colors[seed % 3];
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, (ground + top - capH * 0.6) / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r * 0.32, r * 0.42, top - capH * 0.6 - ground + 0.2, 16]} />
        <meshStandardMaterial color="#f6ecd6" roughness={0.8} />
      </mesh>
      <group position={[0, top - capH, 0]}>
        <mesh castShadow receiveShadow scale={[r * 1.08, capH, r * 1.08]}>
          <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={capColor} roughness={0.45} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[r * 1.08, r * 1.08, 1]}>
          <circleGeometry args={[1, 32]} />
          <meshStandardMaterial color="#f3dcc0" side={THREE.DoubleSide} />
        </mesh>
        {spots.map((s, i) => {
          const ph = s.t * 0.9;
          return (
            <mesh key={i} position={[Math.cos(s.a) * Math.sin(ph) * r * 1.08, Math.cos(ph) * capH, Math.sin(s.a) * Math.sin(ph) * r * 1.08]} scale={[s.s * r, s.s * 0.4 * r, s.s * r]}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color="#fffaf0" roughness={0.6} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export function Glade() {
  const ring = useMemo(() => {
    const out: { x: number; z: number; s: number; c: string }[] = [];
    const cols = ['#7fe3ff', '#c3a2ff', '#ff9fd8'];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x = FAIRY_POS.x + Math.cos(a) * 4.2;
      const z = FAIRY_POS.z + Math.sin(a) * 4.2;
      // leave gaps for paths
      if (Math.abs(Math.sin(a)) > 0.9 || (Math.cos(a) > 0.55 && Math.sin(a) < 0) || (Math.cos(a) < -0.6 && Math.sin(a) < 0)) continue;
      out.push({ x, z, s: 0.7 + (i % 3) * 0.2, c: cols[i % 3] });
    }
    return out;
  }, []);
  const hy = terrainHeight(HOUSE.x, HOUSE.z);
  return (
    <group>
      {ring.map((m, i) => {
        const y = terrainHeight(m.x, m.z);
        return (
          <group key={i} position={[m.x, y, m.z]} scale={m.s}>
            <mesh position={[0, 0.16, 0]}>
              <cylinderGeometry args={[0.05, 0.07, 0.32, 8]} />
              <meshStandardMaterial color="#f3ecdb" />
            </mesh>
            <mesh position={[0, 0.32, 0]} scale={[1, 0.6, 1]}>
              <sphereGeometry args={[0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={m.c} emissive={m.c} emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      {/* Lumi's mushroom house */}
      <group position={[HOUSE.x, hy, HOUSE.z]} rotation={[0, 0.9, 0]}>
        <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.05, 1.25, 1.9, 24]} />
          <meshStandardMaterial color="#f7ecd5" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.85, 0]} scale={[1.9, 1.15, 1.9]} castShadow>
          <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e9615a" roughness={0.45} />
        </mesh>
        {[0, 1.3, 2.4, 3.6, 4.7, 5.6].map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 1.35, 2.35 + (i % 2) * 0.35, Math.sin(a) * 1.35]} scale={[0.26, 0.1, 0.26]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#fffaf0" />
          </mesh>
        ))}
        {/* door */}
        <mesh position={[0, 0.5, 1.13]}>
          <boxGeometry args={[0.6, 1.0, 0.1]} />
          <meshStandardMaterial color="#8a5534" />
        </mesh>
        <mesh position={[0, 1.0, 1.13]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 16, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#8a5534" />
        </mesh>
        <mesh position={[0.18, 0.5, 1.2]}>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshStandardMaterial color="#ffd36b" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* glowing round window */}
        <mesh position={[0.72, 1.2, 0.82]} rotation={[0, 0.72, 0]}>
          <circleGeometry args={[0.2, 20]} />
          <meshStandardMaterial color="#ffd98a" emissive="#ffc35a" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        <mesh position={[0.72, 1.2, 0.81]} rotation={[0, 0.72, 0]}>
          <ringGeometry args={[0.2, 0.26, 20]} />
          <meshStandardMaterial color="#8a5534" />
        </mesh>
      </group>
    </group>
  );
}

/** Glowing stepping stones along the paths; they shine brighter as Wishing Stars are found. */
export function PathStones() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const pts = useMemo(() => {
    const out: { x: number; z: number; r: number }[] = [];
    const rnd = mulberry32(17);
    for (const p of PATHS) {
      for (let i = 0; i < p.length - 1; i++) {
        const [ax, az] = p[i];
        const [bx, bz] = p[i + 1];
        const l = Math.hypot(bx - ax, bz - az);
        const n = Math.floor(l / 2.1);
        for (let k = 0; k < n; k++) {
          const t = (k + 0.5) / n;
          const side = k % 2 ? 1 : -1;
          const nx = -(bz - az) / l;
          const nz = (bx - ax) / l;
          out.push({ x: ax + (bx - ax) * t + nx * 1.45 * side, z: az + (bz - az) * t + nz * 1.45 * side, r: rnd() * 6 });
        }
      }
    }
    return out;
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cfefff', emissive: '#7fd8ff', emissiveIntensity: 0.4, roughness: 0.4, toneMapped: false }), []);
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.16, 0.2, 0.08, 10);
    return g;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    pts.forEach((p, i) => {
      m.makeRotationY(p.r);
      m.setPosition(p.x, terrainHeight(p.x, p.z) + 0.03, p.z);
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [pts]);
  useFrame(({ clock }) => {
    const stars = useGame.getState().level.stars.length;
    mat.emissiveIntensity = 0.35 + (stars / 5) * 1.8 + Math.sin(clock.elapsedTime * 2) * 0.12;
  });
  return <instancedMesh ref={ref} args={[geo, mat, pts.length]} />;
}
