/** Lights shared by every world: a sun that follows the player (stable shadows) and a rim light. */
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SUN_DIR } from '../EnchantedForest/Sky';
import { player } from '../../../systems/playerState';

export function SunLight({ shadows, size, color = '#ffdcae', intensity = 2.9 }: { shadows: boolean; size: number; color?: string; intensity?: number }) {
  const light = useRef<THREE.DirectionalLight>(null!);
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const p = player.position;
    // snap to texel grid to avoid shadow shimmering
    const sx = Math.round(p.x);
    const sz = Math.round(p.z);
    light.current.position.set(sx + SUN_DIR.x * 30, p.y + SUN_DIR.y * 30, sz + SUN_DIR.z * 30);
    target.position.set(sx, p.y, sz);
    target.updateMatrixWorld();
  });
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={light}
        target={target}
        color={color}
        intensity={intensity}
        castShadow={shadows}
        shadow-mapSize={[size, size]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={70}
      />
    </>
  );
}

/**
 * Rim light: a warm light placed behind Anet (relative to the camera) that outlines her silhouette
 * so she always reads clearly against the busy forest.
 */
export function RimLight({ color = '#ffe7c4' }: { color?: string }) {
  const light = useRef<THREE.DirectionalLight>(null!);
  const target = useMemo(() => new THREE.Object3D(), []);
  const { camera } = useThree();
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const p = player.position;
    dir.set(p.x - camera.position.x, 0, p.z - camera.position.z).normalize();
    light.current.position.set(p.x + dir.x * 6, p.y + 3.5, p.z + dir.z * 6);
    target.position.set(p.x, p.y + 0.8, p.z);
    target.updateMatrixWorld();
  });
  return (
    <>
      <primitive object={target} />
      <directionalLight ref={light} target={target} color={color} intensity={1.6} />
    </>
  );
}

