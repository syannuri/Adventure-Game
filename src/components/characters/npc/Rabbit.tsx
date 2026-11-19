/** Pip – a friendly rabbit with a blue scarf. Ear twitches, hops and bounces when talking. */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { angleDelta, damp } from '../../../utils/math';

export function Rabbit({ x, y, z, npc = true, scale = 1, wander = 0, controlled = false, scarf }: { x: number; y: number; z: number; npc?: boolean; scale?: number; wander?: number; /** a parent group moves and turns it */ controlled?: boolean; scarf?: string }) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const earL = useRef<THREE.Group>(null!);
  const earR = useRef<THREE.Group>(null!);
  const seed = x * 3.1 + z;

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime + seed;
    const g = useGame.getState();
    const talking = npc && g.dialogue?.lines[g.dialogue.index]?.speaker === 'pip';
    const happy = npc && g.level.stage === 'done';
    const hopCycle = (t * (happy ? 1.6 : 0.5)) % 1;
    const hop = talking ? Math.abs(Math.sin(t * 8)) * 0.05 : hopCycle < 0.18 || happy ? Math.sin(((hopCycle % 0.5) / 0.18) * Math.PI) * 0.2 : 0;
    body.current.position.y = Math.max(0, hop);
    earL.current.rotation.x = -0.15 + (Math.sin(t * 7) > 0.92 ? 0.35 : 0) + (talking ? Math.sin(t * 10) * 0.12 : 0);
    earR.current.rotation.x = -0.1 + (Math.sin(t * 5.3 + 1) > 0.95 ? 0.4 : 0);
    body.current.scale.y = 1 + Math.sin(t * 3) * 0.02;
    if (controlled) {
      // position and facing come from the parent group
    } else if (wander) {
      const a = t * 0.15;
      root.current.position.set(x + Math.cos(a) * wander, y, z + Math.sin(a * 1.3) * wander);
      root.current.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a * 1.3) * 1.3);
    } else {
      const dx = player.position.x - x;
      const dz = player.position.z - z;
      if (Math.hypot(dx, dz) < 8) root.current.rotation.y += angleDelta(root.current.rotation.y, Math.atan2(dx, dz)) * damp(4, dt);
    }
  });

  const fur = '#e8cfb2';
  const furLight = '#fbf1e4';
  return (
    <group ref={root} position={[x, y, z]} scale={scale}>
      <group ref={body}>
        <mesh position={[0, 0.25, -0.03]} scale={[1, 1.05, 1.1]} castShadow>
          <sphereGeometry args={[0.24, 20, 16]} />
          <meshStandardMaterial color={fur} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.22, 0.12]} scale={[0.8, 0.9, 0.6]}>
          <sphereGeometry args={[0.2, 16, 12]} />
          <meshStandardMaterial color={furLight} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.2, -0.27]}>
          <sphereGeometry args={[0.08, 12, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={1} />
        </mesh>
        {[1, -1].map((s) => (
          <mesh key={s} position={[0.12 * s, 0.04, 0.08]} scale={[0.8, 0.5, 1.4]}>
            <sphereGeometry args={[0.07, 10, 8]} />
            <meshStandardMaterial color={furLight} />
          </mesh>
        ))}
        {(npc || scarf) && (
          <mesh position={[0, 0.4, 0.02]} rotation={[Math.PI / 2 + 0.15, 0, 0]}>
            <torusGeometry args={[0.13, 0.04, 10, 24]} />
            <meshStandardMaterial color={scarf ?? '#5aa8ff'} roughness={0.8} />
          </mesh>
        )}
        <group position={[0, 0.55, 0.04]}>
          <mesh castShadow>
            <sphereGeometry args={[0.18, 20, 16]} />
            <meshStandardMaterial color={fur} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.05, 0.12]} scale={[1, 0.75, 0.7]}>
            <sphereGeometry args={[0.09, 14, 10]} />
            <meshStandardMaterial color={furLight} />
          </mesh>
          <mesh position={[0, -0.01, 0.175]}>
            <sphereGeometry args={[0.022, 10, 8]} />
            <meshStandardMaterial color="#ff8fa8" />
          </mesh>
          {/* whiskers */}
          {[1, -1].flatMap((s) =>
            [-0.12, 0, 0.12].map((tilt) => (
              <mesh key={`${s}${tilt}`} position={[0.075 * s, -0.025 + tilt * 0.08, 0.16]} rotation={[0, -0.35 * s, tilt * s]}>
                <boxGeometry args={[0.11, 0.0035, 0.0035]} />
                <meshBasicMaterial color="#7a6150" />
              </mesh>
            )),
          )}
          {[1, -1].map((s) => (
            <group key={s} position={[0.075 * s, 0.04, 0.14]}>
              <mesh scale={[1, 1.15, 0.6]}>
                <sphereGeometry args={[0.032, 12, 10]} />
                <meshStandardMaterial color="#2b1b14" roughness={0.2} />
              </mesh>
              <mesh position={[0.01, 0.014, 0.017]}>
                <sphereGeometry args={[0.009, 8, 6]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          ))}
          <group ref={earL} position={[0.07, 0.14, -0.02]} rotation={[0, 0, -0.12]}>
            <mesh position={[0, 0.15, 0]} scale={[1, 1, 0.55]}>
              <capsuleGeometry args={[0.05, 0.22, 6, 12]} />
              <meshStandardMaterial color={fur} />
            </mesh>
            <mesh position={[0, 0.15, 0.02]} scale={[0.6, 0.85, 0.3]}>
              <capsuleGeometry args={[0.05, 0.22, 6, 12]} />
              <meshStandardMaterial color="#ffc3cf" />
            </mesh>
          </group>
          <group ref={earR} position={[-0.07, 0.14, -0.02]} rotation={[0, 0, 0.12]}>
            <mesh position={[0, 0.15, 0]} scale={[1, 1, 0.55]}>
              <capsuleGeometry args={[0.05, 0.22, 6, 12]} />
              <meshStandardMaterial color={fur} />
            </mesh>
            <mesh position={[0, 0.15, 0.02]} scale={[0.6, 0.85, 0.3]}>
              <capsuleGeometry args={[0.05, 0.22, 6, 12]} />
              <meshStandardMaterial color="#ffc3cf" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
