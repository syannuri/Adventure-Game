/**
 * Original rounded line icons for buttons (24×24, stroke = currentColor).
 * Drawn for this game so every button shares one consistent, friendly style.
 */
import type { CSSProperties, ReactNode } from 'react';

export type IconName =
  | 'play'
  | 'map'
  | 'heart'
  | 'book'
  | 'gear'
  | 'back'
  | 'pause'
  | 'restart'
  | 'home'
  | 'jump'
  | 'talk'
  | 'take'
  | 'open'
  | 'sparkle'
  | 'wave'
  | 'music'
  | 'run'
  | 'help'
  | 'check'
  | 'next'
  | 'lock'
  | 'flower';

const PATHS: Record<IconName, ReactNode> = {
  play: <path d="M8 5.5v13a1 1 0 0 0 1.5.87l10.5-6.5a1 1 0 0 0 0-1.74L9.5 4.63A1 1 0 0 0 8 5.5Z" fill="currentColor" stroke="none" />,
  map: (
    <>
      <path d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5L3.5 20Z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />,
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5a2.5 2.5 0 0 1 2.5 2.5Z" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
    </>
  ),
  back: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  next: <path d="M9.5 5.5 16 12l-6.5 6.5" />,
  pause: (
    <>
      <rect x="6.5" y="5" width="3.6" height="14" rx="1.4" fill="currentColor" stroke="none" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  restart: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5v4h4" />
    </>
  ),
  home: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  jump: (
    <>
      {/* a person jumping: head, arms up in a V, body, tucked knees, motion lines below */}
      <circle cx="12" cy="4.3" r="2.1" fill="currentColor" stroke="none" />
      <path d="M6.2 3.6 9.3 8.2h5.4l3.1-4.6" />
      <path d="M12 8.2v5.1" />
      <path d="M12 13.3 8.6 15l1.6 3.2" />
      <path d="M12 13.3l3.4 1.7-1.6 3.2" />
      <path d="M8.2 21.2h2.4M13.4 21.2h2.4" strokeWidth={1.8} opacity={0.75} />
    </>
  ),
  talk: (
    <>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5Z" />
      <circle cx="8.6" cy="10" r=".9" fill="currentColor" />
      <circle cx="12" cy="10" r=".9" fill="currentColor" />
      <circle cx="15.4" cy="10" r=".9" fill="currentColor" />
    </>
  ),
  take: (
    <>
      <path d="M8 12.5V6.8a1.4 1.4 0 0 1 2.8 0V11" />
      <path d="M10.8 10.5V5.4a1.4 1.4 0 0 1 2.8 0V11" />
      <path d="M13.6 11V6.6a1.4 1.4 0 0 1 2.8 0v5.8" />
      <path d="M16.4 9.4a1.4 1.4 0 0 1 2.8 0V14a6.5 6.5 0 0 1-6.5 6.5h-.9a6 6 0 0 1-4.6-2.2l-3-3.7a1.5 1.5 0 0 1 2.3-1.9L8 14.3" />
    </>
  ),
  open: (
    <>
      <path d="M3.5 10.5h17V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19Z" />
      <path d="M3.5 10.5 5 6a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 6l1.5 4.5" />
      <path d="M10 14h4" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5c.6 4.2 2.3 5.9 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.6 5.9-2.3 6.5-6.5Z" fill="currentColor" stroke="none" />
      <path d="M19 15.5c.25 1.6.9 2.25 2.5 2.5-1.6.25-2.25.9-2.5 2.5-.25-1.6-.9-2.25-2.5-2.5 1.6-.25 2.25-.9 2.5-2.5Z" fill="currentColor" stroke="none" />
    </>
  ),
  wave: (
    <>
      <path d="M9 13.5 6.4 9a1.4 1.4 0 0 1 2.4-1.4L11 11.3" />
      <path d="m11 11.3-2.8-4.8A1.4 1.4 0 0 1 10.6 5L13.6 10" />
      <path d="M13.6 10 11.8 7a1.4 1.4 0 0 1 2.4-1.4l3.4 5.8a6 6 0 0 1-2.2 8.2l-.5.3a6 6 0 0 1-7.6-1.5L5 14.4a1.4 1.4 0 0 1 2.1-1.8L9 14" />
      <path d="M17.5 3.5c1.6.6 2.6 1.8 3 3.5M3.5 17.5c.4 1.4 1.3 2.4 2.7 3" />
    </>
  ),
  music: (
    <>
      <path d="M9 17.5V6l10-2v11.5" />
      <circle cx="6.8" cy="17.5" r="2.3" />
      <circle cx="16.8" cy="15.5" r="2.3" />
    </>
  ),
  run: (
    <>
      <circle cx="14.5" cy="4.6" r="1.8" fill="currentColor" stroke="none" />
      <path d="m7 10.5 3.8-2.4 3.4 1.2 2 3.2 2.8.8" />
      <path d="m10.8 8.1-1.6 5.6 3.6 2.3-1.4 4.5" />
      <path d="M9.2 13.7 6.5 17 3.5 17" />
    </>
  ),
  help: (
    <>
      <path d="M9.2 9.2a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.2-1.5 2.2v.6" />
      <circle cx="12" cy="18" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  flower: (
    <>
      <circle cx="12" cy="9" r="2.3" fill="currentColor" stroke="none" />
      <path d="M12 6.7a2.6 2.6 0 1 1 2.4 1.6M14.4 8.3a2.6 2.6 0 1 1-.8 2.9M13.6 11.2a2.6 2.6 0 1 1-3.2 0M10.4 11.2a2.6 2.6 0 1 1-.8-2.9M9.6 8.3A2.6 2.6 0 1 1 12 6.7" />
      <path d="M12 12v8.5M12 17c-1.6-1.8-3.6-2.1-5-1.4 1 1.8 3 2.3 5 1.4ZM12 15.6c1.5-1.6 3.4-1.9 4.8-1.2-1 1.7-2.9 2.1-4.8 1.2Z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
};

export function Icon({ name, size = 24, style, className }: { name: IconName; size?: number; style?: CSSProperties; className?: string }) {
  return (
    <svg
      className={'icon' + (className ? ' ' + className : '')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={style}
    >
      {PATHS[name]}
    </svg>
  );
}
