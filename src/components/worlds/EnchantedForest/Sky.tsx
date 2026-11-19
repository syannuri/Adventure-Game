import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from '../../../utils/math';

/** Stylized gradient sky dome with sun glow and slowly drifting puffy clouds. */
/** Golden-hour sun direction (shared by the sky glow and the sun light). */
export const SUN_DIR = new THREE.Vector3(0.68, 0.42, -0.6).normalize();

export function Sky({ top = '#4f9fe0', horizon = '#ffe6c4', sunDir = SUN_DIR, night = false }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new THREE.Color(top) },
          uHorizon: { value: new THREE.Color(horizon) },
          uSun: { value: sunDir.clone().normalize() },
        },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSun; varying vec3 vDir;
          void main(){
            float h = clamp(vDir.y, -0.2, 1.0);
            vec3 col = mix(uHorizon, uTop, pow(smoothstep(-0.05, 0.75, h), 0.8));
            float s = max(dot(normalize(vDir), uSun), 0.0);
            col += vec3(1.0, 0.86, 0.6) * pow(s, 24.0) * 0.55 + vec3(1.0, 0.95, 0.8) * pow(s, 600.0) * 2.0;
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [top, horizon, sunDir],
  );
  return (
    <>
      <mesh material={mat} renderOrder={-10}>
        <sphereGeometry args={[420, 32, 16]} />
      </mesh>
      <Clouds night={night} />
    </>
  );
}

function Clouds({ night = false }: { night?: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const ref = useRef<THREE.InstancedMesh>(null!);
  const puffs = useMemo(() => {
    const rnd = mulberry32(99);
    const out: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion();
    for (let c = 0; c < 14; c++) {
      const a = rnd() * Math.PI * 2;
      const r = 150 + rnd() * 90;
      const cx = Math.cos(a) * r;
      const cy = 45 + rnd() * 35;
      const cz = Math.sin(a) * r;
      const rot = rnd() * Math.PI;
      const n = 5 + Math.floor(rnd() * 4);
      for (let i = 0; i < n; i++) {
        const px = (i - 3) * 6 + rnd() * 4;
        const py = rnd() * 3;
        const pz = rnd() * 5;
        const sc = 5 + rnd() * 5;
        const x = cx + Math.cos(rot) * px + Math.sin(rot) * pz;
        const z = cz - Math.sin(rot) * px + Math.cos(rot) * pz;
        out.push(new THREE.Matrix4().compose(new THREE.Vector3(x, cy + py, z), q, new THREE.Vector3(sc, sc * 0.62, sc)));
      }
    }
    return out;
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: night ? '#3a4676' : '#ffffff', emissive: night ? '#27325c' : '#e9f1ff', emissiveIntensity: night ? 0.35 : 0.55, roughness: 1, fog: false }), [night]);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 14, 10), []);
  useLayoutEffect(() => {
    puffs.forEach((m, i) => ref.current.setMatrixAt(i, m));
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [puffs]);
  useFrame((_, dt) => {
    group.current.rotation.y += dt * 0.004;
  });
  return (
    <group ref={group}>
      <instancedMesh ref={ref} args={[geo, mat, puffs.length]} frustumCulled={false} />
    </group>
  );
}
