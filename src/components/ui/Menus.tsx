import { useEffect, useState } from 'react';
import { useGame } from '../../systems/store';
import { WORLDS } from '../../data/worlds';
import { ACHIEVEMENTS } from '../../data/achievements';
import { audio } from '../audio/audioEngine';
import { AnettPortrait } from './Portraits';
import { GameLogo } from './GameLogo';
import { WorldArt } from './WorldArt';
import { useT } from '../../i18n/useT';
import { LANGS } from '../../i18n';

const click = () => {
  audio.unlock();
  audio.sfx('click');
};

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

export function MainMenu() {
  const save = useGame((s) => s.save);
  const setScreen = useGame((s) => s.setScreen);
  const setOverlay = useGame((s) => s.setOverlay);
  const startWorld = useGame((s) => s.startWorld);
  const t = useT();
  return (
    <div className="menu">
      <div className="menu-lang">
        <LanguageSwitch />
      </div>
      <GameLogo />
      <div className="menu-buttons">
        <button
          className="btn big yellow"
          onClick={() => {
            click();
            if (!save.seenIntro) setScreen('story');
            else startWorld('enchanted-forest');
          }}
        >
          {t.menu.play}
        </button>
        <div className="menu-row">
          <button className="btn" onClick={() => (click(), setScreen('worlds'))}>
            {t.menu.worlds}
          </button>
          <button className="btn pink" onClick={() => (click(), setOverlay('about'))}>
            {t.menu.meet}
          </button>
          <button className="btn teal" onClick={() => (click(), setScreen('story'))}>
            {t.menu.story}
          </button>
          <button className="btn ghost" onClick={() => (click(), setOverlay('settings'))}>
            {t.menu.settings}
          </button>
        </div>
        <div className="star-badge">
          <span className="s">★</span> {t.menu.magicStars}: {save.magicStars} / 5
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
                if (!w.built) return audio.sfx('pop', { pitch: 0.7 });
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
        <p style={{ fontSize: 16 }}>{t.settings.controls}</p>
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
      <div className="modal panel">
        <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 8px', border: '5px solid white', boxShadow: 'var(--shadow)' }}>
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
          <button className="btn big yellow" onClick={() => (click(), setPaused(false))}>
            {t.pause.keep}
          </button>
          <div className="menu-row">
            <button className="btn ghost" onClick={() => (click(), setOverlay('settings'))}>
              {t.pause.settings}
            </button>
            <button className="btn teal" onClick={() => (click(), worldId && startWorld(worldId))}>
              {t.pause.restart}
            </button>
            <button className="btn pink" onClick={() => (click(), setScreen('menu'))}>
              {t.pause.menu}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
