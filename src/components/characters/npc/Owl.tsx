/** Olli – a wise talking owl with round glasses, perched on a mossy stump. */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { angleDelta, damp } from '../../../utils/math';

export function Owl({ x, y, z }: { x: number; y: number; z: number }) {
  const head = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const lids = useRef<THREE.Group>(null!);
  const wingL = useRef<THREE.Mesh>(null!);
  const wingR = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const g = useGame.getState();
    const talking = g.dialogue?.lines[g.dialogue.index]?.speaker === 'olli';
    const dx = player.position.x - x;
    const dz = player.position.z - z;
    const want = Math.hypot(dx, dz) < 10 ? Math.atan2(dx, dz) : Math.sin(t * 0.4) * 1.2;
    body.current.rotation.y += angleDelta(body.current.rotation.y, want * 0.4) * damp(2, dt);
    head.current.rotation.y += angleDelta(head.current.rotation.y, want * 0.6 - body.current.rotation.y * 0.0) * damp(4, dt);
    head.current.rotation.z = Math.sin(t * 0.8) * 0.12 + (talking ? Math.sin(t * 6) * 0.08 : 0);
    const blink = Math.sin(t * 1.7) > 0.97 ? 1 : 0;
    lids.current.visible = blink === 1;
    const flap = talking ? Math.abs(Math.sin(t * 7)) * 0.5 : 0;
    wingL.current.rotation.z = 0.15 + flap;
    wingR.current.rotation.z = -0.15 - flap;
  });
  const brown = '#9a6b4a';
  const belly = '#f1dcc0';
  return (
    <group position={[x, y, z]}>
      {/* perch stump */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.55, 0.7, 16]} />
        <meshStandardMaterial color="#7d5236" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.71, 0]} scale={[1, 0.2, 1]}>
        <sphereGeometry args={[0.46, 16, 10]} />
        <meshStandardMaterial color="#62ad4f" roughness={1} />
      </mesh>
      <group ref={body} position={[0, 0.78, 0]}>
        <mesh position={[0, 0.3, 0]} scale={[1, 1.15, 0.95]} castShadow>
          <sphereGeometry args={[0.3, 20, 16]} />
          <meshStandardMaterial color={brown} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.25, 0.14]} scale={[0.8, 1, 0.6]}>
          <sphereGeometry args={[0.26, 16, 12]} />
          <meshStandardMaterial color={belly} roughness={0.9} />
        </mesh>
        <mesh ref={wingL} position={[0.27, 0.3, -0.02]} scale={[0.35, 0.9, 0.7]}>
          <sphereGeometry args={[0.25, 12, 10]} />
          <meshStandardMaterial color="#86593b" />
        </mesh>
        <mesh ref={wingR} position={[-0.27, 0.3, -0.02]} scale={[0.35, 0.9, 0.7]}>
          <sphereGeometry args={[0.25, 12, 10]} />
          <meshStandardMaterial color="#86593b" />
        </mesh>
        {[1, -1].map((s) => (
          <mesh key={s} position={[0.08 * s, 0.0, 0.1]} scale={[1, 0.4, 1.3]}>
            <sphereGeometry args={[0.05, 10, 8]} />
            <meshStandardMaterial color="#f5a742" />
          </mesh>
        ))}
        <group ref={head} position={[0, 0.66, 0]}>
          <mesh castShadow scale={[1.1, 0.95, 1]}>
            <sphereGeometry args={[0.24, 20, 16]} />
            <meshStandardMaterial color={brown} roughness={0.85} />
          </mesh>
          {[1, -1].map((s) => (
            <group key={s} position={[0.095 * s, 0.02, 0.17]}>
              <mesh scale={[1, 1, 0.5]}>
                <sphereGeometry args={[0.09, 18, 14]} />
                <meshStandardMaterial color={belly} />
              </mesh>
              <mesh position={[0, 0, 0.03]} scale={[1, 1, 0.5]}>
                <sphereGeometry args={[0.06, 16, 12]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, -0.005, 0.055]} scale={[1, 1, 0.5]}>
                <sphereGeometry args={[0.038, 14, 10]} />
                <meshStandardMaterial color="#3a2414" roughness={0.2} />
              </mesh>
              <mesh position={[0.012, 0.015, 0.072]}>
                <sphereGeometry args={[0.011, 8, 6]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              {/* round glasses */}
              <mesh position={[0, 0, 0.07]}>
                <torusGeometry args={[0.072, 0.008, 8, 24]} />
                <meshStandardMaterial color="#c79a3b" metalness={0.6} roughness={0.3} />
              </mesh>
              {/* ear tufts */}
              <mesh position={[0.06 * s, 0.2, -0.12]} rotation={[0, 0, -0.5 * s]}>
                <coneGeometry args={[0.04, 0.12, 8]} />
                <meshStandardMaterial color="#86593b" />
              </mesh>
            </group>
          ))}
          <group ref={lids}>
            {[1, -1].map((s) => (
              <mesh key={s} position={[0.095 * s, 0.03, 0.215]} scale={[1, 1, 0.3]}>
                <sphereGeometry args={[0.062, 12, 10]} />
                <meshStandardMaterial color="#8a5d3f" />
              </mesh>
            ))}
          </group>
          <mesh position={[0, -0.05, 0.22]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.03, 0.08, 8]} />
            <meshStandardMaterial color="#f5a742" />
          </mesh>
        </group>
      </group>
    </group>
  );
}
