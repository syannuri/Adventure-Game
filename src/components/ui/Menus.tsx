import { useEffect } from 'react';
import { useGame } from '../../systems/store';
import { WORLDS } from '../../data/worlds';
import { ACHIEVEMENTS } from '../../data/achievements';
import { audio } from '../audio/audioEngine';
import { AnettPortrait } from './Portraits';
import { GameLogo } from './GameLogo';

const click = () => {
  audio.unlock();
  audio.sfx('click');
};

export function MainMenu() {
  const save = useGame((s) => s.save);
  const setScreen = useGame((s) => s.setScreen);
  const setOverlay = useGame((s) => s.setOverlay);
  const startWorld = useGame((s) => s.startWorld);
  return (
    <div className="menu">
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
          ▶ Play
        </button>
        <div className="menu-row">
          <button className="btn" onClick={() => (click(), setScreen('worlds'))}>
            🗺 Worlds
          </button>
          <button className="btn pink" onClick={() => (click(), setOverlay('about'))}>
            Meet Anett
          </button>
          <button className="btn teal" onClick={() => (click(), setScreen('story'))}>
            📖 Story
          </button>
          <button className="btn ghost" onClick={() => (click(), setOverlay('settings'))}>
            ⚙ Settings
          </button>
        </div>
        <div className="star-badge">
          <span className="s">★</span> Magic Stars: {save.magicStars} / 5
        </div>
      </div>
    </div>
  );
}

const WORLD_ART: Record<string, string> = {
  'enchanted-forest': '🌳',
  'candy-village': '🍭',
  'crystal-cave': '💎',
  'ocean-kingdom': '🐢',
  'sky-castle': '🏰',
};

export function WorldSelect() {
  const save = useGame((s) => s.save);
  const setScreen = useGame((s) => s.setScreen);
  const startWorld = useGame((s) => s.startWorld);
  return (
    <div className="worlds">
      <h1>The Magic Map</h1>
      <div className="star-badge">
        <span className="s">★</span> {save.magicStars} / 5 Magic Stars — collect all five to open the Crystal Castle!
      </div>
      <div className="world-grid">
        {WORLDS.map((w) => {
          const done = save.completedWorlds.includes(w.id);
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
              <span className="num">World {w.index}</span>
              {done && <span className="done">★</span>}
              <div className="art passthrough">{WORLD_ART[w.id]}</div>
              <h3>{w.name}</h3>
              <p>{w.mission}</p>
              {!w.built && <span className="lock">🔒 Coming soon</span>}
              {w.built && <span className="lock">{done ? 'Play again ▶' : 'Play ▶'}</span>}
            </div>
          );
        })}
      </div>
      <button className="btn ghost" onClick={() => (click(), setScreen('menu'))}>
        ◀ Back
      </button>
    </div>
  );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const settings = useGame((s) => s.save.settings);
  const update = useGame((s) => s.updateSettings);
  const reset = useGame((s) => s.resetProgress);
  return (
    <div className="modal-bg" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal panel">
        <h2>Settings</h2>
        <div className="setting">
          <label>🎵 Music</label>
          <input type="range" min={0} max={1} step={0.05} value={settings.musicVolume} onChange={(e) => update({ musicVolume: Number(e.target.value) })} />
        </div>
        <div className="setting">
          <label>🔔 Sounds</label>
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
          <label>✨ Graphics</label>
          <div className="toggle">
            <button className={settings.quality === 'high' ? 'on' : ''} onClick={() => update({ quality: 'high' })}>
              Beautiful
            </button>
            <button className={settings.quality === 'low' ? 'on' : ''} onClick={() => update({ quality: 'low' })}>
              Fast
            </button>
          </div>
        </div>
        <p style={{ fontSize: 16 }}>
          Keyboard: WASD / arrows to move · Shift to run · Space to jump · E to talk · F wave · G dance · Esc pause · drag the mouse to look around
        </p>
        <div className="menu-row" style={{ marginTop: 14 }}>
          <button className="btn" onClick={() => (click(), onClose())}>
            Done
          </button>
          <button
            className="btn ghost"
            style={{ fontSize: 16 }}
            onClick={() => {
              if (window.confirm('Start over? This clears your stars and achievements.')) reset();
            }}
          >
            Reset progress
          </button>
        </div>
      </div>
    </div>
  );
}

export function AboutAnett({ onClose }: { onClose: () => void }) {
  const achievements = useGame((s) => s.save.achievements);
  return (
    <div className="modal-bg" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal panel">
        <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 8px', border: '5px solid white', boxShadow: 'var(--shadow)' }}>
          <AnettPortrait />
        </div>
        <h2>Hi, I'm Anett!</h2>
        <p>
          I'm seven years old and I love exploring! I'm curious, brave and always happy to help a friend. In Grandma's old treasure box I found a magical map that leads to five secret lands.
        </p>
        <p>
          <b>I love:</b> my orange adventure jacket, my big explorer backpack, my hiking boots, jumping on mushrooms and dancing with forest friends!
        </p>
        <h3 style={{ margin: '14px 0 6px', color: 'var(--purple-dark)' }}>My badges</h3>
        <div className="ach-list">
          {Object.values(ACHIEVEMENTS).map((a) => (
            <div key={a.id} className="ach" style={{ opacity: achievements.includes(a.id) ? 1 : 0.4 }} title={a.description}>
              <i>{a.icon}</i>
              {a.title}
            </div>
          ))}
        </div>
        <button className="btn" onClick={() => (click(), onClose())}>
          Let's go!
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
        <h2>Taking a break</h2>
        <p>Anett is waiting for you!</p>
        <div className="menu-buttons" style={{ marginTop: 16 }}>
          <button className="btn big yellow" onClick={() => (click(), setPaused(false))}>
            ▶ Keep playing
          </button>
          <div className="menu-row">
            <button className="btn ghost" onClick={() => (click(), setOverlay('settings'))}>
              ⚙ Settings
            </button>
            <button className="btn teal" onClick={() => (click(), worldId && startWorld(worldId))}>
              ↺ Restart
            </button>
            <button className="btn pink" onClick={() => (click(), setScreen('menu'))}>
              ⌂ Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
