/**
 * Drako – a baby dragon who lives in the Crystal Cave. Lilac scales, cream belly, little wings,
 * round horns and big eyes. Droopy and sad while the cave is dark, flies happy loops at the end.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { angleDelta, damp } from '../../../utils/math';

const SCALE = '#b49cff';
const DARK = '#8f72e8';
const BELLY = '#fff0d6';

export function Dragon({ x, y, z }: { x: number; y: number; z: number }) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const wingL = useRef<THREE.Group>(null!);
  const wingR = useRef<THREE.Group>(null!);
  const tail = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const mouth = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const g = useGame.getState();
    const talking = g.dialogue?.lines[g.dialogue.index]?.speaker === 'dragon';
    const happy = g.level.stage === 'done';
    const flying = happy;
    // hover with wing beats when happy, sit and sway when sad
    body.current.position.y = flying ? 0.9 + Math.sin(t * 3) * 0.15 : talking ? Math.abs(Math.sin(t * 8)) * 0.04 : 0;
    const beat = flying ? Math.sin(t * 14) * 0.7 : Math.sin(t * 2) * 0.15 + (talking ? Math.sin(t * 9) * 0.25 : 0);
    wingL.current.rotation.z = 0.3 + beat;
    wingR.current.rotation.z = -0.3 - beat;
    tail.current.rotation.y = Math.sin(t * (happy ? 4 : 1.5)) * 0.4;
    head.current.rotation.x = happy ? -0.1 : 0.18; // droopy head when sad
    head.current.rotation.z = Math.sin(t * 1.2) * 0.06;
    mouth.current.scale.y = talking ? 0.6 + Math.abs(Math.sin(t * 13)) * 1.2 : happy ? 1.2 : 0.6;
    if (flying) {
      // little happy loops around the heart crystal
      root.current.position.x = x + Math.cos(t * 0.8) * 0.6;
      root.current.position.z = z + Math.sin(t * 0.8) * 0.6;
    }
    const dx = player.position.x - root.current.position.x;
    const dz = player.position.z - root.current.position.z;
    if (Math.hypot(dx, dz) < 9) root.current.rotation.y += angleDelta(root.current.rotation.y, Math.atan2(dx, dz)) * damp(4, dt);
  });

  return (
    <group ref={root} position={[x, y, z]}>
      <group ref={body}>
        {/* body and belly */}
        <mesh position={[0, 0.42, 0]} scale={[1, 1.1, 1.05]} castShadow>
          <sphereGeometry args={[0.32, 22, 18]} />
          <meshStandardMaterial color={SCALE} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.4, 0.15]} scale={[0.75, 0.95, 0.6]}>
          <sphereGeometry args={[0.3, 18, 14]} />
          <meshStandardMaterial color={BELLY} roughness={0.7} />
        </mesh>
        {/* back spikes */}
        {[0, 1, 2].map((k) => (
          <mesh key={k} position={[0, 0.72 - k * 0.18, -0.24 - k * 0.05]} rotation={[-0.6, 0, 0]}>
            <coneGeometry args={[0.06, 0.14, 6]} />
            <meshStandardMaterial color="#ffb3e6" />
          </mesh>
        ))}
        {/* legs */}
        {[1, -1].map((s) => (
          <mesh key={s} position={[0.16 * s, 0.1, 0.06]} scale={[1, 0.8, 1.2]}>
            <sphereGeometry args={[0.1, 12, 10]} />
            <meshStandardMaterial color={DARK} />
          </mesh>
        ))}
        {/* wings */}
        {[1, -1].map((s) => (
          <group key={s} ref={s === 1 ? wingL : wingR} position={[0.24 * s, 0.6, -0.12]}>
            <mesh position={[0.22 * s, 0.08, 0]} rotation={[0, 0, 0.3 * s]} scale={[0.36, 0.26, 0.04]}>
              <sphereGeometry args={[1, 14, 10]} />
              <meshStandardMaterial color="#ffc2ec" side={THREE.DoubleSide} roughness={0.6} />
            </mesh>
            <mesh position={[0.2 * s, 0.14, 0]} rotation={[0, 0, (Math.PI / 2 + 0.3) * s]}>
              <capsuleGeometry args={[0.025, 0.36, 4, 6]} />
              <meshStandardMaterial color={DARK} />
            </mesh>
          </group>
        ))}
        {/* tail */}
        <group ref={tail} position={[0, 0.22, -0.3]}>
          <mesh position={[0, 0, -0.18]} rotation={[-1.2, 0, 0]}>
            <coneGeometry args={[0.1, 0.45, 10]} />
            <meshStandardMaterial color={SCALE} />
          </mesh>
          <mesh position={[0, -0.05, -0.42]} rotation={[-1.2, 0, 0]}>
            <coneGeometry args={[0.07, 0.12, 4]} />
            <meshStandardMaterial color="#ffb3e6" />
          </mesh>
        </group>
        {/* head */}
        <group ref={head} position={[0, 0.88, 0.06]}>
          <mesh castShadow>
            <sphereGeometry args={[0.26, 22, 18]} />
            <meshStandardMaterial color={SCALE} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.07, 0.19]} scale={[1, 0.75, 0.9]}>
            <sphereGeometry args={[0.14, 16, 12]} />
            <meshStandardMaterial color="#c9b6ff" />
          </mesh>
          {[1, -1].map((s) => (
            <group key={s}>
              {/* nostrils */}
              <mesh position={[0.04 * s, -0.04, 0.32]}>
                <sphereGeometry args={[0.012, 6, 6]} />
                <meshStandardMaterial color="#6a4fc0" />
              </mesh>
              {/* big shiny eyes */}
              <mesh position={[0.1 * s, 0.06, 0.2]} scale={[1, 1.15, 0.7]}>
                <sphereGeometry args={[0.07, 14, 12]} />
                <meshStandardMaterial color="#2a1a40" roughness={0.15} />
              </mesh>
              <mesh position={[0.115 * s, 0.09, 0.245]}>
                <sphereGeometry args={[0.022, 8, 6]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              {/* round horns */}
              <mesh position={[0.11 * s, 0.24, -0.04]} rotation={[-0.3, 0, -0.3 * s]}>
                <coneGeometry args={[0.05, 0.16, 8]} />
                <meshStandardMaterial color="#fff3c4" />
              </mesh>
              {/* blush */}
              <mesh position={[0.17 * s, -0.04, 0.16]} scale={[1, 0.6, 0.4]}>
                <sphereGeometry args={[0.04, 10, 8]} />
                <meshStandardMaterial color="#ff9ecf" />
              </mesh>
            </group>
          ))}
          <mesh ref={mouth} position={[0, -0.12, 0.27]} scale={[1.4, 0.6, 0.5]}>
            <sphereGeometry args={[0.03, 10, 8]} />
            <meshStandardMaterial color="#6a2a50" />
          </mesh>
        </group>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.38, 20]} />
        <meshBasicMaterial color="#000" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}
