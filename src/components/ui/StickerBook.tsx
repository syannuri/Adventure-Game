/** Anet's animal sticker book: every animal she has met, with its name in both languages. */
import { useGame } from '../../systems/store';
import { STICKERS } from '../../data/stickers';
import { useT } from '../../i18n/useT';
import { StickerArt } from './StickerArt';

export function StickerBook({ onClose }: { onClose: () => void }) {
  const have = useGame((s) => s.save.stickers ?? []);
  const t = useT();
  const worlds = ['enchanted-forest', 'candy-village'] as const;
  return (
    <div className="modal-bg" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal panel sticker-modal">
        <h2>{t.stickerBook.title}</h2>
        <div className="sticker-count">{t.stickerBook.count(have.length, STICKERS.length)}</div>
        {worlds.map((w) => (
          <div key={w} className="sticker-section">
            <h3>{t.stickerBook.worldLabel[w]}</h3>
            <div className="sticker-grid">
              {STICKERS.filter((s) => s.world === w).map((s, i) => {
                const got = have.includes(s.id);
                const [name, other] = t.animals[s.id] ?? [s.id, ''];
                return (
                  <div key={s.id} className={'sticker' + (got ? ' got' : '')} style={{ ['--tilt' as string]: `${(i % 2 ? 1 : -1) * (2 + (i % 3))}deg` }}>
                    <div className="pic">{got ? <StickerArt id={s.id} /> : <span className="q">{t.stickerBook.hidden}</span>}</div>
                    <b>{got ? name : t.stickerBook.hidden}</b>
                    {got && <small>{other}</small>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <p className="sticker-tip">{t.stickerBook.tip}</p>
        <button className="btn big yellow" onClick={onClose}>
          {t.stickerBook.close}
        </button>
      </div>
    </div>
  );
}
