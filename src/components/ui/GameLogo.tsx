/**
 * "ANET – The Magical Adventure" title logo.
 * Layered lettering (glossy gold fill, white rim, thick purple outline, 3D drop shadow), staggered
 * letter bounce, twinkling sparkles and a curved ribbon banner for the subtitle.
 */
const TITLE = 'ANET';
const TILT = [-6, 3, -3, 5];

function Sparkle({ className, size }: { className: string; size: number }) {
  return (
    <svg className={'logo-sparkle ' + className} width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <path d="M20 0 C21.5 13 27 18.5 40 20 C27 21.5 21.5 27 20 40 C18.5 27 13 21.5 0 20 C13 18.5 18.5 13 20 0 Z" fill="#fffbe0" />
      <circle cx="20" cy="20" r="5" fill="#ffffff" />
    </svg>
  );
}

export function GameLogo() {
  return (
    <div className="game-logo passthrough" role="img" aria-label="Anet: The Magical Adventure">
      <div className="logo-word">
        {TITLE.split('').map((c, i) => (
          <span key={i} className="logo-letter" data-l={c} style={{ animationDelay: `${i * 0.14}s`, ['--tilt' as string]: `${TILT[i % TILT.length]}deg` }}>
            <span className="logo-fill">{c}</span>
          </span>
        ))}
        <Sparkle className="s1" size={46} />
        <Sparkle className="s2" size={26} />
        <Sparkle className="s3" size={20} />
      </div>
      <svg className="logo-ribbon" viewBox="0 0 560 110" aria-hidden>
        <defs>
          <linearGradient id="ribbonFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a98bff" />
            <stop offset="0.55" stopColor="#7b5cff" />
            <stop offset="1" stopColor="#5b3fe0" />
          </linearGradient>
          <path id="ribbonArc" d="M70 74 Q280 34 490 74" />
        </defs>
        {/* folded tails */}
        <path d="M20 58 L92 50 L98 98 L26 104 L44 81 Z" fill="#4a2fc0" />
        <path d="M540 58 L468 50 L462 98 L534 104 L516 81 Z" fill="#4a2fc0" />
        <path d="M92 50 L110 64 L98 98 Z M468 50 L450 64 L462 98 Z" fill="#2f1a8a" />
        {/* main band (curved) */}
        <path d="M90 42 Q280 2 470 42 L462 94 Q280 54 98 94 Z" fill="url(#ribbonFill)" stroke="#2f1a8a" strokeWidth="4" strokeLinejoin="round" />
        <path d="M100 50 Q280 12 460 50" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="3" />
        <text className="logo-ribbon-text" textAnchor="middle">
          <textPath href="#ribbonArc" startOffset="50%">
            The Magical Adventure
          </textPath>
        </text>
      </svg>
    </div>
  );
}
