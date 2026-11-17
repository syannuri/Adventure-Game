import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from './systems/store';
import { installKeyboard, resetEdges } from './systems/input';
import { EnchantedForest } from './components/worlds/EnchantedForest/EnchantedForest';
import { MenuScene, REVIEW_VIEW } from './components/worlds/MenuScene/MenuScene';
import { PostFX } from './components/effects/PostFX';
import { HUD } from './components/ui/HUD';
import { DialogueBox } from './components/ui/DialogueBox';
import { TouchControls, useIsTouch } from './components/ui/TouchControls';
import { AboutAnett, MainMenu, PauseMenu, SettingsPanel, WorldSelect } from './components/ui/Menus';
import { StoryIntro } from './components/ui/StoryIntro';
import { LevelComplete } from './components/ui/LevelComplete';
import { audio } from './components/audio/audioEngine';
import { player } from './systems/playerState';
import { input } from './systems/input';
import { groundHeightAt } from './systems/physics';

/** `?capture` keeps the drawing buffer so automated screenshots never catch an empty frame. */
const CAPTURE = typeof location !== 'undefined' && new URLSearchParams(location.search).has('capture');

function Scene() {
  const screen = useGame((s) => s.screen);
  const runId = useGame((s) => s.runId);
  const inWorld = screen === 'playing' || screen === 'complete';
  return inWorld ? <EnchantedForest key={runId} /> : <MenuScene />;
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
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    resetEdges();
  }, [screen]);

  // expose a tiny debug/test hook (used by automated browser tests)
  useEffect(() => {
    (window as unknown as { __anett: unknown }).__anett = { useGame, player, input, groundHeightAt };
  }, []);

  const playing = screen === 'playing';
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
          <Scene />
          <PostFX quality={quality} />
        </Suspense>
      </Canvas>

      <div className="ui-layer passthrough">
        <div className="passthrough" style={{ position: 'absolute', inset: 0 }}>
          {screen === 'menu' && !REVIEW_VIEW && <MainMenu />}
          {screen === 'worlds' && <WorldSelect />}
          {screen === 'story' && <StoryIntro />}
          {playing && <HUD />}
          {playing && <DialogueBox />}
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
