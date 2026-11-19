/**
 * Night forest (after World 1 is finished): Lumi's Light Party.
 * Catch ten fireflies in a jar and light the five lantern posts along the paths, then go back to
 * Lumi: the fireflies are set free in a big glowing finale.
 * Lantern posts stand there by day too (unlit), so the forest looks the same apart from the night.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { registerInteractable } from '../interaction/interactions';
import { FAIRY_POS, FIREFLY_SPOTS, LANTERN_POSTS, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { glowTexture } from '../../effects/textures';
import { forestDialogue as D } from '../../../data/forestDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { tr } from '../../../i18n';
import type { Objective } from './forestObjective';

const WORLD_ID = 'enchanted-forest';
const FF_TOTAL = FIREFLY_SPOTS.length;
const LAMP_TOTAL = LANTERN_POSTS.length;
const POST_H = 1.9;

export function nightObjective(): Objective {
  const l = useGame.getState().level;
  const n = tr().night;
  if (l.nightStage === 'done') return { text: n.done, target: null };
  if (l.nightStage === 'return') return { text: n.returnLumi, target: FAIRY_POS };
  // point at the nearest lantern still dark, else the nearest firefly
  const p = player.position;
  const targets = [...LANTERN_POSTS.filter((x) => !l.lanterns.includes(x.id)), ...FIREFLY_SPOTS.filter((x) => !l.fireflies.includes(x.id))];
  let best: { x: number; z: number } | null = null;
  let bd = Infinity;
  for (const t of targets) {
    const d = Math.hypot(t.x - p.x, t.z - p.z);
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  return { text: n.objective(l.fireflies.length, FF_TOTAL, l.lanterns.length, LAMP_TOTAL), target: best };
}

function toast(title: string, text: string, icon: string) {
  useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now() + Math.random(), title, text, icon }] }));
  const id = useGame.getState().toasts.at(-1)!.id;
  window.setTimeout(() => useGame.getState().dismissToast(id), 2400);
}

function checkReady() {
  const l = useGame.getState().level;
  if (l.nightStage === 'collect' && l.fireflies.length >= FF_TOTAL && l.lanterns.length >= LAMP_TOTAL) {
    useGame.setState((s) => ({ level: { ...s.level, nightStage: 'return' } }));
    useGame.getState().openDialogue(D().nightReady);
  }
}

function lightLantern(id: string) {
  const g = useGame.getState();
  if (g.level.lanterns.includes(id)) return;
  const post = LANTERN_POSTS.find((x) => x.id === id)!;
  useGame.setState((s) => ({ level: { ...s.level, lanterns: [...s.level.lanterns, id], lastProgressAt: performance.now() } }));
  const n = useGame.getState().level.lanterns.length;
  audio.sfx('magic', { volume: 0.7, pitch: 1 + n * 0.08 });
  spawnBurst(post.x, terrainHeight(post.x, post.z) + POST_H, post.z, '#ffd27a', 36, { speed: 2.6 });
  g.playEmote('collect');
  toast(tr().night.lantern, tr().night.lanternCount(n, LAMP_TOTAL), '☾');
  if (n === LAMP_TOTAL) g.unlockAchievement('night_light', ACHIEVEMENTS.night_light.title, ACHIEVEMENTS.night_light.icon);
  checkReady();
}

/** Lumi during the night party (called from ForestQuest's talkLumi). */
export function nightTalkLumi() {
  const g = useGame.getState();
  const l = g.level;
  if (l.nightStage === 'return') return nightFinale();
  if (l.nightStage === 'collect') g.openDialogue(D().nightLumi(l.fireflies.length, l.lanterns.length));
}

function nightFinale() {
  const g = useGame.getState();
  g.openDialogue(D().nightFinale, () => {
    useGame.setState((s) => ({ level: { ...s.level, nightStage: 'done' } }));
    const s = useGame.getState();
    audio.sfx('magic');
    s.playCinematic({ kind: 'finale', duration: 1600 });
    s.playEmote('celebrate', 3);
    const colors = ['#d6ff7a', '#fff3a0', '#ffd27a', '#a9e8ff', '#ffffff'];
    let n = 0;
    const iv = window.setInterval(() => {
      const a = Math.random() * Math.PI * 2;
      const r = 1 + Math.random() * 6;
      const x = FAIRY_POS.x + Math.cos(a) * r;
      const z = FAIRY_POS.z + Math.sin(a) * r;
      spawnBurst(x, terrainHeight(x, z) + 1 + Math.random() * 3, z, colors[n % colors.length], 26, { speed: 2.6, up: 2.5 });
      if (n % 3 === 0) audio.sfx('star', { pitch: 0.9 + Math.random() * 0.5, volume: 0.35 });
      if (++n > 30) window.clearInterval(iv);
    }, 170);
    window.setTimeout(() => {
      const st = useGame.getState();
      if (st.screen === 'playing' && st.worldId === WORLD_ID && st.night) st.completeWorld(WORLD_ID, st.level.coins.length);
    }, 6200);
  });
}

function Firefly({ i }: { i: number }) {
  const f = FIREFLY_SPOTS[i];
  const g = useRef<THREE.Group>(null!);
  const caught = useGame((s) => s.level.fireflies.includes(f.id));
  const glow = useMemo(() => glowTexture(), []);
  const gy = terrainHeight(f.x, f.z);
  useFrame(({ clock }) => {
    if (caught) return;
    const t = clock.elapsedTime + i * 1.7;
    const x = f.x + Math.sin(t * 0.7) * 0.7;
    const z = f.z + Math.cos(t * 0.9) * 0.7;
    const y = gy + 1.1 + Math.sin(t * 1.6) * 0.35;
    g.current.position.set(x, y, z);
    g.current.scale.setScalar(0.85 + Math.sin(t * 5) * 0.25);
    const st = useGame.getState();
    if (st.screen !== 'playing' || st.dialogue || st.cinematic || st.level.nightStage !== 'collect') return;
    const p = player.position;
    if (Math.hypot(p.x - x, p.z - z) < 1.0 && Math.abs(p.y + 0.8 - y) < 1.4) {
      useGame.setState((s) => ({ level: { ...s.level, fireflies: [...s.level.fireflies, f.id], lastProgressAt: performance.now() } }));
      const n = useGame.getState().level.fireflies.length;
      audio.sfx('coin', { pitch: 1.3 + (n % 5) * 0.06, volume: 0.8 });
      spawnBurst(x, y, z, '#d6ff7a', 18, { speed: 1.6, up: 1.2, life: 0.7 });
      toast(tr().night.firefly, tr().night.fireflyCount(n, FF_TOTAL), '✦');
      checkReady();
    }
  });
  if (caught) return null;
  return (
    <group ref={g} position={[f.x, gy + 1.1, f.z]}>
      <mesh>
        <sphereGeometry args={[0.06, 10, 8]} />
        <meshBasicMaterial color="#efffb0" toneMapped={false} />
      </mesh>
      <sprite scale={1.1}>
        <spriteMaterial map={glow} color="#d6ff7a" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/** Lantern posts beside the paths: dark by day and until lit at night. */
export function LanternPosts() {
  const night = useGame((s) => s.night);
  const lit = useGame((s) => s.level.lanterns);
  const glow = useMemo(() => glowTexture(), []);
  return (
    <>
      {LANTERN_POSTS.map((l) => {
        const on = night && lit.includes(l.id);
        const y = terrainHeight(l.x, l.z);
        return (
          <group key={l.id} position={[l.x, y, l.z]}>
            <mesh position={[0, POST_H / 2, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.07, POST_H, 8]} />
              <meshStandardMaterial color="#5a3d28" roughness={0.9} />
            </mesh>
            <mesh position={[0.18, POST_H - 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.36, 6]} />
              <meshStandardMaterial color="#5a3d28" />
            </mesh>
            <group position={[0.34, POST_H - 0.32, 0]}>
              <mesh position={[0, 0.2, 0]}>
                <coneGeometry args={[0.16, 0.12, 6]} />
                <meshStandardMaterial color="#3b2a1e" />
              </mesh>
              <mesh>
                <cylinderGeometry args={[0.12, 0.12, 0.26, 6]} />
                <meshStandardMaterial color={on ? '#ffe7a0' : '#d9d2c2'} emissive={on ? '#ffb53c' : '#000000'} emissiveIntensity={on ? 2.2 : 0} transparent opacity={0.9} toneMapped={!on} />
              </mesh>
              {on && (
                <sprite scale={2.6}>
                  <spriteMaterial map={glow} color="#ffcf73" transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} />
                </sprite>
              )}
            </group>
          </group>
        );
      })}
    </>
  );
}

export function NightQuest() {
  const started = useRef(false);
  const ending = useRef(false);
  useEffect(() => {
    const offs = LANTERN_POSTS.map((l) =>
      registerInteractable({
        id: l.id,
        x: l.x,
        z: l.z,
        radius: 1.8,
        approach: 0.8,
        label: () => tr().night.lightLantern,
        verb: 'touch',
        enabled: () => useGame.getState().night && !useGame.getState().level.lanterns.includes(l.id),
        onInteract: () => lightLantern(l.id),
      }),
    );
    return () => offs.forEach((f) => f());
  }, []);

  useFrame(() => {
    const g = useGame.getState();
    if (g.screen !== 'playing' || g.paused || g.dialogue || g.cinematic) return;
    if (!started.current) {
      started.current = true;
      g.openDialogue(D().nightIntro);
      return;
    }
    // walking up to Lumi with everything done starts the finale
    if (!ending.current && g.level.nightStage === 'return' && Math.hypot(player.position.x - FAIRY_POS.x, player.position.z - FAIRY_POS.z) < 3.3) {
      ending.current = true;
      player.lookAt = { x: FAIRY_POS.x, z: FAIRY_POS.z };
      nightFinale();
    }
  });

  return (
    <>
      {FIREFLY_SPOTS.map((_, i) => (
        <Firefly key={i} i={i} />
      ))}
      <NightFinaleGlow />
    </>
  );
}

/** Once the party starts, hundreds of freed fireflies float around the glade. */
function NightFinaleGlow() {
  const done = useGame((s) => s.level.nightStage === 'done');
  if (!done) return null;
  return <Sparkles count={260} scale={[20, 7, 20]} position={[FAIRY_POS.x, 2.5, FAIRY_POS.z]} size={7} speed={0.5} color="#d6ff7a" />;
}
