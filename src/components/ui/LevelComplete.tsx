import { useGame } from '../../systems/store';
import { COINS, TREASURES } from '../worlds/EnchantedForest/layout';
import { ACHIEVEMENTS } from '../../data/achievements';
import { audio } from '../audio/audioEngine';
import { useT } from '../../i18n/useT';

export function LevelComplete() {
  const level = useGame((s) => s.level);
  const newAch = useGame((s) => s.newAchievements);
  const save = useGame((s) => s.save);
  const setScreen = useGame((s) => s.setScreen);
  const startWorld = useGame((s) => s.startWorld);
  const t = useT();
  const coins = level.coins.length;
  const chests = level.treasures.length;
  // 1 star for helping Lumi, +1 for finding most acorns, +1 for every treasure
  const earned = 1 + (coins >= Math.ceil(COINS.length * 0.6) ? 1 : 0) + (chests === TREASURES.length ? 1 : 0);
  const mins = Math.floor((performance.now() - level.startedAt) / 60000);
  const secs = Math.floor(((performance.now() - level.startedAt) / 1000) % 60);

  return (
    <div className="complete">
      <div className="head passthrough">
        <h1>{t.complete.title}</h1>
        <div className="reward-stars">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < earned ? 'on' : ''} style={{ animationDelay: `${0.3 + i * 0.25}s` }}>
              ★
            </span>
          ))}
        </div>
      </div>
      <div className="card panel">
        <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--purple-dark)' }}>{t.complete.helped}</p>
        <p style={{ margin: '4px 0 10px', fontSize: 18 }}>
          {t.complete.earnedBefore}
          <b style={{ color: '#d18f00' }}>{t.complete.magicStar}</b>
          {t.complete.earnedAfter(save.magicStars)}
          {earned < 3 && t.complete.more}
        </p>
        <div className="stats">
          <span className="stat">● {t.complete.acorns} {coins}/{COINS.length}</span>
          <span className="stat">◆ {t.complete.treasures} {chests}/{TREASURES.length}</span>
          <span className="stat">
            ⏱ {mins}:{String(secs).padStart(2, '0')}
          </span>
        </div>
        {newAch.length > 0 && (
          <>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 1, color: 'var(--purple)', textTransform: 'uppercase' }}>{t.complete.achUnlocked}</div>
            <div className="ach-list">
              {newAch.map((id) => (
                <div key={id} className="ach">
                  <i>{ACHIEVEMENTS[id]?.icon}</i>
                  {t.achievements[id]?.title ?? ACHIEVEMENTS[id]?.title}
                </div>
              ))}
            </div>
          </>
        )}
        <div className="menu-row">
          <button className="btn big yellow" onClick={() => (audio.sfx('click'), setScreen('worlds'))}>
            {t.complete.continue}
          </button>
          <button className="btn ghost" onClick={() => (audio.sfx('click'), startWorld('enchanted-forest'))}>
            {t.complete.playAgain}
          </button>
        </div>
      </div>
    </div>
  );
}
