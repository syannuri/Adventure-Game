import { Suspense, lazy, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from './systems/store';
import { installKeyboard, resetEdges } from './systems/input';
import { MenuScene, REVIEW_VIEW } from './components/worlds/MenuScene/MenuScene';
import { HUD } from './components/ui/HUD';
import { DialogueBox } from './components/ui/DialogueBox';
import { TouchControls, useIsTouch } from './components/ui/TouchControls';
import { AboutAnett, MainMenu, PauseMenu, SettingsPanel, WorldSelect } from './components/ui/Menus';
import { StoryIntro } from './components/ui/StoryIntro';
import { LevelComplete } from './components/ui/LevelComplete';
import { ControlsCard } from './components/ui/ControlsCard';
import { audio } from './components/audio/audioEngine';
import { DICTS } from './i18n';
import { cameraState, player } from './systems/playerState';
import { input } from './systems/input';
import { groundHeightAt } from './systems/physics';

/** `?capture` keeps the drawing buffer so automated screenshots never catch an empty frame. */
const CAPTURE = typeof location !== 'undefined' && new URLSearchParams(location.search).has('capture');

// Loaded on demand: the menu shows first, the forest and post-processing download in the background.
const loadForest = () => import('./components/worlds/EnchantedForest/EnchantedForest').then((m) => ({ default: m.EnchantedForest }));
const EnchantedForest = lazy(loadForest);
const PostFX = lazy(() => import('./components/effects/PostFX'));

function Scene() {
  const screen = useGame((s) => s.screen);
  const runId = useGame((s) => s.runId);
  const inWorld = screen === 'playing' || screen === 'complete';
  return inWorld ? <EnchantedForest key={runId} /> : <MenuScene />;
}

/** Bloom etc. start a moment after the first frame so the menu appears immediately. */
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

export default function App() {
  const screen = useGame((s) => s.screen);
  const overlay = useGame((s) => s.overlay);
  const paused = useGame((s) => s.paused);
  const quality = useGame((s) => s.save.settings.quality);
  const setOverlay = useGame((s) => s.setOverlay);
  const isTouch = useIsTouch();
  const dialogue = useGame((s) => s.dialogue);
  const cinematic = useGame((s) => s.cinematic);

  useEffect(() => {
    // hide the instant HTML splash, then fetch the forest quietly in the background
    document.getElementById('splash')?.classList.add('gone');
    window.setTimeout(() => document.getElementById('splash')?.remove(), 600);
    const idle = window.setTimeout(() => void loadForest(), 2500);
    installKeyboard();
    const s = useGame.getState().save.settings;
    audio.setVolumes(s.musicVolume, s.sfxVolume);
    // browsers only allow audio after a user gesture
    const unlock = () => {
      audio.unlock();
      const st = useGame.getState().screen;
      if (st === 'menu' || st === 'worlds' || st === 'story') audio.playMusic('menu');
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    const onKey = (e: KeyboardEvent) => {
      const g = useGame.getState();
      if ((e.code === 'Escape' || e.code === 'KeyP') && g.screen === 'playing' && !g.paused && !g.overlay) g.setPaused(true);
    };
    window.addEventListener('keydown', onKey);
    const onVis = () => {
      const g = useGame.getState();
      if (document.hidden && g.screen === 'playing') g.setPaused(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearTimeout(idle);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    resetEdges();
  }, [screen]);

  const language = useGame((s) => s.save.settings.language);
  useEffect(() => {
    document.title = DICTS[language]?.title ?? DICTS.id.title;
    document.documentElement.lang = language;
  }, [language]);

  // expose a tiny debug/test hook (used by automated browser tests)
  useEffect(() => {
    (window as unknown as { __anett: unknown }).__anett = { useGame, player, input, groundHeightAt, cameraState };
  }, []);

  const playing = screen === 'playing';
  return (
    <>
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={screen === 'playing' || screen === 'complete' ? (quality === 'high' ? [1, 1.75] : [0.75, 1.25]) : [0.75, 1.5]}
        gl={{ antialias: quality === 'low', powerPreference: 'high-performance', preserveDrawingBuffer: CAPTURE }}
        camera={{ fov: 55, near: 0.1, far: 900, position: [0, 3, 8] }}
        style={{ position: 'fixed', inset: 0 }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          (window as unknown as { __anettScene: unknown }).__anettScene = { scene, gl };
        }}
      >
        <Suspense fallback={null}>
          <Scene />
          <DeferredPostFX quality={quality} inWorld={screen === 'playing' || screen === 'complete'} />
        </Suspense>
      </Canvas>

      <div className="ui-layer passthrough">
        <div className="passthrough" style={{ position: 'absolute', inset: 0 }}>
          {screen === 'menu' && !REVIEW_VIEW && <MainMenu />}
          {screen === 'worlds' && <WorldSelect />}
          {screen === 'story' && <StoryIntro />}
          {playing && <HUD />}
          {playing && <DialogueBox />}
          {playing && !dialogue && !paused && (!cinematic || cinematic.kind === 'finale') && <ControlsCard isTouch={isTouch} />}
          {playing && isTouch && !dialogue && (!cinematic || cinematic.kind === 'finale') && !paused && <TouchControls />}
          {screen === 'complete' && <LevelComplete />}
          {paused && playing && !overlay && <PauseMenu />}
          {overlay === 'settings' && <SettingsPanel onClose={() => setOverlay(null)} />}
          {overlay === 'about' && <AboutAnett onClose={() => setOverlay(null)} />}
        </div>
      </div>
    </>
  );
}
