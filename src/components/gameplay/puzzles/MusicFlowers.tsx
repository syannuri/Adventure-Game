/**
 * Lumi's singing flowers (World 1 memory game).
 *
 * Five giant flowers stand in a ring around a magic bud, each singing its own note (C D E G A).
 * Touch the bud: the flowers light up and sing a little song. Then step on the flowers in the
 * same order. Songs grow from 3 to 4 to 5 notes. A wrong flower is never a failure: Anet says
 * "let me listen again" and the song plays once more. Stepping on the flowers at any other time
 * just plays their notes, like a giant piano.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { registerInteractable } from '../interaction/interactions';
import { MUSIC, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { forestDialogue as D } from '../../../data/forestDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { tr } from '../../../i18n';
import { damp } from '../../../utils/math';
import { rewardAcorns } from '../shop/KikiShopQuest';

const COLORS = ['#ff5a6e', '#ffa94d', '#ffd23f', '#6fd36b', '#4aa8ff'];
const SEMITONES = [0, 2, 4, 7, 9]; // C D E G A: a pentatonic scale, every order sounds nice
const ROUNDS = [3, 4, 5];
const STEP_R = 0.78;
const NOTE_GAP = 0.75; // seconds between notes while the flowers sing

/** Flowers on a ring, the first one facing Lumi's glade. */
export const MUSIC_FLOWERS = COLORS.map((c, i) => {
  const a = Math.PI / 2 + (i / COLORS.length) * Math.PI * 2;
  return { color: c, x: MUSIC.x + Math.cos(a) * MUSIC.r, z: MUSIC.z + Math.sin(a) * MUSIC.r };
});

type Phase = 'idle' | 'playing' | 'input' | 'between' | 'won';

/** Game state shared with the HUD (kept outside React: it changes every note). */
export const music = {
  phase: 'idle' as Phase,
  round: 0,
  seq: [] as number[],
  pos: 0,
  playIndex: 0,
  nextAt: 0,
  /** time each flower last sang (drives the glow) */
  litAt: COLORS.map(() => -10),
  inside: -1,
  seen: false,
};

// automated tests read the game state from here
if (typeof window !== 'undefined') (window as unknown as { __anettMusic: typeof music }).__anettMusic = music;

function newSequence() {
  const out: number[] = [];
  while (out.length < 5) {
    const n = Math.floor(Math.random() * 5);
    if (n !== out[out.length - 1]) out.push(n);
  }
  return out;
}

/** HUD line while a game is running. */
export function musicStatus() {
  if (music.phase === 'idle' || music.phase === 'won') return null;
  return '🎵 ' + tr().hud.music(music.round + 1, music.phase === 'input');
}

function sing(i: number, t: number, volume = 1) {
  music.litAt[i] = t;
  audio.sfx('note', { pitch: Math.pow(2, SEMITONES[i] / 12), volume });
}

function startGame(t: number) {
  if (music.phase === 'playing' || music.phase === 'between') return;
  if (music.phase === 'idle' || music.phase === 'won') {
    music.seq = newSequence();
    music.round = 0;
  }
  music.phase = 'playing';
  music.playIndex = 0;
  music.nextAt = t + 0.5;
  useGame.setState((s) => ({ level: { ...s.level, lastProgressAt: performance.now() } }));
}

export function MusicFlowers() {
  const clock = useRef(0);
  useEffect(() => {
    // fresh game every time the forest loads
    Object.assign(music, { phase: 'idle', round: 0, seq: [], pos: 0, playIndex: 0, nextAt: 0, inside: -1, seen: false });
    music.litAt = COLORS.map(() => -10);
    return registerInteractable({
      id: 'music-bud',
      x: MUSIC.x,
      z: MUSIC.z,
      radius: 1.5,
      approach: 0.9,
      label: () => tr().prompts.listenFlowers,
      verb: 'touch',
      enabled: () => music.phase !== 'playing' && music.phase !== 'between',
      onInteract: () => startGame(clock.current),
    });
  }, []);

  useFrame(({ clock: c }) => {
    const t = c.elapsedTime;
    clock.current = t;
    const g = useGame.getState();
    if (g.screen !== 'playing') return;
    const busy = g.paused || !!g.dialogue || !!g.cinematic;

    // first visit: Anet explains the game
    if (!music.seen && !busy && Math.hypot(player.position.x - MUSIC.x, player.position.z - MUSIC.z) < 6.5) {
      music.seen = true;
      g.openDialogue(D().musicFound);
      return;
    }

    // the flowers sing the song
    if (music.phase === 'playing' && !busy && t >= music.nextAt) {
      const len = ROUNDS[music.round];
      if (music.playIndex < len) {
        sing(music.seq[music.playIndex], t);
        music.playIndex++;
        music.nextAt = t + NOTE_GAP;
      } else {
        music.phase = 'input';
        music.pos = 0;
      }
    }
    if (music.phase === 'between' && t >= music.nextAt) {
      music.phase = 'playing';
      music.playIndex = 0;
      music.nextAt = t + 0.3;
    }

    // stepping onto a flower
    let on = -1;
    MUSIC_FLOWERS.forEach((f, i) => {
      if (Math.hypot(player.position.x - f.x, player.position.z - f.z) < STEP_R && player.grounded) on = i;
    });
    if (on !== music.inside) {
      music.inside = on;
      if (on >= 0 && !busy && music.phase !== 'playing' && music.phase !== 'between') {
        sing(on, t);
        const f = MUSIC_FLOWERS[on];
        spawnBurst(f.x, terrainHeight(f.x, f.z) + 1.0, f.z, f.color, 10, { speed: 1.4, up: 1.2, life: 0.7 });
        if (music.phase === 'input') {
          if (on === music.seq[music.pos]) {
            music.pos++;
            if (music.pos === ROUNDS[music.round]) {
              // song complete
              audio.sfx('star', { volume: 0.7 });
              spawnBurst(MUSIC.x, terrainHeight(MUSIC.x, MUSIC.z) + 1.6, MUSIC.z, '#fff3a0', 40, { speed: 3 });
              const done = music.round + 1;
              useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now(), title: tr().toasts.song, text: tr().toasts.songCount(done), icon: '♫' }], level: { ...s.level, lastProgressAt: performance.now() } }));
              const id = useGame.getState().toasts.at(-1)!.id;
              window.setTimeout(() => useGame.getState().dismissToast(id), 2600);
              if (done === ROUNDS.length) {
                music.phase = 'won';
                g.playEmote('dance', 2.6);
                g.unlockAchievement('flower_singer', ACHIEVEMENTS.flower_singer.title, ACHIEVEMENTS.flower_singer.icon);
                window.setTimeout(() => rewardAcorns(5), 1200);
                // the flowers play a happy run up and down
                [0, 1, 2, 3, 4, 3, 2, 4].forEach((n, k) => window.setTimeout(() => sing(n, clock.current, 0.8), 500 + k * 160));
                MUSIC_FLOWERS.forEach((ff) => spawnBurst(ff.x, terrainHeight(ff.x, ff.z) + 1.4, ff.z, ff.color, 24, { speed: 2.5 }));
                window.setTimeout(() => useGame.getState().openDialogue(D().musicWin), 2000);
              } else {
                g.playEmote('celebrate', 1.4);
                music.round++;
                music.phase = 'between';
                music.nextAt = t + 2.2;
              }
            }
          } else {
            // a different flower: no problem, listen once more
            audio.sfx('pop', { pitch: 0.55, volume: 0.6 });
            music.phase = 'between';
            music.nextAt = t + 2.4;
            window.setTimeout(() => useGame.getState().openDialogue(D().musicAgain), 300);
          }
        }
      }
    }
  });

  return (
    <group>
      {MUSIC_FLOWERS.map((_, i) => (
        <SingingFlower key={i} i={i} />
      ))}
      <MagicBud />
    </group>
  );
}

function SingingFlower({ i }: { i: number }) {
  const f = MUSIC_FLOWERS[i];
  const y = terrainHeight(f.x, f.z);
  const bloom = useRef<THREE.Group>(null!);
  const petal = useMemo(() => new THREE.MeshStandardMaterial({ color: f.color, emissive: f.color, emissiveIntensity: 0.2, roughness: 0.4, side: THREE.DoubleSide }), [f.color]);
  const pad = useMemo(() => new THREE.MeshBasicMaterial({ color: f.color, transparent: true, opacity: 0.35, depthWrite: false }), [f.color]);
  const facing = Math.atan2(MUSIC.x - f.x, MUSIC.z - f.z);
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const since = t - music.litAt[i];
    const glow = since < 0.6 ? 1 - since / 0.6 : 0;
    const want = music.phase === 'input';
    petal.emissiveIntensity += (0.2 + glow * 2.2 - petal.emissiveIntensity) * damp(14, dt);
    pad.opacity += ((want ? 0.55 + Math.sin(t * 4 + i) * 0.12 : 0.32) + glow * 0.45 - pad.opacity) * damp(10, dt);
    const s = 1 + glow * 0.35;
    bloom.current.scale.setScalar(s);
    bloom.current.rotation.z = Math.sin(t * 1.5 + i) * 0.06 + (glow ? Math.sin(t * 30) * 0.05 * glow : 0);
  });
  return (
    <group position={[f.x, y, f.z]} rotation={[0, facing, 0]}>
      {/* the stepping pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} material={pad}>
        <circleGeometry args={[STEP_R, 32]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[STEP_R - 0.06, STEP_R, 40]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} depthWrite={false} />
      </mesh>
      {/* stem and leaves, the bloom leans in toward the bud */}
      <mesh position={[0, 0.5, -0.04]} rotation={[-0.12, 0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.0, 8]} />
        <meshStandardMaterial color="#4c9a3e" />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0.16 * s, 0.35, 0]} rotation={[0, 0, -1.0 * s]} scale={[1, 0.3, 0.55]}>
          <sphereGeometry args={[0.2, 12, 8]} />
          <meshStandardMaterial color="#5fb04a" />
        </mesh>
      ))}
      <group ref={bloom} position={[0, 1.02, 0.08]} rotation={[0.35, 0, 0]}>
        {Array.from({ length: 6 }, (_, k) => {
          const a = (k / 6) * Math.PI * 2;
          return (
            <mesh key={k} material={petal} position={[Math.cos(a) * 0.16, 0.12, Math.sin(a) * 0.16]} rotation={[Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7]} scale={[0.9, 1.4, 0.35]}>
              <sphereGeometry args={[0.15, 14, 10]} />
            </mesh>
          );
        })}
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.1, 14, 10]} />
          <meshStandardMaterial color="#fff3b0" emissive="#ffe27a" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

function MagicBud() {
  const bud = useRef<THREE.Group>(null!);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e7d6ff', emissive: '#c9a7ff', emissiveIntensity: 0.6, roughness: 0.35 }), []);
  const y = terrainHeight(MUSIC.x, MUSIC.z);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const waiting = music.phase === 'idle' || music.phase === 'won' || music.phase === 'input';
    mat.emissiveIntensity = waiting ? 0.6 + Math.sin(t * 3) * 0.35 : 1.6;
    bud.current.rotation.y = t * 0.6;
    bud.current.position.y = 0.95 + Math.sin(t * 2) * 0.04;
  });
  return (
    <group position={[MUSIC.x, y, MUSIC.z]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 0.9, 8]} />
        <meshStandardMaterial color="#4c9a3e" />
      </mesh>
      <group ref={bud}>
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} material={mat} rotation={[0, (k / 4) * Math.PI * 2, 0.25]} position={[Math.cos((k / 4) * Math.PI * 2) * 0.05, 0.1, Math.sin((k / 4) * Math.PI * 2) * 0.05]} scale={[0.7, 1.5, 0.7]}>
            <sphereGeometry args={[0.13, 14, 10]} />
          </mesh>
        ))}
      </group>
      <Sparkles count={18} scale={[1.4, 1.4, 1.4]} position={[0, 1.2, 0]} size={4} speed={0.6} color="#e7d6ff" />
    </group>
  );
}
