/** Hand-drawn SVG illustrations for the five lands (world map cards and story intro). */

/** Art for one land, drawn in a 100×100 box. Embeddable inside any <svg>. */
export function WorldArtGroup({ id }: { id: string }) {
  switch (id) {
    case 'enchanted-forest':
      return (
        <g>
          <ellipse cx="50" cy="90" rx="40" ry="7" fill="#000" opacity="0.15" />
          <rect x="44" y="52" width="12" height="36" rx="4" fill="#8a5a3c" />
          <circle cx="50" cy="40" r="26" fill="#4fae55" />
          <circle cx="34" cy="48" r="16" fill="#3f9b4f" />
          <circle cx="66" cy="46" r="17" fill="#62b95a" />
          <circle cx="44" cy="30" r="7" fill="#7cc466" opacity="0.8" />
          <circle cx="40" cy="58" r="3" fill="#ffd27a" />
          <circle cx="62" cy="60" r="3" fill="#ffb3d9" />
          <rect x="72" y="76" width="5" height="11" rx="2" fill="#f6ecd6" />
          <path d="M66 78 Q74.5 62 83 78 Z" fill="#ef6a5a" />
          <circle cx="71" cy="74" r="1.6" fill="#fff" />
          <circle cx="78" cy="73" r="1.6" fill="#fff" />
          <path d="M22 18 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fff6b8" />
        </g>
      );
    case 'candy-village':
      return (
        <g>
          <ellipse cx="50" cy="90" rx="40" ry="7" fill="#000" opacity="0.15" />
          <rect x="22" y="56" width="34" height="30" rx="4" fill="#ffd9ec" />
          <path d="M18 58 L39 36 L60 58 Z" fill="#ff7eb6" />
          <path d="M22 58 L39 40 L56 58" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="4 4" />
          <rect x="33" y="68" width="11" height="18" rx="5" fill="#a0603a" />
          <rect x="72" y="46" width="3.5" height="42" rx="1.5" fill="#fff" />
          <circle cx="73.75" cy="38" r="15" fill="#8ee8ff" />
          <path d="M73.75 38 m-10 0 a10 10 0 1 1 10 10 a6 6 0 1 1 -6 -6 a3 3 0 1 1 3 3" fill="none" stroke="#ff7eb6" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="16" cy="24" r="4" fill="#ffd23f" />
          <circle cx="90" cy="70" r="3" fill="#a9f08c" />
        </g>
      );
    case 'crystal-cave':
      return (
        <g>
          <ellipse cx="50" cy="90" rx="40" ry="7" fill="#000" opacity="0.18" />
          <path d="M30 88 L36 40 L46 28 L52 42 L48 88 Z" fill="#8fd8ff" />
          <path d="M46 28 L52 42 L48 88 L42 88 Z" fill="#5fb8f0" />
          <path d="M50 88 L58 22 L68 12 L74 30 L68 88 Z" fill="#c9b0ff" />
          <path d="M68 12 L74 30 L68 88 L62 88 Z" fill="#9a7cf0" />
          <path d="M66 88 L72 56 L80 48 L84 60 L80 88 Z" fill="#8ee8ff" />
          <path d="M18 88 L22 66 L28 60 L31 70 L29 88 Z" fill="#c9b0ff" />
          <path d="M40 46 l3 -10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <path d="M62 30 l3 -10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <circle cx="86" cy="22" r="3" fill="#fff6b8" />
        </g>
      );
    case 'ocean-kingdom':
      return (
        <g>
          <ellipse cx="50" cy="90" rx="40" ry="7" fill="#000" opacity="0.15" />
          <path d="M16 88 Q18 68 24 74 Q26 60 32 72 Q36 64 36 88 Z" fill="#ff8f8f" />
          <path d="M72 88 Q72 70 78 76 Q84 62 86 88 Z" fill="#ffb36b" />
          <ellipse cx="54" cy="60" rx="22" ry="15" fill="#6bbf6b" />
          <path d="M40 56 L54 48 L68 56 L62 68 L46 68 Z" fill="#4c9d4a" opacity="0.8" />
          <ellipse cx="80" cy="56" rx="8" ry="6.5" fill="#9bdc8a" />
          <circle cx="83" cy="54" r="1.6" fill="#1a2a1a" />
          <ellipse cx="38" cy="72" rx="7" ry="3.5" fill="#9bdc8a" transform="rotate(30 38 72)" />
          <ellipse cx="68" cy="73" rx="7" ry="3.5" fill="#9bdc8a" transform="rotate(-30 68 73)" />
          <circle cx="22" cy="30" r="5" fill="none" stroke="#bff3ff" strokeWidth="2" />
          <circle cx="30" cy="18" r="3" fill="none" stroke="#bff3ff" strokeWidth="2" />
          <circle cx="76" cy="26" r="4" fill="none" stroke="#bff3ff" strokeWidth="2" />
        </g>
      );
    case 'sky-castle':
    default:
      return (
        <g>
          <path d="M8 70 A42 42 0 0 1 92 70" fill="none" stroke="#ff8f8f" strokeWidth="4" />
          <path d="M13 70 A37 37 0 0 1 87 70" fill="none" stroke="#ffd23f" strokeWidth="4" />
          <path d="M18 70 A32 32 0 0 1 82 70" fill="none" stroke="#8fd8ff" strokeWidth="4" />
          <rect x="34" y="40" width="32" height="36" fill="#fff4dc" />
          <rect x="28" y="30" width="10" height="46" fill="#ffe9c0" />
          <rect x="62" y="30" width="10" height="46" fill="#ffe9c0" />
          <path d="M26 30 L33 16 L40 30 Z M60 30 L67 16 L74 30 Z M40 40 L50 22 L60 40 Z" fill="#9a7cf0" />
          <rect x="45" y="58" width="10" height="18" rx="5" fill="#9a7cf0" />
          <ellipse cx="50" cy="80" rx="36" ry="10" fill="#ffffff" />
          <circle cx="24" cy="78" r="10" fill="#ffffff" />
          <circle cx="76" cy="78" r="11" fill="#ffffff" />
          <path d="M50 10 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" fill="#ffd23f" />
        </g>
      );
  }
}

export function WorldArt({ id, size = 100 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <WorldArtGroup id={id} />
    </svg>
  );
}
