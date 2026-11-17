/** Hand-authored SVG character portraits for the dialogue system (consistent with the 3D designs). */
import type { DialogueLine } from '../../systems/store';

export const SPEAKERS: Record<DialogueLine['speaker'], { name: string; color: string }> = {
  anett: { name: 'Anett', color: '#e39a00' },
  lumi: { name: 'Lumi the Fairy', color: '#7b5cff' },
  pip: { name: 'Pip the Rabbit', color: '#2f8ad8' },
  olli: { name: 'Olli the Owl', color: '#9a6b4a' },
};

export function AnettPortrait() {
  return (
    <svg viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#ffe9a8" />
      <path d="M14 100 Q16 78 50 76 Q84 78 86 100 Z" fill="#f7c531" />
      <path d="M40 78 L50 92 L60 78 Z" fill="#fbfbf7" />
      <path d="M22 44 Q20 82 30 84 L70 84 Q80 82 78 44 Z" fill="#15121a" />
      <ellipse cx="50" cy="50" rx="25" ry="25" fill="#f7d9c8" />
      <path d="M24 48 Q24 22 50 22 Q76 22 76 48 L76 40 Q70 37 50 37 Q30 37 24 40 Z" fill="#15121a" />
      <path d="M24 46 Q26 20 50 20 Q74 20 76 46 Q74 36 50 36 Q26 36 24 46" fill="#2a2433" opacity="0.6" />
      <path d="M33 26 Q44 22 52 24" stroke="#5a5070" strokeWidth="2" fill="none" opacity="0.7" />
      <ellipse cx="40" cy="52" rx="6" ry="7" fill="#fff" />
      <ellipse cx="60" cy="52" rx="6" ry="7" fill="#fff" />
      <ellipse cx="40.5" cy="53" rx="4.4" ry="5.2" fill="#4a2a17" />
      <ellipse cx="60.5" cy="53" rx="4.4" ry="5.2" fill="#4a2a17" />
      <circle cx="42" cy="50.5" r="1.6" fill="#fff" />
      <circle cx="62" cy="50.5" r="1.6" fill="#fff" />
      <ellipse cx="31" cy="61" rx="4.5" ry="2.6" fill="#ff9aaa" opacity="0.6" />
      <ellipse cx="69" cy="61" rx="4.5" ry="2.6" fill="#ff9aaa" opacity="0.6" />
      <path d="M43 64 Q50 70 57 64" stroke="#b4485c" strokeWidth="2.6" fill="none" strokeLinecap="round" />
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
