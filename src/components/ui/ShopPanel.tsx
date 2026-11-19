/** Kiki's shop: trade golden acorns for things Anet wears. */
import { useGame } from '../../systems/store';
import { COSMETICS, type Cosmetic } from '../../data/cosmetics';
import { ACHIEVEMENTS } from '../../data/achievements';
import { useT } from '../../i18n/useT';
import { audio } from '../audio/audioEngine';
import { KikiPortrait } from './Portraits';
import { sparkleBurst } from './sparkleBurst';

/** Small picture of each item. */
function ItemArt({ item }: { item: Cosmetic }) {
  const c = item.color;
  switch (item.id) {
    case 'clip-star':
      return (
        <svg viewBox="0 0 60 60">
          <rect x="10" y="27" width="34" height="6" rx="3" fill="#c9a7ff" />
          <path d="m40 14 4.4 9 9.8 1.2-7.2 6.8 1.9 9.8L40 36l-8.9 4.8 1.9-9.8-7.2-6.8 9.8-1.2Z" fill={c} stroke="#c47f00" strokeWidth="1.5" />
        </svg>
      );
    case 'bow-pink':
      return (
        <svg viewBox="0 0 60 60">
          <path d="M30 30 C18 14 6 18 8 30 C6 42 18 46 30 30Z M30 30 C42 14 54 18 52 30 C54 42 42 46 30 30Z" fill={c} />
          <path d="M26 32 L20 50 L27 46 L30 52 L33 46 L40 50 L34 32Z" fill="#e2508f" />
          <circle cx="30" cy="30" r="6" fill="#ffb3d1" />
        </svg>
      );
    case 'crown-flower':
      return (
        <svg viewBox="0 0 60 60">
          <ellipse cx="30" cy="36" rx="22" ry="9" fill="none" stroke="#5fae5c" strokeWidth="4" />
          {[[10, 34, '#ff8fbf'], [20, 28, '#fff'], [30, 26, '#ffd23f'], [40, 28, '#c9a7ff'], [50, 34, '#ff8fbf']].map(([x, y, col], i) => (
            <g key={i}>
              {[0, 72, 144, 216, 288].map((a) => (
                <circle key={a} cx={Number(x) + Math.cos((a * Math.PI) / 180) * 4} cy={Number(y) + Math.sin((a * Math.PI) / 180) * 4} r="3.4" fill={String(col)} />
              ))}
              <circle cx={Number(x)} cy={Number(y)} r="2.4" fill="#ffd34d" />
            </g>
          ))}
        </svg>
      );
    case 'hat-acorn':
      return (
        <svg viewBox="0 0 60 60">
          <path d="M8 38 Q30 4 52 38Z" fill={c} />
          <path d="M14 30 L46 30 M18 24 L42 24 M24 18 L36 18" stroke="#7a4a22" strokeWidth="2" />
          <ellipse cx="30" cy="38" rx="24" ry="5" fill="#7a4a22" />
          <path d="M30 12 Q32 4 38 4" stroke="#5a3018" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'glasses-heart':
      return (
        <svg viewBox="0 0 60 60">
          {[16, 44].map((x) => (
            <path key={x} d={`M${x} 40 C${x - 4} 36 ${x - 12} 30 ${x - 12} 24 C${x - 12} 18 ${x - 4} 16 ${x} 22 C${x + 4} 16 ${x + 12} 18 ${x + 12} 24 C${x + 12} 30 ${x + 4} 36 ${x} 40Z`} fill="#ffc2d4" stroke={c} strokeWidth="3" />
          ))}
          <path d="M26 24 Q30 20 34 24" stroke={c} strokeWidth="3" fill="none" />
        </svg>
      );
    case 'charm-star':
      return (
        <svg viewBox="0 0 60 60">
          <path d="M30 6 L30 22" stroke="#8a86a8" strokeWidth="2" />
          <circle cx="30" cy="8" r="4" fill="none" stroke="#8a86a8" strokeWidth="2" />
          <path d="m30 22 5.3 10.8 11.9 1.4-8.7 8.2 2.3 11.8L30 48.4l-10.8 5.8 2.3-11.8-8.7-8.2 11.9-1.4Z" fill={c} stroke="#c47f00" strokeWidth="1.5" />
        </svg>
      );
    default:
      // backpack in the item's colour
      return (
        <svg viewBox="0 0 60 60">
          <rect x="14" y="14" width="32" height="38" rx="9" fill={c} />
          <rect x="14" y="14" width="32" height="12" rx="6" fill="rgba(0,0,0,0.12)" />
          <rect x="20" y="32" width="20" height="14" rx="4" fill="rgba(255,255,255,0.35)" />
          <path d="M22 14 Q22 6 30 6 Q38 6 38 14" stroke="#6b6680" strokeWidth="3" fill="none" />
        </svg>
      );
  }
}

export function ShopPanel({ onClose }: { onClose: () => void }) {
  const save = useGame((s) => s.save);
  const buy = useGame((s) => s.buyCosmetic);
  const equip = useGame((s) => s.equipCosmetic);
  const unequip = useGame((s) => s.unequipSlot);
  const t = useT();
  const acorns = save.acorns ?? 0;

  return (
    <div className="modal-bg" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal panel shop-modal">
        <div className="shop-head">
          <div className="shop-kiki">
            <KikiPortrait />
          </div>
          <div>
            <h2>{t.shop.title}</h2>
            <div className="shop-pouch">
              <span className="acorn" aria-hidden />
              {t.shop.pouch}: <b>{t.shop.acorns(acorns)}</b>
            </div>
          </div>
        </div>
        <div className="shop-grid">
          {COSMETICS.map((item) => {
            const owned = save.owned.includes(item.id);
            const wearing = save.equipped[item.slot] === item.id;
            const short = item.price - acorns;
            return (
              <div key={item.id} className={'shop-item' + (wearing ? ' wearing' : '')}>
                <div className="art">
                  <ItemArt item={item} />
                </div>
                <div className="name">{t.shop.items[item.id]}</div>
                <div className="slot">{t.shop.slots[item.slot]}</div>
                {!owned && (
                  <button
                    className={'btn shop-btn' + (short > 0 ? ' disabled' : ' yellow')}
                    disabled={short > 0}
                    onClick={(e) => {
                      if (buy(item.id)) {
                        audio.sfx('star', { pitch: 1.1 });
                        sparkleBurst(e.clientX, e.clientY, [item.color, '#ffffff', '#ffe27a']);
                        useGame.getState().unlockAchievement('stylish', ACHIEVEMENTS.stylish.title, ACHIEVEMENTS.stylish.icon);
                      }
                    }}
                  >
                    {short > 0 ? (
                      t.shop.need(short)
                    ) : (
                      <>
                        {t.shop.buy} <span className="acorn" aria-hidden /> {item.price}
                      </>
                    )}
                  </button>
                )}
                {owned && !wearing && (
                  <button className="btn shop-btn teal" onClick={() => equip(item.id)}>
                    {t.shop.wear}
                  </button>
                )}
                {owned && wearing && (
                  <button className="btn shop-btn ghost" onClick={() => unequip(item.slot)}>
                    {t.shop.wearing}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="shop-tip">{t.shop.tip}</p>
        <button className="btn big yellow" onClick={onClose}>
          {t.shop.close}
        </button>
      </div>
    </div>
  );
}
