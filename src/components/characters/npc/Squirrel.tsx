/**
 * Kiki – the squirrel shopkeeper, behind a little wooden stall with a striped awning, a jar of
 * golden acorns and her wares on display. Fluffy tail swishes, she hops when Anet comes by.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { angleDelta, damp } from '../../../utils/math';

const FUR = '#e08a3c';
const BELLY = '#fbe2c2';

function Kiki({ wx, wz, rot }: { wx: number; wz: number; rot: number }) {
  const body = useRef<THREE.Group>(null!);
  const tail = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const tailGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.2, -0.18), new THREE.Vector3(0, 0.5, -0.22), new THREE.Vector3(0, 0.72, -0.08), new THREE.Vector3(0, 0.7, 0.06)]);
    return new THREE.TubeGeometry(curve, 24, 0.11, 12, false);
  }, []);
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const g = useGame.getState();
    const talking = g.dialogue?.lines[g.dialogue.index]?.speaker === 'kiki' || g.overlay === 'shop';
    const near = Math.hypot(player.position.x - wx, player.position.z - wz) < 4;
    body.current.position.y = talking ? Math.abs(Math.sin(t * 8)) * 0.04 : near ? Math.max(0, Math.sin(t * 5)) * 0.08 : 0;
    tail.current.rotation.x = Math.sin(t * 2.4) * 0.15;
    tail.current.rotation.z = Math.sin(t * 1.7) * 0.1;
    head.current.rotation.z = Math.sin(t * 1.3) * 0.08;
    // look toward Anet
    const root = body.current.parent!;
    const target = angleDelta(rot, Math.atan2(player.position.x - wx, player.position.z - wz));
    root.rotation.y += angleDelta(root.rotation.y, Math.max(-0.9, Math.min(0.9, target))) * damp(4, dt);
  });
  return (
    <group>
      <group ref={body}>
        <mesh position={[0, 0.28, 0]} scale={[1, 1.15, 0.9]} castShadow>
          <sphereGeometry args={[0.2, 18, 14]} />
          <meshStandardMaterial color={FUR} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.27, 0.11]} scale={[0.75, 1, 0.5]}>
          <sphereGeometry args={[0.17, 14, 10]} />
          <meshStandardMaterial color={BELLY} roughness={0.9} />
        </mesh>
        <group ref={tail} position={[0, 0.15, -0.16]}>
          <mesh geometry={tailGeo} castShadow>
            <meshStandardMaterial color={FUR} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.7, 0.04]}>
            <sphereGeometry args={[0.13, 12, 10]} />
            <meshStandardMaterial color="#f0a35a" roughness={0.9} />
          </mesh>
        </group>
        {/* paws holding an acorn */}
        <mesh position={[0, 0.33, 0.19]} scale={[1, 1.15, 1]}>
          <sphereGeometry args={[0.06, 12, 10]} />
          <meshStandardMaterial color="#d79a3c" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.39, 0.19]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.065, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#7a4a22" />
        </mesh>
        {[1, -1].map((s) => (
          <mesh key={s} position={[0.07 * s, 0.32, 0.17]}>
            <sphereGeometry args={[0.04, 10, 8]} />
            <meshStandardMaterial color={FUR} />
          </mesh>
        ))}
        <group ref={head} position={[0, 0.58, 0.02]}>
          <mesh scale={[1, 0.95, 0.95]} castShadow>
            <sphereGeometry args={[0.16, 18, 14]} />
            <meshStandardMaterial color={FUR} roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.04, 0.11]} scale={[1, 0.75, 0.6]}>
            <sphereGeometry args={[0.09, 14, 10]} />
            <meshStandardMaterial color={BELLY} />
          </mesh>
          <mesh position={[0, -0.01, 0.165]}>
            <sphereGeometry args={[0.02, 10, 8]} />
            <meshStandardMaterial color="#5a3018" />
          </mesh>
          {[1, -1].map((s) => (
            <group key={s}>
              <mesh position={[0.065 * s, 0.03, 0.13]} scale={[1, 1.15, 0.6]}>
                <sphereGeometry args={[0.028, 12, 10]} />
                <meshStandardMaterial color="#2a160c" roughness={0.2} />
              </mesh>
              <mesh position={[0.072 * s, 0.042, 0.146]}>
                <sphereGeometry args={[0.008, 8, 6]} />
                <meshBasicMaterial color="#fff" />
              </mesh>
              <mesh position={[0.09 * s, 0.15, -0.01]} rotation={[0, 0, -0.3 * s]} scale={[0.7, 1.3, 0.4]}>
                <coneGeometry args={[0.05, 0.12, 10]} />
                <meshStandardMaterial color={FUR} />
              </mesh>
              <mesh position={[0.11 * s, -0.04, 0.1]} scale={[1, 0.6, 0.4]}>
                <sphereGeometry args={[0.03, 10, 8]} />
                <meshStandardMaterial color="#ff9e8f" />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

/** The stall: wooden counter, striped awning on posts, an acorn jar and a little sign. */
export function KikiShop({ x, y, z, rot }: { x: number; y: number; z: number; rot: number }) {
  const sign = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    sign.current.rotation.z = Math.sin(clock.elapsedTime * 1.5) * 0.06;
  });
  const wood = '#a8703f';
  const stripes = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 16;
    const g = c.getContext('2d')!;
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#ffffff' : '#ff8a5c';
      g.fillRect(i * 16, 0, 16, 16);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      {/* counter */}
      <mesh position={[0, 0.42, 0.25]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.84, 0.5]} />
        <meshStandardMaterial color={wood} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.86, 0.27]}>
        <boxGeometry args={[1.62, 0.06, 0.6]} />
        <meshStandardMaterial color="#c88a52" roughness={0.7} />
      </mesh>
      {/* posts + striped awning */}
      {[-0.72, 0.72].map((px) => (
        <mesh key={px} position={[px, 1.0, -0.15]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 2.0, 8]} />
          <meshStandardMaterial color={wood} />
        </mesh>
      ))}
      <mesh position={[0, 2.02, 0.12]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[1.75, 0.05, 0.95]} />
        <meshStandardMaterial map={stripes} roughness={0.7} />
      </mesh>
      {/* scalloped edge */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-0.77 + i * 0.22, 1.86, 0.56]} rotation={[Math.PI / 2 + 0.35, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.03, 16, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color={i % 2 ? '#ffffff' : '#ff8a5c'} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* acorn jar */}
      <group position={[0.5, 0.89, 0.3]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.12, 0.11, 0.3, 18, 1, true]} />
          <meshPhysicalMaterial color="#ffffff" transmission={0.8} roughness={0.05} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {[0, 1, 2, 3, 4].map((k) => (
          <mesh key={k} position={[Math.sin(k * 2.3) * 0.05, 0.05 + (k % 3) * 0.06, Math.cos(k * 2.3) * 0.05]}>
            <sphereGeometry args={[0.045, 10, 8]} />
            <meshStandardMaterial color="#f3b23c" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* a bow and a star on display */}
      <mesh position={[-0.45, 0.93, 0.33]} rotation={[0, 0, 0.3]} scale={[1, 0.6, 0.5]}>
        <torusGeometry args={[0.07, 0.03, 8, 16]} />
        <meshStandardMaterial color="#ff6fae" />
      </mesh>
      <mesh position={[-0.3, 0.93, 0.33]} rotation={[0, 0, -0.3]} scale={[1, 0.6, 0.5]}>
        <torusGeometry args={[0.07, 0.03, 8, 16]} />
        <meshStandardMaterial color="#ff6fae" />
      </mesh>
      {/* hanging sign with an acorn */}
      <mesh ref={sign} position={[0, 1.6, 0.62]}>
        <circleGeometry args={[0.2, 24]} />
        <meshStandardMaterial color="#fff3dc" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.6, 0.635]} scale={[1, 1.2, 0.4]}>
        <sphereGeometry args={[0.08, 12, 10]} />
        <meshStandardMaterial color="#d79a3c" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Kiki stands behind the counter */}
      <group position={[0, 0.84, -0.05]}>
        <Kiki wx={x} wz={z} rot={rot} />
      </group>
    </group>
  );
}
