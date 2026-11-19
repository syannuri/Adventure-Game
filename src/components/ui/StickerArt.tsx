/** Sticker pictures for the sticker book (reusing the dialogue portraits where they exist). */
import { KikiPortrait, KokoPortrait, LumiPortrait, OlliPortrait, PipPortrait } from './Portraits';

export function DuckPortrait() {
  return (
    <svg viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#d8f2ff" />
      <path d="M0 78 Q25 72 50 78 T100 78 V100 H0Z" fill="#8fd6ec" />
      <ellipse cx="50" cy="72" rx="30" ry="18" fill="#ffffff" />
      <path d="M30 70 Q46 60 64 70" stroke="#e6eef2" strokeWidth="4" fill="none" />
      <circle cx="56" cy="42" r="17" fill="#ffffff" />
      <path d="M70 44 Q86 44 84 50 Q78 54 68 50Z" fill="#ff9a3c" />
      <circle cx="61" cy="38" r="3.2" fill="#1a1414" />
      <circle cx="62" cy="37" r="1" fill="#fff" />
      <ellipse cx="50" cy="48" rx="4" ry="2.4" fill="#ffb3b3" opacity="0.7" />
    </svg>
  );
}

export function DucklingPortrait() {
  return (
    <svg viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#fff7d6" />
      <ellipse cx="50" cy="74" rx="26" ry="17" fill="#ffe27a" />
      <path d="M28 70 Q40 62 52 70" stroke="#ffd23f" strokeWidth="4" fill="none" />
      <circle cx="52" cy="44" r="18" fill="#ffe27a" />
      <path d="M50 26 Q54 18 58 26" stroke="#ffd23f" strokeWidth="3" fill="none" />
      <path d="M66 46 Q78 46 76 51 Q72 54 64 51Z" fill="#ff9a3c" />
      <circle cx="58" cy="41" r="3.4" fill="#1a1414" />
      <circle cx="59" cy="40" r="1.1" fill="#fff" />
      <ellipse cx="46" cy="49" rx="4" ry="2.4" fill="#ffb07a" opacity="0.7" />
    </svg>
  );
}

export function ButterflyPortrait() {
  return (
    <svg viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#f2e8ff" />
      <path d="M50 50 C30 20 8 26 14 46 C18 58 36 58 50 52Z" fill="#ff8fc8" />
      <path d="M50 50 C70 20 92 26 86 46 C82 58 64 58 50 52Z" fill="#ff8fc8" />
      <path d="M50 54 C34 60 22 78 34 82 C44 84 48 70 50 58Z" fill="#9fd2ff" />
      <path d="M50 54 C66 60 78 78 66 82 C56 84 52 70 50 58Z" fill="#9fd2ff" />
      <circle cx="28" cy="42" r="5" fill="#fff07a" />
      <circle cx="72" cy="42" r="5" fill="#fff07a" />
      <rect x="47" y="34" width="6" height="40" rx="3" fill="#3a2a2a" />
      <path d="M49 34 Q42 22 38 22 M51 34 Q58 22 62 22" stroke="#3a2a2a" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function BunnyPortrait() {
  return (
    <svg viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#ffeef5" />
      <ellipse cx="38" cy="26" rx="7" ry="20" fill="#e8cfb2" />
      <ellipse cx="62" cy="26" rx="7" ry="20" fill="#e8cfb2" />
      <ellipse cx="38" cy="28" rx="3.5" ry="14" fill="#ffc3cf" />
      <ellipse cx="62" cy="28" rx="3.5" ry="14" fill="#ffc3cf" />
      <ellipse cx="50" cy="80" rx="24" ry="18" fill="#e8cfb2" />
      <circle cx="50" cy="54" r="20" fill="#e8cfb2" />
      <path d="M32 70 Q50 78 68 70" stroke="#ff8fbf" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="43" cy="52" r="3.2" fill="#2b1b14" />
      <circle cx="57" cy="52" r="3.2" fill="#2b1b14" />
      <circle cx="50" cy="59" r="2.4" fill="#ff8fa8" />
    </svg>
  );
}

export function StickerArt({ id }: { id: string }) {
  switch (id) {
    case 'fairy':
      return <LumiPortrait />;
    case 'rabbit':
      return <PipPortrait />;
    case 'owl':
      return <OlliPortrait />;
    case 'squirrel':
      return <KikiPortrait />;
    case 'duck':
      return <DuckPortrait />;
    case 'duckling':
      return <DucklingPortrait />;
    case 'butterfly':
      return <ButterflyPortrait />;
    case 'bunny':
      return <BunnyPortrait />;
    default:
      return <KokoPortrait />;
  }
}
