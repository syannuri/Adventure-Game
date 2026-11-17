/**
 * World 1 mission: "Help Lumi find her magic wand".
 *
 *  meetFairy    -> talk to Lumi in the glade
 *  collectStars -> find the 5 Wishing Stars (they can also be found before meeting Lumi)
 *  findWand     -> the stars reveal the wand near the waterfall (cinematic), pick it up
 *  returnWand   -> bring it back to Lumi
 *  done         -> celebration finale, world complete
 */
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { registerInteractable } from '../interaction/interactions';
import { FOREST_DIALOGUE as D } from '../../../data/forestDialogue';
import { FAIRY_POS, LOG, OWL_POS, RABBIT_POS, STARS, WAND_POS, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { Wand } from '../collectibles/Wand';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { player } from '../../../systems/playerState';

const WORLD_ID = 'enchanted-forest';
const wandY = () => terrainHeight(WAND_POS.x, WAND_POS.z);

function revealWand() {
  const g = useGame.getState();
  g.setStage('findWand');
  audio.sfx('magic');
  g.playCinematic({ kind: 'reveal', duration: 4200, focus: [WAND_POS.x, wandY() + 1.2, WAND_POS.z] });
  for (let i = 0; i < 5; i++) spawnBurst(player.position.x, player.position.y + 1.2, player.position.z, '#ffe27a', 8, { speed: 2 + Math.random() * 2 });
}

function finale() {
  const g = useGame.getState();
  g.setStage('done');
  g.setHasWand(false);
  audio.sfx('magic');
  g.playCinematic({ kind: 'finale', duration: 1600 });
  g.unlockAchievement('fairy_friend', ACHIEVEMENTS.fairy_friend.title, ACHIEVEMENTS.fairy_friend.icon);
  const colors = ['#ff9ec7', '#ffd36b', '#c9a7ff', '#9fe7ff', '#ffffff'];
  let n = 0;
  const iv = window.setInterval(() => {
    const a = Math.random() * Math.PI * 2;
    const r = 1.5 + Math.random() * 5;
    const x = FAIRY_POS.x + Math.cos(a) * r;
    const z = FAIRY_POS.z + Math.sin(a) * r;
    spawnBurst(x, terrainHeight(x, z) + 0.6 + Math.random() * 2.5, z, colors[n % colors.length], 30, { speed: 3 });
    if (n % 3 === 0) audio.sfx('pop', { pitch: 0.8 + Math.random() * 0.6, volume: 0.5 });
    if (++n > 26) window.clearInterval(iv);
  }, 180);
  window.setTimeout(() => {
    const s = useGame.getState();
    if (s.screen === 'playing' && s.worldId === WORLD_ID) s.completeWorld(WORLD_ID, s.level.coins.length);
  }, 6200);
}

function talkLumi() {
  const g = useGame.getState();
  const { stage, stars } = g.level;
  switch (stage) {
    case 'meetFairy':
      if (stars.length >= STARS.length) g.openDialogue(D.lumiIntroAlreadyStars, revealWand);
      else g.openDialogue(D.lumiIntro, () => g.setStage('collectStars'));
      break;
    case 'collectStars':
      g.openDialogue(D.lumiReminder(stars.length, STARS.length));
      break;
    case 'findWand':
      g.openDialogue(D.lumiFindWand);
      break;
    case 'returnWand':
      g.openDialogue(D.lumiReturn, finale);
      break;
  }
}

function talkPip() {
  const g = useGame.getState();
  const { stage, stars } = g.level;
  if (stage === 'collectStars') {
    const next = STARS.find((s) => !stars.includes(s.id));
    g.openDialogue([
      { speaker: 'pip', text: 'Looking for Wishing Stars? I know a secret!' },
      { speaker: 'pip', text: next ? D.pipHints[next.id] : 'You found them all! Go and tell Lumi!' },
    ]);
  } else {
    g.openDialogue(D.pip[stage === 'meetFairy' ? 'meetFairy' : stage === 'done' ? 'done' : stage]);
  }
}

function pickUpWand() {
  const g = useGame.getState();
  g.setHasWand(true);
  g.setStage('returnWand');
  audio.sfx('star');
  spawnBurst(WAND_POS.x, wandY() + 1, WAND_POS.z, '#fff3a0', 70, { speed: 4 });
  g.playEmote('surprise', 1.2);
  window.setTimeout(() => useGame.getState().openDialogue(D.foundWand, () => useGame.getState().playEmote('celebrate', 2.2)), 900);
}

export function ForestQuest() {
  const triggered = useRef(false);

  useEffect(() => {
    const st = () => useGame.getState().level.stage;
    const offs = [
      registerInteractable({
        id: 'lumi',
        x: FAIRY_POS.x,
        z: FAIRY_POS.z,
        radius: 4.2,
        approach: 2.0,
        label: () => (st() === 'returnWand' ? 'Give the wand to Lumi' : 'Talk to Lumi'),
        enabled: () => st() !== 'done',
        onInteract: talkLumi,
      }),
      registerInteractable({
        id: 'pip',
        x: RABBIT_POS.x,
        z: RABBIT_POS.z,
        radius: 3.2,
        approach: 1.4,
        label: () => 'Talk to Pip',
        enabled: () => true,
        onInteract: talkPip,
      }),
      registerInteractable({
        id: 'olli',
        x: OWL_POS.x,
        z: OWL_POS.z,
        radius: 3.4,
        approach: 1.6,
        label: () => 'Talk to Olli',
        enabled: () => true,
        onInteract: () => useGame.getState().openDialogue(st() === 'done' ? D.olliDone : D.olli),
      }),
      registerInteractable({
        id: 'wand',
        x: WAND_POS.x,
        z: WAND_POS.z,
        radius: 3,
        approach: 1.2,
        label: () => 'Pick up the magic wand',
        enabled: () => st() === 'findWand',
        onInteract: pickUpWand,
      }),
    ];
    return () => offs.forEach((f) => f());
  }, []);

  useFrame(() => {
    const g = useGame.getState();
    if (g.paused || g.dialogue || g.cinematic) return;
    if (!triggered.current && g.level.stage === 'collectStars' && g.level.stars.length >= STARS.length) {
      triggered.current = true;
      g.openDialogue(D.allStars, revealWand);
    }
  });

  return <WandSpot />;
}

/** Hollow log, the wand and the beam of light that reveals it. */
function WandSpot() {
  const stage = useGame((s) => s.level.stage);
  const wand = useRef<THREE.Group>(null!);
  const beam = useRef<THREE.Mesh>(null!);
  const y = wandY();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (wand.current) {
      wand.current.rotation.y = t * 1.2;
      wand.current.position.y = y + 0.55 + Math.sin(t * 2) * 0.1;
    }
    if (beam.current) (beam.current.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(t * 3) * 0.06;
  });
  return (
    <group>
      {/* permanent light (intensity animated) so the light count never changes -> no shader recompiles */}
      <pointLight position={[WAND_POS.x, y + 1.4, WAND_POS.z]} color="#ffe27a" intensity={stage === 'findWand' ? 6 : 0} distance={8} decay={2} />
      <group position={[LOG.x, terrainHeight(LOG.x, LOG.z), LOG.z]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.5, 0.55, 2.2, 18, 1, true]} />
          <meshStandardMaterial color="#8b5d3d" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.42, 2.21, 18, 1, true]} />
          <meshStandardMaterial color="#5e3b25" roughness={1} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, 0.92, 0]} scale={[1.1, 0.25, 0.5]}>
          <sphereGeometry args={[1, 16, 8]} />
          <meshStandardMaterial color="#5ea84c" roughness={1} />
        </mesh>
      </group>
      {stage === 'findWand' && (
        <>
          <group ref={wand} position={[WAND_POS.x, y + 0.55, WAND_POS.z]} rotation={[0, 0, 0.3]}>
            <Wand />
          </group>
          <mesh ref={beam} position={[WAND_POS.x, y + 12, WAND_POS.z]}>
            <cylinderGeometry args={[0.55, 0.9, 24, 20, 1, true]} />
            <meshBasicMaterial color="#fff2a8" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <Sparkles count={50} scale={[2, 6, 2]} position={[WAND_POS.x, y + 3, WAND_POS.z]} size={5} speed={1} color="#fff3a0" />
        </>
      )}
      {stage === 'done' && <Sparkles count={160} scale={[14, 5, 14]} position={[FAIRY_POS.x, 2, FAIRY_POS.z]} size={6} speed={0.8} color="#ffd6f2" />}
    </group>
  );
}
