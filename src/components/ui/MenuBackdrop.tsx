/**
 * Painted golden-hour backdrop for the menus (SVG + CSS animation, shown instantly). Anet stands on
 * the meadow, breathing, blinking and waving. A moment later a transparent 3D layer fades in over the
 * painted sky: the floating world islands, clouds, a fairy and more (see MenuScene/Menu3D).
 */
import { Component, Suspense, lazy, memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useGame, type Screen } from '../../systems/store';
import { useT } from '../../i18n/useT';
import { WORLDS } from '../../data/worlds';
import { audio } from '../audio/audioEngine';
import { sparkleBurst } from './sparkleBurst';

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
      {/* breathing halo around the sun */}
      <circle className="mb-halo" cx="930" cy="560" r="150" fill="#fff4c8" opacity="0.5" />
      <circle className="mb-halo2" cx="930" cy="560" r="96" fill="#fffbe2" opacity="0.7" />
      <circle cx="930" cy="560" r="64" fill="#fffbe8" />
      {/* god rays: soft beams falling across the meadow, each fading in and out on its own rhythm */}
      <g className="mb-shafts" fill="#fff1c0">
        <path className="mb-shaft s1" d="M930 560 L120 900 L330 900 Z" />
        <path className="mb-shaft s2" d="M930 560 L520 900 L700 900 Z" />
        <path className="mb-shaft s3" d="M930 560 L1180 900 L1330 900 Z" />
        <path className="mb-shaft s4" d="M930 560 L1500 900 L1600 820 Z" />
      </g>

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

      {/* flowers swaying in the evening breeze */}
      <g className="mb-sway">
      {flowers.map((f, i) => (
        <g key={i}>
          <circle cx={f.x} cy={f.y} r={f.s} fill={f.c} />
          <circle cx={f.x} cy={f.y} r={f.s * 0.35} fill="#ffd36b" />
        </g>
      ))}
      </g>

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

/**
 * Cover figure of Anet (cut out from the official illustration) with dynamic sunlight:
 * a warm light wash from the sun side that brightens and fades with the sun's glow,
 * a soft rim light, gentle idle motion and a contact shadow.
 */
const COVER = { small: './cover/anet-720.webp', large: './cover/anet-1300.webp' };

/** Anet on the main menu: tap her and she hops, sparkles and says something; she also chats on her own. */
function AnetCover() {
  const t = useT();
  const save = useGame((s) => s.save);
  const next = WORLDS.find((w) => w.built && !save.completedWorlds.includes(w.id)) ?? WORLDS[0];
  const lines = t.menu.anetLines(t.worlds[next.id]?.name ?? next.name);
  const [line, setLine] = useState<string | null>(null);
  const [hop, setHop] = useState(0);
  const idx = useRef(0);
  const hideT = useRef(0);
  const say = () => {
    setLine(lines[idx.current++ % lines.length]);
    window.clearTimeout(hideT.current);
    hideT.current = window.setTimeout(() => setLine(null), 3600);
  };
  const sayRef = useRef(say);
  sayRef.current = say;
  useEffect(() => {
    const first = window.setTimeout(() => sayRef.current(), 1200);
    const iv = window.setInterval(() => sayRef.current(), 8000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(iv);
      window.clearTimeout(hideT.current);
    };
  }, []);
  return (
    <div
      className={'cover-anet' + (hop % 2 ? ' hop-a' : hop ? ' hop-b' : '')}
      onClick={(e) => {
        audio.unlock();
        audio.sfx('jump', { volume: 0.7 });
        sparkleBurst(e.clientX, e.clientY);
        setHop((h) => h + 1);
        say();
      }}
    >
      {line && (
        <div key={line} className="cover-bubble">
          {line}
        </div>
      )}
      <div className="cover-shadow" />
      <div className="cover-figure">
        <img
          src={COVER.small}
          srcSet={`${COVER.small} 382w, ${COVER.large} 690w`}
          sizes="(min-height: 700px) 40vh, 30vh"
          alt=""
          draggable={false}
          decoding="async"
          fetchPriority="high"
        />
        {/* warm sunlight wash, masked to Anet's shape */}
        <div className="cover-sunlight" style={{ WebkitMaskImage: `url(${COVER.small})`, maskImage: `url(${COVER.small})` }} />
      </div>
    </div>
  );
}

/** A few birds crossing the evening sky. */
const Birds = memo(function Birds() {
  return (
    <div className="mb-birds">
      {[
        [16, 28, 0],
        [22, 34, 11],
        [12, 42, 22],
      ].map(([top, dur, delay], i) => (
        <svg key={i} viewBox="0 0 24 12" style={{ top: `${top}%`, animationDuration: `${dur}s`, animationDelay: `-${delay}s` }}>
          <path d="M1 7 Q6 1 12 7 Q18 1 23 7" stroke="#5a4a7a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
});

/** Floating pollen / dust motes glowing in the low sun. */
const Motes = memo(function Motes() {
  const motes = useMemo(() => {
    const r = rng(23);
    return Array.from({ length: 26 }, () => ({ x: r() * 100, y: 35 + r() * 60, s: 2 + r() * 4, d: r() * 9, t: 7 + r() * 8, dx: (r() - 0.5) * 60 }));
  }, []);
  return (
    <div className="mb-motes">
      {motes.map((m, i) => (
        <span
          key={i}
          style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.s, height: m.s, animationDelay: `-${m.d}s`, animationDuration: `${m.t}s`, ['--dx' as string]: `${m.dx}px` }}
        />
      ))}
    </div>
  );
});

/** Lens flare: soft discs on the line from the sun across the screen, drifting slowly. */
function LensFlare() {
  return (
    <div className="mb-flare">
      <i className="f1" />
      <i className="f2" />
      <i className="f3" />
      <i className="f4" />
    </div>
  );
}

/** The 3D layer (islands, clouds, fairy…) loads after the painted menu has appeared. */
const Menu3D = lazy(() => import('../worlds/MenuScene/Menu3D'));

/** If WebGL is not available the painted menu simply stays as it is. */
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    document.documentElement.classList.remove('menu3d');
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function Layer3D() {
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (!webglOk() || new URLSearchParams(location.search).has('flat')) return;
    const id = window.setTimeout(() => setGo(true), 350);
    return () => window.clearTimeout(id);
  }, []);
  if (!go) return null;
  return (
    <Quiet>
      <Suspense fallback={null}>
        <Menu3D />
      </Suspense>
    </Quiet>
  );
}

export function MenuBackdrop({ screen }: { screen: Screen }) {
  return (
    <div className={'menu-backdrop' + (screen === 'menu' ? '' : ' dim')} aria-hidden>
      <div className="mb-parallax">
        <Scene />
      </div>
      <Layer3D />
      <Birds />
      <div className="mb-warmth" />
      <LensFlare />
      <Motes />
      {screen === 'menu' && <AnetCover />}
    </div>
  );
}
