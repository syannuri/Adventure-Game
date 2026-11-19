/** Pond with animated water shader, a cascading waterfall ribbon, mossy cliff rocks and foam. */
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { POND, STREAM, STREAM_HALF, STREAM_MOUTH_S, WATER_LEVEL, WATERFALL, terrainHeight } from './layout';
import { lumpy, prep } from './Trees';
import { mulberry32 } from '../../../utils/math';

const waterUniforms = { uTime: { value: 0 } };

function useWaterMaterial(kind: 'pond' | 'fall') {
  return useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 } }]),
      vertexShader: `
        #include <fog_pars_vertex>
        varying vec2 vUv; varying vec3 vWorld;
        void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.0); vWorld = wp.xyz;
          vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader:
        kind === 'pond'
          ? `
        #include <fog_pars_fragment>
        uniform float uTime; varying vec2 vUv; varying vec3 vWorld;
        void main(){
          vec2 c = vUv - 0.5; float r = length(c) * 2.0;
          vec3 deep = vec3(0.10, 0.45, 0.55); vec3 shallow = vec3(0.45, 0.85, 0.85);
          vec3 col = mix(deep, shallow, smoothstep(0.2, 1.0, r));
          float w = sin(vWorld.x * 2.3 + uTime * 1.4) * sin(vWorld.z * 2.1 - uTime * 1.1);
          float w2 = sin((vWorld.x + vWorld.z) * 4.7 + uTime * 2.2);
          float spark = smoothstep(0.85, 1.0, w * 0.6 + w2 * 0.4);
          col += vec3(1.0) * spark * 0.45;
          // ripples near the waterfall
          float d = length(vWorld.xz - vec2(${WATERFALL.x.toFixed(2)}, ${(WATERFALL.z + 2.6).toFixed(2)}));
          col += vec3(0.9) * smoothstep(0.7, 1.0, sin(d * 6.0 - uTime * 5.0)) * (1.0 - smoothstep(0.0, 4.0, d)) * 0.35;
          float alpha = mix(0.88, 0.55, smoothstep(0.75, 1.0, r));
          gl_FragColor = vec4(col, alpha);
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`
          : `
        #include <fog_pars_fragment>
        uniform float uTime; varying vec2 vUv; varying vec3 vWorld;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        void main(){
          // vUv.y runs from the top of the cliff (0) down to the pond (1): water moves toward +y,
          // so the pattern scrolls with -uTime (it used to scroll the wrong way and looked like it rose)
          float s1 = hash(vec2(floor(vUv.x * 30.0), 1.0));
          float s2 = hash(vec2(floor(vUv.x * 12.0), 7.0));
          float f1 = fract(vUv.y * 4.5 - uTime * (1.7 + s1 * 0.9) + s1);
          float f2 = fract(vUv.y * 2.2 - uTime * (1.1 + s2 * 0.5) + s2 * 3.0);
          // long falling streaks: brightest at their leading (lower) end
          float streaks = smoothstep(0.45, 1.0, f1) * 0.55 + smoothstep(0.65, 1.0, f2) * 0.45;
          vec3 deep = vec3(0.42, 0.74, 0.88);
          vec3 col = mix(deep, vec3(1.0), clamp(0.18 + streaks, 0.0, 1.0));
          // the water is brighter where it tips over the cliff edge
          col = mix(col, vec3(1.0), smoothstep(0.35, 0.42, vUv.y) * (1.0 - smoothstep(0.42, 0.55, vUv.y)) * 0.35);
          float edge = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
          // churning white foam where it lands in the pond
          float churn = hash(vec2(floor(vUv.x * 18.0), floor(vUv.y * 24.0 - uTime * 6.0)));
          float foam = smoothstep(0.78, 0.98, vUv.y) * (0.65 + churn * 0.35);
          col = mix(col, vec3(1.0), foam);
          gl_FragColor = vec4(col, (0.74 + foam * 0.22) * edge);
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    });
    mat.uniforms.uTime = waterUniforms.uTime;
    return mat;
  }, [kind]);
}

/** Ribbon that follows the terrain from the cliff plateau down into the pond. */
function cascadeGeometry() {
  const zs: number[] = [];
  for (let z = WATERFALL.z - 6; z <= WATERFALL.z + 3.4; z += 0.25) zs.push(z);
  const width = 2.4;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  zs.forEach((z, i) => {
    const t = i / (zs.length - 1);
    const w = width * (0.8 + t * 0.5);
    for (let j = 0; j <= 4; j++) {
      const u = j / 4;
      const x = WATERFALL.x + (u - 0.5) * w;
      const y = Math.max(WATER_LEVEL + 0.02, terrainHeight(x, z) + 0.12);
      pos.push(x, y, z);
      uv.push(u, t);
    }
    if (i > 0) {
      const a = (i - 1) * 5;
      const b = i * 5;
      for (let j = 0; j < 4; j++) idx.push(a + j, b + j, a + j + 1, a + j + 1, b + j, b + j + 1);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function Water() {
  const pondMat = useWaterMaterial('pond');
  const fallMat = useWaterMaterial('fall');
  const cascade = useMemo(cascadeGeometry, []);
  const rocks = useMemo(() => {
    const rnd = mulberry32(61);
    const list: { x: number; y: number; z: number; s: number; r: number }[] = [];
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1;
      const z = WATERFALL.z - 4.5 + (i / 16) * 6.5 + rnd() * 0.6;
      const x = WATERFALL.x + side * (1.7 + rnd() * 1.6);
      list.push({ x, y: terrainHeight(x, z) - 0.2, z, s: 0.8 + rnd() * 1.1, r: rnd() * 6 });
    }
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + rnd();
      const x = POND.x + Math.cos(a) * (POND.r + 0.3);
      const z = POND.z + Math.sin(a) * (POND.r + 0.3);
      if (z < POND.z - POND.r + 1.5) continue;
      list.push({ x, y: terrainHeight(x, z) - 0.15, z, s: 0.45 + rnd() * 0.4, r: rnd() * 6 });
    }
    return list;
  }, []);
  const rockGeo = useMemo(() => {
    const g = prep(new THREE.DodecahedronGeometry(1, 1));
    lumpy(g, 4, 0.16);
    g.scale(1, 0.8, 1);
    return g;
  }, []);

  useFrame((_, dt) => {
    waterUniforms.uTime.value += dt;
  });

  const foot = WATERFALL.z + 2.4;
  return (
    <group>
      <mesh material={pondMat} position={[POND.x, WATER_LEVEL, POND.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[POND.r + 1.6, 64]} />
      </mesh>
      <mesh geometry={cascade} material={fallMat} renderOrder={2} />
      <Stream />
      {rocks.map((r, i) => (
        <mesh key={i} geometry={rockGeo} position={[r.x, r.y, r.z]} rotation={[0, r.r, 0]} scale={r.s} castShadow receiveShadow>
          <meshStandardMaterial color={i % 3 ? '#8f978d' : '#7f8a7c'} roughness={0.95} />
        </mesh>
      ))}
      {/* moss caps on the biggest rocks */}
      {rocks.slice(0, 16).map((r, i) => (
        <mesh key={'m' + i} position={[r.x, r.y + r.s * 0.62, r.z]} scale={[r.s * 0.8, r.s * 0.22, r.s * 0.8]}>
          <sphereGeometry args={[1, 14, 8]} />
          <meshStandardMaterial color="#5ea84c" roughness={1} />
        </mesh>
      ))}
      <Sparkles count={40} scale={[2.6, 1.2, 1.6]} position={[WATERFALL.x, WATER_LEVEL + 0.5, foot]} size={6} speed={1.2} color="#ffffff" opacity={0.9} />
      <Sparkles count={20} scale={[2, 4, 2]} position={[WATERFALL.x, 2.5, WATERFALL.z]} size={4} speed={0.8} color="#d8f6ff" />
      {/* lily pads */}
      {[
        [POND.x - 2.5, POND.z + 1.5],
        [POND.x + 1.8, POND.z + 3],
        [POND.x - 1, POND.z - 2.2],
        [POND.x + 3.2, POND.z - 0.5],
      ].map(([x, z], i) => (
        <group key={'l' + i} position={[x, WATER_LEVEL + 0.02, z]} rotation={[0, i * 1.7, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.45, 20, 0.3, Math.PI * 1.85]} />
            <meshStandardMaterial color="#5fb85a" roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
          {i % 2 === 0 && (
            <mesh position={[0.1, 0.08, 0.05]}>
              <sphereGeometry args={[0.1, 10, 8]} />
              <meshStandardMaterial color="#ffb3d1" emissive="#ff8fbf" emissiveIntensity={0.3} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** The stream ribbon: follows the centre line at the water level, with ripples flowing downstream. */
function Stream() {
  const geo = useMemo(() => {
    const pts = STREAM.filter((p) => p.s <= STREAM_MOUTH_S);
    const w = STREAM_HALF + 0.4;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
      const nx = -(b.z - a.z) / l;
      const nz = (b.x - a.x) / l;
      for (const side of [-1, 1]) {
        pos.push(p.x + nx * w * side, p.level, p.z + nz * w * side);
        uv.push(side < 0 ? 0 : 1, p.s);
      }
      if (i < pts.length - 1) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 } }]),
      vertexShader: `
        #include <fog_pars_vertex>
        varying vec2 vUv;
        void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `
        #include <fog_pars_fragment>
        uniform float uTime; varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        void main(){
          float across = abs(vUv.x - 0.5) * 2.0;
          vec3 deep = vec3(0.16, 0.55, 0.66); vec3 shallow = vec3(0.5, 0.88, 0.86);
          vec3 col = mix(deep, shallow, smoothstep(0.3, 1.0, across));
          // ripples carried downstream (vUv.y is metres along the stream)
          float y = vUv.y - uTime * 1.6;
          float w = sin(y * 3.1 + sin(vUv.x * 9.0 + y * 0.7) * 1.4) * sin(vUv.x * 13.0 - y * 0.9);
          col += vec3(1.0) * smoothstep(0.55, 0.95, w) * 0.35;
          float flecks = step(0.985, hash(vec2(floor(vUv.x * 26.0), floor(y * 5.0))));
          col += flecks * 0.4;
          // foam lines along the banks
          col = mix(col, vec3(0.95), smoothstep(0.78, 0.92, across) * (0.5 + 0.5 * sin(y * 4.0 + vUv.x * 30.0)) * 0.6);
          float alpha = 0.86 * (1.0 - smoothstep(0.9, 1.0, across));
          gl_FragColor = vec4(col, alpha);
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    });
    m.uniforms.uTime = waterUniforms.uTime;
    return m;
  }, []);
  // the spring: a little pool of bubbling water among mossy rocks where the stream begins
  const src = STREAM[0];
  return (
    <group>
      <mesh geometry={geo} material={mat} renderOrder={1} />
      <Sparkles count={24} scale={[2.2, 0.6, 2.2]} position={[src.x, src.level + 0.3, src.z]} size={5} speed={1.2} color="#ffffff" />
    </group>
  );
}
