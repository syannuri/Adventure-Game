/**
 * WORLD 1 – ENCHANTED FOREST (playable vertical slice)
 * Assembles environment, lighting, characters, collectibles, quest and ambience.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment, Lightformer, Sparkles } from '@react-three/drei';
import { setWorldPhysics } from '../../../systems/physics';
import { buildForestPhysics, COINS, FAIRY_POS, OWL_POS, RABBIT_POS, SPAWN, STARS, TREASURES, WATERFALL, terrainHeight } from './layout';
import { Terrain } from './Terrain';
import { SUN_DIR, Sky } from './Sky';
import { Trees } from './Trees';
import { Vegetation } from './Vegetation';
import { GroundDetail } from './GroundDetail';
import { Water } from './Water';
import { Glade, PathStones, Platforms } from './Props';
import { Birds, Butterflies, Ducks } from './Critters';
import { AnettController } from '../../characters/Anett/AnettController';
import { Fairy } from '../../characters/npc/Fairy';
import { Rabbit } from '../../characters/npc/Rabbit';
import { Owl } from '../../characters/npc/Owl';
import { Collectibles } from '../../gameplay/collectibles/Collectibles';
import { ForestQuest } from '../../gameplay/missions/ForestQuest';
import { InteractionSystem } from '../../gameplay/interaction/InteractionSystem';
import { FollowCamera } from '../../camera/FollowCamera';
import { Bursts } from '../../effects/Bursts';
import { windUniforms } from '../../effects/wind';
import { player } from '../../../systems/playerState';
import { audio } from '../../audio/audioEngine';
import { useGame } from '../../../systems/store';

const FOG = '#dfe4c6'; // warm golden-hour haze

function SunLight({ shadows, size }: { shadows: boolean; size: number }) {
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
        color="#ffdcae"
        intensity={2.9}
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
function RimLight() {
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
      <directionalLight ref={light} target={target} color="#ffe7c4" intensity={1.6} />
    </>
  );
}

function Ambience() {
  useEffect(() => {
    audio.setBirds(true);
    audio.setAmbience('wind', 0.5);
    return () => audio.stopAmbience();
  }, []);
  useFrame((_, dt) => {
    windUniforms.uTime.value += Math.min(dt, 0.05);
    const d = Math.hypot(player.position.x - WATERFALL.x, player.position.z - (WATERFALL.z + 1));
    audio.setAmbience('waterfall', Math.max(0, 1 - d / 20) ** 1.6);
  });
  return null;
}

export function EnchantedForest() {
  useMemo(() => setWorldPhysics(buildForestPhysics()), []);
  const quality = useGame((s) => s.save.settings.quality);
  const high = quality === 'high';
  const spawn = useMemo(() => ({ ...SPAWN }), []);

  return (
    <>
      <color attach="background" args={[FOG]} />
      <fog attach="fog" args={[FOG, 28, 105]} />
      <hemisphereLight args={['#cfe2ff', '#6b8a45', 0.95]} />
      <RimLight />
      <ambientLight intensity={0.18} />
      <SunLight shadows size={high ? 2048 : 1024} />
      <Environment resolution={64} frames={1} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={2} color="#fff2d8" position={[5, 8, -5]} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={1} color="#bfe3ff" position={[-6, 4, 6]} scale={[10, 6, 1]} />
        <Lightformer form="ring" intensity={0.8} color="#9fe0b0" position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={8} />
      </Environment>

      <Sky top="#5c9fe0" horizon="#ffd8a8" />
      <Terrain />
      <Trees shadows={high} />
      <Vegetation quality={quality} />
      <GroundDetail quality={quality} />
      <Water />
      <Platforms />
      <Glade />
      <PathStones />
      <Butterflies count={high ? 18 : 10} />
      <Ducks />
      <Birds />
      <Sparkles count={high ? 220 : 90} scale={[70, 5, 70]} position={[0, 2.5, -4]} size={3.5} speed={0.25} color="#fff6b8" opacity={0.85} />
      <Sparkles count={60} scale={[9, 3, 9]} position={[FAIRY_POS.x, 1.6, FAIRY_POS.z]} size={4} speed={0.4} color="#d9c9ff" />

      <Fairy x={FAIRY_POS.x} y={terrainHeight(FAIRY_POS.x, FAIRY_POS.z) + 1.25} z={FAIRY_POS.z} />
      <Rabbit x={RABBIT_POS.x} y={terrainHeight(RABBIT_POS.x, RABBIT_POS.z)} z={RABBIT_POS.z} />
      <Rabbit x={-16} y={terrainHeight(-16, 2)} z={2} npc={false} scale={0.7} wander={2.5} />
      <Rabbit x={6} y={terrainHeight(6, -18)} z={-18} npc={false} scale={0.6} wander={2} />
      <Owl x={OWL_POS.x} y={terrainHeight(OWL_POS.x, OWL_POS.z) - 0.05} z={OWL_POS.z} />

      <Collectibles stars={STARS} coins={COINS} treasures={TREASURES} />
      <ForestQuest />
      <InteractionSystem />
      <AnettController spawn={spawn} />
      <FollowCamera />
      <Bursts />
      <Bursts channel="dust" />
      <Ambience />
    </>
  );
}
