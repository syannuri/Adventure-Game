/**
 * Collectibles of every world. Enchanted Forest: Wishing Stars (quest items), golden acorns (coins)
 * and treasure chests. Candy Village: the five candy ingredients, peppermints and gift boxes.
 * Touch quest items / coins to collect them; chests and gifts open with the action button.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import type { Spot } from '../../worlds/EnchantedForest/layout';
import { getWorldPhysics } from '../../../systems/physics';
import { INGREDIENT_GLOW, IngredientModel, Peppermint, giftColors } from './CandyItems';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { starShapeGeometry } from './Wand';
import { registerInteractable } from '../interaction/interactions';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { glowTexture } from '../../effects/textures';
import { tr } from '../../../i18n';

const terrainHeight = (x: number, z: number) => getWorldPhysics().height(x, z);
const spotY = (s: Spot) => (s.abs ? s.y : terrainHeight(s.x, s.z) + s.y);

export type Theme = 'forest' | 'candy';

export function Collectibles({ stars, coins, treasures, theme = 'forest' }: { stars: Spot[]; coins: Spot[]; treasures: Spot[]; theme?: Theme }) {
  return (
    <group>
      {stars.map((s) => (
        <WishingStar key={s.id} spot={s} total={stars.length} theme={theme} />
      ))}
      {coins.map((s) => (
        <Acorn key={s.id} spot={s} total={coins.length} theme={theme} />
      ))}
      {treasures.map((s) => (
        <Chest key={s.id} spot={s} total={treasures.length} theme={theme} />
      ))}
    </group>
  );
}

const starGeo = () => starShapeGeometry(0.42, 0.19, 0.12);

function WishingStar({ spot, total, theme }: { spot: Spot; total: number; theme: Theme }) {
  const ref = useRef<THREE.Group>(null!);
  const collected = useGame((s) => s.level.stars.includes(spot.id));
  const geo = useMemo(starGeo, []);
  const y = spotY(spot);
  const glow = useMemo(() => glowTexture(), []);
  useFrame(({ clock }) => {
    if (collected) return;
    const t = clock.elapsedTime;
    ref.current.rotation.y = t * 1.6;
    ref.current.position.y = y + Math.sin(t * 2.2 + spot.x) * 0.15;
    const dx = player.position.x - spot.x;
    const dz = player.position.z - spot.z;
    const dy = player.position.y + 0.6 - ref.current.position.y;
    if (dx * dx + dz * dz < 0.85 && Math.abs(dy) < 1.1) {
      const g = useGame.getState();
      if (g.screen !== 'playing') return;
      g.collect('stars', spot.id);
      const n = useGame.getState().level.stars.length;
      audio.sfx('star');
      const candy = theme === 'candy';
      spawnBurst(spot.x, ref.current.position.y, spot.z, candy ? INGREDIENT_GLOW[spot.id] ?? '#ffb3d1' : '#ffe27a', 60, { speed: 4 });
      spawnBurst(spot.x, ref.current.position.y, spot.z, '#ffffff', 20, { speed: 2 });
      g.playEmote('collect');
      const toast = candy
        ? { title: tr().toasts.ingredient, text: tr().toasts.ingredientCount(tr().ingredients[spot.id] ?? '', n, total), icon: '❀' }
        : { title: tr().toasts.star, text: tr().toasts.starCount(n, total), icon: '★' };
      useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now(), ...toast }] }));
      const id = useGame.getState().toasts.at(-1)!.id;
      setTimeout(() => useGame.getState().dismissToast(id), 2600);
      if (n === 1 && !candy) g.unlockAchievement('first_star', ACHIEVEMENTS.first_star.title, ACHIEVEMENTS.first_star.icon);
      if (spot.id === 'star-mushroom') g.unlockAchievement('high_jumper', ACHIEVEMENTS.high_jumper.title, ACHIEVEMENTS.high_jumper.icon);
      if (spot.id === 'ing-honey') g.unlockAchievement('donut_hopper', ACHIEVEMENTS.donut_hopper.title, ACHIEVEMENTS.donut_hopper.icon);
    }
  });
  if (collected) return null;
  if (theme === 'candy')
    return (
      <group ref={ref} position={[spot.x, y, spot.z]}>
        <group scale={1.5}>
          <IngredientModel id={spot.id} />
        </group>
        <sprite scale={2.2}>
          <spriteMaterial map={glow} color={INGREDIENT_GLOW[spot.id] ?? '#ffb3d1'} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    );
  return (
    <group ref={ref} position={[spot.x, y, spot.z]}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color="#ffe680" emissive="#ffc93a" emissiveIntensity={1.9} metalness={0.2} roughness={0.25} toneMapped={false} />
      </mesh>
      <sprite scale={2.2}>
        <spriteMaterial map={glow} color="#ffdd77" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

function acornGeometry() {
  const nut = new THREE.SphereGeometry(0.16, 16, 12);
  nut.scale(1, 1.2, 1);
  return nut;
}

function Acorn({ spot, total, theme }: { spot: Spot; total: number; theme: Theme }) {
  const ref = useRef<THREE.Group>(null!);
  const collected = useGame((s) => s.level.coins.includes(spot.id));
  const nut = useMemo(acornGeometry, []);
  const y = spotY(spot);
  useFrame(({ clock }) => {
    if (collected) return;
    const t = clock.elapsedTime;
    ref.current.rotation.y = t * 2.4 + spot.x;
    ref.current.position.y = y + Math.sin(t * 3 + spot.z) * 0.08;
    const dx = player.position.x - spot.x;
    const dz = player.position.z - spot.z;
    const dy = player.position.y + 0.6 - ref.current.position.y;
    if (dx * dx + dz * dz < 0.7 && Math.abs(dy) < 1.1) {
      const g = useGame.getState();
      if (g.screen !== 'playing') return;
      g.collect('coins', spot.id);
      audio.sfx('coin', { pitch: 1 + (g.level.coins.length % 5) * 0.06 });
      spawnBurst(spot.x, ref.current.position.y, spot.z, theme === 'candy' ? '#ff8fa8' : '#ffd36b', 16, { speed: 2, up: 1.5, life: 0.7 });
      const ach = theme === 'candy' ? 'candy_collector' : 'coin_collector';
      if (useGame.getState().level.coins.length === total) g.unlockAchievement(ach, ACHIEVEMENTS[ach].title, ACHIEVEMENTS[ach].icon);
    }
  });
  if (collected) return null;
  if (theme === 'candy')
    return (
      <group ref={ref} position={[spot.x, y, spot.z]}>
        <Peppermint />
      </group>
    );
  return (
    <group ref={ref} position={[spot.x, y, spot.z]}>
      <mesh geometry={nut} castShadow>
        <meshStandardMaterial color="#f3b23c" emissive="#c77a10" emissiveIntensity={0.45} metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.13, 0]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[0.175, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#9a6a32" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.08, 6]} />
        <meshStandardMaterial color="#6b4423" />
      </mesh>
    </group>
  );
}

function Chest({ spot, total, theme }: { spot: Spot; total: number; theme: Theme }) {
  const lid = useRef<THREE.Group>(null!);
  const gem = useRef<THREE.Mesh>(null!);
  const opened = useGame((s) => s.level.treasures.includes(spot.id));
  const openT = useRef(0);
  const y = terrainHeight(spot.x, spot.z);
  const facing = Math.atan2(-spot.x, -spot.z); // face the middle of the forest

  useEffect(
    () =>
      registerInteractable({
        id: spot.id,
        x: spot.x,
        z: spot.z,
        radius: 2.6,
        approach: 1.3,
        label: () => (theme === 'candy' ? tr().prompts.openGift : tr().prompts.openChest),
        verb: 'open',
        enabled: () => !useGame.getState().level.treasures.includes(spot.id),
        onInteract: () => {
          const g = useGame.getState();
          g.collect('treasures', spot.id);
          audio.sfx('chest');
          g.playEmote('surprise', 1.4);
          spawnBurst(spot.x, y + 0.8, spot.z, '#9fe7ff', 50, { speed: 3 });
          spawnBurst(spot.x, y + 0.8, spot.z, '#ffd36b', 30, { speed: 2.5 });
          const n = useGame.getState().level.treasures.length;
          const toast = theme === 'candy' ? { title: tr().toasts.gift, text: tr().toasts.giftCount(n, total) } : { title: tr().toasts.treasure, text: tr().toasts.chestCount(n, total) };
          useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now(), ...toast, icon: '◆' }] }));
          const id = useGame.getState().toasts.at(-1)!.id;
          setTimeout(() => useGame.getState().dismissToast(id), 2600);
          if (n === total) g.unlockAchievement('treasure_hunter', ACHIEVEMENTS.treasure_hunter.title, ACHIEVEMENTS.treasure_hunter.icon);
        },
      }),
    [spot.id, spot.x, spot.z, total, y, theme],
  );

  useFrame(({ clock }, dt) => {
    const target = opened ? 1 : 0;
    const v = (openT.current += (target - openT.current) * Math.min(1, dt * 4));
    if (theme === 'candy') {
      // gift lid pops up and tilts away
      lid.current.position.y = 0.62 + v * 0.55;
      lid.current.rotation.z = v * 0.6;
    } else lid.current.rotation.x = -v * 1.9;
    if (gem.current) {
      gem.current.visible = opened;
      gem.current.position.y = 0.45 + v * 0.5 + Math.sin(clock.elapsedTime * 2) * 0.05;
      gem.current.rotation.y = clock.elapsedTime * 2;
    }
  });

  if (theme === 'candy') {
    const [box, ribbon] = giftColors(spot.id);
    return (
      <group position={[spot.x, y, spot.z]} rotation={[0, facing, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.62, 0.6, 0.62]} />
          <meshStandardMaterial color={box} roughness={0.45} />
        </mesh>
        {[0, Math.PI / 2].map((r) => (
          <mesh key={r} position={[0, 0.3, 0]} rotation={[0, r, 0]}>
            <boxGeometry args={[0.12, 0.61, 0.63]} />
            <meshStandardMaterial color={ribbon} roughness={0.35} metalness={0.2} />
          </mesh>
        ))}
        <group ref={lid} position={[0, 0.62, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.14, 0.7]} />
            <meshStandardMaterial color={box} roughness={0.45} />
          </mesh>
          {[0, Math.PI / 2].map((r) => (
            <mesh key={r} rotation={[0, r, 0]}>
              <boxGeometry args={[0.12, 0.15, 0.71]} />
              <meshStandardMaterial color={ribbon} roughness={0.35} metalness={0.2} />
            </mesh>
          ))}
          {[1, -1].map((s) => (
            <mesh key={s} position={[0.09 * s, 0.13, 0]} rotation={[0, 0, s * 0.6]} scale={[1, 0.6, 0.5]}>
              <torusGeometry args={[0.09, 0.03, 8, 16]} />
              <meshStandardMaterial color={ribbon} roughness={0.35} metalness={0.2} />
            </mesh>
          ))}
        </group>
        <mesh ref={gem} visible={false} position={[0, 0.45, 0]}>
          <octahedronGeometry args={[0.16]} />
          <meshStandardMaterial color="#ffd6ea" emissive="#ff6fae" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[spot.x, y, spot.z]} rotation={[0, facing, 0]}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.44, 0.55]} />
        <meshStandardMaterial color="#a8683a" roughness={0.8} />
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.22, 0]}>
          <boxGeometry args={[0.07, 0.46, 0.57]} />
          <meshStandardMaterial color="#f0c24b" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <group ref={lid} position={[0, 0.44, -0.275]}>
        <mesh position={[0, 0.06, 0.275]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.27, 0.27, 0.8, 16, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#b9773f" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.06, 0.55]}>
          <boxGeometry args={[0.12, 0.14, 0.04]} />
          <meshStandardMaterial color="#f0c24b" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      <mesh ref={gem} visible={false} position={[0, 0.45, 0]}>
        <octahedronGeometry args={[0.16]} />
        <meshStandardMaterial color="#9fe7ff" emissive="#4fd2ff" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
}
