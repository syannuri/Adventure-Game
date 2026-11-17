/** Instanced grass, flowers, mushrooms and rocks with wind animation. */
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FLOWERS, GRASS, MEADOW, MUSHROOMS, ROCKS, terrainHeight } from './layout';
import { windify } from '../../effects/wind';
import { lumpy, prep } from './Trees';
import { mulberry32 } from '../../../utils/math';

type Item = { x: number; z: number; s: number; r: number; c: number };

function useInstances(ref: React.RefObject<THREE.InstancedMesh | null>, items: Item[], color: (it: Item, c: THREE.Color) => void, scale = 1, yOff = 0) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const c = new THREE.Color();
    const up = new THREE.Vector3(0, 1, 0);
    items.forEach((it, i) => {
      p.set(it.x, terrainHeight(it.x, it.z) + yOff, it.z);
      q.setFromAxisAngle(up, it.r);
      s.setScalar(it.s * scale);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      color(it, c);
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
}

const GRASS_COLORS = ['#6dbb52', '#7cc95c', '#5fae4a', '#95d466'];
const FLOWER_COLORS = ['#ff9ec7', '#ffd36b', '#c9a7ff', '#ffffff', '#ff8f8f', '#9fd8ff'];

export function Vegetation({ quality }: { quality: 'high' | 'low' }) {
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const stemRef = useRef<THREE.InstancedMesh>(null);
  const petalRef = useRef<THREE.InstancedMesh>(null);
  const capRef = useRef<THREE.InstancedMesh>(null);
  const glowCapRef = useRef<THREE.InstancedMesh>(null);
  const mStemRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);

  const grass = useMemo(() => (quality === 'high' ? GRASS : GRASS.filter((_, i) => i % 3 === 0)), [quality]);
  const flowers = useMemo(() => {
    // extra flowers in the meadow
    const rnd = mulberry32(3);
    const extra: Item[] = Array.from({ length: 220 }, () => {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * MEADOW.r;
      return { x: MEADOW.x + Math.cos(a) * r, z: MEADOW.z + Math.sin(a) * r, s: 0.8 + rnd() * 0.6, r: rnd() * 6, c: rnd() };
    }).filter((f) => Math.hypot(f.x - MEADOW.x, f.z - MEADOW.z) > 1.2);
    const all = [...FLOWERS, ...extra];
    return quality === 'high' ? all : all.filter((_, i) => i % 2 === 0);
  }, [quality]);
  const glowShrooms = useMemo(() => MUSHROOMS.filter((_, i) => i % 3 === 0), []);
  const redShrooms = useMemo(() => MUSHROOMS.filter((_, i) => i % 3 !== 0), []);

  const geos = useMemo(() => {
    const blades: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 4; i++) {
      const b = new THREE.ConeGeometry(0.055, 0.36 + i * 0.05, 3, 1, true);
      b.deleteAttribute('uv');
      b.translate(0, 0.2 + i * 0.03, 0);
      b.rotateZ((i - 1.5) * 0.25);
      b.rotateY(i * 1.7);
      b.translate((i - 1.5) * 0.06, 0, (i % 2) * 0.05);
      blades.push(b.toNonIndexed());
    }
    const grass = mergeGeometries(blades)!;
    grass.computeVertexNormals();

    const stem = new THREE.CylinderGeometry(0.012, 0.016, 0.34, 4);
    stem.translate(0, 0.17, 0);
    const petals: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 5; i++) {
      const p = new THREE.SphereGeometry(0.045, 6, 4);
      p.scale(1, 0.35, 0.6);
      p.translate(0.05, 0, 0);
      p.rotateY((i / 5) * Math.PI * 2);
      petals.push(p);
    }
    const center = new THREE.SphereGeometry(0.025, 5, 4);
    petals.push(center);
    const petal = mergeGeometries(petals)!;
    petal.translate(0, 0.36, 0);

    const cap = new THREE.SphereGeometry(0.22, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    cap.scale(1, 0.75, 1);
    cap.translate(0, 0.26, 0);
    const mstem = new THREE.CylinderGeometry(0.06, 0.08, 0.28, 10);
    mstem.translate(0, 0.14, 0);

    const rock = prep(new THREE.DodecahedronGeometry(0.7, 1));
    lumpy(rock, 9, 0.18);
    rock.scale(1, 0.62, 1);
    return { grass, stem, petal, cap, mstem, rock };
  }, []);

  const mats = useMemo(
    () => ({
      grass: windify(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, side: THREE.DoubleSide }), 0.9, 1),
      stem: windify(new THREE.MeshStandardMaterial({ color: '#4c9a3e', roughness: 0.9 }), 0.8, 1),
      petal: windify(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.06 }), 0.8, 1),
      cap: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }),
      glowCap: new THREE.MeshStandardMaterial({ color: '#7fe3ff', emissive: '#53cfff', emissiveIntensity: 1.6, roughness: 0.4, toneMapped: false }),
      mstem: new THREE.MeshStandardMaterial({ color: '#f4ead2', roughness: 0.8 }),
      rock: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 }),
    }),
    [],
  );

  useInstances(grassRef, grass, (it, c) => c.set(GRASS_COLORS[Math.floor(it.c * GRASS_COLORS.length)]), 0.72, -0.03);
  useInstances(stemRef, flowers, (_, c) => c.set('#ffffff'), 1, -0.02);
  useInstances(petalRef, flowers, (it, c) => c.set(FLOWER_COLORS[Math.floor(it.c * FLOWER_COLORS.length)]), 1, -0.02);
  useInstances(capRef, redShrooms, (it, c) => c.set(it.c > 0.5 ? '#e8604f' : '#f08a4b'), 1.2);
  useInstances(mStemRef, MUSHROOMS, (_, c) => c.set('#ffffff'), 1.2);
  useInstances(glowCapRef, glowShrooms, (_, c) => c.set('#ffffff'), 1.2);
  useInstances(rockRef, ROCKS, (it, c) => c.set(it.c > 0.5 ? '#9aa39a' : '#8c9488'), 1.4, -0.12);

  return (
    <group>
      <instancedMesh ref={grassRef} args={[geos.grass, mats.grass, grass.length]} receiveShadow frustumCulled={false} />
      <instancedMesh ref={stemRef} args={[geos.stem, mats.stem, flowers.length]} frustumCulled={false} />
      <instancedMesh ref={petalRef} args={[geos.petal, mats.petal, flowers.length]} frustumCulled={false} />
      <instancedMesh ref={mStemRef} args={[geos.mstem, mats.mstem, MUSHROOMS.length]} castShadow />
      <instancedMesh ref={capRef} args={[geos.cap, mats.cap, redShrooms.length]} castShadow />
      <instancedMesh ref={glowCapRef} args={[geos.cap, mats.glowCap, glowShrooms.length]} />
      <instancedMesh ref={rockRef} args={[geos.rock, mats.rock, ROCKS.length]} castShadow receiveShadow />
    </group>
  );
}
