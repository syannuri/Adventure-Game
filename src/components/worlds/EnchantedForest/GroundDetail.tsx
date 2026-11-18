/**
 * Ground detail that makes the forest floor feel lived-in: flowering bushes, pebbles, ferns,
 * fallen leaves and mossy fallen logs. All instanced (one draw call per kind).
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BUSHES, FERNS, LEAVES, LOGS, PEBBLES, terrainHeight } from './layout';
import { lumpy, prep } from './Trees';
import { windify } from '../../effects/wind';

type Item = { x: number; z: number; s: number; r: number; c: number };

function useInstances(ref: React.RefObject<THREE.InstancedMesh | null>, items: Item[], color: (it: Item, c: THREE.Color) => void, scale = 1, yOff = 0, tilt = 0) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      p.set(it.x, terrainHeight(it.x, it.z) + yOff, it.z);
      e.set((it.c - 0.5) * tilt, it.r, (it.s - 1) * tilt);
      q.setFromEuler(e);
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

const BUSH_COLORS = ['#3f8f45', '#4c9d4a', '#5aa956', '#2f7f48'];
const BLOSSOM_COLORS = ['#ffb3d1', '#fff1a6', '#ffffff', '#c9b0ff'];
const PEBBLE_COLORS = ['#a9ada4', '#9a9f95', '#bcb8ab', '#8f948a'];
const LEAF_COLORS = ['#d98b2b', '#e8b33c', '#b5652a', '#c9a24a', '#8f6a3a'];

export function GroundDetail({ quality }: { quality: 'high' | 'low' }) {
  const bushRef = useRef<THREE.InstancedMesh>(null);
  const blossomRef = useRef<THREE.InstancedMesh>(null);
  const pebbleRef = useRef<THREE.InstancedMesh>(null);
  const fernRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const leaves = useMemo(() => (quality === 'high' ? LEAVES : LEAVES.filter((_, i) => i % 3 === 0)), [quality]);
  const pebbles = useMemo(() => (quality === 'high' ? PEBBLES : PEBBLES.filter((_, i) => i % 2 === 0)), [quality]);

  const geos = useMemo(() => {
    // bush: three lumpy blobs
    const parts = [
      [0.55, 0, 0.32, 0],
      [0.42, 0.38, 0.26, 0.12],
      [0.4, -0.34, 0.25, -0.1],
    ].map(([r, x, y, z], i) => {
      const g = prep(new THREE.IcosahedronGeometry(r, 2));
      lumpy(g, 80 + i, 0.14);
      g.scale(1, 0.78, 1);
      g.translate(x, y, z);
      return g;
    });
    const bush = mergeGeometries(parts)!;
    // blossoms dotted on the bush surface
    const dots: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const d = new THREE.SphereGeometry(0.05, 6, 4);
      d.translate(Math.cos(a) * 0.48, 0.36 + (i % 3) * 0.09, Math.sin(a) * 0.4);
      dots.push(d);
    }
    const blossoms = mergeGeometries(dots)!;
    const pebble = prep(new THREE.DodecahedronGeometry(0.11, 0));
    lumpy(pebble, 5, 0.2);
    pebble.scale(1, 0.55, 1);
    // fern: a rosette of arching fronds
    const frond = new THREE.Shape();
    frond.moveTo(0, 0);
    frond.quadraticCurveTo(0.07, 0.25, 0.012, 0.55);
    frond.quadraticCurveTo(-0.05, 0.25, 0, 0);
    const fronds: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 7; i++) {
      const f = new THREE.ShapeGeometry(frond, 6);
      f.rotateX(-0.95 + (i % 2) * 0.2);
      f.rotateY((i / 7) * Math.PI * 2);
      fronds.push(f);
    }
    const fern = mergeGeometries(fronds)!;
    fern.computeVertexNormals();
    const leaf = new THREE.CircleGeometry(0.075, 5);
    leaf.scale(1, 0.6, 1);
    leaf.rotateX(-Math.PI / 2);
    return { bush, blossoms, pebble, fern, leaf };
  }, []);

  const mats = useMemo(
    () => ({
      bush: windify(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 }), 0.02, 0.5),
      blossom: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.12 }),
      pebble: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }),
      fern: windify(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, side: THREE.DoubleSide }), 0.5, 1.2),
      leaf: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, side: THREE.DoubleSide }),
    }),
    [],
  );

  useInstances(bushRef, BUSHES, (it, c) => c.set(BUSH_COLORS[Math.floor(it.c * BUSH_COLORS.length)]), 1.25, -0.05);
  useInstances(blossomRef, BUSHES, (it, c) => c.set(BLOSSOM_COLORS[Math.floor(it.c * 7) % BLOSSOM_COLORS.length]), 1.25, -0.05);
  useInstances(pebbleRef, pebbles, (it, c) => c.set(PEBBLE_COLORS[Math.floor(it.c * PEBBLE_COLORS.length)]), 1, -0.02, 0.4);
  useInstances(fernRef, FERNS, (it, c) => c.set(it.c > 0.5 ? '#4e9a3c' : '#3f8a3a'), 1.3, -0.02);
  useInstances(leafRef, leaves, (it, c) => c.set(LEAF_COLORS[Math.floor(it.c * LEAF_COLORS.length)]), 1, 0.012, 0.25);

  return (
    <group>
      <instancedMesh ref={bushRef} args={[geos.bush, mats.bush, BUSHES.length]} castShadow receiveShadow />
      <instancedMesh ref={blossomRef} args={[geos.blossoms, mats.blossom, BUSHES.length]} />
      <instancedMesh ref={pebbleRef} args={[geos.pebble, mats.pebble, pebbles.length]} receiveShadow />
      <instancedMesh ref={fernRef} args={[geos.fern, mats.fern, FERNS.length]} receiveShadow />
      <instancedMesh ref={leafRef} args={[geos.leaf, mats.leaf, leaves.length]} receiveShadow />
      {LOGS.map((l, i) => (
        <FallenLog key={i} {...l} />
      ))}
    </group>
  );
}

function FallenLog({ x, z, rot, len }: { x: number; z: number; rot: number; len: number }) {
  const y = terrainHeight(x, z);
  return (
    <group position={[x, y + 0.28, z]} rotation={[0, rot, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.34, len, 14]} />
        <meshStandardMaterial color="#7b5236" roughness={0.95} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[(len / 2 + 0.002) * s, 0, 0]} rotation={[0, (Math.PI / 2) * s, 0]}>
          <circleGeometry args={[0.3, 16]} />
          <meshStandardMaterial color="#d8b07c" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.24, 0]} scale={[len * 0.42, 0.12, 0.26]}>
        <sphereGeometry args={[1, 14, 8]} />
        <meshStandardMaterial color="#5ea84c" roughness={1} />
      </mesh>
      {[-0.3, 0.1, 0.45].map((f, i) => (
        <group key={i} position={[f * len * 0.5, 0.22, 0.24]} scale={0.55}>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.12, 8]} />
            <meshStandardMaterial color="#f3ead6" />
          </mesh>
          <mesh position={[0, 0.13, 0]} scale={[1, 0.6, 1]}>
            <sphereGeometry args={[0.09, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={i === 1 ? '#f59a4e' : '#e8604f'} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
