import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../systems/store';
import { WORLDS } from '../../data/worlds';
import { ACHIEVEMENTS } from '../../data/achievements';
import { audio } from '../audio/audioEngine';
import { AnettPortrait } from './Portraits';
import { GameLogo } from './GameLogo';
import { WorldArt, WorldArtGroup } from './WorldArt';
import { sparkleBurst } from './sparkleBurst';
import { Icon } from './Icons';
import { useT } from '../../i18n/useT';
import { LANGS } from '../../i18n';

// the press sound is played globally on pointerdown (App.tsx); here we only make sure audio is unlocked
const click = () => {
  audio.unlock();
};

/**
 * Reliable tap for touch screens: fires on pointer-up (instant) and keeps click as a fallback,
 * guarded so the action runs only once. Avoids taps being swallowed on iPhone / iPad.
 */
let lastTap = 0; // shared: the click that follows a pointer-up (even after a re-render) is ignored
export function tapProps(action: () => void) {
  const run = () => {
    const now = performance.now();
    if (now - lastTap < 600) return;
    lastTap = now;
    action();
  };
  return {
    onPointerUp: (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse') run();
    },
    onClick: run,
  };
}

/** Small ID / EN switch shown on the main menu and in Settings. */
export function LanguageSwitch() {
  const lang = useGame((s) => s.save.settings.language);
  const update = useGame((s) => s.updateSettings);
  return (
    <div className="lang-switch" role="group" aria-label="Language / Bahasa">
      {LANGS.map((l) => (
        <button
          key={l.code}
          className={lang === l.code ? 'on' : ''}
          title={l.label}
          onClick={() => {
            click();
            update({ language: l.code });
          }}
        >
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/** The five worlds float in the sky above the meadow (landscape / portrait positions in % and vw). */
const ISLAND_SPOTS = {
  land: [
    [44, 46, 7.5],
    [52, 24, 8.5],
    [61, 50, 6.2],
    [40, 20, 6],
    [63, 13, 6.6],
  ],
  port: [
    [5, 31, 15],
    [74, 29, 16],
    [7, 47, 12],
    [78, 46, 12],
    [44, 23, 11],
  ],
} as const;

function WorldIsland({ i, onTap }: { i: number; onTap: (i: number, e: React.MouseEvent) => void }) {
  const w = WORLDS[i];
  const done = useGame((s) => s.save.completedWorlds.includes(w.id));
  const t = useT();
  const [show, setShow] = useState(false);
  const timer = useRef(0);
  return (
    <button
      className={'home-island ' + (w.built ? '' : 'locked ') + (show ? 'show' : '')}
      style={{ ['--i' as string]: i, animationDelay: `-${i * 0.9}s` }}
      aria-label={t.worlds[w.id]?.name ?? w.name}
      onClick={(e) => {
        setShow(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setShow(false), 1800);
        onTap(i, e);
      }}
    >
      <svg viewBox="0 0 120 120" aria-hidden>
        <path d="M8 78 Q60 102 112 78 L86 108 Q60 122 34 108Z" fill={w.colors[1]} opacity="0.85" />
        <path d="M30 98 L60 118 L90 98" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="3" />
        <ellipse cx="60" cy="78" rx="52" ry="13" fill={w.colors[0]} />
        <g transform="translate(18 12) scale(0.84)">
          <WorldArtGroup id={w.id} />
        </g>
      </svg>
      <span className="tag">
        {t.worlds[w.id]?.name ?? w.name} {done ? '✓' : w.built ? '' : '🔒'}
      </span>
    </button>
  );
}

function StarIcon({ on }: { on: boolean }) {
  return (
    <svg className={'home-star' + (on ? '' : ' off')} viewBox="0 0 24 24" aria-hidden>
      <path d="m12 2 3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6Z" fill="#ffc928" stroke="#c47f00" strokeWidth="1.2" />
    </svg>
  );
}

export function MainMenu() {
  const save = useGame((s) => s.save);
  const setScreen = useGame((s) => s.setScreen);
  const setOverlay = useGame((s) => s.setOverlay);
  const t = useT();
  // continue the adventure: the first built world that isn't finished yet
  const next = WORLDS.find((w) => w.built && !save.completedWorlds.includes(w.id));
  const target = next ?? WORLDS[0];
  const targetName = t.worlds[target.id]?.name ?? target.name;
  const portrait = typeof window !== 'undefined' && window.matchMedia?.('(orientation: portrait)').matches;
  const spots = portrait ? ISLAND_SPOTS.port : ISLAND_SPOTS.land;

  // gentle parallax: the sky layers follow the finger / mouse (drift on their own on touch screens)
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    let mx = 0;
    let my = 0;
    let manual = 0;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      manual = performance.now();
    };
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const auto = now - manual > 4000;
      const x = auto ? Math.sin(now / 4200) * 0.3 : mx;
      const y = auto ? Math.cos(now / 5300) * 0.2 : my;
      root.style.setProperty('--px', x.toFixed(3));
      root.style.setProperty('--py', y.toFixed(3));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    if (!reduce) raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      root.style.removeProperty('--px');
      root.style.removeProperty('--py');
    };
  }, []);

  const tapIsland = (i: number, e: React.MouseEvent) => {
    audio.unlock();
    audio.sfx(WORLDS[i].built ? 'star' : 'pop', { pitch: WORLDS[i].built ? 1.2 : 0.8, volume: 0.6 });
    sparkleBurst(e.clientX, e.clientY, ['#fff3a0', '#ffb3d1', '#c9a7ff']);
  };

  return (
    <div className="home">
      <div className="home-islands passthrough-children">
        {WORLDS.map((w, i) => (
          <div key={w.id} className="home-island-slot" style={{ left: `${spots[i][0]}%`, top: `${spots[i][1]}%`, width: `max(56px, ${spots[i][2]}vw)` }}>
            <WorldIsland i={i} onTap={tapIsland} />
          </div>
        ))}
      </div>

      <div className="home-top">
        <button className="icon-btn home-gear home-stickers" aria-label={t.stickerBook.open} onClick={() => (click(), setOverlay('stickers'))}>
          <Icon name="sparkle" size={22} />
          <span className="badge-n">{(save.stickers ?? []).length}</span>
        </button>
        <button className="icon-btn home-gear" aria-label={t.menu.settings} onClick={() => (click(), setOverlay('settings'))}>
          <Icon name="gear" size={22} />
        </button>
        <LanguageSwitch />
      </div>

      <div className="home-col">
        <GameLogo />
        <div className="home-lower">
          <div className="home-next">
            <div className="thumb" style={{ background: `linear-gradient(160deg, ${target.colors[0]}, ${target.colors[1]})` }}>
              <WorldArt id={target.id} size={60} />
            </div>
            <div className="info">
              <small>{next ? t.menu.next : t.menu.again}</small>
              <b>{t.menu.worldN(target.index, targetName)}</b>
              <div className="meter" aria-hidden>
                <i style={{ width: `${Math.max(6, (save.magicStars / 5) * 100)}%` }} />
              </div>
              <span className="meta">{t.worlds[target.id]?.mission ?? target.mission}</span>
            </div>
          </div>

          <button
            className="home-play"
            {...tapProps(() => {
              click();
              const g = useGame.getState();
              if (g.screen !== 'menu') return;
              if (!g.save.seenIntro) g.setScreen('story');
              else g.startWorld(target.id);
            })}
          >
            <span className="ring" />
            <Icon name="play" size={32} />
            {t.menu.play}
          </button>

          <div className="home-row">
            <button className="home-pill" onClick={() => (click(), setScreen('worlds'))}>
              <span className="ic" style={{ background: '#3fb7a7' }}>
                <Icon name="map" size={20} />
              </span>
              {t.menu.worlds}
            </button>
            <button className="home-pill" onClick={() => (click(), setOverlay('about'))}>
              <span className="ic" style={{ background: '#ff6fae' }}>
                <Icon name="heart" size={20} />
              </span>
              {t.menu.meet}
            </button>
            <button className="home-pill" onClick={() => (click(), setScreen('story'))}>
              <span className="ic" style={{ background: '#7b5cff' }}>
                <Icon name="book" size={20} />
              </span>
              {t.menu.story}
            </button>
          </div>

          <div className="home-stars" aria-label={t.menu.starsOf(save.magicStars)}>
            {[0, 1, 2, 3, 4].map((k) => (
              <StarIcon key={k} on={k < save.magicStars} />
            ))}
            <span>{t.menu.starsOf(save.magicStars)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorldSelect() {
  const save = useGame((s) => s.save);
  const setScreen = useGame((s) => s.setScreen);
  const startWorld = useGame((s) => s.startWorld);
  const t = useT();
  return (
    <div className="worlds">
      <h1>{t.worldsScreen.title}</h1>
      <div className="star-badge">
        <span className="s">★</span> {t.worldsScreen.collectAll(save.magicStars)}
      </div>
      <div className="world-grid">
        {WORLDS.map((w) => {
          const done = save.completedWorlds.includes(w.id);
          const txt = t.worlds[w.id] ?? { name: w.name, mission: w.mission };
          return (
            <div
              key={w.id}
              className={'world-card' + (w.built ? '' : ' locked')}
              style={{ background: `linear-gradient(160deg, ${w.colors[0]}, ${w.colors[1]})` }}
              onClick={() => {
                if (!w.built) return;
                click();
                startWorld(w.id);
              }}
            >
              <span className="num">
                {t.worldsScreen.world} {w.index}
              </span>
              {done && <span className="done">★</span>}
              <div className="art passthrough">
                <WorldArt id={w.id} size={96} />
              </div>
              <h3>{txt.name}</h3>
              <p>{txt.mission}</p>
              {!w.built && <span className="lock">{t.worldsScreen.comingSoon}</span>}
              {w.built && <span className="lock">{done ? t.worldsScreen.playAgain : t.worldsScreen.play}</span>}
            </div>
          );
        })}
      </div>
      <button className="btn ghost" onClick={() => (click(), setScreen('menu'))}>
        <Icon name="back" size={20} />
        {t.worldsScreen.back}
      </button>
    </div>
  );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const settings = useGame((s) => s.save.settings);
  const update = useGame((s) => s.updateSettings);
  const reset = useGame((s) => s.resetProgress);
  const t = useT();
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div className="modal-bg" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal panel">
        <h2>{t.settings.title}</h2>
        <div className="setting">
          <label>{t.settings.language}</label>
          <div className="toggle">
            {LANGS.map((l) => (
              <button key={l.code} className={settings.language === l.code ? 'on' : ''} onClick={() => update({ language: l.code })}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="setting">
          <label>{t.settings.music}</label>
          <input type="range" min={0} max={1} step={0.05} value={settings.musicVolume} onChange={(e) => update({ musicVolume: Number(e.target.value) })} />
        </div>
        <div className="setting">
          <label>{t.settings.sounds}</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.sfxVolume}
            onChange={(e) => update({ sfxVolume: Number(e.target.value) })}
            onPointerUp={() => audio.sfx('coin')}
          />
        </div>
        <div className="setting">
          <label>{t.settings.graphics}</label>
          <div className="toggle">
            <button className={settings.quality === 'high' ? 'on' : ''} onClick={() => update({ quality: 'high' })}>
              {t.settings.beautiful}
            </button>
            <button className={settings.quality === 'low' ? 'on' : ''} onClick={() => update({ quality: 'low' })}>
              {t.settings.fast}
            </button>
          </div>
        </div>
        <p className="settings-controls" style={{ fontSize: 16 }}>{t.settings.controls}</p>
        <div className="menu-row" style={{ marginTop: 14 }}>
          <button className="btn" onClick={() => (click(), onClose())}>
            {t.settings.done}
          </button>
          <button
            className="btn ghost"
            style={{ fontSize: 16 }}
            onClick={() => {
              // in-page two-step confirmation (browser confirm dialogs are blocked in embedded viewers)
              if (!confirmReset) return setConfirmReset(true);
              reset();
              setConfirmReset(false);
            }}
          >
            {confirmReset ? t.settings.resetConfirm : t.settings.reset}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AboutAnett({ onClose }: { onClose: () => void }) {
  const achievements = useGame((s) => s.save.achievements);
  const t = useT();
  return (
    <div className="modal-bg" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal panel about-modal">
        <div className="about-portrait" style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 8px', border: '5px solid white', boxShadow: 'var(--shadow)' }}>
          <AnettPortrait />
        </div>
        <h2>{t.about.hi}</h2>
        <p>{t.about.p1}</p>
        <p>
          <b>{t.about.loveLabel}</b> {t.about.love}
        </p>
        <h3 style={{ margin: '14px 0 6px', color: 'var(--purple-dark)' }}>{t.about.badges}</h3>
        <div className="ach-list">
          {Object.values(ACHIEVEMENTS).map((a) => (
            <div key={a.id} className="ach" style={{ opacity: achievements.includes(a.id) ? 1 : 0.4 }} title={t.achievements[a.id]?.description ?? a.description}>
              <i>{a.icon}</i>
              {t.achievements[a.id]?.title ?? a.title}
            </div>
          ))}
        </div>
        <button className="btn" onClick={() => (click(), onClose())}>
          {t.about.go}
        </button>
      </div>
    </div>
  );
}

export function PauseMenu() {
  const setPaused = useGame((s) => s.setPaused);
  const setScreen = useGame((s) => s.setScreen);
  const startWorld = useGame((s) => s.startWorld);
  const worldId = useGame((s) => s.worldId);
  const setOverlay = useGame((s) => s.setOverlay);
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') setPaused(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPaused]);
  return (
    <div className="modal-bg">
      <div className="modal panel">
        <h2>{t.pause.title}</h2>
        <p>{t.pause.waiting}</p>
        <div className="menu-buttons" style={{ marginTop: 16 }}>
          <button className="btn big yellow" {...tapProps(() => (click(), setPaused(false)))}>
            <Icon name="play" size={26} />
            {t.pause.keep}
          </button>
          <div className="menu-row">
            <button className="btn ghost" onClick={() => (click(), setOverlay('settings'))}>
              <Icon name="gear" size={18} />
              {t.pause.settings}
            </button>
            <button className="btn ghost" onClick={() => (click(), setOverlay('stickers'))}>
              <Icon name="sparkle" size={18} />
              {t.stickerBook.open}
            </button>
            <button className="btn teal" onClick={() => (click(), worldId && startWorld(worldId))}>
              <Icon name="restart" size={18} />
              {t.pause.restart}
            </button>
            <button className="btn pink" onClick={() => (click(), setScreen('menu'))}>
              <Icon name="home" size={18} />
              {t.pause.menu}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
