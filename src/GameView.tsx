/**
 * Everything that needs the 3D engine: the WebGL canvas, the worlds, post-processing and the
 * in-game UI (HUD, dialogue, touch controls, pause, level complete).
 * Loaded on demand when a world starts, so the main menu stays tiny and fast.
 */
import { Suspense, lazy, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from './systems/store';
import { MenuScene } from './components/worlds/MenuScene/MenuScene';
import { HUD } from './components/ui/HUD';
import { DialogueBox } from './components/ui/DialogueBox';
import { TouchControls, useIsTouch } from './components/ui/TouchControls';
import { PauseMenu } from './components/ui/Menus';
import { LevelComplete } from './components/ui/LevelComplete';
import { ControlsCard } from './components/ui/ControlsCard';
import { cameraState, player } from './systems/playerState';
import { input } from './systems/input';
import { groundHeightAt } from './systems/physics';
import { audio } from './components/audio/audioEngine';
import { preloadAnettHD } from './components/characters/Anett/AnettHD';

// start downloading the sculpted Anet model as soon as the 3D engine loads
preloadAnettHD();
// and Anet's dialogue avatar, so the first speech bubble shows it right away
if (typeof Image !== 'undefined') new Image().src = `${import.meta.env.BASE_URL}portraits/anet.webp`;

/** `?capture` keeps the drawing buffer so automated screenshots never catch an empty frame. */
const CAPTURE = typeof location !== 'undefined' && new URLSearchParams(location.search).has('capture');

const EnchantedForest = lazy(() => import('./components/worlds/EnchantedForest/EnchantedForest').then((m) => ({ default: m.EnchantedForest })));
const CandyVillage = lazy(() => import('./components/worlds/CandyVillage/CandyVillage').then((m) => ({ default: m.CandyVillage })));
const PostFX = lazy(() => import('./components/effects/PostFX'));

/** Bloom etc. start a moment after the first frame so the world appears immediately. */
function DeferredPostFX({ quality, inWorld }: { quality: 'high' | 'low'; inWorld: boolean }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 900);
    return () => window.clearTimeout(id);
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <PostFX quality={quality} ao={inWorld} />
    </Suspense>
  );
}

export default function GameView({ review = false }: { review?: boolean }) {
  const screen = useGame((s) => s.screen);
  const runId = useGame((s) => s.runId);
  const overlay = useGame((s) => s.overlay);
  const paused = useGame((s) => s.paused);
  const quality = useGame((s) => s.save.settings.quality);
  const dialogue = useGame((s) => s.dialogue);
  const cinematic = useGame((s) => s.cinematic);
  const isTouch = useIsTouch();
  const worldId = useGame((s) => s.worldId);
  const inWorld = screen === 'playing' || screen === 'complete';
  const playing = screen === 'playing';

  // debug / automated-test hook
  useEffect(() => {
    const w = window as unknown as { __anett: Record<string, unknown> };
    w.__anett = { ...(w.__anett ?? {}), useGame, player, input, groundHeightAt, cameraState, audio };
  }, []);

  return (
    <>
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={quality === 'high' ? [1, 1.75] : [0.75, 1.25]}
        gl={{ antialias: quality === 'low', powerPreference: 'high-performance', preserveDrawingBuffer: CAPTURE }}
        camera={{ fov: 55, near: 0.1, far: 900, position: [0, 3, 8] }}
        style={{ position: 'fixed', inset: 0 }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          (window as unknown as { __anettScene: unknown }).__anettScene = { scene, gl };
        }}
      >
        <Suspense fallback={null}>
          {review ? <MenuScene /> : inWorld ? worldId === 'candy-village' ? <CandyVillage key={runId} /> : <EnchantedForest key={runId} /> : null}
          <DeferredPostFX quality={quality} inWorld={inWorld} />
        </Suspense>
      </Canvas>

      {!review && (
        <div className="ui-layer passthrough">
          <div className="passthrough" style={{ position: 'absolute', inset: 0 }}>
            {playing && <HUD />}
            {playing && <DialogueBox />}
            {playing && !dialogue && !paused && (!cinematic || cinematic.kind === 'finale') && <ControlsCard isTouch={isTouch} />}
            {playing && isTouch && !dialogue && (!cinematic || cinematic.kind === 'finale') && !paused && <TouchControls />}
            {screen === 'complete' && <LevelComplete />}
            {paused && playing && !overlay && <PauseMenu />}
          </div>
        </div>
      )}
    </>
  );
}
