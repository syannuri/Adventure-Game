import { useT } from '../../i18n/useT';
/** Opening storybook cinematic: Anet discovers the magical map in Grandma's treasure box. */
import { useState } from 'react';
import { useGame } from '../../systems/store';
import { audio } from '../audio/audioEngine';

const Box = ({ open }: { open: boolean }) => (
  <g>
    <ellipse cx="180" cy="196" rx="120" ry="14" fill="#000" opacity="0.15" />
    <rect x="80" y="110" width="200" height="86" rx="14" fill="#a8683a" />
    <rect x="80" y="150" width="200" height="12" fill="#8a5330" />
    <rect x="110" y="110" width="16" height="86" fill="#f0c24b" />
    <rect x="234" y="110" width="16" height="86" fill="#f0c24b" />
    {open && (
      <>
        <path d="M100 110 Q180 20 260 110 Z" fill="#fff3a0" opacity="0.55">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
        </path>
        <rect x="142" y="78" width="76" height="46" rx="6" fill="#f6e3b4" stroke="#c99a5a" strokeWidth="3" transform="rotate(-8 180 100)" />
      </>
    )}
    <g transform={open ? 'rotate(-28 80 110)' : ''}>
      <path d="M80 110 Q80 70 180 70 Q280 70 280 110 Z" fill="#b9773f" />
      <rect x="166" y="96" width="28" height="22" rx="5" fill="#f0c24b" />
    </g>
  </g>
);

const MapArt = () => (
  <g>
    <rect x="50" y="30" width="260" height="170" rx="12" fill="#f6e3b4" stroke="#c99a5a" strokeWidth="4" />
    <path d="M70 170 C110 120 120 160 160 120 S230 90 290 60" stroke="#c99a5a" strokeWidth="4" strokeDasharray="8 8" fill="none" />
    <text x="88" y="178" fontSize="36">🌳</text>
    <text x="140" y="140" fontSize="32">🍭</text>
    <text x="190" y="118" fontSize="32">💎</text>
    <text x="236" y="98" fontSize="32">🐢</text>
    <text x="262" y="66" fontSize="32">🏰</text>
    <circle cx="180" cy="115" r="96" fill="none" stroke="#ffd23f" strokeWidth="3" opacity="0.6">
      <animate attributeName="r" values="80;105;80" dur="2.4s" repeatCount="indefinite" />
    </circle>
  </g>
);

const Stars = ({ castle }: { castle: string }) => (
  <g>
    {[0, 1, 2, 3, 4].map((i) => (
      <text key={i} x={70 + i * 50} y={100 + Math.sin(i) * 30} fontSize="44" fill="#ffd23f" stroke="#b37a00" strokeWidth="1.5">
        ★
        <animate attributeName="y" values={`${100 + Math.sin(i) * 30};${85 + Math.sin(i) * 30};${100 + Math.sin(i) * 30}`} dur={`${1.6 + i * 0.2}s`} repeatCount="indefinite" />
      </text>
    ))}
    <path d="M110 200 L180 150 L250 200 Z" fill="#c3a2ff" opacity="0.8" />
    <rect x="160" y="120" width="40" height="40" rx="6" fill="#8ee8ff" />
    <text x="180" y="230" textAnchor="middle" fontSize="22" fontWeight="800" fill="#7a3fd0">{castle}</text>
  </g>
);

const Forest = () => (
  <g>
    <rect x="30" y="160" width="300" height="50" rx="20" fill="#7cc466" />
    {[60, 120, 240, 300].map((x, i) => (
      <g key={x}>
        <rect x={x - 8} y={110} width={16} height={60} fill="#8a5a3c" />
        <circle cx={x} cy={100 - (i % 2) * 10} r={36} fill={i % 2 ? '#4fae55' : '#62b95a'} />
      </g>
    ))}
    <circle cx="180" cy="120" r="14" fill="#fde3d5" />
    <path d="M168 118 Q168 104 180 104 Q192 104 192 118 Q186 110 180 110 Q174 110 168 118" fill="#ffa9d2" />
    <path d="M160 120 Q140 100 162 108 Z M200 120 Q220 100 198 108 Z" fill="#c8f4ff" />
    <text x="150" y="80" fontSize="26">✨</text>
  </g>
);

const ART = [<Box key="0" open={false} />, <Box key="1" open />, <MapArt key="2" />, null, <Forest key="4" />];

export function StoryIntro() {
  const [page, setPage] = useState(0);
  const startWorld = useGame((s) => s.startWorld);
  const markIntroSeen = useGame((s) => s.markIntroSeen);
  const finish = () => {
    audio.sfx('magic');
    markIntroSeen();
    startWorld('enchanted-forest');
  };
  const t = useT();
  const pages = t.story.pages;
  const art = ART[page] ?? <Stars castle={t.story.crystalCastle} />;
  return (
    <div className="story">
      <div className="story-card panel" key={page}>
        <svg viewBox="0 0 360 240">{art}</svg>
        <div className="text">{pages[page]}</div>
        <div className="story-nav">
          <button className="btn ghost" style={{ fontSize: 17 }} onClick={() => (audio.sfx('click'), finish())}>
            {t.story.skip}
          </button>
          <div className="dots">
            {pages.map((_, i) => (
              <i key={i} className={i === page ? 'on' : ''} />
            ))}
          </div>
          <button
            className="btn yellow"
            onClick={() => {
              audio.unlock();
              audio.sfx('pop');
              if (page + 1 < pages.length) setPage(page + 1);
              else finish();
            }}
          >
            {page + 1 < pages.length ? t.story.next : t.story.go}
          </button>
        </div>
      </div>
    </div>
  );
}
