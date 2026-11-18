/** Candy Village ground (pastel frosting meadow, cream paths, chocolate banks) and the chocolate river. */
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { distToPath, distToRiver, FIELD, RIVER, RIVER_LEVEL, RIVER_W, terrainHeight } from './layout';
import { mulberry32, smoothstep } from '../../../utils/math';

export function CandyTerrain() {
  const geo = useMemo(() => {
    const size = 150;
    const seg = 190;
    const g = new THREE.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const mint = new THREE.Color('#8fe0b4');
    const pink = new THREE.Color('#ffacd0');
    const lilac = new THREE.Color('#c9b0ff');
    const hill = new THREE.Color('#f59cc6');
    const path = new THREE.Color('#ffe9c2');
    const pathEdge = new THREE.Color('#f2c98e');
    const bank = new THREE.Color('#8a5232');
    const field = new THREE.Color('#b8ec9c');
    const c = new THREE.Color();
    const rnd = mulberry32(9);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = terrainHeight(x, z);
      pos.setY(i, y);
      const n = Math.sin(x * 0.17 + Math.cos(z * 0.13) * 2.2) * 0.5 + 0.5;
      const n2 = Math.sin(x * 0.07 - z * 0.11 + 1) * 0.5 + 0.5;
      c.copy(mint).lerp(pink, smoothstep(0.35, 0.65, n)).lerp(lilac, smoothstep(0.7, 0.95, n2) * 0.6);
      c.offsetHSL(0, 0, (rnd() - 0.5) * 0.02);
      const r = Math.hypot(x, z);
      c.lerp(hill, smoothstep(33, 52, r) * 0.75);
      c.lerp(field, (1 - smoothstep(FIELD.r - 1.5, FIELD.r + 1.5, Math.hypot(x - FIELD.x, z - FIELD.z))) * 0.7);
      const dp = distToPath(x, z);
      c.lerp(pathEdge, (1 - smoothstep(1.5, 2.3, dp)) * 0.5);
      c.lerp(path, 1 - smoothstep(0.9, 1.8, dp));
      const dr = distToRiver(x, z);
      c.lerp(bank, 1 - smoothstep(RIVER_W - 0.2, RIVER_W + 1.4, dr));
      c.multiplyScalar(0.92 + smoothstep(-0.6, 1.2, y) * 0.1);
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
      <meshStandardMaterial vertexColors roughness={0.75} metalness={0} />
    </mesh>
  );
}

/** Ribbon geometry along the river centre line (u = distance along, v = across). */
function riverGeometry() {
  const pts = RIVER.map(([x, z]) => new THREE.Vector2(x, z));
  const curve = new THREE.SplineCurve(pts);
  const N = 220;
  const half = RIVER_W + 0.9;
  const positions: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  let along = 0;
  let prev = curve.getPoint(0);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPoint(t);
    along += p.distanceTo(prev);
    prev = p;
    const tan = curve.getTangent(t);
    const nx = -tan.y;
    const nz = tan.x;
    for (const side of [-1, 1]) {
      positions.push(p.x + nx * half * side, RIVER_LEVEL, p.y + nz * half * side);
      uvs.push(along, side * 0.5 + 0.5);
    }
    if (i < N) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); // counter-clockwise from above (faces up)
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function ChocolateRiver() {
  const geo = useMemo(riverGeometry, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        fog: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: { ...THREE.UniformsLib.fog, uTime: { value: 0 } },
        vertexShader: `
          varying vec2 vUv; varying vec3 vW;
          #include <fog_pars_vertex>
          void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          }`,
        fragmentShader: `
          uniform float uTime; varying vec2 vUv; varying vec3 vW;
          #include <fog_pars_fragment>
          float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
          float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
          void main(){
            vec2 p = vec2(vUv.x * 0.6 - uTime * 0.9, vUv.y * 3.0);
            float w = n(p * 1.3) * 0.6 + n(p * 3.1 + 7.0) * 0.4;
            vec3 dark = vec3(0.20, 0.09, 0.04), milk = vec3(0.45, 0.22, 0.10);
            vec3 col = mix(dark, milk, w);
            // flowing ripples across the stream
            float rip = sin(vUv.x * 2.4 - uTime * 3.0 + n(p * 2.0) * 4.0) * 0.5 + 0.5;
            col *= 0.85 + rip * 0.25;
            // creamy swirls of milk chocolate
            float swirl = smoothstep(0.6, 0.7, n(vec2(vUv.x * 0.35 - uTime * 0.6, vUv.y * 2.0 + 3.0)));
            col = mix(col, vec3(0.78, 0.55, 0.36), swirl * 0.3);
            // glossy highlights that slide downstream
            float gloss = pow(n(p * 2.2 + vec2(uTime * 0.3, 0.0)), 5.0);
            col += vec3(1.0, 0.82, 0.62) * gloss * 0.6;
            // a lighter creamy line where the chocolate meets the banks
            float bankLine = smoothstep(0.1, 0.18, vUv.y) * smoothstep(0.26, 0.18, vUv.y) + smoothstep(0.9, 0.82, vUv.y) * smoothstep(0.74, 0.82, vUv.y);
            col = mix(col, vec3(0.62, 0.38, 0.22), bankLine * 0.45);
            float edge = smoothstep(0.0, 0.14, vUv.y) * smoothstep(1.0, 0.86, vUv.y);
            gl_FragColor = vec4(col, 0.98 * edge);
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      }),
    [],
  );
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += Math.min(dt, 0.05);
  });
  return <mesh geometry={geo} material={mat} renderOrder={1} />;
}
