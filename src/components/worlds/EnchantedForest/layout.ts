/**
 * Enchanted Forest layout: terrain height function, quest positions, collectibles and
 * deterministic decoration placement. Everything the gameplay needs to know about the map.
 */
import { lerp, mulberry32, smoothstep } from '../../../utils/math';
import type { CircleCollider, Platform, WorldPhysics } from '../../../systems/physics';

export const POND = { x: 17, z: -17, r: 6.5 };
export const WATER_LEVEL = -0.55;
export const WATERFALL = { x: 20.5, z: -24.6 };

export const SPAWN = { x: 0, z: 16, facing: Math.PI };
export const FAIRY_POS = { x: 0, z: -1.5 };
export const RABBIT_POS = { x: 10.5, z: -6.5 };
export const OWL_POS = { x: -13.2, z: -9.2 };
export const WAND_POS = { x: 26.2, z: -15.5 };
export const HOUSE = { x: -5.6, z: 1.2 };

/** Main path polyline (with branches) used for terrain colouring and keeping it free of props. */
export const PATHS: [number, number][][] = [
  [
    [0, 22],
    [0.5, 14],
    [-0.6, 7],
    [0, 2],
  ],
  [
    [0, -4],
    [4, -8],
    [9, -10],
    [14, -9],
    [21, -10],
    [25, -13],
  ],
  [
    [-2.5, -3],
    [-8, -6],
    [-13, -7],
    [-19, -14],
    [-21, -20],
  ],
  [
    [2.5, 0],
    [8, 4],
    [11, 9],
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

export function terrainHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  let h = Math.sin(x * 0.085) * 0.55 + Math.cos(z * 0.07 + 1.3) * 0.5 + Math.sin((x + z) * 0.16) * 0.22 + Math.cos(x * 0.31 - z * 0.23) * 0.08;
  // flat central glade where the fairy lives
  h *= lerp(0.25, 1, smoothstep(3, 13, Math.hypot(x - FAIRY_POS.x, z - FAIRY_POS.z)));
  // rising hills around the edge of the playable area
  h += smoothstep(33, 58, r) * 9;
  // cliff behind the waterfall
  const dw = Math.hypot((x - WATERFALL.x) * 0.6, z - (WATERFALL.z - 3.5));
  h += (1 - smoothstep(2, 9, dw)) * 4.2;
  // pond basin
  const dp = Math.hypot(x - POND.x, z - POND.z);
  h = lerp(h, -1.5, 1 - smoothstep(POND.r * 0.55, POND.r + 2.2, dp));
  return h;
}

// --------------------------------------------------------------------- quest objects

export interface Spot {
  id: string;
  x: number;
  z: number;
  /** height above ground (or absolute when `abs` is true) */
  y: number;
  abs?: boolean;
}

/** Mushroom steps: a little parkour to reach a star. */
const MUSH_STEPS = [
  { x: -9, z: 5.5, r: 1.25, h: 0.85 },
  { x: -11.2, z: 7.4, r: 1.25, h: 1.65 },
  { x: -13.6, z: 6.2, r: 1.45, h: 2.45 },
];

export const PLATFORM_DEFS = [
  ...MUSH_STEPS.map((m) => ({ ...m, kind: 'mushroom' as const })),
  { x: 7.8, z: 10.6, r: 1.1, h: 0.75, kind: 'stump' as const },
  { x: 9.6, z: 12.4, r: 0.9, h: 1.45, kind: 'stump' as const },
  { x: -4.5, z: -22.5, r: 1.4, h: 0.7, kind: 'rock' as const },
  { x: -6.6, z: -24.4, r: 1.3, h: 1.45, kind: 'rock' as const },
  { x: 4.5, z: 4.5, r: 0.85, h: 0.55, kind: 'stump' as const },
];

export const PLATFORMS: Platform[] = PLATFORM_DEFS.map((p) => ({ x: p.x, z: p.z, r: p.r, top: terrainHeight(p.x, p.z) + p.h }));

const top = (i: number) => PLATFORMS[i].top;

export const STARS: Spot[] = [
  { id: 'star-mushroom', x: -13.6, z: 6.2, y: top(2) + 1.0, abs: true },
  { id: 'star-pond', x: 9.5, z: -22.5, y: 1.0 },
  { id: 'star-flowers', x: -20.5, z: -19.5, y: 1.0 },
  { id: 'star-stump', x: 9.6, z: 12.4, y: top(4) + 1.0, abs: true },
  { id: 'star-rocks', x: -6.6, z: -24.4, y: top(6) + 1.0, abs: true },
];

export const TREASURES: Spot[] = [
  { id: 'chest-west', x: -25.5, z: 4.5, y: 0 },
  { id: 'chest-east', x: 27.5, z: 3.0, y: 0 },
  { id: 'chest-north', x: -3.5, z: -32.5, y: 0 },
];

function coinsAlong(prefix: string, pts: [number, number][], count: number): Spot[] {
  const out: Spot[] = [];
  let total = 0;
  const seg: number[] = [];
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

export const COINS: Spot[] = [
  ...coinsAlong('coin-a', [[0.5, 13], [-0.5, 6]], 4),
  ...coinsAlong('coin-b', [[4, -8], [14, -9.2]], 5),
  ...coinsAlong('coin-c', [[-8, -6], [-18, -13]], 5),
  ...coinsAlong('coin-d', [[3.5, 1], [10, 7.5]], 4),
  ...coinsAlong('coin-e', [[12, -27], [3, -28]], 4),
];

// --------------------------------------------------------------------- decoration

export interface TreeDef {
  x: number;
  z: number;
  s: number;
  hue: number;
  variant: number;
  rot: number;
}

const KEEP_CLEAR: { x: number; z: number; r: number }[] = [
  { x: FAIRY_POS.x, z: FAIRY_POS.z, r: 7 },
  { x: HOUSE.x, z: HOUSE.z, r: 3 },
  { x: SPAWN.x, z: SPAWN.z, r: 4 },
  { x: POND.x, z: POND.z, r: POND.r + 3 },
  { x: WAND_POS.x, z: WAND_POS.z, r: 3.5 },
  { x: RABBIT_POS.x, z: RABBIT_POS.z, r: 3 },
  ...STARS.map((s) => ({ x: s.x, z: s.z, r: 3 })),
  ...TREASURES.map((s) => ({ x: s.x, z: s.z, r: 2.2 })),
  ...PLATFORM_DEFS.map((p) => ({ x: p.x, z: p.z, r: p.r + 1.6 })),
];

const clearAt = (x: number, z: number, extra = 0) => KEEP_CLEAR.every((k) => Math.hypot(x - k.x, z - k.z) > k.r + extra) && distToPath(x, z) > 2.6 + extra;

function genTrees(): TreeDef[] {
  const rnd = mulberry32(7);
  const trees: TreeDef[] = [];
  const tryAdd = (x: number, z: number, s: number, minGap: number) => {
    if (!clearAt(x, z, s * 0.6)) return;
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < minGap * (t.s + s) * 0.5)) return;
    trees.push({ x, z, s, hue: rnd(), variant: Math.floor(rnd() * 5), rot: rnd() * Math.PI * 2 });
  };
  // dense outer ring
  for (let i = 0; i < 260; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 34 + rnd() * 22;
    tryAdd(Math.cos(a) * r, Math.sin(a) * r, 1.1 + rnd() * 0.9, 3.4);
  }
  // natural groves: trees grow in clusters with open clearings between them
  for (let c = 0; c < 18; c++) {
    const a = rnd() * Math.PI * 2;
    const r = 10 + rnd() * 24;
    const cx = Math.cos(a) * r;
    const cz = Math.sin(a) * r;
    const n = 3 + Math.floor(rnd() * 4);
    for (let k = 0; k < n * 4; k++) tryAdd(cx + (rnd() - 0.5) * 8, cz + (rnd() - 0.5) * 8, 0.7 + rnd() * 0.75, 3.4);
  }
  // a few lone trees in the clearings
  for (let i = 0; i < 60; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 8 + rnd() * 27;
    tryAdd(Math.cos(a) * r, Math.sin(a) * r, 0.8 + rnd() * 0.6, 6.5);
  }
  return trees;
}

export const TREES = genTrees();

/** Hand-placed giant "hero" trees with glowing lanterns. */
export const HERO_TREES = [
  { x: -13.2, z: -12.2, s: 2.1 },
  { x: 13.5, z: 6.5, s: 1.8 },
  { x: -18, z: 13, s: 1.9 },
];

function scatter(seed: number, count: number, rMin: number, rMax: number, gap = 0) {
  const rnd = mulberry32(seed);
  const out: { x: number; z: number; s: number; r: number; c: number }[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * (rMax - rMin) + rMin;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (distToPath(x, z) < 1.4 + gap) continue;
    if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 0.5) continue;
    if (TREES.some((t) => Math.hypot(t.x - x, t.z - z) < 0.9 * t.s)) continue;
    out.push({ x, z, s: 0.6 + rnd() * 0.8, r: rnd() * Math.PI * 2, c: rnd() });
  }
  return out;
}

export const FLOWERS = scatter(11, 900, 2, 40);
export const GRASS = scatter(23, 5200, 0, 44, -0.4);
export const MUSHROOMS = scatter(31, 70, 4, 36, 0.2);
export const ROCKS = scatter(41, 26, 6, 38, 0.6);
/** Ground detail: bushes, pebbles, ferns and fallen leaves. */
export const BUSHES = scatter(53, 120, 5, 38, 0.5);
export const PEBBLES = scatter(61, 320, 1, 40, -0.7);
export const FERNS = scatter(67, 160, 4, 40, 0.3);
export const LEAVES = scatter(71, 650, 1, 40, -1.2);

/** Fallen logs (decoration + obstacles). */
export const LOGS = [
  { x: -23.5, z: -3.5, rot: 0.7, len: 3.2 },
  { x: 21.5, z: 11.5, rot: -0.45, len: 2.8 },
  { x: 7.5, z: -31, rot: 1.2, len: 3.4 },
  { x: -29, z: 16, rot: 2.1, len: 2.6 },
].filter((l) => clearAt(l.x, l.z, 0.5));

/** Flower meadow patch around the flower star. */
export const MEADOW = { x: -20.5, z: -19.5, r: 6 };

/** Hollow log at the wand position (blocks walking through). */
export const LOG = { x: WAND_POS.x + 0.6, z: WAND_POS.z - 1.2 };

export function buildForestPhysics(): WorldPhysics {
  const colliders: CircleCollider[] = [
    ...TREES.map((t) => ({ x: t.x, z: t.z, r: 0.42 * t.s + 0.15 })),
    ...HERO_TREES.map((t) => ({ x: t.x, z: t.z, r: 0.75 * t.s })),
    ...ROCKS.map((r) => ({ x: r.x, z: r.z, r: 0.5 * r.s })),
    { x: POND.x, z: POND.z, r: POND.r - 1.1 },
    { x: WATERFALL.x, z: WATERFALL.z - 1.8, r: 3.2 },
    { x: WATERFALL.x - 4.2, z: WATERFALL.z - 0.6, r: 2.2 },
    { x: WATERFALL.x + 4.2, z: WATERFALL.z - 0.4, r: 2.2 },
    { x: LOG.x, z: LOG.z, r: 0.8 },
    ...LOGS.flatMap((l) => [-0.3, 0.3].map((f) => ({ x: l.x + Math.cos(l.rot) * l.len * f, z: l.z - Math.sin(l.rot) * l.len * f, r: 0.55 }))),
    ...BUSHES.filter((b) => b.s > 1.1).map((b) => ({ x: b.x, z: b.z, r: 0.45 * b.s })),
    ...TREASURES.map((t) => ({ x: t.x, z: t.z, r: 0.55 })),
    { x: FAIRY_POS.x, z: FAIRY_POS.z, r: 0.9 },
    { x: HOUSE.x, z: HOUSE.z, r: 1.55 },
    { x: OWL_POS.x, z: OWL_POS.z, r: 0.6 },
  ];
  return { height: terrainHeight, colliders, platforms: PLATFORMS, boundaryRadius: 40 };
}
