/**
 * World 2 mission: "Help Koko find the missing candy ingredients".
 *
 *  meetChef           -> talk to Koko the gingerbread chef in front of the cupcake bakery
 *  collectIngredients -> find the 5 ingredients (they can also be found before meeting Koko)
 *  returnIngredients  -> bring them back to Koko
 *  sortCandy          -> sort the six candies into the matching jars (puzzle)
 *  done               -> the candy machine bakes the Rainbow Cake, party finale, world complete
 */
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { registerInteractable } from '../interaction/interactions';
import { candyDialogue as D } from '../../../data/candyDialogue';
import { tr } from '../../../i18n';
import { CAKE_POS, INGREDIENTS, KOKO_POS, PIP_POS, SORT, terrainHeight } from '../../worlds/CandyVillage/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { player } from '../../../systems/playerState';
import { SortPuzzle } from '../puzzles/SortPuzzle';
import { damp } from '../../../utils/math';

const WORLD_ID = 'candy-village';

function startSorting() {
  const g = useGame.getState();
  g.setStage('sortCandy');
  audio.sfx('magic');
  g.playCinematic({ kind: 'reveal', duration: 3600, focus: [SORT.x, terrainHeight(SORT.x, SORT.z) + 1.2, SORT.z] });
}

function finale() {
  const g = useGame.getState();
  g.setStage('done');
  audio.sfx('magic');
  // the camera flies over to the Rainbow Cake as it pops up in front of the bakery
  g.playCinematic({ kind: 'reveal', duration: 8000, focus: [CAKE_POS.x, terrainHeight(CAKE_POS.x, CAKE_POS.z) + 1.4, CAKE_POS.z] });
  g.playEmote('celebrate', 3);
  g.unlockAchievement('candy_helper', ACHIEVEMENTS.candy_helper.title, ACHIEVEMENTS.candy_helper.icon);
  const colors = ['#ff6fae', '#ffd23f', '#5ab8ff', '#7ee081', '#c9a7ff', '#ffffff'];
  let n = 0;
  const iv = window.setInterval(() => {
    const a = Math.random() * Math.PI * 2;
    const r = 1.5 + Math.random() * 6;
    const x = CAKE_POS.x + Math.cos(a) * r;
    const z = CAKE_POS.z + Math.sin(a) * r;
    spawnBurst(x, terrainHeight(x, z) + 0.8 + Math.random() * 3, z, colors[n % colors.length], 34, { speed: 3.2 });
    if (n % 3 === 0) audio.sfx('pop', { pitch: 0.8 + Math.random() * 0.7, volume: 0.5 });
    if (++n > 28) window.clearInterval(iv);
  }, 170);
  window.setTimeout(() => {
    const s = useGame.getState();
    if (s.screen === 'playing' && s.worldId === WORLD_ID) s.completeWorld(WORLD_ID, s.level.coins.length);
  }, 6400);
}

function sortSolved() {
  useGame.getState().openDialogue(D().sortDone, finale);
}

function talkKoko() {
  const g = useGame.getState();
  const { stage, stars } = g.level;
  switch (stage) {
    case 'meetChef':
      if (stars.length >= INGREDIENTS.length) g.openDialogue([...D().kokoIntroAlready, ...D().kokoReturn.slice(2)], startSorting);
      else g.openDialogue(D().kokoIntro, () => g.setStage('collectIngredients'));
      break;
    case 'collectIngredients':
      g.openDialogue(D().kokoReminder(stars.length, INGREDIENTS.length));
      break;
    case 'returnIngredients':
      g.openDialogue(D().kokoReturn, startSorting);
      break;
    case 'sortCandy':
      g.openDialogue(D().kokoSorting);
      break;
  }
}

function talkPip() {
  const g = useGame.getState();
  const { stage, stars } = g.level;
  if (stage === 'collectIngredients') {
    const next = INGREDIENTS.find((s) => !stars.includes(s.id));
    g.openDialogue([
      { speaker: 'pip', text: D().pipSecret },
      { speaker: 'pip', text: next ? D().pipHints[next.id] : D().pipAllFound },
    ]);
  } else g.openDialogue(D().pip[stage] ?? D().pip.meetChef);
}

export function CandyQuest() {
  const allFound = useRef(false);
  const arrived = useRef(false);

  useEffect(() => {
    const st = () => useGame.getState().level.stage;
    const offs = [
      registerInteractable({
        id: 'koko',
        x: KOKO_POS.x,
        z: KOKO_POS.z,
        radius: 3.6,
        approach: 1.6,
        label: () => (st() === 'returnIngredients' ? tr().prompts.giveIngredients : tr().prompts.talkKoko),
        verb: 'talk',
        enabled: () => st() !== 'done',
        onInteract: talkKoko,
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
    // a happy first line once the intro fly-over has finished
    if (!arrived.current) {
      arrived.current = true;
      if (g.level.stage === 'meetChef' && g.level.stars.length === 0) {
        g.openDialogue(D().arrive);
        return;
      }
    }
    // walking up to Koko with every ingredient hands them over automatically
    if (g.level.stage === 'returnIngredients' && Math.hypot(player.position.x - KOKO_POS.x, player.position.z - KOKO_POS.z) < 2.6) {
      player.lookAt = { x: KOKO_POS.x, z: KOKO_POS.z };
      talkKoko();
      return;
    }
    if (!allFound.current && g.level.stage === 'collectIngredients' && g.level.stars.length >= INGREDIENTS.length) {
      allFound.current = true;
      g.openDialogue(D().allIngredients, () => useGame.getState().setStage('returnIngredients'));
    }
  });

  return (
    <>
      <SortPuzzle onSolved={sortSolved} />
      <RainbowCake />
    </>
  );
}

/** The Rainbow Cake: pops up in front of the bakery when the candy machine has done its job. */
function RainbowCake() {
  const stage = useGame((s) => s.level.stage);
  const g = useRef<THREE.Group>(null!);
  const scale = useRef(0);
  const y = terrainHeight(CAKE_POS.x, CAKE_POS.z);
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const target = stage === 'done' ? 1 : 0;
    scale.current += (target - scale.current) * damp(3.5, dt);
    const s = scale.current;
    // a little overshoot "pop" while it appears
    // kept "visible" at a tiny scale from the start so its shaders are compiled while the world loads
    g.current.scale.setScalar(Math.max(0.001, s * (1 + Math.sin(Math.min(1, s) * Math.PI) * 0.15)));
    g.current.rotation.y = clock.elapsedTime * 0.4;
  });
  const layers = ['#ff6b8b', '#ff9f43', '#ffd23f', '#7ee081', '#5ab8ff', '#a77bff'];
  return (
    <group ref={g} position={[CAKE_POS.x, y, CAKE_POS.z]} scale={0.001}>
      {/* cake stand */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.3, 0.6, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[1.0, 0.95, 0.06, 36]} />
        <meshStandardMaterial color="#ffffff" roughness={0.25} />
      </mesh>
      {layers.map((c, i) => (
        <mesh key={i} position={[0, 0.72 + i * 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.85 - i * 0.07, 0.85 - i * 0.07, 0.2, 36]} />
          <meshStandardMaterial color={c} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, 0.72 + layers.length * 0.2 - 0.02, 0]} scale={[1, 0.35, 1]}>
        <sphereGeometry args={[0.5, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#fffaf4" roughness={0.5} />
      </mesh>
      {/* candles */}
      {[0, 1, 2, 3, 4].map((k) => {
        const a = (k / 5) * Math.PI * 2;
        return (
          <group key={k} position={[Math.cos(a) * 0.3, 2.05, Math.sin(a) * 0.3]}>
            <mesh>
              <cylinderGeometry args={[0.03, 0.03, 0.26, 8]} />
              <meshStandardMaterial color={layers[k]} />
            </mesh>
            <mesh position={[0, 0.17, 0]} scale={[1, 1.6, 1]}>
              <sphereGeometry args={[0.035, 8, 6]} />
              <meshStandardMaterial color="#fff2a8" emissive="#ffb300" emissiveIntensity={3} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      <Sparkles count={70} scale={[3, 3, 3]} position={[0, 1.6, 0]} size={6} speed={0.8} color="#fff3b0" />
    </group>
  );
}
