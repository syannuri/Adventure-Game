/**
 * Painted golden-hour backdrop for the menus (pure SVG + CSS animation: no WebGL, so it is light
 * and perfectly smooth on phones). Anet stands on the meadow, breathing, blinking and waving.
 */
import { memo, useMemo } from 'react';
import type { Screen } from '../../systems/store';

// deterministic pseudo-random so the meadow looks the same every time
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FLOWER_COLORS = ['#ffb3d1', '#ffffff', '#ffe27a', '#d9c2ff', '#ff9ec7'];

const Scene = memo(function Scene() {
  const { flowers, sparkles, trees } = useMemo(() => {
    const r = rng(7);
    const flowers = Array.from({ length: 70 }, () => {
      const x = r() * 1600;
      const y = 770 + r() * 130;
      return { x, y, s: 4 + r() * 5 + (y - 770) * 0.04, c: FLOWER_COLORS[Math.floor(r() * FLOWER_COLORS.length)] };
    });
    const sparkles = Array.from({ length: 22 }, (_, i) => ({ x: 120 + r() * 1360, y: 260 + r() * 520, s: 1.6 + r() * 2.6, d: (i * 0.37) % 4 }));
    const trees = Array.from({ length: 26 }, (_, i) => ({ x: i * 64 + r() * 30 - 20, r: 34 + r() * 30, h: 600 + r() * 30 }));
    return { flowers, sparkles, trees };
  }, []);
  return (
    <svg className="mb-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="mbSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f8fd8" />
          <stop offset="0.32" stopColor="#b6a3e6" />
          <stop offset="0.56" stopColor="#ffc3a6" />
          <stop offset="0.7" stopColor="#ffdca0" />
          <stop offset="1" stopColor="#ffeec2" />
        </linearGradient>
        <radialGradient id="mbSun" cx="930" cy="560" r="560" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff7d6" stopOpacity="1" />
          <stop offset="0.18" stopColor="#ffe7a6" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#ffc98a" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ffc98a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mbCloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf2" />
          <stop offset="1" stopColor="#ffc6c4" />
        </linearGradient>
        <linearGradient id="mbHill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b2dc7c" />
          <stop offset="0.5" stopColor="#7cc461" />
          <stop offset="1" stopColor="#4fa255" />
        </linearGradient>
        <linearGradient id="mbFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c3a9d8" />
          <stop offset="1" stopColor="#e8c3c0" />
        </linearGradient>
        <linearGradient id="mbMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fb08f" />
          <stop offset="1" stopColor="#a9b99a" />
        </linearGradient>
        <radialGradient id="mbGlowMush" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#bff6ff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#7fe3ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mbFairy" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.35" stopColor="#e7dbff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#c9b6ff" stopOpacity="0" />
        </radialGradient>
        <path id="mbSpark" d="M0 -1C.12 -.33 .33 -.12 1 0 .33 .12 .12 .33 0 1 -.12 .33 -.33 .12 -1 0 -.33 -.12 -.12 -.33 0 -1Z" />
      </defs>

      <rect width="1600" height="900" fill="url(#mbSky)" />
      {/* sun, glow and slowly turning rays */}
      <circle cx="930" cy="560" r="560" fill="url(#mbSun)" />
      <g className="mb-rays" opacity="0.13" fill="#fff3c4">
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d="M930 560 L912 -200 L948 -200 Z" transform={`rotate(${i * 36 - 90} 930 560)`} />
        ))}
      </g>
      <circle cx="930" cy="560" r="64" fill="#fffbe8" />

      {/* soft drifting clouds lit pink from below */}
      {[
        { x: 160, y: 150, s: 1.15, d: 0 },
        { x: 1180, y: 110, s: 0.9, d: -14 },
        { x: 640, y: 230, s: 0.7, d: -28 },
        { x: 1380, y: 300, s: 0.6, d: -7 },
      ].map((c, i) => (
        <g key={i} className="mb-cloud" style={{ animationDelay: `${c.d}s` }}>
          <g transform={`translate(${c.x} ${c.y}) scale(${c.s})`} fill="url(#mbCloud)" opacity="0.92">
            <ellipse cx="0" cy="30" rx="130" ry="34" />
            <circle cx="-60" cy="12" r="44" />
            <circle cx="0" cy="-8" r="60" />
            <circle cx="66" cy="10" r="46" />
          </g>
        </g>
      ))}

      {/* far mountains in lavender haze */}
      <path d="M0 610 L130 520 L240 575 L380 470 L520 560 L640 505 L760 585 L900 520 L1040 590 L1180 480 L1320 560 L1460 500 L1600 570 V700 H0Z" fill="url(#mbFar)" opacity="0.85" />
      {/* misty mid forest */}
      <g fill="url(#mbMid)" opacity="0.9">
        <rect x="0" y="640" width="1600" height="120" />
        {trees.map((t, i) => (
          <circle key={i} cx={t.x} cy={t.h} r={t.r} />
        ))}
      </g>
      <rect x="0" y="600" width="1600" height="160" fill="#ffe6b4" opacity="0.22" />

      {/* near tree clusters framing the scene, rim-lit by the sun */}
      {[
        { x: 70, flip: 1 },
        { x: 1530, flip: -1 },
      ].map((g, i) => (
        <g key={i} transform={`translate(${g.x} 0) scale(${g.flip} 1)`}>
          <rect x="-16" y="520" width="34" height="260" rx="10" fill="#6b4a36" />
          <circle cx="0" cy="470" r="120" fill="#3f8a4c" />
          <circle cx="90" cy="520" r="90" fill="#4c9a52" />
          <circle cx="-70" cy="560" r="80" fill="#3a7f46" />
          <circle cx="40" cy="390" r="80" fill="#4fa557" />
          <path d="M60 330 A80 80 0 0 1 120 400" stroke="#ffe7a0" strokeWidth="8" fill="none" opacity="0.6" strokeLinecap="round" />
          <path d="M150 470 A90 90 0 0 1 178 540" stroke="#ffe7a0" strokeWidth="7" fill="none" opacity="0.55" strokeLinecap="round" />
        </g>
      ))}

      {/* meadow hill with a sunlit rim and a winding path */}
      <path d="M0 760 C280 700 520 720 800 735 C1080 750 1320 690 1600 720 V900 H0Z" fill="url(#mbHill)" />
      <path d="M0 760 C280 700 520 720 800 735 C1080 750 1320 690 1600 720" stroke="#ffeaa6" strokeWidth="5" fill="none" opacity="0.8" />
      <path d="M720 900 C740 840 820 800 880 770 C920 752 960 742 990 738 L1010 740 C980 752 950 765 925 785 C880 820 860 860 880 900Z" fill="#f2d79c" opacity="0.9" />

      {/* mushrooms */}
      {[
        { x: 300, y: 805, s: 1.1, c: '#ef6a5a' },
        { x: 355, y: 822, s: 0.7, c: '#f59a4e' },
        { x: 1270, y: 800, s: 0.9, c: '#ef6a5a' },
      ].map((m, i) => (
        <g key={i} transform={`translate(${m.x} ${m.y}) scale(${m.s})`}>
          <rect x="-9" y="-30" width="18" height="34" rx="7" fill="#f6ecd6" />
          <path d="M-38 -26 Q0 -78 38 -26 Z" fill={m.c} />
          <circle cx="-14" cy="-44" r="6" fill="#fff" />
          <circle cx="12" cy="-50" r="5" fill="#fff" />
          <circle cx="22" cy="-34" r="4" fill="#fff" />
        </g>
      ))}
      <g transform="translate(1180 820)">
        <circle cx="0" cy="-26" r="48" fill="url(#mbGlowMush)" className="mb-pulse" />
        <rect x="-6" y="-24" width="12" height="26" rx="5" fill="#eef6ff" />
        <path d="M-26 -20 Q0 -56 26 -20Z" fill="#8ee8ff" />
      </g>

      {/* flowers */}
      {flowers.map((f, i) => (
        <g key={i}>
          <circle cx={f.x} cy={f.y} r={f.s} fill={f.c} />
          <circle cx={f.x} cy={f.y} r={f.s * 0.35} fill="#ffd36b" />
        </g>
      ))}

      {/* Lumi the fairy, floating near the sun */}
      <g className="mb-fairy">
        <circle cx="560" cy="330" r="46" fill="url(#mbFairy)" />
        <ellipse cx="546" cy="322" rx="14" ry="8" fill="#e8f9ff" opacity="0.9" transform="rotate(-30 546 322)" />
        <ellipse cx="574" cy="322" rx="14" ry="8" fill="#e8f9ff" opacity="0.9" transform="rotate(30 574 322)" />
        <circle cx="560" cy="324" r="8" fill="#fde3d5" />
        <path d="M553 331 L567 331 L563 348 L557 348Z" fill="#b8a2ff" />
        <circle cx="560" cy="318" r="7" fill="#ffa9d2" />
      </g>

      {/* twinkling fireflies */}
      {sparkles.map((s, i) => (
        <use key={i} href="#mbSpark" className="mb-twinkle" style={{ animationDelay: `${s.d}s` }} transform={`translate(${s.x} ${s.y}) scale(${s.s * 3})`} fill="#fff6c8" />
      ))}
    </svg>
  );
});

/** Anet, painted in the same style as her 3D model, lit by the low sun from the left. */
const Anet = memo(function Anet() {
  return (
    <svg className="mb-anet" viewBox="0 0 320 560" aria-hidden>
      <defs>
        <linearGradient id="anHair" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#6e4c3c" />
          <stop offset="0.35" stopColor="#3a2b25" />
          <stop offset="1" stopColor="#1f1714" />
        </linearGradient>
        <linearGradient id="anSkin" x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0" stopColor="#ffe8d6" />
          <stop offset="1" stopColor="#f3cfb6" />
        </linearGradient>
        <linearGradient id="anJacket" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#ffb468" />
          <stop offset="0.5" stopColor="#ef8a3e" />
          <stop offset="1" stopColor="#d26326" />
        </linearGradient>
        <radialGradient id="anIris" cx="0.45" cy="0.42" r="0.6">
          <stop offset="0" stopColor="#ffc06a" />
          <stop offset="0.55" stopColor="#c46b1f" />
          <stop offset="1" stopColor="#4a230b" />
        </radialGradient>
        <linearGradient id="anPack" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#cdb791" />
          <stop offset="1" stopColor="#9b8463" />
        </linearGradient>
      </defs>

      <ellipse cx="160" cy="532" rx="92" ry="14" fill="#2b4a2b" opacity="0.28" />

      <g className="an-breathe">
        {/* backpack behind the body */}
        <rect x="74" y="258" width="172" height="130" rx="34" fill="url(#anPack)" />
        <rect x="90" y="244" width="140" height="40" rx="18" fill="#9b8463" />

        {/* legs, socks, hiking boots */}
        <g>
          <rect x="118" y="408" width="32" height="70" rx="15" fill="url(#anSkin)" />
          <rect x="170" y="408" width="32" height="70" rx="15" fill="url(#anSkin)" />
          <rect x="114" y="462" width="40" height="30" rx="12" fill="#efe6d4" />
          <rect x="166" y="462" width="40" height="30" rx="12" fill="#e6dcc8" />
          <path d="M118 470h32M118 478h32M170 470h32M170 478h32" stroke="#d6cab3" strokeWidth="2" />
          <path d="M104 520 Q102 486 134 486 Q158 486 160 506 L160 520Z" fill="#d29b6c" />
          <path d="M160 520 L160 506 Q162 486 188 486 Q220 486 218 520Z" fill="#b98457" />
          <rect x="100" y="514" width="62" height="12" rx="6" fill="#f2e7d4" />
          <rect x="158" y="514" width="62" height="12" rx="6" fill="#e8dcc6" />
        </g>

        {/* cream shorts */}
        <path d="M108 372 H212 L218 424 Q190 432 166 422 L160 404 L154 422 Q130 432 102 424Z" fill="#f4ecdc" />

        {/* left arm (her right) relaxed */}
        <path d="M96 268 Q70 300 72 352" stroke="url(#anJacket)" strokeWidth="34" strokeLinecap="round" fill="none" />
        <rect x="56" y="346" width="32" height="14" rx="7" fill="#c8622a" />
        <circle cx="72" cy="372" r="15" fill="url(#anSkin)" />

        {/* jacket body */}
        <path d="M96 262 Q160 236 224 262 Q238 320 228 384 Q160 398 92 384 Q82 320 96 262Z" fill="url(#anJacket)" />
        <path d="M92 380 Q160 394 228 380 L228 392 Q160 406 92 392Z" fill="#c8622a" />
        <path d="M160 262 V392" stroke="#d7d7de" strokeWidth="4" />
        <rect x="104" y="318" width="34" height="26" rx="6" fill="#ec8238" stroke="#c8622a" strokeWidth="3" />
        <rect x="182" y="318" width="34" height="26" rx="6" fill="#e27932" stroke="#c8622a" strokeWidth="3" />
        {/* backpack straps */}
        <path d="M120 262 Q114 320 122 392" stroke="#7f7a70" strokeWidth="13" fill="none" strokeLinecap="round" />
        <path d="M200 262 Q206 320 198 392" stroke="#6e6a62" strokeWidth="13" fill="none" strokeLinecap="round" />
        <rect x="116" y="300" width="88" height="8" rx="4" fill="#7f7a70" />
        <rect x="150" y="296" width="20" height="16" rx="4" fill="#3a3936" />
        {/* hood collar */}
        <path d="M118 258 Q160 282 202 258 Q200 246 160 250 Q120 246 118 258Z" fill="#c8622a" />
        {/* warm sunlit rim on the left */}
        <path d="M98 270 Q86 320 94 380" stroke="#ffe0a0" strokeWidth="5" fill="none" opacity="0.7" strokeLinecap="round" />

        {/* right arm (her left) waving */}
        <g className="an-wave">
          <path d="M222 268 Q262 238 270 186" stroke="url(#anJacket)" strokeWidth="34" strokeLinecap="round" fill="none" />
          <rect x="254" y="170" width="32" height="14" rx="7" fill="#c8622a" transform="rotate(-12 270 177)" />
          {/* open waving hand: palm + thumb */}
          <ellipse cx="272" cy="152" rx="17" ry="19" fill="url(#anSkin)" />
          <ellipse cx="256" cy="160" rx="7" ry="10" fill="#f3cfb6" transform="rotate(-35 256 160)" />
        </g>

        {/* hair (back), head, face */}
        <g className="an-hair">
          <path d="M66 170 Q58 70 160 60 Q262 70 254 170 Q268 240 252 296 Q238 310 226 296 Q218 312 204 300 L116 300 Q102 312 94 296 Q82 310 68 296 Q52 240 66 170Z" fill="url(#anHair)" />
          <path d="M80 214 Q72 250 84 286 M240 214 Q248 250 236 286" stroke="#7d5b48" strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round" />
        </g>
        <ellipse cx="160" cy="170" rx="92" ry="88" fill="url(#anSkin)" />
        {/* straight-cut bangs */}
        <path d="M70 168 Q62 66 160 62 Q258 66 250 168 Q244 136 226 128 Q160 120 94 128 Q76 136 70 168Z" fill="url(#anHair)" />
        <path d="M96 126 Q160 118 224 126" stroke="#2a201b" strokeWidth="3" opacity="0.5" fill="none" />
        <path d="M108 86 Q150 68 206 76" stroke="#a78a78" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M70 168 Q60 110 92 82" stroke="#ffd79a" strokeWidth="4" fill="none" opacity="0.55" strokeLinecap="round" />

        {/* eyes */}
        <g>
          {[118, 202].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="168" rx="27" ry="30" fill="#fffdf8" />
              <circle cx={x + 2} cy="172" r="22" fill="url(#anIris)" />
              <circle cx={x + 2} cy="172" r="10" fill="#140804" />
              <circle cx={x - 7} cy="160" r="7" fill="#fff" />
              <circle cx={x + 9} cy="182" r="3" fill="#fff" />
              <path d={`M${x - 30} 158 Q${x} 128 ${x + 30} 158`} stroke="#1e1512" strokeWidth="6" fill="none" strokeLinecap="round" />
            </g>
          ))}
          <path d="M88 158 L80 150 M232 158 L240 150" stroke="#1e1512" strokeWidth="4" strokeLinecap="round" />
        </g>
        {/* eyelids: shown for a moment to blink */}
        <g className="an-lids">
          {[118, 202].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="168" rx="29" ry="32" fill="#f7d7c2" />
              <path d={`M${x - 26} 172 Q${x} 184 ${x + 26} 172`} stroke="#1e1512" strokeWidth="5" fill="none" strokeLinecap="round" />
            </g>
          ))}
        </g>
        <ellipse cx="96" cy="206" rx="18" ry="10" fill="#ff9b8f" opacity="0.38" />
        <ellipse cx="224" cy="206" rx="18" ry="10" fill="#ff9b8f" opacity="0.38" />
        <ellipse cx="160" cy="200" rx="6" ry="4" fill="#efc2a6" />
        <path d="M142 218 Q160 232 178 218" stroke="#c4655c" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
});

export function MenuBackdrop({ screen }: { screen: Screen }) {
  return (
    <div className={'menu-backdrop' + (screen === 'menu' ? '' : ' dim')} aria-hidden>
      <Scene />
      {screen === 'menu' && <Anet />}
    </div>
  );
}
