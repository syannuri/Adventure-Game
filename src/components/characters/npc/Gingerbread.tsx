/**
 * Koko – the gingerbread candy chef of Candy Village. White icing trim, gumdrop buttons, a tall
 * chef's hat and a little whisk. Bounces when talking, looks sad until the cake is baked.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { angleDelta, damp } from '../../../utils/math';
import { contactShadowTexture } from '../../effects/textures';

const COOKIE = '#b8692f';
const ICING = '#fffaf2';

/** Wavy icing line (a thin tube following a zig-zag), drawn on the cookie surface. */
function zigzag(width: number, waves: number, amp: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= waves * 8; i++) {
    const t = i / (waves * 8);
    pts.push(new THREE.Vector3((t - 0.5) * width, Math.sin(t * Math.PI * 2 * waves) * amp, 0));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), waves * 12, 0.012, 6, false);
}

export function Gingerbread({ x, y, z }: { x: number; y: number; z: number }) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const mouth = useRef<THREE.Mesh>(null!);
  const brows = useRef<THREE.Group>(null!);
  const zig = useMemo(() => zigzag(0.34, 4, 0.02), []);
  const cookieMat = useMemo(() => new THREE.MeshStandardMaterial({ color: COOKIE, roughness: 0.85 }), []);
  const icingMat = useMemo(() => new THREE.MeshStandardMaterial({ color: ICING, roughness: 0.5 }), []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const g = useGame.getState();
    const talking = g.dialogue?.lines[g.dialogue.index]?.speaker === 'koko';
    const happy = g.level.stage === 'done' || g.level.stage === 'sortCandy';
    const bounce = talking ? Math.abs(Math.sin(t * 9)) * 0.06 : happy ? Math.abs(Math.sin(t * 4)) * 0.12 : Math.sin(t * 2) * 0.015;
    body.current.position.y = bounce;
    body.current.rotation.z = Math.sin(t * (happy ? 4 : 1.4)) * (happy ? 0.08 : 0.03);
    armL.current.rotation.z = 0.5 + Math.sin(t * (talking ? 7 : 2)) * (talking ? 0.35 : 0.08) + (happy ? 1.4 : 0);
    armR.current.rotation.z = -0.5 - Math.sin(t * (talking ? 6 : 1.7) + 1) * (talking ? 0.3 : 0.08) - (happy ? 1.4 : 0);
    mouth.current.scale.y = talking ? 0.6 + Math.abs(Math.sin(t * 14)) * 0.9 : 1;
    // worried brows until he's happy
    brows.current.rotation.z = 0;
    brows.current.children.forEach((b, i) => (b.rotation.z = (i ? -1 : 1) * (happy ? -0.15 : 0.35)));
    const dx = player.position.x - x;
    const dz = player.position.z - z;
    if (Math.hypot(dx, dz) < 9) root.current.rotation.y += angleDelta(root.current.rotation.y, Math.atan2(dx, dz)) * damp(4, dt);
  });

  return (
    <group ref={root} position={[x, y, z]}>
      <group ref={body}>
        {/* legs */}
        {[1, -1].map((s) => (
          <mesh key={s} material={cookieMat} position={[0.11 * s, 0.2, 0]} scale={[1, 1, 0.55]} castShadow>
            <capsuleGeometry args={[0.09, 0.2, 6, 12]} />
          </mesh>
        ))}
        {/* body: a flat round cookie with icing */}
        <mesh material={cookieMat} position={[0, 0.62, 0]} scale={[1, 1.12, 0.5]} castShadow>
          <sphereGeometry args={[0.27, 28, 20]} />
        </mesh>
        <mesh geometry={zig} material={icingMat} position={[0, 0.42, 0.13]} />
        {/* gumdrop buttons */}
        {['#ff5fa2', '#4cc9f0', '#ffd23f'].map((c, i) => (
          <mesh key={i} position={[0, 0.74 - i * 0.12, 0.135]} scale={[1, 0.8, 0.6]}>
            <sphereGeometry args={[0.04, 12, 10]} />
            <meshStandardMaterial color={c} roughness={0.3} />
          </mesh>
        ))}
        {/* arms */}
        {[1, -1].map((s) => (
          <group key={s} ref={s === 1 ? armL : armR} position={[0.22 * s, 0.76, 0]}>
            <mesh material={cookieMat} position={[0.13 * s, -0.04, 0]} rotation={[0, 0, (Math.PI / 2) * s]} scale={[1, 1, 0.55]} castShadow>
              <capsuleGeometry args={[0.075, 0.2, 6, 12]} />
            </mesh>
            <mesh material={icingMat} position={[0.22 * s, -0.04, 0.035]} rotation={[0, 0, (Math.PI / 2) * s]}>
              <torusGeometry args={[0.055, 0.01, 6, 16]} />
            </mesh>
            {s === -1 && (
              // a little whisk
              <group position={[-0.3, -0.04, 0.05]} rotation={[0, 0, 0.4]}>
                <mesh position={[0, -0.1, 0]}>
                  <cylinderGeometry args={[0.015, 0.015, 0.18, 8]} />
                  <meshStandardMaterial color="#ff8fbf" />
                </mesh>
                {[0, 1, 2].map((k) => (
                  <mesh key={k} position={[0, 0.06, 0]} rotation={[0, (k * Math.PI) / 3, 0]} scale={[0.6, 1, 1]}>
                    <torusGeometry args={[0.06, 0.006, 6, 16]} />
                    <meshStandardMaterial color="#dfe4ea" metalness={0.8} roughness={0.25} />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        ))}
        {/* head */}
        <group position={[0, 1.08, 0]}>
          <mesh material={cookieMat} scale={[1, 0.95, 0.55]} castShadow>
            <sphereGeometry args={[0.23, 28, 20]} />
          </mesh>
          {/* icing eyes, smile and rosy cheeks */}
          {[1, -1].map((s) => (
            <mesh key={s} position={[0.075 * s, 0.03, 0.12]}>
              <sphereGeometry args={[0.03, 12, 10]} />
              <meshStandardMaterial color="#2a160c" roughness={0.3} />
            </mesh>
          ))}
          {[1, -1].map((s) => (
            <mesh key={'h' + s} position={[0.067 * s, 0.042, 0.146]}>
              <sphereGeometry args={[0.009, 8, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
          <group ref={brows}>
            {[1, -1].map((s) => (
              <mesh key={s} position={[0.075 * s, 0.09, 0.118]} material={icingMat}>
                <capsuleGeometry args={[0.008, 0.04, 4, 8]} />
              </mesh>
            ))}
          </group>
          <mesh ref={mouth} position={[0, -0.06, 0.12]} rotation={[0, 0, Math.PI]} material={icingMat}>
            <torusGeometry args={[0.055, 0.011, 6, 18, Math.PI]} />
          </mesh>
          {[1, -1].map((s) => (
            <mesh key={'c' + s} position={[0.13 * s, -0.035, 0.1]} scale={[1, 0.7, 0.4]}>
              <sphereGeometry args={[0.035, 12, 10]} />
              <meshStandardMaterial color="#ff8a9e" roughness={0.6} />
            </mesh>
          ))}
          {/* chef's hat */}
          <group position={[0, 0.2, -0.01]}>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.15, 0.16, 0.12, 24]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
            {[
              [0, 0.2, 0, 0.15],
              [0.1, 0.17, 0, 0.11],
              [-0.1, 0.17, 0, 0.11],
              [0, 0.17, 0.08, 0.1],
              [0, 0.17, -0.08, 0.1],
            ].map(([px, py, pz, r], i) => (
              <mesh key={i} position={[px, py, pz]}>
                <sphereGeometry args={[r, 16, 12]} />
                <meshStandardMaterial color="#ffffff" roughness={0.85} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
      {/* soft contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[0.6, 0.45]} />
        <meshBasicMaterial map={contactShadowTexture()} color="#2a1a30" transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}
