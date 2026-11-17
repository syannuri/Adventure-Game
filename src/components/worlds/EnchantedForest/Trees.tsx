/**
 * Giant magical trees. Instanced for performance: one trunk mesh + three canopy shape variants,
 * per-instance colour variation and GPU wind sway. Hero trees are hand-placed giants with
 * glowing lanterns.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { HERO_TREES, TREES, terrainHeight } from './layout';
import { windify } from '../../effects/wind';
import { mulberry32 } from '../../../utils/math';

/** Strip uv/normals and weld vertices so displaced shapes stay watertight and shade smoothly. */
export function prep(g: THREE.BufferGeometry) {
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  return mergeVertices(g);
}

export function lumpy(geo: THREE.BufferGeometry, seed: number, amt: number) {
  const rnd = mulberry32(seed);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const off = [rnd() * 10, rnd() * 10, rnd() * 10];
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = Math.sin(v.x * 2.1 + off[0]) * Math.sin(v.y * 2.3 + off[1]) * Math.sin(v.z * 1.9 + off[2]);
    v.multiplyScalar(1 + n * amt);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function blob(r: number, x: number, y: number, z: number, seed: number, sy = 0.85) {
  const g = prep(new THREE.IcosahedronGeometry(r, 2));
  lumpy(g, seed, 0.12);
  g.scale(1, sy, 1);
  g.translate(x, y, z);
  return g;
}

function canopyVariants() {
  // 0: round fluffy crown
  const v0 = mergeGeometries([
    blob(1.6, 0, 3.6, 0, 1),
    blob(1.15, 1.1, 3.2, 0.3, 2),
    blob(1.1, -1.0, 3.3, -0.4, 3),
    blob(1.05, 0.2, 4.6, -0.2, 4),
    blob(0.95, -0.3, 3.1, 1.0, 5),
  ])!;
  // 1: tall layered crown (stylized pine)
  const layers: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const g = prep(new THREE.ConeGeometry(1.7 - i * 0.33, 1.6, 9, 2));
    lumpy(g, 10 + i, 0.06);
    g.translate(0, 2.6 + i * 0.95, 0);
    layers.push(g);
  }
  const v1 = mergeGeometries(layers)!;
  // 2: wide umbrella crown
  const v2 = mergeGeometries([
    blob(1.9, 0, 3.9, 0, 21, 0.55),
    blob(1.2, 1.5, 3.7, 0.4, 22, 0.6),
    blob(1.2, -1.4, 3.75, -0.5, 23, 0.6),
    blob(1.1, 0.2, 3.7, 1.4, 24, 0.6),
    blob(1.1, -0.3, 3.8, -1.4, 25, 0.6),
  ])!;
  return [v0, v1, v2];
}

function trunkGeometry() {
  const t = prep(new THREE.CylinderGeometry(0.24, 0.42, 3.4, 10, 4));
  lumpy(t, 77, 0.05);
  t.translate(0, 1.7, 0);
  const roots: THREE.BufferGeometry[] = [t];
  for (let i = 0; i < 4; i++) {
    const r = prep(new THREE.ConeGeometry(0.16, 0.9, 6));
    r.computeVertexNormals();
    r.rotateZ(Math.PI / 2.6);
    r.translate(0.38, 0.15, 0);
    r.rotateY((i / 4) * Math.PI * 2 + 0.4);
    roots.push(r);
  }
  return mergeGeometries(roots)!;
}

const CANOPY_COLORS = ['#4fae55', '#3f9b4f', '#62b95a', '#2f8a55', '#57b086', '#7cc466'];

export function Trees({ shadows }: { shadows: boolean }) {
  const trunkRef = useRef<THREE.InstancedMesh>(null!);
  const canopyRefs = [useRef<THREE.InstancedMesh>(null!), useRef<THREE.InstancedMesh>(null!), useRef<THREE.InstancedMesh>(null!)];
  const { trunk, canopies, trunkMat, canopyMat, byVariant } = useMemo(() => {
    const byVariant: (typeof TREES)[] = [[], [], []];
    TREES.forEach((t) => byVariant[t.variant].push(t));
    return {
      trunk: trunkGeometry(),
      canopies: canopyVariants(),
      trunkMat: new THREE.MeshStandardMaterial({ color: '#8a5a3c', roughness: 0.95 }),
      canopyMat: windify(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 }), 0.012, 0.4),
      byVariant,
    };
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const c = new THREE.Color();
    TREES.forEach((t, i) => {
      p.set(t.x, terrainHeight(t.x, t.z) - 0.1, t.z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.rot);
      s.setScalar(t.s);
      m.compose(p, q, s);
      trunkRef.current.setMatrixAt(i, m);
      c.set('#8a5a3c').offsetHSL(0, 0, (t.hue - 0.5) * 0.08);
      trunkRef.current.setColorAt(i, c);
    });
    trunkRef.current.instanceMatrix.needsUpdate = true;
    if (trunkRef.current.instanceColor) trunkRef.current.instanceColor.needsUpdate = true;
    byVariant.forEach((list, v) => {
      const mesh = canopyRefs[v].current;
      list.forEach((t, i) => {
        p.set(t.x, terrainHeight(t.x, t.z) - 0.1, t.z);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.rot);
        s.setScalar(t.s);
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
        c.set(CANOPY_COLORS[Math.floor(t.hue * CANOPY_COLORS.length)]);
        c.offsetHSL((t.hue - 0.5) * 0.03, 0, (t.hue - 0.5) * 0.06);
        mesh.setColorAt(i, c);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
    trunkRef.current.computeBoundingSphere();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[trunk, trunkMat, TREES.length]} castShadow={shadows} receiveShadow />
      {canopies.map((g, v) => (
        <instancedMesh key={v} ref={canopyRefs[v]} args={[g, canopyMat, byVariant[v].length]} castShadow={shadows} receiveShadow />
      ))}
      {HERO_TREES.map((t, i) => (
        <HeroTree key={i} x={t.x} z={t.z} s={t.s} seed={i} shadows={shadows} />
      ))}
    </group>
  );
}

const LANTERN_COLORS = ['#ffd27a', '#ffb3d9', '#a9e8ff'];

function HeroTree({ x, z, s, seed, shadows }: { x: number; z: number; s: number; seed: number; shadows: boolean }) {
  const lanterns = useRef<THREE.Group>(null!);
  const { trunk, crown, lanternList } = useMemo(() => {
    const rnd = mulberry32(100 + seed);
    const trunk = trunkGeometry();
    trunk.scale(1.5, 1.15, 1.5);
    const crown = mergeGeometries([
      blob(2.1, 0, 4.5, 0, 50 + seed),
      blob(1.5, 1.7, 4.1, 0.4, 51 + seed),
      blob(1.5, -1.6, 4.2, -0.5, 52 + seed),
      blob(1.4, 0.2, 5.8, -0.2, 53 + seed),
      blob(1.3, -0.3, 4.0, 1.6, 54 + seed),
      blob(1.3, 0.4, 4.0, -1.6, 55 + seed),
    ])!;
    const lanternList = Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + rnd();
      const r = 1.6 + rnd() * 0.9;
      return { x: Math.cos(a) * r, y: 2.6 + rnd() * 0.7, z: Math.sin(a) * r, c: LANTERN_COLORS[i % 3], len: 0.4 + rnd() * 0.6, ph: rnd() * 6 };
    });
    return { trunk, crown, lanternList };
  }, [seed]);
  const y = terrainHeight(x, z) - 0.1;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    lanterns.current.children.forEach((l, i) => {
      l.rotation.z = Math.sin(t * 1.3 + lanternList[i].ph) * 0.08;
      l.rotation.x = Math.cos(t * 1.1 + lanternList[i].ph) * 0.06;
    });
  });

  return (
    <group position={[x, y, z]} scale={s}>
      <mesh geometry={trunk} castShadow={shadows} receiveShadow>
        <meshStandardMaterial color="#7d5236" roughness={0.95} />
      </mesh>
      <mesh geometry={crown} castShadow={shadows} receiveShadow>
        <meshStandardMaterial color={seed === 1 ? '#5aa985' : '#4fa757'} roughness={0.8} />
      </mesh>
      <group ref={lanterns}>
        {lanternList.map((l, i) => (
          <group key={i} position={[l.x, l.y + l.len, l.z]}>
            <mesh position={[0, -l.len / 2, 0]}>
              <cylinderGeometry args={[0.008, 0.008, l.len, 4]} />
              <meshBasicMaterial color="#3c2a1e" />
            </mesh>
            <mesh position={[0, -l.len - 0.08, 0]}>
              <sphereGeometry args={[0.11, 12, 10]} />
              <meshStandardMaterial color={l.c} emissive={l.c} emissiveIntensity={2.4} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
