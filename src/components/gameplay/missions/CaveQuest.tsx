/**
 * World 3 mission: "Light up the Crystal Cave for Drako the baby dragon".
 *
 *  meetDragon       -> talk to Drako next to the dark Heart Crystal
 *  collectCrystals  -> find the 5 crystals (they can also be found before meeting Drako)
 *  returnCrystals   -> bring them back; they are set around the Heart Crystal
 *  lightPuzzle      -> turn the three mirror crystals to guide the sunbeam to the Heart Crystal
 *  done             -> the cave lights up, Drako flies, world complete
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { registerInteractable } from '../interaction/interactions';
import { caveDialogue as D } from '../../../data/caveDialogue';
import { tr } from '../../../i18n';
import { CRYSTALS, DRAKO_POS, HEART, MIRRORS, PIP_POS, SOURCE, terrainHeight } from '../../worlds/CrystalCave/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { player } from '../../../systems/playerState';
import { LightPuzzle } from '../puzzles/LightPuzzle';
import { damp } from '../../../utils/math';

const WORLD_ID = 'crystal-cave';

function startPuzzle() {
  const g = useGame.getState();
  g.setStage('lightPuzzle');
  audio.sfx('magic');
  const m = MIRRORS[1];
  g.playCinematic({ kind: 'reveal', duration: 4200, focus: [(SOURCE.x + m.x) / 2, terrainHeight(m.x, m.z) + 1.4, (SOURCE.z + m.z) / 2] });
}

function finale() {
  const g = useGame.getState();
  g.setStage('done');
  audio.sfx('magic');
  g.playCinematic({ kind: 'finale', duration: 1600 });
  g.playEmote('celebrate', 3);
  g.unlockAchievement('light_master', ACHIEVEMENTS.light_master.title, ACHIEVEMENTS.light_master.icon);
  g.unlockAchievement('crystal_keeper', ACHIEVEMENTS.crystal_keeper.title, ACHIEVEMENTS.crystal_keeper.icon);
  const colors = ['#c9a7ff', '#8ff3ff', '#ff9ee0', '#fff3a0', '#ffffff'];
  let n = 0;
  const iv = window.setInterval(() => {
    const a = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 10;
    const x = HEART.x + Math.cos(a) * r;
    const z = HEART.z + Math.sin(a) * r;
    spawnBurst(x, terrainHeight(x, z) + 1 + Math.random() * 4, z, colors[n % colors.length], 30, { speed: 3 });
    if (n % 3 === 0) audio.sfx('star', { pitch: 0.8 + Math.random() * 0.6, volume: 0.4 });
    if (++n > 30) window.clearInterval(iv);
  }, 170);
  window.setTimeout(() => {
    const s = useGame.getState();
    if (s.screen === 'playing' && s.worldId === WORLD_ID) s.completeWorld(WORLD_ID, s.level.coins.length);
  }, 6400);
}

function talkDrako() {
  const g = useGame.getState();
  const { stage, stars } = g.level;
  switch (stage) {
    case 'meetDragon':
      if (stars.length >= CRYSTALS.length) g.openDialogue([...D().drakoIntroAlready, ...D().drakoReturn.slice(1)], startPuzzle);
      else g.openDialogue(D().drakoIntro, () => g.setStage('collectCrystals'));
      break;
    case 'collectCrystals':
      g.openDialogue(D().drakoReminder(stars.length, CRYSTALS.length));
      break;
    case 'returnCrystals':
      g.openDialogue(D().drakoReturn, startPuzzle);
      break;
    case 'lightPuzzle':
      g.openDialogue(D().drakoPuzzle);
      break;
  }
}

function talkPip() {
  const g = useGame.getState();
  const { stage, stars } = g.level;
  if (stage === 'collectCrystals') {
    const next = CRYSTALS.find((s) => !stars.includes(s.id));
    g.openDialogue([
      { speaker: 'pip', text: D().pipSecret },
      { speaker: 'pip', text: next ? D().pipHints[next.id] : D().pipAllFound },
    ]);
  } else g.openDialogue(D().pip[stage] ?? D().pip.meetDragon);
}

export function CaveQuest() {
  const allFound = useRef(false);
  const arrived = useRef(false);

  useEffect(() => {
    const st = () => useGame.getState().level.stage;
    const offs = [
      registerInteractable({
        id: 'drako',
        x: DRAKO_POS.x,
        z: DRAKO_POS.z,
        radius: 3.4,
        approach: 1.5,
        label: () => (st() === 'returnCrystals' ? tr().prompts.giveCrystals : tr().prompts.talkDrako),
        verb: 'talk',
        enabled: () => st() !== 'done',
        onInteract: talkDrako,
      }),
      registerInteractable({
        id: 'pip',
        x: PIP_POS.x,
        z: PIP_POS.z,
        radius: 3.2,
        approach: 1.4,
        label: () => tr().prompts.talkPip,
        enabled: () => true,
        onInteract: talkPip,
      }),
    ];
    return () => offs.forEach((f) => f());
  }, []);

  useFrame(() => {
    const g = useGame.getState();
    if (g.paused || g.dialogue || g.cinematic || g.screen !== 'playing') return;
    if (!arrived.current) {
      arrived.current = true;
      if (g.level.stage === 'meetDragon' && g.level.stars.length === 0) {
        g.openDialogue(D().arrive);
        return;
      }
    }
    if (g.level.stage === 'returnCrystals' && Math.hypot(player.position.x - DRAKO_POS.x, player.position.z - DRAKO_POS.z) < 2.8) {
      player.lookAt = { x: DRAKO_POS.x, z: DRAKO_POS.z };
      talkDrako();
      return;
    }
    if (!allFound.current && g.level.stage === 'collectCrystals' && g.level.stars.length >= CRYSTALS.length) {
      allFound.current = true;
      g.openDialogue(D().allCrystals, () => useGame.getState().setStage('returnCrystals'));
    }
  });

  return (
    <>
      <LightPuzzle onSolved={() => useGame.getState().openDialogue(D().beamDone, finale)} />
      <HeartCrystal />
    </>
  );
}

/** The Heart Crystal on its dais: dark at first, the five crystals appear around it, then it blazes. */
function HeartCrystal() {
  const stage = useGame((s) => s.level.stage);
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#e6dcff', emissive: '#7a5cff', emissiveIntensity: 0.2, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.93 }), []);
  const ring = useRef<THREE.Group>(null!);
  const y = terrainHeight(HEART.x, HEART.z);
  const placed = stage === 'lightPuzzle' || stage === 'done';
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const target = stage === 'done' ? 3.2 + Math.sin(t * 2) * 0.4 : placed ? 0.7 + Math.sin(t * 2) * 0.15 : 0.18;
    mat.emissiveIntensity += (target - mat.emissiveIntensity) * damp(3, dt);
    if (ring.current) ring.current.rotation.y = t * 0.4;
  });
  return (
    <group position={[HEART.x, y, HEART.z]}>
      {/* dais */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[HEART.r, HEART.r + 0.2, 0.3, 24]} />
        <meshStandardMaterial color="#5e5388" roughness={0.9} />
      </mesh>
      <mesh material={mat} position={[0, 1.35, 0]} scale={[0.8, 1.9, 0.8]} castShadow>
        <octahedronGeometry args={[0.65, 0]} />
      </mesh>
      {placed && (
        <group ref={ring}>
          {CRYSTALS.map((_, k) => {
            const a = (k / CRYSTALS.length) * Math.PI * 2;
            return (
              <mesh key={k} position={[Math.cos(a) * 1.05, 0.55, Math.sin(a) * 1.05]} scale={[0.6, 1.1, 0.6]}>
                <octahedronGeometry args={[0.2, 0]} />
                <meshStandardMaterial color="#d6c4ff" emissive="#9b6bff" emissiveIntensity={stage === 'done' ? 2.4 : 1.2} toneMapped={false} />
              </mesh>
            );
          })}
        </group>
      )}
      {stage === 'done' && <Sparkles count={120} scale={[8, 6, 8]} position={[0, 2.5, 0]} size={7} speed={0.6} color="#e6dcff" />}
    </group>
  );
}
