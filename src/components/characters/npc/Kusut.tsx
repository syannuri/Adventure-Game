/**
 * Si Kusut (Grumble): a round, fuzzy purple monster with stubby yellow horns and big eyes. Cheeky
 * and grumpy at first (frown, slanted brows), happy once he becomes Anet's friend. Never scary: soft
 * shapes, pastel colours, little blush on the cheeks. He bounces as he moves.
 */
import { forwardRef, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from '../../../utils/math';

const fur = new THREE.MeshStandardMaterial({ color: '#9a6be0', roughness: 0.9 });
const furDark = new THREE.MeshStandardMaterial({ color: '#7d52c4', roughness: 0.95 });
const horn = new THREE.MeshStandardMaterial({ color: '#ffd23f', roughness: 0.5 });
const white = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });
const pupil = new THREE.MeshStandardMaterial({ color: '#2b1b3a', roughness: 0.3 });
const dark = new THREE.MeshStandardMaterial({ color: '#4b2a7a', roughness: 0.6 });
const blush = new THREE.MeshStandardMaterial({ color: '#ff9fc8', transparent: true, opacity: 0.7, roughness: 0.8 });

export interface KusutProps {
  /** smiling friend instead of a grumpy prankster */
  happy?: boolean;
  scale?: number;
  /** extra bounce (running / cheering) */
  lively?: boolean;
}

export const Kusut = forwardRef<THREE.Group, KusutProps>(function Kusut({ happy = false, scale = 1, lively = false }, ref) {
  const body = useRef<THREE.Group>(null!);
  const lids = useRef<THREE.Group>(null!);
  const tufts = useMemo(() => {
    const rnd = mulberry32(17);
    return Array.from({ length: 34 }, () => {
      const u = rnd() * 2 - 1;
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const n = new THREE.Vector3(Math.cos(a) * r, u, Math.sin(a) * r);
      if (n.z > 0.55 && n.y > -0.4) n.z = 0.2; // keep the face clear
      n.normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
      return { p: n.clone().multiplyScalar(0.5), q, s: 0.7 + rnd() * 0.6 };
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const f = lively ? 7 : 3;
    const hop = Math.abs(Math.sin(t * f)) * (lively ? 0.22 : 0.06);
    body.current.position.y = 0.62 + hop;
    const sq = 1 + Math.sin(t * f * 2) * (lively ? 0.06 : 0.025);
    body.current.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    body.current.rotation.z = Math.sin(t * 1.3) * 0.06;
    // blink now and then
    const blink = t % 3.7 < 0.12 ? 1 : 0;
    lids.current.scale.y = blink ? 1 : 0.001;
  });

  return (
    <group ref={ref} scale={scale}>
      {/* feet */}
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.09, 0.08]} scale={[0.17, 0.1, 0.24]} material={furDark} castShadow>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
      ))}
      <group ref={body} position={[0, 0.62, 0]}>
        <mesh material={fur} castShadow>
          <icosahedronGeometry args={[0.55, 3]} />
        </mesh>
        {tufts.map((tf, i) => (
          <mesh key={i} position={tf.p} quaternion={tf.q} scale={tf.s} material={i % 3 ? fur : furDark}>
            <coneGeometry args={[0.09, 0.2, 6]} />
          </mesh>
        ))}
        {/* horns */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.26, 0.48, 0.05]} rotation={[0.1, 0, -s * 0.35]} material={horn}>
            <coneGeometry args={[0.08, 0.26, 10]} />
          </mesh>
        ))}
        {/* little arms */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.56, -0.08, 0.08]} rotation={[0, 0, s * (happy ? -0.9 : 0.5)]} scale={[0.1, 0.2, 0.1]} material={fur}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        ))}
        {/* eyes */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.17, 0.1, 0.46]}>
            <mesh scale={[0.13, 0.155, 0.08]} material={white}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
            <mesh position={[s * -0.015, -0.015, 0.06]} scale={[0.07, 0.08, 0.04]} material={pupil}>
              <sphereGeometry args={[1, 12, 10]} />
            </mesh>
            <mesh position={[s * -0.035, 0.02, 0.095]} material={white}>
              <sphereGeometry args={[0.018, 8, 6]} />
            </mesh>
            {/* brow: slanted down to the middle when grumpy, raised when happy */}
            <mesh position={[0, 0.2, 0.04]} rotation={[0, 0, happy ? s * 0.2 : -s * 0.45]} scale={[0.13, 0.025, 0.03]} material={dark}>
              <boxGeometry args={[1, 1, 1]} />
            </mesh>
          </group>
        ))}
        <group ref={lids}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.17, 0.1, 0.5]} scale={[0.135, 0.16, 0.06]} material={fur}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          ))}
        </group>
        {/* mouth: frown or smile */}
        <mesh position={[0, happy ? -0.12 : -0.2, 0.5]} rotation={[0, 0, happy ? Math.PI : 0]} material={dark}>
          <torusGeometry args={[0.1, 0.022, 8, 16, Math.PI]} />
        </mesh>
        {!happy && (
          <mesh position={[-0.04, -0.17, 0.53]} rotation={[0, 0, Math.PI]} material={white}>
            <coneGeometry args={[0.022, 0.05, 6]} />
          </mesh>
        )}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.3, -0.08, 0.42]} scale={[0.07, 0.045, 0.02]} material={blush}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
});
