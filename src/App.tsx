/**
 * App shell. The menus and the painted menu backdrop are plain HTML/SVG (instant, light on phones).
 * The 3D engine (GameView) is only downloaded and started when a world begins.
 */
import { Suspense, lazy, useEffect } from 'react';
import { useGame } from './systems/store';
import { installKeyboard, resetEdges } from './systems/input';
import { AboutAnett, MainMenu, SettingsPanel, WorldSelect } from './components/ui/Menus';
import { StoryIntro } from './components/ui/StoryIntro';
import { MenuBackdrop } from './components/ui/MenuBackdrop';
import { ShopPanel } from './components/ui/ShopPanel';
import { audio } from './components/audio/audioEngine';
import { DICTS } from './i18n';

/** Character review mode (?view=face|front|side|back) renders the 3D model instead of the menus. */
const REVIEW = typeof location !== 'undefined' && new URLSearchParams(location.search).has('view');

const loadGame = () => import('./GameView');
const GameView = lazy(loadGame);

function Loading() {
  const lang = useGame((s) => s.save.settings.language);
  return (
    <div className="loading">
      <div style={{ textAlign: 'center' }}>
        <div className="loading-star">★</div>
        {DICTS[lang]?.hud.loading ?? DICTS.id.hud.loading}
      </div>
    </div>
  );
}

export default function App() {
  const screen = useGame((s) => s.screen);
  const overlay = useGame((s) => s.overlay);
  const setOverlay = useGame((s) => s.setOverlay);
  const inWorld = screen === 'playing' || screen === 'complete';

  useEffect(() => {
    // hide the instant HTML splash
    document.getElementById('splash')?.classList.add('gone');
    window.setTimeout(() => document.getElementById('splash')?.remove(), 600);
    installKeyboard();
    const s = useGame.getState().save.settings;
    audio.setVolumes(s.musicVolume, s.sfxVolume);
    // browsers only allow audio after a user gesture
    const unlock = () => {
      audio.unlock();
      const st = useGame.getState().screen;
      if (st === 'menu' || st === 'worlds' || st === 'story') audio.playMusic('menu');
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    // every menu button gives a little sound the moment it is touched (in-game touch controls have their own)
    const press = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('.btn, .world-card, .lang-switch button, .icon-btn, .help-btn, .toggle button, .home-play, .home-pill');
      if (!el || (el as HTMLButtonElement).disabled) return;
      audio.unlock();
      if (el.classList.contains('locked')) return audio.sfx('pop', { pitch: 0.7 });
      audio.sfx(el.classList.contains('big') || el.classList.contains('home-play') ? 'tapPlay' : 'tap', { pitch: 0.94 + Math.random() * 0.12 });
    };
    window.addEventListener('pointerdown', press, { passive: true });
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
      window.removeEventListener('pointerdown', press);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    resetEdges();
    // start fetching the 3D engine as soon as the player heads toward a world
    if (screen !== 'menu') void loadGame();
  }, [screen]);

  const language = useGame((s) => s.save.settings.language);
  useEffect(() => {
    document.title = DICTS[language]?.title ?? DICTS.id.title;
    document.documentElement.lang = language;
  }, [language]);

  // tiny debug / automated-test hook (GameView adds the 3D bits when it loads)
  useEffect(() => {
    const w = window as unknown as { __anett: Record<string, unknown> };
    w.__anett = { ...(w.__anett ?? {}), useGame };
  }, []);

  if (REVIEW)
    return (
      <Suspense fallback={null}>
        <GameView review />
      </Suspense>
    );

  return (
    <>
      {!inWorld && <MenuBackdrop screen={screen} />}
      {inWorld && (
        <Suspense fallback={<Loading />}>
          <GameView />
        </Suspense>
      )}

      <div className="ui-layer passthrough">
        <div className="passthrough" style={{ position: 'absolute', inset: 0 }}>
          {screen === 'menu' && <MainMenu />}
          {screen === 'worlds' && <WorldSelect />}
          {screen === 'story' && <StoryIntro />}
          {overlay === 'settings' && <SettingsPanel onClose={() => setOverlay(null)} />}
          {overlay === 'about' && <AboutAnett onClose={() => setOverlay(null)} />}
          {overlay === 'shop' && (
            <ShopPanel
              onClose={() => {
                setOverlay(null);
                useGame.getState().setPaused(false);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
