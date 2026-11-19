/** Character portraits for the dialogue system. Anet uses her 3D render; the others are hand-authored SVG. */
import { useState } from 'react';
import type { DialogueLine } from '../../systems/store';
import { DuckPortrait } from './StickerArt';

const ANET_AVATAR = `${import.meta.env.BASE_URL}portraits/anet.webp`;

/** Anet's avatar: the 3D render (public/portraits/anet.webp), with the SVG drawing as a fallback. */
export function AnettPortrait() {
  const [failed, setFailed] = useState(false);
  if (failed) return <AnettPortraitSVG />;
  return <img className="portrait-img" src={ANET_AVATAR} alt="Anet" draggable={false} onError={() => setFailed(true)} />;
}

export const SPEAKERS: Record<DialogueLine['speaker'], { name: string; color: string }> = {
  anett: { name: 'Anet', color: '#d9661f' },
  lumi: { name: 'Lumi the Fairy', color: '#7b5cff' },
  pip: { name: 'Pip the Rabbit', color: '#2f8ad8' },
  olli: { name: 'Olli the Owl', color: '#9a6b4a' },
  koko: { name: 'Koko the Chef', color: '#b8692f' },
  kiki: { name: 'Kiki the Squirrel', color: '#d9772b' },
  duck: { name: 'Mama Duck', color: '#3a9ec7' },
};

/** Kiki the squirrel shopkeeper: orange fur, big fluffy tail, holding an acorn. */
export function KikiPortrait() {
  return (
    <svg viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#e8f6dc" />
      <path d="M70 100 C96 86 98 46 80 30 C70 22 60 30 66 42 C74 56 70 80 56 100Z" fill="#e08a3c" />
      <path d="M74 92 C90 80 90 52 80 40" stroke="#f3b87a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="44" cy="88" rx="22" ry="18" fill="#e08a3c" />
      <ellipse cx="44" cy="90" rx="12" ry="11" fill="#fbe2c2" />
      <circle cx="44" cy="54" r="22" fill="#e08a3c" />
      <path d="M26 40 L24 22 L36 34Z M62 40 L64 22 L52 34Z" fill="#e08a3c" />
      <path d="M28 37 L27 27 L34 34Z M60 37 L61 27 L54 34Z" fill="#ffb3a7" />
      <ellipse cx="44" cy="62" rx="12" ry="9" fill="#fbe2c2" />
      <circle cx="36" cy="52" r="4" fill="#2a160c" />
      <circle cx="52" cy="52" r="4" fill="#2a160c" />
      <circle cx="37.3" cy="50.7" r="1.3" fill="#fff" />
      <circle cx="53.3" cy="50.7" r="1.3" fill="#fff" />
      <ellipse cx="44" cy="59" rx="3" ry="2.2" fill="#6b3a26" />
      <path d="M39 64 Q44 68 49 64" stroke="#6b3a26" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="30" cy="60" rx="4" ry="2.5" fill="#ff9e8f" opacity="0.7" />
      <ellipse cx="58" cy="60" rx="4" ry="2.5" fill="#ff9e8f" opacity="0.7" />
      <ellipse cx="44" cy="80" rx="7" ry="8" fill="#c8862c" />
      <path d="M37 76 Q44 70 51 76 L51 78 Q44 74 37 78Z" fill="#7a4a22" />
    </svg>
  );
}

/** Koko the gingerbread chef: cookie face with icing details and a tall chef's hat. */
export function KokoPortrait() {
  return (
    <svg viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#ffe1ef" />
      <circle cx="18" cy="20" r="2.4" fill="#ff8fbf" />
      <circle cx="84" cy="30" r="2" fill="#5ab8ff" />
      <circle cx="80" cy="82" r="2.4" fill="#ffd23f" />
      {/* body + arms */}
      <path d="M22 100 Q24 76 50 74 Q76 76 78 100Z" fill="#b8692f" />
      <path d="M30 88 Q35 84 40 88 Q45 92 50 88 Q55 84 60 88 Q65 92 70 88" stroke="#fffaf2" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="94" r="3" fill="#ff5fa2" />
      {/* head */}
      <circle cx="50" cy="54" r="24" fill="#b8692f" />
      <path d="M30 46 Q32 34 42 31" stroke="#c98a4e" strokeWidth="3" fill="none" opacity="0.6" />
      {/* chef hat */}
      <rect x="33" y="24" width="34" height="9" rx="3" fill="#ffffff" />
      <circle cx="40" cy="18" r="9" fill="#ffffff" />
      <circle cx="52" cy="13" r="10" fill="#ffffff" />
      <circle cx="62" cy="19" r="8" fill="#ffffff" />
      {/* face */}
      <path d="M39 45 Q42 43 45 45 M55 45 Q58 43 61 45" stroke="#fffaf2" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="42" cy="52" r="3.6" fill="#2a160c" />
      <circle cx="58" cy="52" r="3.6" fill="#2a160c" />
      <circle cx="43.2" cy="50.8" r="1.2" fill="#fff" />
      <circle cx="59.2" cy="50.8" r="1.2" fill="#fff" />
      <ellipse cx="35" cy="60" rx="4" ry="2.6" fill="#ff8a9e" opacity="0.8" />
      <ellipse cx="65" cy="60" rx="4" ry="2.6" fill="#ff8a9e" opacity="0.8" />
      <path d="M42 62 Q50 69 58 62" stroke="#fffaf2" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function AnettPortraitSVG() {
  return (
    <svg viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#ffe8c8" />
      {/* long dark hair behind */}
      <path d="M18 46 Q16 16 50 14 Q84 16 82 46 Q86 78 80 100 L20 100 Q14 78 18 46Z" fill="#1f1714" />
      {/* striped T-shirt + mustard pinafore with straps and clips */}
      <path d="M12 100 Q16 82 50 80 Q84 82 88 100Z" fill="#fbf8f0" />
      <path d="M14 94 Q50 86 86 94 L87 98 Q50 90 13 98Z M18 87 Q50 80 82 87 L84 91 Q50 84 16 91Z" fill="#f6c33c" />
      <path d="M34 86 L36 100 L64 100 L66 86 Q50 90 34 86Z" fill="#c98b2c" />
      <rect x="31" y="80" width="6" height="12" rx="2" fill="#c98b2c" />
      <rect x="63" y="80" width="6" height="12" rx="2" fill="#c98b2c" />
      <circle cx="35" cy="90" r="2.2" fill="#d8d8de" />
      <circle cx="65" cy="90" r="2.2" fill="#d8d8de" />
      {/* backpack shoulder straps */}
      <rect x="24" y="82" width="6" height="18" rx="2" fill="#7f7a70" />
      <rect x="70" y="82" width="6" height="18" rx="2" fill="#7f7a70" />
      {/* face */}
      <ellipse cx="50" cy="52" rx="24" ry="26" fill="#f9dcc6" />
      {/* centre-part hair framing the face */}
      <path d="M50 16 Q24 18 22 50 Q24 70 28 78 Q26 54 34 36 Q42 24 50 22Z" fill="#1f1714" />
      <path d="M50 16 Q76 18 78 50 Q76 70 72 78 Q74 54 66 36 Q58 24 50 22Z" fill="#1f1714" />
      <path d="M50 16 L50 24" stroke="#5a4033" strokeWidth="1.2" />
      <path d="M30 30 Q38 20 48 19" stroke="#6b5040" strokeWidth="2" fill="none" opacity="0.7" />
      {/* brows, big dark-brown eyes */}
      <path d="M33 41 Q39 38 45 40 M55 40 Q61 38 67 41" stroke="#3b2a22" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="40" cy="52" rx="6.6" ry="7.4" fill="#fff" />
      <ellipse cx="60" cy="52" rx="6.6" ry="7.4" fill="#fff" />
      <circle cx="40.4" cy="53" r="5.4" fill="#5c341a" />
      <circle cx="60.4" cy="53" r="5.4" fill="#5c341a" />
      <circle cx="40.4" cy="53.6" r="3.4" fill="#9a6238" opacity="0.6" />
      <circle cx="60.4" cy="53.6" r="3.4" fill="#9a6238" opacity="0.6" />
      <circle cx="40.4" cy="53" r="2.4" fill="#140804" />
      <circle cx="60.4" cy="53" r="2.4" fill="#140804" />
      <circle cx="38.6" cy="50.6" r="1.6" fill="#fff" />
      <circle cx="58.6" cy="50.6" r="1.6" fill="#fff" />
      <path d="M33 49 Q40 43 47 49 M53 49 Q60 43 67 49" stroke="#160f0c" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M33 49 L30.5 46.5 M67 49 L69.5 46.5" stroke="#160f0c" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="32" cy="62" rx="4.6" ry="2.8" fill="#ff9b8f" opacity="0.45" />
      <ellipse cx="68" cy="62" rx="4.6" ry="2.8" fill="#ff9b8f" opacity="0.45" />
      <ellipse cx="50" cy="61" rx="2.2" ry="1.6" fill="#efc2a6" />
      <path d="M44 67 Q50 71.5 56 67" stroke="#d2706f" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function LumiPortrait() {
  return (
    <svg viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#e9e1ff" />
      <path d="M10 60 Q0 30 26 40 Q34 52 30 62 Z" fill="#c8f4ff" opacity="0.8" />
      <path d="M90 60 Q100 30 74 40 Q66 52 70 62 Z" fill="#c8f4ff" opacity="0.8" />
      <path d="M22 100 Q30 76 50 76 Q70 76 78 100 Z" fill="#b8a2ff" />
      <circle cx="50" cy="20" r="11" fill="#ffa9d2" />
      <ellipse cx="50" cy="50" rx="24" ry="24" fill="#fde3d5" />
      <path d="M26 50 Q24 24 50 24 Q76 24 74 50 Q70 34 50 33 Q30 34 26 50" fill="#ffa9d2" />
      <path d="M46 12 L50 4 L54 12 L50 15 Z" fill="#ffe066" />
      <ellipse cx="41" cy="51" rx="4" ry="5" fill="#2a1840" />
      <ellipse cx="59" cy="51" rx="4" ry="5" fill="#2a1840" />
      <circle cx="42.5" cy="49" r="1.4" fill="#fff" />
      <circle cx="60.5" cy="49" r="1.4" fill="#fff" />
      <ellipse cx="33" cy="59" rx="4" ry="2.4" fill="#ff9fbf" opacity="0.6" />
      <ellipse cx="67" cy="59" rx="4" ry="2.4" fill="#ff9fbf" opacity="0.6" />
      <path d="M44 62 Q50 67 56 62" stroke="#b4485c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function PipPortrait() {
  return (
    <svg viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#d8efff" />
      <ellipse cx="38" cy="22" rx="8" ry="22" fill="#e8cfb2" />
      <ellipse cx="62" cy="22" rx="8" ry="22" fill="#e8cfb2" />
      <ellipse cx="38" cy="24" rx="4" ry="16" fill="#ffc3cf" />
      <ellipse cx="62" cy="24" rx="4" ry="16" fill="#ffc3cf" />
      <ellipse cx="50" cy="96" rx="34" ry="22" fill="#e8cfb2" />
      <path d="M26 82 Q50 92 74 82 L74 88 Q50 98 26 88 Z" fill="#5aa8ff" />
      <ellipse cx="50" cy="58" rx="26" ry="24" fill="#e8cfb2" />
      <ellipse cx="50" cy="66" rx="13" ry="10" fill="#fbf1e4" />
      <ellipse cx="40" cy="54" rx="4.5" ry="5.5" fill="#2b1b14" />
      <ellipse cx="60" cy="54" rx="4.5" ry="5.5" fill="#2b1b14" />
      <circle cx="41.5" cy="52" r="1.5" fill="#fff" />
      <circle cx="61.5" cy="52" r="1.5" fill="#fff" />
      <ellipse cx="50" cy="62" rx="3.4" ry="2.6" fill="#ff8fa8" />
      <path d="M45 67 Q50 71 55 67" stroke="#8a5a40" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function OlliPortrait() {
  return (
    <svg viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#e1f5d6" />
      <path d="M26 30 L30 14 L38 26 Z" fill="#86593b" />
      <path d="M74 30 L70 14 L62 26 Z" fill="#86593b" />
      <ellipse cx="50" cy="96" rx="34" ry="26" fill="#9a6b4a" />
      <ellipse cx="50" cy="96" rx="22" ry="20" fill="#f1dcc0" />
      <ellipse cx="50" cy="50" rx="30" ry="27" fill="#9a6b4a" />
      <circle cx="38" cy="48" r="12" fill="#f1dcc0" />
      <circle cx="62" cy="48" r="12" fill="#f1dcc0" />
      <circle cx="38" cy="48" r="7" fill="#fff" />
      <circle cx="62" cy="48" r="7" fill="#fff" />
      <circle cx="38.5" cy="48.5" r="4.6" fill="#3a2414" />
      <circle cx="62.5" cy="48.5" r="4.6" fill="#3a2414" />
      <circle cx="40" cy="46.5" r="1.5" fill="#fff" />
      <circle cx="64" cy="46.5" r="1.5" fill="#fff" />
      <circle cx="38" cy="48" r="11" fill="none" stroke="#c79a3b" strokeWidth="2" />
      <circle cx="62" cy="48" r="11" fill="none" stroke="#c79a3b" strokeWidth="2" />
      <path d="M49 48 L51 48" stroke="#c79a3b" strokeWidth="2" />
      <path d="M46 58 L54 58 L50 66 Z" fill="#f5a742" />
    </svg>
  );
}

export function Portrait({ speaker }: { speaker: DialogueLine['speaker'] }) {
  switch (speaker) {
    case 'anett':
      return <AnettPortrait />;
    case 'lumi':
      return <LumiPortrait />;
    case 'pip':
      return <PipPortrait />;
    case 'olli':
      return <OlliPortrait />;
    case 'koko':
      return <KokoPortrait />;
    case 'kiki':
      return <KikiPortrait />;
    case 'duck':
      return <DuckPortrait />;
  }
}
