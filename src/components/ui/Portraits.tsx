/** Hand-authored SVG character portraits for the dialogue system (consistent with the 3D designs). */
import type { DialogueLine } from '../../systems/store';

export const SPEAKERS: Record<DialogueLine['speaker'], { name: string; color: string }> = {
  anett: { name: 'Anet', color: '#d9661f' },
  lumi: { name: 'Lumi the Fairy', color: '#7b5cff' },
  pip: { name: 'Pip the Rabbit', color: '#2f8ad8' },
  olli: { name: 'Olli the Owl', color: '#9a6b4a' },
};

export function AnettPortrait() {
  return (
    <svg viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#ffe2c4" />
      {/* backpack straps peeking over the jacket */}
      <path d="M8 100 Q12 80 50 78 Q88 80 92 100 Z" fill="#e9843b" />
      <path d="M38 79 Q50 86 62 79 L60 75 Q50 80 40 75 Z" fill="#c8622a" />
      <rect x="30" y="80" width="7" height="20" fill="#7f7a70" />
      <rect x="63" y="80" width="7" height="20" fill="#7f7a70" />
      <path d="M50 82 L50 100" stroke="#c9c9cf" strokeWidth="1.6" />
      {/* hair volume behind the face */}
      <path d="M14 48 Q10 22 50 14 Q90 22 86 48 Q92 64 86 78 Q80 86 74 80 Q70 88 64 82 L36 82 Q30 88 26 80 Q20 86 14 78 Q8 64 14 48 Z" fill="#2b221e" />
      <path d="M20 60 Q16 70 20 78 M80 60 Q84 70 80 78" stroke="#5c4d45" strokeWidth="2" fill="none" />
      {/* round chubby face */}
      <ellipse cx="50" cy="54" rx="26" ry="25" fill="#f9dcc6" />
      {/* full straight bangs */}
      <path d="M22 50 Q20 24 50 22 Q80 24 78 50 L74 46 L70 49 L66 45 L61 48 L56 45 L50 48 L44 45 L39 48 L34 45 L30 49 L26 46 Z" fill="#2b221e" />
      <path d="M34 30 Q46 24 60 27" stroke="#6b5a52" strokeWidth="2" fill="none" opacity="0.8" />
      {/* big amber eyes */}
      <ellipse cx="39" cy="56" rx="7.4" ry="8" fill="#fff" />
      <ellipse cx="61" cy="56" rx="7.4" ry="8" fill="#fff" />
      <circle cx="39.5" cy="57" r="5.8" fill="#b8621d" />
      <circle cx="61.5" cy="57" r="5.8" fill="#b8621d" />
      <circle cx="39.5" cy="57.5" r="3.6" fill="#f2a145" opacity="0.55" />
      <circle cx="61.5" cy="57.5" r="3.6" fill="#f2a145" opacity="0.55" />
      <circle cx="39.5" cy="57" r="2.6" fill="#140804" />
      <circle cx="61.5" cy="57" r="2.6" fill="#140804" />
      <circle cx="37.5" cy="54.5" r="1.7" fill="#fff" />
      <circle cx="59.5" cy="54.5" r="1.7" fill="#fff" />
      <path d="M31 53 Q39 46 47 53 M53 53 Q61 46 69 53" stroke="#1e1512" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M31 53 L28 50 M69 53 L72 50" stroke="#1e1512" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="31" cy="65" rx="4.5" ry="2.6" fill="#ff9b8f" opacity="0.35" />
      <ellipse cx="69" cy="65" rx="4.5" ry="2.6" fill="#ff9b8f" opacity="0.35" />
      <ellipse cx="50" cy="65" rx="2.4" ry="1.7" fill="#efc2a6" />
      <path d="M44 71 Q50 75 56 71" stroke="#c4655c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
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
  }
}
