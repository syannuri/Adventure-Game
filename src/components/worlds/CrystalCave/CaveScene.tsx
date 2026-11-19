/**
 * Crystal Cave scenery: rocky floor, the cave dome with glow-worms, the sunbeam from a hole in the
 * roof, crystal clusters, stalagmites/stalactites, glowing mushrooms, the glowing lake, stone pillars.
 * Repeated props are instanced to stay light on phones.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CAVE_MUSHROOMS,
  CAVE_R,
  CLUSTERS,
  GLOW_DUST,
  LAKE,
  LAKE_LEVEL,
  PLATFORM_DEFS,
  PLATFORMS,
  ROCKS,
  ROOF_H,
  SOURCE,
  STALAGMITES,
  distToPath,
  terrainHeight,
  type Prop,
} from './layout';
import { mulberry32, smoothstep } from '../../../utils/math';

const CRYSTAL_COLORS = ['#b38cff', '#6fe3ff', '#ff8fd6', '#8fb8ff'];

export function CaveFloor() {
  const geo = useMemo(() => {
    const size = 110;
    const seg = 170;
    const g = new THREE.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const floorA = new THREE.Color('#5a4f82');
    const floorB = new THREE.Color('#483f6e');
    const moss = new THREE.Color('#3f6b74');
    const wall = new THREE.Color('#2b2545');
    const path = new THREE.Color('#9b8fd0');
    const shore = new THREE.Color('#5a8fa8');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = terrainHeight(x, z);
      pos.setY(i, y);
      const n = Math.sin(x * 0.31 + Math.cos(z * 0.27) * 2) * 0.5 + 0.5;
      const n2 = Math.sin(x * 0.09 - z * 0.13) * 0.5 + 0.5;
      c.copy(floorA).lerp(floorB, n).lerp(moss, smoothstep(0.65, 0.95, n2) * 0.5);
      c.lerp(wall, smoothstep(CAVE_R - 3, CAVE_R + 4, Math.hypot(x, z)));
      c.lerp(path, (1 - smoothstep(0.8, 1.8, distToPath(x, z))) * 0.55);
      c.lerp(shore, (1 - smoothstep(LAKE.r - 0.5, LAKE.r + 1.6, Math.hypot(x - LAKE.x, z - LAKE.z))) * 0.7);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.9} />
    </mesh>
  );
}

/** The cave roof: a dark dome with twinkling glow-worms and a round hole where daylight falls in. */
export function CaveDome() {
  const worms = useRef<THREE.Points>(null!);
  const geo = useMemo(() => {
    const rnd = mulberry32(77);
    const n = 900;
    const p = new Float32Array(n * 3);
    const ph = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const el = 0.12 + rnd() * 1.3;
      const r = 44;
      p[i * 3] = Math.cos(a) * Math.cos(el) * r;
      p[i * 3 + 1] = Math.sin(el) * ROOF_H * 0.98;
      p[i * 3 + 2] = Math.sin(a) * Math.cos(el) * r;
      ph[i] = rnd() * 6.28;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
    return g;
  }, []);
  const wormMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `attribute float phase; uniform float uTime; varying float vA;
          void main(){ vA = 0.45 + 0.55 * sin(uTime * 1.3 + phase); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = 4.0 * (60.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(0.55, 0.95, 1.0, (1.0 - d * 2.0) * vA); }`,
      }),
    [],
  );
  useFrame((_, dt) => {
    wormMat.uniforms.uTime.value += Math.min(dt, 0.05);
  });
  // stalactites hanging from the roof
  const stalactites = useMemo(() => {
    const rnd = mulberry32(88);
    return Array.from({ length: 46 }, () => {
      const a = rnd() * Math.PI * 2;
      const r = 6 + rnd() * 34;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = ROOF_H * Math.sqrt(Math.max(0, 1 - (r / 46) ** 2)) - 0.5;
      return { x, z, y, s: 0.8 + rnd() * 1.6 };
    }).filter((s) => Math.hypot(s.x - SOURCE.x, s.z - SOURCE.z) > 5);
  }, []);
  const stRef = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    stalactites.forEach((s, i) => stRef.current.setMatrixAt(i, m.compose(new THREE.Vector3(s.x, s.y - s.s * 1.2, s.z), new THREE.Quaternion(), new THREE.Vector3(s.s, s.s * 2.4, s.s))));
    stRef.current.instanceMatrix.needsUpdate = true;
    stRef.current.computeBoundingSphere();
  }, [stalactites]);
  const stGeo = useMemo(() => new THREE.ConeGeometry(0.5, 1, 7).rotateX(Math.PI), []);
  return (
    <>
      <mesh scale={[46, ROOF_H, 46]}>
        <sphereGeometry args={[1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#251f3d" roughness={1} side={THREE.BackSide} />
      </mesh>
      <points ref={worms} geometry={geo} material={wormMat} />
      <instancedMesh ref={stRef} args={[stGeo, undefined, stalactites.length]}>
        <meshStandardMaterial color="#3d3460" roughness={0.95} />
      </instancedMesh>
      <SunShaft />
    </>
  );
}

/** Daylight falling through a hole in the roof onto the beam source. */
function SunShaft() {
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame(({ clock }) => {
    mat.current.opacity = 0.16 + Math.sin(clock.elapsedTime * 0.8) * 0.03;
  });
  const y = terrainHeight(SOURCE.x, SOURCE.z);
  return (
    <group position={[SOURCE.x, y, SOURCE.z]}>
      <mesh position={[0, ROOF_H / 2, 0]}>
        <cylinderGeometry args={[1.6, 0.9, ROOF_H, 24, 1, true]} />
        <meshBasicMaterial ref={mat} color="#fff3c4" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial color="#fff3c4" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* the bright opening in the roof */}
      <mesh position={[0, ROOF_H * 0.93, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 32]} />
        <meshBasicMaterial color="#fffbe6" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function useInstances(ref: React.RefObject<THREE.InstancedMesh | null>, items: Prop[], fn: (p: Prop, m: THREE.Matrix4, i: number) => void, colors?: (p: Prop) => THREE.Color) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    items.forEach((it, i) => {
      fn(it, m, i);
      mesh.setMatrixAt(i, m);
      if (colors) mesh.setColorAt(i, colors(it));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, items, fn, colors]);
}

/** Crystal clusters: several hexagonal shards per cluster, glowing in four colours. */
export function CrystalClusters() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const shards = useMemo(() => {
    const rnd = mulberry32(5);
    const out: { x: number; y: number; z: number; s: number; tx: number; tz: number; rot: number; c: number }[] = [];
    for (const cl of CLUSTERS) {
      const n = 3 + Math.floor(rnd() * 4);
      const y = terrainHeight(cl.x, cl.z);
      for (let k = 0; k < n; k++) {
        const a = rnd() * Math.PI * 2;
        const r = rnd() * 0.45 * cl.s;
        out.push({ x: cl.x + Math.cos(a) * r, y, z: cl.z + Math.sin(a) * r, s: cl.s * (0.45 + rnd() * 0.75), tx: (rnd() - 0.5) * 0.9, tz: (rnd() - 0.5) * 0.9, rot: rnd() * 3, c: Math.floor(cl.c * CRYSTAL_COLORS.length) });
      }
    }
    return out;
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.22, 0.3, 1.6, 6, 1);
    // pointed tip
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0.7) pos.setXYZ(i, pos.getX(i) * 0.05, pos.getY(i) + 0.35, pos.getZ(i) * 0.05);
    g.computeVertexNormals();
    g.translate(0, 0.8, 0);
    return g;
  }, []);
  useLayoutEffect(() => {
    const mesh = ref.current!;
    const m = new THREE.Matrix4();
    const e = new THREE.Euler();
    const q = new THREE.Quaternion();
    shards.forEach((s, i) => {
      e.set(s.tx, s.rot, s.tz);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(s.x, s.y - 0.1, s.z), q, new THREE.Vector3(s.s, s.s, s.s));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, new THREE.Color(CRYSTAL_COLORS[s.c]));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [shards]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, shards.length]} castShadow>
      <meshPhysicalMaterial roughness={0.12} metalness={0.05} clearcoat={1} emissive="#7a5cff" emissiveIntensity={0.55} transparent opacity={0.92} />
    </instancedMesh>
  );
}

export function Stalagmites() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.ConeGeometry(0.55, 1, 8).translate(0, 0.5, 0), []);
  const fn = useMemo(() => (p: Prop, m: THREE.Matrix4) => m.compose(new THREE.Vector3(p.x, terrainHeight(p.x, p.z) - 0.1, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.rot, 0)), new THREE.Vector3(p.s, p.s * 2.6, p.s)), []);
  useInstances(ref, STALAGMITES, fn);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, STALAGMITES.length]} castShadow receiveShadow>
      <meshStandardMaterial color="#5a4f80" roughness={0.95} />
    </instancedMesh>
  );
}

export function CaveRocks() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.DodecahedronGeometry(0.7, 0), []);
  const fn = useMemo(() => (p: Prop, m: THREE.Matrix4) => m.compose(new THREE.Vector3(p.x, terrainHeight(p.x, p.z) + 0.1, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(p.rot, p.rot * 2, 0)), new THREE.Vector3(p.s, p.s * 0.7, p.s)), []);
  useInstances(ref, ROCKS, fn);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, ROCKS.length]} castShadow receiveShadow>
      <meshStandardMaterial color="#4b4270" roughness={1} flatShading />
    </instancedMesh>
  );
}

export function CaveMushrooms() {
  const stems = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);
  const stemGeo = useMemo(() => new THREE.CylinderGeometry(0.07, 0.1, 0.6, 8).translate(0, 0.3, 0), []);
  const capGeo = useMemo(() => new THREE.SphereGeometry(0.32, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.58, 0), []);
  const fn = useMemo(() => (p: Prop, m: THREE.Matrix4) => m.compose(new THREE.Vector3(p.x, terrainHeight(p.x, p.z) - 0.02, p.z), new THREE.Quaternion(), new THREE.Vector3(p.s, p.s, p.s)), []);
  const colors = useMemo(() => (p: Prop) => new THREE.Color(['#6fe3ff', '#b38cff', '#7dffc4'][Math.floor(p.c * 3)]), []);
  useInstances(stems, CAVE_MUSHROOMS, fn);
  useInstances(caps, CAVE_MUSHROOMS, fn, colors);
  return (
    <>
      <instancedMesh ref={stems} args={[stemGeo, undefined, CAVE_MUSHROOMS.length]}>
        <meshStandardMaterial color="#e6e2ff" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[capGeo, undefined, CAVE_MUSHROOMS.length]}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  );
}

/** Tiny glowing crystal specks on the floor. */
export function GlowDust({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => GLOW_DUST.slice(0, count), [count]);
  const geo = useMemo(() => new THREE.OctahedronGeometry(0.06), []);
  const fn = useMemo(() => (p: Prop, m: THREE.Matrix4) => m.compose(new THREE.Vector3(p.x, terrainHeight(p.x, p.z) + 0.04, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(p.rot, p.rot, 0)), new THREE.Vector3(p.s, p.s, p.s)), []);
  const colors = useMemo(() => (p: Prop) => new THREE.Color(CRYSTAL_COLORS[Math.floor(p.c * CRYSTAL_COLORS.length)]), []);
  useInstances(ref, items, fn, colors);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, items.length]}>
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/** Glowing lake: calm turquoise water that shimmers. */
export function GlowLake() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uTime; varying vec2 vP;
          void main(){
            float r = length(vP);
            float ripple = sin(r * 3.2 - uTime * 1.4) * 0.5 + 0.5;
            float shimmer = sin(vP.x * 5.0 + uTime * 0.9) * sin(vP.y * 4.0 - uTime * 0.7);
            vec3 deep = vec3(0.05, 0.35, 0.45), glow = vec3(0.35, 0.95, 1.0);
            vec3 col = mix(deep, glow, 0.25 + ripple * 0.2 + shimmer * 0.08);
            float edge = smoothstep(${(LAKE.r + 1.2).toFixed(1)}, ${(LAKE.r - 0.5).toFixed(1)}, r);
            gl_FragColor = vec4(col, 0.88 * edge);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += Math.min(dt, 0.05);
  });
  return (
    <mesh position={[LAKE.x, LAKE_LEVEL, LAKE.z]} rotation={[-Math.PI / 2, 0, 0]} material={mat} renderOrder={1}>
      <circleGeometry args={[LAKE.r + 1.3, 48]} />
    </mesh>
  );
}

/** Stone pillars to jump on (crystal-capped). */
export function StonePillars() {
  return (
    <>
      {PLATFORM_DEFS.map((p, i) => {
        const g = terrainHeight(p.x, p.z);
        const h = PLATFORMS[i].top - g;
        return (
          <group key={i} position={[p.x, g, p.z]}>
            <mesh position={[0, h / 2 - 0.1, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[p.r, p.r * 1.15, h + 0.2, 9]} />
              <meshStandardMaterial color="#5e5388" roughness={0.95} flatShading />
            </mesh>
            <mesh position={[0, h - 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[p.r * 0.75, p.r * 0.95, 9]} />
              <meshBasicMaterial color={CRYSTAL_COLORS[i % 4]} transparent opacity={0.6} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

/** Little bats fluttering around (and a sticker to collect). */
export function Bats({ onMove }: { onMove: (i: number, x: number, z: number) => void }) {
  const group = useRef<THREE.Group>(null!);
  const bats = useMemo(() => [
    { cx: 6, cz: 8, r: 3.2, h: 3.2, sp: 0.6 },
    { cx: -8, cz: -2, r: 2.6, h: 3.6, sp: -0.7 },
    { cx: 10, cz: -14, r: 2.8, h: 4.5, sp: 0.5 },
    { cx: -12, cz: 16, r: 3.5, h: 3.4, sp: -0.55 },
  ], []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    group.current.children.forEach((b, i) => {
      const s = bats[i];
      const a = t * s.sp + i;
      const x = s.cx + Math.cos(a) * s.r;
      const z = s.cz + Math.sin(a) * s.r;
      b.position.set(x, terrainHeight(x, z) + s.h + Math.sin(t * 2 + i) * 0.3, z);
      b.rotation.y = -a + (s.sp > 0 ? 0 : Math.PI);
      const flap = Math.sin(t * 16 + i) * 0.9;
      b.children[1].rotation.z = flap;
      b.children[2].rotation.z = -flap;
      onMove(i, x, z);
    });
  });
  return (
    <group ref={group}>
      {bats.map((_, i) => (
        <group key={i} scale={0.8}>
          <mesh>
            <sphereGeometry args={[0.13, 12, 10]} />
            <meshStandardMaterial color="#5a4a7a" />
          </mesh>
          {[1, -1].map((s) => (
            <group key={s}>
              <mesh position={[0.22 * s, 0, 0]} scale={[0.32, 0.03, 0.18]}>
                <sphereGeometry args={[1, 10, 6]} />
                <meshStandardMaterial color="#7a6a9e" />
              </mesh>
            </group>
          ))}
          {[1, -1].map((s) => (
            <mesh key={'e' + s} position={[0.05 * s, 0.03, 0.11]}>
              <sphereGeometry args={[0.025, 8, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
