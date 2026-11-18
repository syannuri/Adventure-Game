/**
 * WORLD 2 – CANDY VILLAGE
 * Lollipop trees, a chocolate river, cupcake houses and Koko's bakery.
 * Mission: find Koko's five missing ingredients, then sort the candies for the candy machine.
 */
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment, Lightformer, Sparkles } from '@react-three/drei';
import { setWorldPhysics } from '../../../systems/physics';
import { BAKERY, CANDIES, GIFTS, INGREDIENTS, KOKO_POS, PIP_POS, SPAWN, buildCandyPhysics, distToRiver, RIVER_W, terrainHeight } from './layout';
import { Sky } from '../EnchantedForest/Sky';
import { RimLight, SunLight } from '../shared/Lights';
import { CandyTerrain, ChocolateRiver } from './CandyTerrain';
import { Bakery, CandyCanes, CandyPlatforms, CookieBridge, CupcakeHouses, GroundSprinkles, Gumdrops, IceCreamTowers, Lollipops, Strawberries } from './CandyProps';
import { Butterflies } from '../EnchantedForest/Critters';
import { AnettController } from '../../characters/Anett/AnettController';
import { Gingerbread } from '../../characters/npc/Gingerbread';
import { Rabbit } from '../../characters/npc/Rabbit';
import { Collectibles } from '../../gameplay/collectibles/Collectibles';
import { CandyQuest } from '../../gameplay/missions/CandyQuest';
import { InteractionSystem } from '../../gameplay/interaction/InteractionSystem';
import { FollowCamera } from '../../camera/FollowCamera';
import { Bursts } from '../../effects/Bursts';
import { windUniforms } from '../../effects/wind';
import { player } from '../../../systems/playerState';
import { audio } from '../../audio/audioEngine';
import { useGame } from '../../../systems/store';

const FOG = '#f7dcec'; // cotton-candy haze

function Ambience() {
  useEffect(() => {
    audio.setBirds(true);
    audio.setAmbience('wind', 0.35);
    return () => audio.stopAmbience();
  }, []);
  useFrame((_, dt) => {
    windUniforms.uTime.value += Math.min(dt, 0.05);
    // the chocolate river gurgles softly when Anet is near it
    const d = distToRiver(player.position.x, player.position.z);
    audio.setAmbience('waterfall', Math.max(0, 1 - Math.max(0, d - RIVER_W) / 9) ** 2 * 0.45);
  });
  return null;
}

/** Floating cotton-candy clouds drifting over the village. */
function CottonCandyClouds() {
  const clouds = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        x: Math.cos(i * 0.7) * (28 + (i % 3) * 14),
        y: 16 + (i % 4) * 3,
        z: Math.sin(i * 0.7) * (28 + (i % 3) * 14),
        s: 2 + (i % 3) * 0.8,
        c: ['#ffc4e1', '#d9c4ff', '#c4ecff'][i % 3],
      })),
    [],
  );
  return (
    <>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {[
            [0, 0, 0, 1],
            [0.9, -0.15, 0.1, 0.75],
            [-0.9, -0.1, -0.1, 0.8],
            [0.3, 0.45, 0, 0.7],
          ].map(([x, y, z, r], k) => (
            <mesh key={k} position={[x, y, z]}>
              <sphereGeometry args={[r, 16, 12]} />
              <meshStandardMaterial color={c.c} roughness={1} emissive={c.c} emissiveIntensity={0.25} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

export function CandyVillage() {
  useMemo(() => setWorldPhysics(buildCandyPhysics()), []);
  const quality = useGame((s) => s.save.settings.quality);
  const high = quality === 'high';
  const spawn = useMemo(() => ({ ...SPAWN }), []);
  const introCenter = useMemo(() => new THREE.Vector3(BAKERY.x - 2, 1, BAKERY.z + 2), []);

  return (
    <>
      <color attach="background" args={[FOG]} />
      <fog attach="fog" args={[FOG, 45, 150]} />
      <hemisphereLight args={['#ffe3f2', '#b48fd0', 1.0]} />
      <RimLight color="#fff0f6" />
      <ambientLight intensity={0.22} />
      <SunLight shadows size={high ? 2048 : 1024} color="#fff0dc" intensity={2.7} />
      <Environment resolution={64} frames={1} environmentIntensity={0.6}>
        <Lightformer form="rect" intensity={2} color="#fff4fa" position={[5, 8, -5]} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#c9e9ff" position={[-6, 4, 6]} scale={[10, 6, 1]} />
        <Lightformer form="ring" intensity={0.8} color="#ffc4e1" position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={8} />
      </Environment>

      <Sky top="#7fc4ff" horizon="#ffd9ee" />
      <CottonCandyClouds />
      <CandyTerrain />
      <ChocolateRiver />
      <CookieBridge />
      <Lollipops shadows={high} />
      <Gumdrops />
      <CandyCanes shadows={high} />
      <Strawberries />
      <GroundSprinkles count={high ? 1400 : 600} />
      <IceCreamTowers />
      <CupcakeHouses />
      <Bakery />
      <CandyPlatforms />
      <Butterflies count={high ? 14 : 8} />
      <Sparkles count={high ? 200 : 80} scale={[70, 6, 70]} position={[0, 3, -4]} size={4} speed={0.3} color="#ffd6f0" opacity={0.85} />

      <Gingerbread x={KOKO_POS.x} y={terrainHeight(KOKO_POS.x, KOKO_POS.z)} z={KOKO_POS.z} />
      <Rabbit x={PIP_POS.x} y={terrainHeight(PIP_POS.x, PIP_POS.z)} z={PIP_POS.z} />

      <Collectibles stars={INGREDIENTS} coins={CANDIES} treasures={GIFTS} theme="candy" />
      <CandyQuest />
      <InteractionSystem />
      <AnettController spawn={spawn} />
      <FollowCamera introCenter={introCenter} />
      <Bursts />
      <Bursts channel="dust" />
      <Ambience />
    </>
  );
}
