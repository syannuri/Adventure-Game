/**
 * WORLD 3 – CRYSTAL CAVE
 * A great cavern under the mountain: glowing crystals, a glowing lake, bats and glow-worms.
 * Mission: find the five lost crystals for Drako, then guide the sunbeam to the Heart Crystal.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment, Lightformer, Sparkles } from '@react-three/drei';
import { setWorldPhysics } from '../../../systems/physics';
import { CAVE_CHESTS, CRYSTALS, DRAKO_POS, GEMS, HEART, PIP_POS, SPAWN, buildCavePhysics, terrainHeight } from './layout';
import { RimLight, SunLight } from '../shared/Lights';
import { Bats, CaveDome, CaveFloor, CaveMushrooms, CaveRocks, CrystalClusters, GlowDust, GlowLake, Stalagmites, StonePillars } from './CaveScene';
import { AnettController } from '../../characters/Anett/AnettController';
import { Dragon } from '../../characters/npc/Dragon';
import { Rabbit } from '../../characters/npc/Rabbit';
import { Collectibles } from '../../gameplay/collectibles/Collectibles';
import { CaveQuest } from '../../gameplay/missions/CaveQuest';
import { InteractionSystem } from '../../gameplay/interaction/InteractionSystem';
import { FollowCamera } from '../../camera/FollowCamera';
import { Bursts } from '../../effects/Bursts';
import { StickerWatcher } from '../../gameplay/stickers/StickerWatcher';
import { setAnimalSpot } from '../../../systems/animalSpots';
import { audio } from '../../audio/audioEngine';
import { useGame } from '../../../systems/store';
import { damp } from '../../../utils/math';

const FOG = '#1b1533';
const CAVE_STICKERS = [
  { id: 'dragon', x: DRAKO_POS.x, z: DRAKO_POS.z },
  { id: 'rabbit', x: PIP_POS.x, z: PIP_POS.z },
];

function Ambience() {
  useEffect(() => {
    audio.setBirds(false);
    audio.setAmbience('wind', 0.25);
    return () => audio.stopAmbience();
  }, []);
  return null;
}

/** The cave brightens when the Heart Crystal lights up. */
function CaveLights() {
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const glow = useRef<THREE.PointLight>(null!);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const done = useGame.getState().level.stage === 'done';
    hemi.current.intensity += ((done ? 1.5 : 0.95) - hemi.current.intensity) * damp(1.2, dt);
    glow.current.intensity += ((done ? 60 : 6) - glow.current.intensity) * damp(1.2, dt);
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={['#9a8cff', '#24304f', 0.95]} />
      <pointLight ref={glow} position={[HEART.x, terrainHeight(HEART.x, HEART.z) + 3, HEART.z]} color="#c9b2ff" intensity={6} distance={40} decay={1.4} />
    </>
  );
}

export function CrystalCave() {
  useMemo(() => setWorldPhysics(buildCavePhysics()), []);
  const quality = useGame((s) => s.save.settings.quality);
  const high = quality === 'high';
  const spawn = useMemo(() => ({ ...SPAWN }), []);
  const introCenter = useMemo(() => new THREE.Vector3(HEART.x, 1.5, HEART.z + 2), []);

  return (
    <>
      <color attach="background" args={[FOG]} />
      <fog attach="fog" args={[FOG, 22, 80]} />
      <CaveLights />
      <RimLight color="#b9c8ff" />
      <ambientLight intensity={0.3} />
      <SunLight shadows size={high ? 2048 : 1024} color="#cfe0ff" intensity={1.3} />
      <Environment resolution={64} frames={1} environmentIntensity={0.45}>
        <Lightformer form="rect" intensity={2} color="#b9a6ff" position={[5, 8, -5]} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#8ff3ff" position={[-6, 4, 6]} scale={[10, 6, 1]} />
        <Lightformer form="ring" intensity={0.8} color="#ff9ee0" position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={8} />
      </Environment>

      <CaveDome />
      <CaveFloor />
      <GlowLake />
      <CrystalClusters />
      <Stalagmites />
      <CaveRocks />
      <CaveMushrooms />
      <GlowDust count={high ? 260 : 120} />
      <StonePillars />
      <Bats onMove={(i, x, z) => setAnimalSpot('bat', i, x, z)} />
      <Sparkles count={high ? 220 : 90} scale={[60, 8, 60]} position={[0, 3, 0]} size={3.5} speed={0.2} color="#bfeaff" opacity={0.8} />

      <Dragon x={DRAKO_POS.x} y={terrainHeight(DRAKO_POS.x, DRAKO_POS.z)} z={DRAKO_POS.z} />
      <Rabbit x={PIP_POS.x} y={terrainHeight(PIP_POS.x, PIP_POS.z)} z={PIP_POS.z} />

      <Collectibles stars={CRYSTALS} coins={GEMS} treasures={CAVE_CHESTS} theme="crystal" />
      <CaveQuest />
      <InteractionSystem />
      <AnettController spawn={spawn} />
      <FollowCamera introCenter={introCenter} />
      <Bursts />
      <Bursts channel="dust" />
      <Ambience />
      <StickerWatcher statics={CAVE_STICKERS} />
    </>
  );
}
