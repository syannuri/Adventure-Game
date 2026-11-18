import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from '../../../utils/math';

/** Stylized gradient sky dome with sun glow and slowly drifting puffy clouds. */
/** Golden-hour sun direction (shared by the sky glow and the sun light). */
export const SUN_DIR = new THREE.Vector3(0.68, 0.42, -0.6).normalize();

export function Sky({ top = '#4f9fe0', horizon = '#ffe6c4', sunDir = SUN_DIR }) {
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
      <Clouds />
    </>
  );
}

function Clouds() {
  const group = useRef<THREE.Group>(null!);
  const clouds = useMemo(() => {
    const rnd = mulberry32(99);
    return Array.from({ length: 14 }, () => {
      const a = rnd() * Math.PI * 2;
      const r = 150 + rnd() * 90;
      const puffs = Array.from({ length: 5 + Math.floor(rnd() * 4) }, (_, i) => ({
        x: (i - 3) * 6 + rnd() * 4,
        y: rnd() * 3,
        z: rnd() * 5,
        s: 5 + rnd() * 5,
      }));
      return { x: Math.cos(a) * r, y: 45 + rnd() * 35, z: Math.sin(a) * r, rot: rnd() * Math.PI, puffs };
    });
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#e9f1ff', emissiveIntensity: 0.55, roughness: 1, fog: false }), []);
  useFrame((_, dt) => {
    group.current.rotation.y += dt * 0.004;
  });
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} rotation={[0, c.rot, 0]}>
          {c.puffs.map((p, j) => (
            <mesh key={j} material={mat} position={[p.x, p.y, p.z]} scale={[p.s, p.s * 0.62, p.s]}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
