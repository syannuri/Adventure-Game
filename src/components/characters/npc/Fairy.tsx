/** Lumi – the forest fairy. Hovers, flaps iridescent wings, looks sad until her wand is back. */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { angleDelta, damp } from '../../../utils/math';
import { Wand } from '../../gameplay/collectibles/Wand';
import { glowTexture } from '../../effects/textures';

function wingGeo(w: number, h: number) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(w * 0.3, h * 0.9, w * 1.1, h * 1.1, w, h * 0.35);
  s.bezierCurveTo(w * 0.95, 0, w * 0.4, -h * 0.1, 0, 0);
  return new THREE.ShapeGeometry(s, 12);
}

export function Fairy({ x, y, z }: { x: number; y: number; z: number }) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const wings = useRef<THREE.Group>(null!);
  const mouth = useRef<THREE.Mesh>(null!);
  const armR = useRef<THREE.Group>(null!);
  const geos = useMemo(() => ({ upper: wingGeo(0.42, 0.36), lower: wingGeo(0.3, -0.22) }), []);
  const wingMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#c8f4ff',
        emissive: '#9fe7ff',
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.6,
        roughness: 0.15,
        iridescence: 1,
        iridescenceIOR: 1.6,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  );

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const g = useGame.getState();
    const talking = g.dialogue?.lines[g.dialogue.index]?.speaker === 'lumi';
    const happy = g.level.stage === 'done';
    body.current.position.y = Math.sin(t * 2.2) * 0.12 + (talking ? Math.abs(Math.sin(t * 9)) * 0.04 : 0) + (happy ? Math.abs(Math.sin(t * 4)) * 0.18 : 0);
    body.current.rotation.z = Math.sin(t * 1.3) * 0.06;
    const flap = Math.sin(t * (happy ? 34 : 24)) * 0.55;
    wings.current.children[0].rotation.y = 0.35 + flap;
    wings.current.children[1].rotation.y = -0.35 - flap;
    // turn toward Anett when she is near
    const dx = player.position.x - x;
    const dz = player.position.z - z;
    const want = Math.hypot(dx, dz) < 9 ? Math.atan2(dx, dz) : Math.sin(t * 0.3) * 0.8;
    root.current.rotation.y += angleDelta(root.current.rotation.y, want) * damp(3, dt);
    // expression: frown -> smile
    const targetRot = happy || g.level.hasWand ? Math.PI : 0;
    mouth.current.rotation.z += (targetRot - mouth.current.rotation.z) * damp(4, dt);
    mouth.current.position.y = 0.085 + (mouth.current.rotation.z > 1.5 ? 0 : 0.015);
    armR.current.rotation.z = happy ? -2.4 + Math.sin(t * 8) * 0.3 : talking ? -0.6 + Math.sin(t * 5) * 0.3 : -0.3;
  });

  const happy = useGame((s) => s.level.stage === 'done');

  return (
    <group ref={root} position={[x, y, z]} scale={1.45}>
      <pointLight color="#d4c2ff" intensity={6} distance={9} decay={2} position={[0, 0.4, 0.3]} />
      <Sparkles count={30} scale={[1.6, 1.6, 1.6]} size={3} speed={0.6} color="#fff3b0" />
      {/* soft magical aura so Lumi is easy to spot from far away */}
      <sprite scale={1.6} position={[0, 0.1, 0]}>
        <spriteMaterial map={glowTexture()} color="#d9c8ff" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <group ref={body}>
        {/* dress */}
        <mesh position={[0, -0.12, 0]} castShadow>
          <coneGeometry args={[0.2, 0.36, 20, 1, true]} />
          <meshStandardMaterial color="#b8a2ff" roughness={0.5} side={THREE.DoubleSide} emissive="#7e66ff" emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.025, 8, 24]} />
          <meshStandardMaterial color="#e6dcff" />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.085, 16, 12]} />
          <meshStandardMaterial color="#b8a2ff" roughness={0.5} />
        </mesh>
        {/* legs */}
        {[1, -1].map((s) => (
          <mesh key={s} position={[0.045 * s, -0.38, 0]}>
            <capsuleGeometry args={[0.022, 0.1, 4, 8]} />
            <meshStandardMaterial color="#fde3d5" />
          </mesh>
        ))}
        {/* arms */}
        <group position={[0.09, 0.08, 0]} rotation={[0, 0, 0.5]}>
          <mesh position={[0, -0.07, 0]}>
            <capsuleGeometry args={[0.02, 0.1, 4, 8]} />
            <meshStandardMaterial color="#fde3d5" />
          </mesh>
        </group>
        <group ref={armR} position={[-0.09, 0.08, 0]}>
          <mesh position={[0, -0.07, 0]}>
            <capsuleGeometry args={[0.02, 0.1, 4, 8]} />
            <meshStandardMaterial color="#fde3d5" />
          </mesh>
          {happy && (
            <group position={[0, -0.16, 0.02]} rotation={[Math.PI, 0, 0]} scale={0.55}>
              <Wand />
            </group>
          )}
        </group>
        {/* head */}
        <group position={[0, 0.26, 0]}>
          <mesh>
            <sphereGeometry args={[0.15, 24, 18]} />
            <meshStandardMaterial color="#fde3d5" roughness={0.6} />
          </mesh>
          {/* hair: pastel pink with a bun */}
          <mesh position={[0, 0.035, -0.015]}>
            <sphereGeometry args={[0.158, 24, 14, 0, Math.PI * 2, 0, 1.45]} />
            <meshStandardMaterial color="#ffa9d2" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.17, -0.04]}>
            <sphereGeometry args={[0.07, 16, 12]} />
            <meshStandardMaterial color="#ffa9d2" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.19, 0.06]} rotation={[0.3, 0, 0]}>
            <octahedronGeometry args={[0.035]} />
            <meshStandardMaterial color="#fff3a0" emissive="#ffe066" emissiveIntensity={2} toneMapped={false} />
          </mesh>
          {[1, -1].map((s) => (
            <group key={s} position={[0.055 * s, -0.005, 0.13]}>
              <mesh scale={[1, 1.25, 0.6]}>
                <sphereGeometry args={[0.03, 12, 10]} />
                <meshStandardMaterial color="#2a1840" roughness={0.2} />
              </mesh>
              <mesh position={[0.01, 0.014, 0.016]}>
                <sphereGeometry args={[0.009, 8, 6]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          ))}
          {[1, -1].map((s) => (
            <mesh key={'c' + s} position={[0.09 * s, -0.04, 0.115]} scale={[1, 0.7, 0.3]}>
              <sphereGeometry args={[0.022, 10, 8]} />
              <meshBasicMaterial color="#ff9fbf" transparent opacity={0.6} />
            </mesh>
          ))}
          <mesh ref={mouth} position={[0, -0.07, 0.142]}>
            <torusGeometry args={[0.022, 0.006, 6, 14, Math.PI]} />
            <meshStandardMaterial color="#b4485c" />
          </mesh>
        </group>
        {/* wings */}
        <group ref={wings} position={[0, 0.1, -0.08]}>
          <group>
            <mesh geometry={geos.upper} material={wingMat} />
            <mesh geometry={geos.lower} material={wingMat} position={[0, -0.03, 0]} />
          </group>
          <group scale={[-1, 1, 1]}>
            <mesh geometry={geos.upper} material={wingMat} />
            <mesh geometry={geos.lower} material={wingMat} position={[0, -0.03, 0]} />
          </group>
        </group>
      </group>
    </group>
  );
}
