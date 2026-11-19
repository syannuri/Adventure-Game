/**
 * Lily-pad hop (World 1): jump from lily pad to lily pad across the pond to a little island with a
 * golden lotus full of acorns. Missing a pad is just a splash: Anet pops back onto the shore.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { registerInteractable } from '../interaction/interactions';
import { LILY_PADS, LILY_START, LILY_TOP, LOTUS_ISLAND, POND, WATER_LEVEL, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { forestDialogue as D } from '../../../data/forestDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { tr } from '../../../i18n';
import { rewardAcorns } from '../shop/KikiShopQuest';

function pickLotus() {
  const g = useGame.getState();
  if (g.level.lotus) return;
  useGame.setState((s) => ({ level: { ...s.level, lotus: true, lastProgressAt: performance.now() } }));
  audio.sfx('star', { pitch: 1.15 });
  spawnBurst(LOTUS_ISLAND.x, LILY_TOP + 0.8, LOTUS_ISLAND.z, '#ffd36b', 50, { speed: 3 });
  spawnBurst(LOTUS_ISLAND.x, LILY_TOP + 0.8, LOTUS_ISLAND.z, '#ffb3d1', 30, { speed: 2.5 });
  g.playEmote('celebrate', 2);
  g.unlockAchievement('lily_hopper', ACHIEVEMENTS.lily_hopper.title, ACHIEVEMENTS.lily_hopper.icon);
  rewardAcorns(5);
  g.openDialogue(D().lotusPicked);
}

function LilyPad({ i }: { i: number }) {
  const p = LILY_PADS[i];
  const g = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // dip a little when Anet stands on it
    const on = Math.hypot(player.position.x - p.x, player.position.z - p.z) < p.r && Math.abs(player.position.y - LILY_TOP) < 0.15;
    g.current.position.y = LILY_TOP - 0.03 + Math.sin(t * 1.6 + i) * 0.012 - (on ? 0.03 : 0);
    g.current.rotation.y = i * 1.7 + Math.sin(t * 0.5 + i) * 0.05;
  });
  return (
    <group ref={g} position={[p.x, LILY_TOP, p.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[p.r + 0.08, 28, 0.25, Math.PI * 1.86]} />
        <meshStandardMaterial color="#5fb85a" roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* leaf veins */}
      {[0, 1, 2, 3, 4].map((k) => (
        <mesh key={k} rotation={[-Math.PI / 2, 0, 0.25 + (k / 5) * Math.PI * 1.86 + 0.18]} position={[0, 0.004, 0]}>
          <planeGeometry args={[p.r * 0.9, 0.02]} />
          <meshBasicMaterial color="#86d17a" transparent opacity={0.6} />
        </mesh>
      ))}
      {i === 1 && (
        <mesh position={[0.3, 0.08, -0.25]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshStandardMaterial color="#ffb3d1" emissive="#ff8fbf" emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  );
}

function LotusIsland() {
  const lotus = useRef<THREE.Group>(null!);
  const picked = useGame((s) => s.level.lotus);
  const petals = useMemo(() => Array.from({ length: 8 }, (_, k) => (k / 8) * Math.PI * 2), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (lotus.current) {
      lotus.current.rotation.y = t * 0.4;
      lotus.current.position.y = LILY_TOP + 0.25 + Math.sin(t * 2) * 0.03;
    }
  });
  return (
    <group>
      {/* mossy little island */}
      <mesh position={[LOTUS_ISLAND.x, LILY_TOP - 0.15, LOTUS_ISLAND.z]} scale={[1, 0.35, 1]} receiveShadow castShadow>
        <sphereGeometry args={[LOTUS_ISLAND.r + 0.1, 24, 12]} />
        <meshStandardMaterial color="#8a8f80" roughness={1} />
      </mesh>
      <mesh position={[LOTUS_ISLAND.x, LILY_TOP + 0.1, LOTUS_ISLAND.z]} scale={[1, 0.12, 1]}>
        <sphereGeometry args={[LOTUS_ISLAND.r, 24, 10]} />
        <meshStandardMaterial color="#6cbf5a" roughness={1} />
      </mesh>
      {!picked && (
        <group ref={lotus} position={[LOTUS_ISLAND.x, LILY_TOP + 0.25, LOTUS_ISLAND.z]}>
          {petals.map((a, k) => (
            <mesh key={k} position={[Math.cos(a) * 0.14, 0.08, Math.sin(a) * 0.14]} rotation={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]} scale={[0.7, 1.4, 0.35]}>
              <sphereGeometry args={[0.13, 12, 8]} />
              <meshStandardMaterial color="#ffd36b" emissive="#ffb300" emissiveIntensity={0.9} metalness={0.4} roughness={0.25} toneMapped={false} />
            </mesh>
          ))}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.09, 12, 10]} />
            <meshStandardMaterial color="#fff3b0" emissive="#ffe27a" emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
          <Sparkles count={24} scale={[1.2, 1.2, 1.2]} position={[0, 0.4, 0]} size={5} speed={0.7} color="#fff3a0" />
        </group>
      )}
    </group>
  );
}

export function LilyPads() {
  const seen = useRef(false);
  const splashT = useRef(-10);
  const splashedOnce = useRef(false);
  useEffect(
    () =>
      registerInteractable({
        id: 'lotus',
        x: LOTUS_ISLAND.x,
        z: LOTUS_ISLAND.z,
        radius: 1.3,
        approach: 0.5,
        label: () => tr().prompts.lotus,
        verb: 'take',
        enabled: () => !useGame.getState().level.lotus,
        onInteract: pickLotus,
      }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const g = useGame.getState();
    if (g.screen !== 'playing' || g.paused || g.cinematic) return;
    const p = player.position;
    const dPond = Math.hypot(p.x - POND.x, p.z - POND.z);
    // first time near the pads
    if (!seen.current && !g.dialogue && Math.hypot(p.x - LILY_START.x, p.z - LILY_START.z) < 3.5) {
      seen.current = true;
      g.openDialogue(D().lilyFound);
      return;
    }
    // touching the lotus picks it, like the stars
    if (!g.level.lotus && !g.dialogue && Math.hypot(p.x - LOTUS_ISLAND.x, p.z - LOTUS_ISLAND.z) < 0.6 && p.y > LILY_TOP) {
      pickLotus();
      return;
    }
    // fell into the water: splash and pop back onto the shore
    if (dPond < POND.r + 0.4 && p.y < WATER_LEVEL - 0.18 && terrainHeight(p.x, p.z) < WATER_LEVEL && t - splashT.current > 1.5) {
      splashT.current = t;
      audio.sfx('splash');
      spawnBurst(p.x, WATER_LEVEL + 0.1, p.z, '#bfeaff', 40, { speed: 3, up: 3 });
      spawnBurst(p.x, WATER_LEVEL + 0.1, p.z, '#ffffff', 20, { speed: 2, up: 2.5 });
      // back onto the nearest bit of shore, facing the pond
      const ang = Math.atan2(p.z - POND.z, p.x - POND.x);
      const sx = POND.x + Math.cos(ang) * (POND.r - 0.4);
      const sz = POND.z + Math.sin(ang) * (POND.r - 0.4);
      player.teleport(sx, terrainHeight(sx, sz), sz, Math.atan2(POND.x - sx, POND.z - sz));
      g.playEmote('surprise', 1.2);
      if (!splashedOnce.current && !g.dialogue) window.setTimeout(() => !useGame.getState().dialogue && useGame.getState().openDialogue(D().lilySplash), 400);
      splashedOnce.current = true;
    }
  });

  return (
    <group>
      {LILY_PADS.map((_, i) => (
        <LilyPad key={i} i={i} />
      ))}
      <LotusIsland />
    </group>
  );
}
