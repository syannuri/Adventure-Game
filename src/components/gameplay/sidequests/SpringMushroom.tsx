/**
 * Spring mushroom (World 1): a wobbly blue mushroom under the giant lantern tree. Landing on it
 * bounces Anet high up onto a leafy branch, where a glowing lantern treasure holds golden acorns.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { bounceEvent } from '../../../systems/physics';
import { registerInteractable } from '../interaction/interactions';
import { BRANCH, SPRING, SPRING_PLATFORMS, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { forestDialogue as D } from '../../../data/forestDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { tr } from '../../../i18n';
import { rewardAcorns } from '../shop/KikiShopQuest';

const branchTop = SPRING_PLATFORMS[1].top;

function openLantern() {
  const g = useGame.getState();
  if (g.level.lantern) return;
  useGame.setState((s) => ({ level: { ...s.level, lantern: true, lastProgressAt: performance.now() } }));
  audio.sfx('chest');
  spawnBurst(BRANCH.x, branchTop + 0.7, BRANCH.z, '#ffd27a', 50, { speed: 3 });
  spawnBurst(BRANCH.x, branchTop + 0.7, BRANCH.z, '#a9e8ff', 30, { speed: 2.4 });
  g.playEmote('celebrate', 2);
  g.unlockAchievement('sky_hopper', ACHIEVEMENTS.sky_hopper.title, ACHIEVEMENTS.sky_hopper.icon);
  rewardAcorns(5);
  g.openDialogue(D().lanternOpen);
}

export function SpringMushroom() {
  const cap = useRef<THREE.Group>(null!);
  const lantern = useRef<THREE.Group>(null!);
  const opened = useGame((s) => s.level.lantern);
  const seen = useRef(false);
  const gy = terrainHeight(SPRING.x, SPRING.z);
  const by = terrainHeight(BRANCH.x, BRANCH.z);
  const spots = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ a: (i / 7) * Math.PI * 2 + 0.3, r: 0.28 + (i % 2) * 0.2 })), []);

  useEffect(
    () =>
      registerInteractable({
        id: 'lantern-treasure',
        x: BRANCH.x,
        z: BRANCH.z,
        radius: 1.2,
        approach: 0.4,
        label: () => tr().prompts.lantern,
        verb: 'open',
        // only up on the branch
        enabled: () => !useGame.getState().level.lantern && player.position.y > branchTop - 0.3,
        onInteract: openLantern,
      }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // squash and wobble right after a bounce, gentle jelly wobble otherwise
    const since = (performance.now() - bounceEvent.t) / 1000;
    const k = since < 0.6 ? Math.exp(-since * 6) * Math.cos(since * 30) : 0;
    cap.current.scale.set(1 + k * 0.25, 1 - k * 0.35 + Math.sin(t * 3) * 0.02, 1 + k * 0.25);
    if (lantern.current) lantern.current.rotation.z = Math.sin(t * 1.4) * 0.12;
    const g = useGame.getState();
    if (g.screen !== 'playing' || g.paused || g.cinematic || g.dialogue) return;
    const d = Math.hypot(player.position.x - SPRING.x, player.position.z - SPRING.z);
    if (!seen.current && d < 4) {
      seen.current = true;
      g.openDialogue(D().springFound);
      return;
    }
    // touching the lantern while standing on the branch opens it
    if (!g.level.lantern && player.position.y > branchTop - 0.1 && Math.hypot(player.position.x - BRANCH.x, player.position.z - BRANCH.z) < 0.55) openLantern();
  });

  return (
    <group>
      {/* the spring mushroom */}
      <group position={[SPRING.x, gy, SPRING.z]}>
        <mesh position={[0, SPRING.h / 2, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.28, SPRING.h, 14]} />
          <meshStandardMaterial color="#f3f6ff" roughness={0.7} />
        </mesh>
        <group ref={cap} position={[0, SPRING.h - 0.05, 0]}>
          <mesh scale={[1, 0.5, 1]} castShadow receiveShadow>
            <sphereGeometry args={[SPRING.r + 0.1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#59c7ff" emissive="#2fa8ff" emissiveIntensity={0.45} roughness={0.25} clearcoat={1} />
          </mesh>
          {spots.map((s, i) => (
            <mesh key={i} position={[Math.cos(s.a) * s.r, 0.32 - s.r * 0.35, Math.sin(s.a) * s.r]} scale={[1, 0.4, 1]}>
              <sphereGeometry args={[0.08, 10, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#d8f4ff" emissiveIntensity={0.6} />
            </mesh>
          ))}
        </group>
        <Sparkles count={14} scale={[1.6, 1, 1.6]} position={[0, 1.2, 0]} size={4} speed={0.6} color="#bfeaff" />
      </group>

      {/* the leafy branch reaching out from the giant tree */}
      <group position={[BRANCH.x, by, BRANCH.z]}>
        <mesh position={[0, BRANCH.h - 0.12, -1.0]} rotation={[Math.PI / 2 - 0.25, 0, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.26, 2.4, 10]} />
          <meshStandardMaterial color="#7d5236" roughness={0.95} />
        </mesh>
        <mesh position={[0, BRANCH.h - 0.08, 0]} scale={[1, 0.22, 1]} castShadow receiveShadow>
          <sphereGeometry args={[BRANCH.r + 0.15, 20, 12]} />
          <meshStandardMaterial color="#4fa757" roughness={0.85} />
        </mesh>
        {!opened && (
          <group ref={lantern} position={[0.1, BRANCH.h + 0.1, 0.1]}>
            <mesh position={[0, 0.28, 0]}>
              <coneGeometry args={[0.2, 0.14, 8]} />
              <meshStandardMaterial color="#7a4a22" />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.26, 8]} />
              <meshStandardMaterial color="#ffe27a" emissive="#ffb300" emissiveIntensity={1.6} transparent opacity={0.9} toneMapped={false} />
            </mesh>
            <mesh position={[0, -0.03, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.05, 8]} />
              <meshStandardMaterial color="#7a4a22" />
            </mesh>
            <pointLight position={[0, 0.2, 0]} color="#ffd27a" intensity={2.5} distance={4} decay={2} />
            <Sparkles count={16} scale={[0.9, 0.9, 0.9]} position={[0, 0.3, 0]} size={4} speed={0.6} color="#fff3a0" />
          </group>
        )}
      </group>
    </group>
  );
}
