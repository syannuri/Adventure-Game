/**
 * WORLD 1 – ENCHANTED FOREST (playable vertical slice)
 * Assembles environment, lighting, characters, collectibles, quest and ambience.
 */
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer, Sparkles, Stars } from '@react-three/drei';
import { setWorldPhysics } from '../../../systems/physics';
import { buildForestPhysics, SHOP, COINS, FAIRY_POS, OWL_POS, RABBIT_POS, SPAWN, STARS, TREASURES, WATERFALL, terrainHeight } from './layout';
import { Terrain } from './Terrain';
import { Sky } from './Sky';
import { RimLight, SunLight } from '../shared/Lights';
import { Trees } from './Trees';
import { Vegetation } from './Vegetation';
import { GroundDetail } from './GroundDetail';
import { Water } from './Water';
import { Glade, PathStones, Platforms } from './Props';
import { Birds, Butterflies } from './Critters';
import { StickerWatcher } from '../../gameplay/stickers/StickerWatcher';
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

const FOG = '#dfe4c6';
const NIGHT_FOG = '#18214a';
const NO_STARS: typeof STARS = [];
const FOREST_STICKERS = [
  { id: 'fairy', x: FAIRY_POS.x, z: FAIRY_POS.z },
  { id: 'rabbit', x: RABBIT_POS.x, z: RABBIT_POS.z },
  { id: 'owl', x: OWL_POS.x, z: OWL_POS.z },
  { id: 'squirrel', x: SHOP.x + 1.1, z: SHOP.z },
]; // warm golden-hour haze

function Ambience({ night }: { night: boolean }) {
  useEffect(() => {
    audio.setBirds(!night);
    audio.setAmbience('wind', 0.5);
    return () => audio.stopAmbience();
  }, [night]);
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
  const night = useGame((s) => s.night);
  const fog = night ? NIGHT_FOG : FOG;

  return (
    <>
      <color attach="background" args={[fog]} />
      <fog attach="fog" args={night ? [fog, 20, 90] : [fog, 28, 105]} />
      <hemisphereLight args={night ? ['#6d82c4', '#1f2e2a', 0.6] : ['#cfe2ff', '#6b8a45', 0.95]} />
      <RimLight color={night ? '#a9c4ff' : undefined} />
      <ambientLight intensity={night ? 0.14 : 0.18} />
      <SunLight shadows size={high ? 2048 : 1024} color={night ? '#9fb8ff' : '#ffdcae'} intensity={night ? 1.25 : 2.9} />
      <Environment resolution={64} frames={1} environmentIntensity={night ? 0.3 : 0.55}>
        <Lightformer form="rect" intensity={2} color={night ? '#8ea6ff' : '#fff2d8'} position={[5, 8, -5]} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={1} color="#bfe3ff" position={[-6, 4, 6]} scale={[10, 6, 1]} />
        <Lightformer form="ring" intensity={0.8} color={night ? '#7f8fd0' : '#9fe0b0'} position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={8} />
      </Environment>

      {night ? <Sky top="#0b1534" horizon="#3b3f7e" night /> : <Sky top="#5c9fe0" horizon="#ffd8a8" />}
      {night && <Stars radius={260} depth={80} count={high ? 2600 : 1200} factor={7} saturation={0.3} fade speed={0.6} />}
      <Terrain />
      <Trees shadows={high} />
      <Vegetation quality={quality} />
      <GroundDetail quality={quality} />
      <Water />
      <Platforms />
      <Glade />
      <PathStones />
      <Butterflies count={high ? 18 : 10} />
      <Birds />
      <Sparkles count={high ? (night ? 320 : 220) : night ? 140 : 90} scale={[70, 5, 70]} position={[0, 2.5, -4]} size={night ? 5 : 3.5} speed={0.25} color={night ? '#d6ff7a' : '#fff6b8'} opacity={0.85} />
      <Sparkles count={60} scale={[9, 3, 9]} position={[FAIRY_POS.x, 1.6, FAIRY_POS.z]} size={4} speed={0.4} color="#d9c9ff" />

      <Fairy x={FAIRY_POS.x} y={terrainHeight(FAIRY_POS.x, FAIRY_POS.z) + 1.25} z={FAIRY_POS.z} />
      <Rabbit x={RABBIT_POS.x} y={terrainHeight(RABBIT_POS.x, RABBIT_POS.z)} z={RABBIT_POS.z} />
      <Rabbit x={-16} y={terrainHeight(-16, 2)} z={2} npc={false} scale={0.7} wander={2.5} />
      <Rabbit x={6} y={terrainHeight(6, -18)} z={-18} npc={false} scale={0.6} wander={2} />
      <Owl x={OWL_POS.x} y={terrainHeight(OWL_POS.x, OWL_POS.z) - 0.05} z={OWL_POS.z} />

      <Collectibles stars={night ? NO_STARS : STARS} coins={COINS} treasures={TREASURES} />
      <ForestQuest />
      <InteractionSystem />
      <AnettController spawn={spawn} />
      <FollowCamera />
      <Bursts />
      <Bursts channel="dust" />
      <Ambience night={night} />
      <StickerWatcher statics={FOREST_STICKERS} />
    </>
  );
}
