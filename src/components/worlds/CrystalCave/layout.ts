/**
 * Crystal Cave layout: a huge cavern under the mountain. Floor height, walls, the glowing lake,
 * paths, quest positions, the light-beam puzzle, collectibles, platforms and decoration.
 *
 * Map (top view, -z is "north"):
 *   south: the tunnel mouth where Anet arrives
 *   middle: the Heart Crystal on its dais, and Drako the baby dragon
 *   north-west: the light puzzle (sunbeam from a hole in the roof, three mirror crystals)
 *   west: the glowing lake       east: stone pillars to jump on, a high ledge
 */
import { lerp, mulberry32, smoothstep } from '../../../utils/math';
import type { CircleCollider, Platform, WorldPhysics } from '../../../systems/physics';
import type { Spot } from '../EnchantedForest/layout';

export const SPAWN = { x: 0, z: 22, facing: Math.PI };
export const HEART = { x: 0, z: -6, r: 1.6 };
export const DRAKO_POS = { x: 2.9, z: -2.4 };
export const PIP_POS = { x: -4.5, z: 13 };
export const LAKE = { x: -17, z: 7, r: 5.5 };
export const LAKE_LEVEL = -0.45;
export const CAVE_R = 31; // where the walls start rising
export const ROOF_H = 24;

/** Light puzzle: sunbeam source, three mirror crystals, the Heart Crystal is the target. */
export const BEAM_Y = 1.15;
export const SOURCE = { x: -14, z: -16 };
export const MIRRORS = [
  { x: -8, z: -16 },
  { x: -8, z: -10 },
  { x: 0, z: -10 },
];
/** direction index: 0 north (-z), 1 east (+x), 2 south (+z), 3 west (-x) */
export const DIRS: [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
export const MIRROR_TARGET = [2, 1, 2]; // south, east, south
export const MIRROR_START = [1, 0, 3];

export const PATHS: [number, number][][] = [
  [
    [0, 28],
    [0.5, 18],
    [-0.5, 8],
    [0, 0],
  ],
  [
    [-1, 6],
    [-7, 6],
    [-11, 8],
  ],
  [
    [1, 4],
    [7, 3],
    [12, 1],
    [18, -2],
  ],
  [
    [-2, -1],
    [-6, -4],
    [-8, -8],
  ],
  [
    [2, -9],
    [5, -15],
    [6, -22],
  ],
  [
    [2, 8],
    [8, 12],
    [13, 15],
  ],
];

function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}
export function distToPath(x: number, z: number) {
  let d = Infinity;
  for (const p of PATHS) for (let i = 0; i < p.length - 1; i++) d = Math.min(d, distToSegment(x, z, p[i][0], p[i][1], p[i + 1][0], p[i + 1][1]));
  return d;
}

/** inside the light-puzzle area (kept flat so the beam runs straight) */
const inPuzzle = (x: number, z: number) => x > -17 && x < 3 && z > -19 && z < -7;

export function terrainHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  let h = Math.sin(x * 0.13 + 1.2) * 0.35 + Math.cos(z * 0.11) * 0.3 + Math.sin((x + z) * 0.27) * 0.12;
  // flat floor around the heart and in the puzzle
  h *= lerp(0.1, 1, smoothstep(4, 10, Math.hypot(x - HEART.x, z - HEART.z)));
  if (inPuzzle(x, z)) h *= 0.15;
  // the dais the Heart Crystal stands on
  h += (1 - smoothstep(HEART.r + 0.2, HEART.r + 0.9, Math.hypot(x - HEART.x, z - HEART.z))) * 0.35;
  // steep rocky walls all around
  h += smoothstep(CAVE_R - 2, CAVE_R + 8, r) * 14 + smoothstep(CAVE_R, CAVE_R + 3, r) * Math.sin(Math.atan2(z, x) * 9) * 1.2;
  // the tunnel mouth in the south stays open
  h -= (1 - smoothstep(4, 8, Math.abs(x))) * smoothstep(CAVE_R - 4, CAVE_R + 4, z) * 10;
  // the lake basin
  const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
  h = lerp(h, -1.4, 1 - smoothstep(LAKE.r * 0.55, LAKE.r + 1.8, dl));
  return h;
}

// --------------------------------------------------------------------- platforms

export const PLATFORM_DEFS = [
  // stone pillars in the east, getting taller: a crystal waits on the last one
  { x: 9.5, z: -4, r: 1.0, h: 0.8 },
  { x: 11.8, z: -5.8, r: 1.0, h: 1.6 },
  { x: 14.4, z: -5.0, r: 1.2, h: 2.4 },
  // steps up to the high ledge in the north-east
  { x: 14, z: -11, r: 1.0, h: 0.9 },
  { x: 15.8, z: -13.2, r: 1.0, h: 1.7 },
  { x: 18.2, z: -14.6, r: 1.7, h: 2.6 },
];
export const PLATFORMS: Platform[] = PLATFORM_DEFS.map((p) => ({ x: p.x, z: p.z, r: p.r, top: terrainHeight(p.x, p.z) + p.h }));
const top = (i: number) => PLATFORMS[i].top;

// --------------------------------------------------------------------- quest items

export const CRYSTALS: Spot[] = [
  { id: 'cr-pillar', x: 14.4, z: -5.0, y: top(2) + 1.0, abs: true },
  { id: 'cr-lake', x: -11.2, z: 11.5, y: 1.0 },
  { id: 'cr-mushroom', x: 15, z: 16, y: 1.0 },
  { id: 'cr-ledge', x: 18.2, z: -14.6, y: top(5) + 1.0, abs: true },
  { id: 'cr-north', x: 5.5, z: -24, y: 1.0 },
];

export const CAVE_CHESTS: Spot[] = [
  { id: 'chest-cave-w', x: -25, z: -6, y: 0 },
  { id: 'chest-cave-e', x: 25, z: 7, y: 0 },
  { id: 'chest-cave-s', x: -9, z: 24, y: 0 },
];

function along(prefix: string, pts: [number, number][], count: number): Spot[] {
  const out: Spot[] = [];
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    seg.push(l);
    total += l;
  }
  for (let k = 0; k < count; k++) {
    let d = ((k + 0.5) / count) * total;
    let i = 0;
    while (i < seg.length - 1 && d > seg[i]) {
      d -= seg[i];
      i++;
    }
    const t = d / seg[i];
    out.push({ id: `${prefix}-${k}`, x: lerp(pts[i][0], pts[i + 1][0], t), z: lerp(pts[i][1], pts[i + 1][1], t), y: 0.75 });
  }
  return out;
}

/** small gems (the cave's coins) */
export const GEMS: Spot[] = [
  ...along('gem-a', [[0.3, 17], [-0.3, 9]], 4),
  ...along('gem-b', [[-2, 6], [-10, 7.5]], 4),
  ...along('gem-c', [[3, 3.6], [16, -1.4]], 5),
  ...along('gem-d', [[3, -11], [6, -21]], 4),
  ...along('gem-e', [[3, 9], [12, 14.5]], 3),
];

// --------------------------------------------------------------------- decoration

const KEEP_CLEAR: { x: number; z: number; r: number }[] = [
  { x: HEART.x, z: HEART.z, r: 5 },
  { x: DRAKO_POS.x, z: DRAKO_POS.z, r: 2 },
  { x: PIP_POS.x, z: PIP_POS.z, r: 2 },
  { x: SPAWN.x, z: SPAWN.z, r: 4 },
  { x: LAKE.x, z: LAKE.z, r: LAKE.r + 1.5 },
  ...CRYSTALS.map((s) => ({ x: s.x, z: s.z, r: 3 })),
  ...CAVE_CHESTS.map((s) => ({ x: s.x, z: s.z, r: 2.2 })),
  ...PLATFORM_DEFS.map((p) => ({ x: p.x, z: p.z, r: p.r + 1.5 })),
];
const clearAt = (x: number, z: number, extra = 0) =>
  KEEP_CLEAR.every((k) => Math.hypot(x - k.x, z - k.z) > k.r + extra) && distToPath(x, z) > 2.2 + extra && !(x > -18 && x < 4 && z > -20 && z < -6);

export interface Prop {
  x: number;
  z: number;
  s: number;
  c: number;
  rot: number;
}

function place(seed: number, count: number, rMin: number, rMax: number, gap: number, minDist: number, sMin: number, sMax: number): Prop[] {
  const rnd = mulberry32(seed);
  const out: Prop[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * (rMax - rMin) + rMin;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const s = sMin + rnd() * (sMax - sMin);
    if (!clearAt(x, z, gap)) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < minDist * (o.s + s) * 0.5)) continue;
    out.push({ x, z, s, c: rnd(), rot: rnd() * Math.PI * 2 });
  }
  return out;
}

/** big crystal clusters (some against the walls, some in the cave) */
export const CLUSTERS = [...place(201, 26, 8, 27, 0.6, 3.4, 0.9, 1.7), ...place(202, 40, 28, 33, 0, 3, 1.4, 2.6)];
export const STALAGMITES = place(203, 34, 6, 29, 0.4, 2.4, 0.7, 1.6);
export const CAVE_MUSHROOMS = [...place(204, 18, 5, 28, 0.2, 1.6, 0.6, 1.2), ...Array.from({ length: 9 }, (_, i) => ({ x: 15 + Math.cos(i * 0.7) * (2 + (i % 3)), z: 16 + Math.sin(i * 0.7) * (2 + (i % 3)), s: 0.9 + (i % 3) * 0.35, c: i / 9, rot: i }))].filter((m) => Math.hypot(m.x - 15, m.z - 16) > 1.3 || m.s < 0.7);
export const ROCKS = place(205, 22, 6, 29, 0.6, 2.6, 0.6, 1.3);
export const GLOW_DUST = place(206, 260, 0, 30, -2.0, 0, 0.5, 1.2);

export function buildCavePhysics(): WorldPhysics {
  const colliders: CircleCollider[] = [
    ...CLUSTERS.filter((c) => Math.hypot(c.x, c.z) < 29).map((c) => ({ x: c.x, z: c.z, r: 0.55 * c.s })),
    ...STALAGMITES.map((s) => ({ x: s.x, z: s.z, r: 0.4 * s.s })),
    ...ROCKS.map((r) => ({ x: r.x, z: r.z, r: 0.55 * r.s })),
    { x: LAKE.x, z: LAKE.z, r: LAKE.r - 1.0, water: true },
    { x: HEART.x, z: HEART.z, r: 0.9 },
    { x: DRAKO_POS.x, z: DRAKO_POS.z, r: 0.5 },
    { x: PIP_POS.x, z: PIP_POS.z, r: 0.4 },
    { x: SOURCE.x, z: SOURCE.z, r: 0.5 },
    ...MIRRORS.map((m) => ({ x: m.x, z: m.z, r: 0.45 })),
    ...CAVE_CHESTS.map((c) => ({ x: c.x, z: c.z, r: 0.55 })),
  ];
  return {
    height: terrainHeight,
    colliders,
    platforms: PLATFORMS,
    boundaryRadius: 32,
    surfaceAt: (x, z) => (distToPath(x, z) < 1.6 ? 'dirt' : 'dirt'),
  };
}
