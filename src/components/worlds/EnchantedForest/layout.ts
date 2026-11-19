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
/** Lumi's singing flowers: a ring of five giant flowers (step on them) around a magic bud. */
export const MUSIC = { x: -1, z: -9.6, r: 2.3 };
/** Kiki the squirrel's little shop stall beside the path into the glade (facing the path). */
export const SHOP = { x: -3.6, z: 4.8, rot: Math.PI / 2 };
/**
 * Anet's magic garden: three raised beds (sunflower, berry bush, rainbow flower) in a clearing east
 * of the glade, a tree stump with the watering can, and water from the pond nearby.
 */
export const GARDEN = { x: 8.5, z: -1.5, r: 3.4 };
export const GARDEN_BEDS = [-1.7, 0, 1.7].map((dx, i) => ({ i, x: GARDEN.x + dx, z: GARDEN.z }));
export const GARDEN_STUMP = { x: GARDEN.x - 3.3, z: GARDEN.z + 1.9 };
/**
 * Anet's tree house: a big oak at the south end of the main path. Built in steps with twigs found in
 * the forest and golden acorns. The platform is 3 m up; the ladder faces the path (north).
 */
export const TREEHOUSE = { x: 0.5, z: 28, r: 2.4, h: 3.0, clear: 4.6 };
/** bundles of twigs lying around the forest */
export const TWIGS = [
  [4, 23],
  [-4.5, 23.5],
  [12.5, 0.5],
  [-8, -12.5],
  [6, -15.5],
  [29.5, -8],
  [-26.5, -15.5],
].map(([x, z], i) => ({ id: `twig-${i}`, x, z }));

/**
 * Colour flower puzzle guarding the wand: a stone tablet with three gems, and three magic flowers in
 * front of it. Each flower cycles red -> yellow -> blue when touched; match all three to the gems.
 */
export const PUZZLE_COLORS = ['#ff5a6e', '#ffd23f', '#4aa8ff'];
export const PUZZLE_TARGET = [2, 1, 0]; // blue, yellow, red (start is [red, red, yellow]: nothing matches yet)
export const PUZZLE_TABLET = { x: 24.9, z: -13.75, rot: -0.75 };
export const PUZZLE_FLOWERS = [-1, 0, 1].map((i) => ({ x: 24.05 + i * 1.25 * 0.68, z: -12.9 + i * 1.25 * 0.73 }));

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

/** Ground height before the stream is carved in. */
function baseHeight(x: number, z: number) {
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

// --------------------------------------------------------------------- the stream (leaf race)

/**
 * A little stream from a spring in the north-west hills down into the pond. It crosses no path.
 * Anet can wade through it; the leaf race rides it from the spring to the pond.
 */
const STREAM_CTRL: [number, number][] = [
  [-25, -34.5],
  [-20, -31],
  [-15, -28],
  [-10, -29.5],
  [-5, -28.5],
  [-1, -25.5],
  [3, -23.5],
  [7, -22.2],
  [10, -19.6],
  [12.6, -18.4],
];
/** half the width of the water */
export const STREAM_HALF = 1.6;
function chaikin(pts: [number, number][], n: number): [number, number][] {
  let p = pts;
  for (let k = 0; k < n; k++) {
    const out: [number, number][] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, az] = p[i];
      const [bx, bz] = p[i + 1];
      out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}
/** centre line sampled every ~0.5 m: position, distance along the stream and water level */
export const STREAM: { x: number; z: number; s: number; level: number }[] = (() => {
  const raw = chaikin(STREAM_CTRL, 3);
  const pts: { x: number; z: number; s: number; level: number }[] = [];
  let s = 0;
  for (let i = 0; i < raw.length - 1; i++) {
    const [ax, az] = raw[i];
    const [bx, bz] = raw[i + 1];
    const l = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(l / 0.5));
    for (let k = 0; k < n; k++) pts.push({ x: ax + ((bx - ax) * k) / n, z: az + ((bz - az) * k) / n, s: s + (l * k) / n, level: 0 });
    s += l;
  }
  const last = raw[raw.length - 1];
  pts.push({ x: last[0], z: last[1], s, level: 0 });
  // the water always runs downhill and stays below the banks; it ends at the pond's level
  let level = Infinity;
  for (const p of pts) {
    const bank = Math.min(...[-1, 1].map((side) => baseHeight(p.x + side * 1.2, p.z + side * 1.2)), baseHeight(p.x, p.z));
    level = Math.min(level - 0.006, bank - 0.32);
    p.level = Math.max(WATER_LEVEL, level);
  }
  return pts;
})();
export const STREAM_LEN = STREAM[STREAM.length - 1].s;
/** where the stream flows into the pond (its ribbon stops here) */
export const STREAM_MOUTH_S = STREAM.find((p) => Math.hypot(p.x - POND.x, p.z - POND.z) < POND.r + 1.65)?.s ?? STREAM_LEN;
/** leaf race: the start (a little dock just inside the walkable area) and the finish arch before the pond */
export const RACE_START_S = (STREAM.find((p) => Math.hypot(p.x, p.z) < 36)?.s ?? 2) + 0.6;
export const RACE_END_S = STREAM_MOUTH_S - 2.2;
const SB = STREAM.reduce((b, p) => ({ x0: Math.min(b.x0, p.x), x1: Math.max(b.x1, p.x), z0: Math.min(b.z0, p.z), z1: Math.max(b.z1, p.z) }), { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity });

/** distance to the stream's centre line and the matching distance along it (and its water level) */
export function streamQuery(x: number, z: number) {
  if (x < SB.x0 - 5 || x > SB.x1 + 5 || z < SB.z0 - 5 || z > SB.z1 + 5) return null;
  let best = Infinity;
  let bs = 0;
  let bl = 0;
  for (let i = 0; i < STREAM.length - 1; i++) {
    const a = STREAM[i];
    const b = STREAM[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2));
    const d = Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t));
    if (d < best) {
      best = d;
      bs = a.s + (b.s - a.s) * t;
      bl = a.level + (b.level - a.level) * t;
    }
  }
  return { d: best, s: bs, level: bl };
}

/** point on the stream at distance s: position, flow direction and water level */
export function streamAt(s: number) {
  const c = Math.max(0, Math.min(STREAM_LEN - 0.001, s));
  let i = 0;
  while (i < STREAM.length - 2 && STREAM[i + 1].s < c) i++;
  const a = STREAM[i];
  const b = STREAM[i + 1];
  const t = (c - a.s) / (b.s - a.s || 1);
  const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, dx: (b.x - a.x) / l, dz: (b.z - a.z) / l, level: a.level + (b.level - a.level) * t };
}

export function terrainHeight(x: number, z: number) {
  const h = baseHeight(x, z);
  const q = streamQuery(x, z);
  if (!q || q.d > STREAM_HALF + 1.8) return h;
  // a shallow channel: deepest in the middle, a gentle bank up to the grass
  const bed = q.level - 0.12 - 0.3 * (1 - Math.min(1, q.d / STREAM_HALF) ** 2);
  if (q.d <= STREAM_HALF) return Math.min(h, bed);
  return lerp(Math.min(h, q.level - 0.12), h, smoothstep(STREAM_HALF, STREAM_HALF + 1.8, q.d));
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

/** Lily pads across the pond to a little island with a golden lotus (jump from pad to pad). */
export const LILY_START = { x: 10.5, z: -16 };
export const LILY_PADS = [
  { x: 12.2, z: -15.7, r: 0.6 },
  { x: 13.4, z: -17.4, r: 0.6 },
  { x: 14.9, z: -18.2, r: 0.6 },
];
export const LOTUS_ISLAND = { x: 16.4, z: -17.0, r: 1.0 };
export const LILY_TOP = WATER_LEVEL + 0.07;
export const LILY_PLATFORMS: Platform[] = [
  ...LILY_PADS.map((p) => ({ x: p.x, z: p.z, r: p.r, top: LILY_TOP })),
  { x: LOTUS_ISLAND.x, z: LOTUS_ISLAND.z, r: LOTUS_ISLAND.r, top: LILY_TOP + 0.12 },
];

/** Spring mushroom under the giant lantern tree: bounce up onto a branch with a lantern treasure. */
export const SPRING = { x: 13.5, z: 11.0, r: 0.75, h: 0.65, bounce: 12.5 };
export const BRANCH = { x: 13.5, z: 9.0, r: 0.95, h: 2.8 };
export const SPRING_PLATFORMS: Platform[] = [
  { x: SPRING.x, z: SPRING.z, r: SPRING.r, top: terrainHeight(SPRING.x, SPRING.z) + SPRING.h, bounce: SPRING.bounce },
  { x: BRANCH.x, z: BRANCH.z, r: BRANCH.r, top: terrainHeight(BRANCH.x, BRANCH.z) + BRANCH.h },
];

/** Night forest: lantern posts beside the paths (unlit by day) and fireflies to catch. */
function besidePath(pi: number, si: number, t: number, side: number, off = 1.9) {
  const a = PATHS[pi][si];
  const b = PATHS[pi][si + 1];
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l = Math.hypot(dx, dz) || 1;
  return { x: a[0] + dx * t + (-dz / l) * off * side, z: a[1] + dz * t + (dx / l) * off * side };
}
export const LANTERN_POSTS = [
  { id: 'lamp-1', ...besidePath(0, 0, 0.55, 1) },
  { id: 'lamp-2', ...besidePath(1, 1, 0.5, -1) },
  { id: 'lamp-3', ...besidePath(2, 2, 0.5, -1) },
  { id: 'lamp-4', ...besidePath(3, 1, 0.5, -1) },
  { id: 'lamp-5', ...besidePath(1, 3, 0.5, 1) },
];
export const FIREFLY_SPOTS = [
  [4, 12],
  [-8, 3],
  [12, -12],
  [-16, -7],
  [-19, -17],
  [6, -20],
  [17, 2],
  [-2.5, -12.5],
  [-22, 6],
  [22, -6],
].map(([x, z], i) => ({ id: `ff-${i}`, x, z }));

/** Mama duck waits on the south shore; her four ducklings got lost in the forest. */
export const MAMA_DUCK = { x: 18.2, z: -10.0 };
export const DUCKLING_SPOTS = [
  { id: 'duckling-1', x: -3, z: 17 },
  { id: 'duckling-2', x: -17, z: -10 },
  { id: 'duckling-3', x: -6, z: -17 },
  { id: 'duckling-4', x: 6, z: -26 },
];
/** where the duck family swims (east part of the pond, clear of the lily pads) */
export const DUCK_SWIM = { x: POND.x + 2.4, z: POND.z, r: 1.5 };

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

const TREES_ALL = genTrees();
const clearOfStream = (x: number, z: number, r: number) => {
  const q = streamQuery(x, z);
  return !q || q.d > STREAM_HALF + r;
};
export const TREES = TREES_ALL.filter((t) => clearOfStream(t.x, t.z, 0.8 + 0.45 * t.s));

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
    if (Math.hypot(x - PUZZLE_TABLET.x, z - PUZZLE_TABLET.z) < 2.6) continue; // keep the flower puzzle clear
    if (Math.hypot(x - MUSIC.x, z - MUSIC.z) < MUSIC.r + 1.3) continue; // and the singing flowers
    if (Math.hypot(x - SHOP.x, z - SHOP.z) < 2.2) continue; // and Kiki's shop
    if (TREES_ALL.some((t) => Math.hypot(t.x - x, t.z - z) < 0.9 * t.s)) continue;
    out.push({ x, z, s: 0.6 + rnd() * 0.8, r: rnd() * Math.PI * 2, c: rnd() });
  }
  return out;
}

/** keep the garden clearing free (filtered afterwards so nothing else moves) */
const notInGarden = <T extends { x: number; z: number }>(list: T[], extra = 0) =>
  list.filter(
    (p) =>
      Math.hypot(p.x - GARDEN.x, p.z - GARDEN.z) > GARDEN.r + extra &&
      Math.hypot(p.x - TREEHOUSE.x, p.z - TREEHOUSE.z) > TREEHOUSE.clear + extra &&
      clearOfStream(p.x, p.z, 0.35 + Math.max(0, extra * 0.5)),
  );
export const FLOWERS = notInGarden(scatter(11, 900, 2, 40));
export const GRASS = notInGarden(scatter(23, 5200, 0, 44, -0.4), -1.2);
export const MUSHROOMS = notInGarden(scatter(31, 70, 4, 36, 0.2));
export const ROCKS = notInGarden(scatter(41, 26, 6, 38, 0.6), 0.6);
/** Ground detail: bushes, pebbles, ferns and fallen leaves. */
export const BUSHES = notInGarden(scatter(53, 120, 5, 38, 0.5), 0.6);
export const PEBBLES = notInGarden(scatter(61, 320, 1, 40, -0.7));
export const FERNS = notInGarden(scatter(67, 160, 4, 40, 0.3));
export const LEAVES = notInGarden(scatter(71, 650, 1, 40, -1.2), -1);

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
    { x: POND.x, z: POND.z, r: POND.r - 1.1, water: true },
    { x: WATERFALL.x, z: WATERFALL.z - 1.8, r: 3.2 },
    { x: WATERFALL.x - 4.2, z: WATERFALL.z - 0.6, r: 2.2 },
    { x: WATERFALL.x + 4.2, z: WATERFALL.z - 0.4, r: 2.2 },
    { x: LOG.x, z: LOG.z, r: 0.8 },
    // stone tablet of the flower puzzle (three circles along its length)
    ...[-0.6, 0, 0.6].map((f) => ({ x: PUZZLE_TABLET.x + Math.cos(PUZZLE_TABLET.rot) * f, z: PUZZLE_TABLET.z - Math.sin(PUZZLE_TABLET.rot) * f, r: 0.35 })),
    ...LOGS.flatMap((l) => [-0.3, 0.3].map((f) => ({ x: l.x + Math.cos(l.rot) * l.len * f, z: l.z - Math.sin(l.rot) * l.len * f, r: 0.55 }))),
    ...BUSHES.filter((b) => b.s > 1.1).map((b) => ({ x: b.x, z: b.z, r: 0.45 * b.s })),
    ...TREASURES.map((t) => ({ x: t.x, z: t.z, r: 0.55 })),
    { x: FAIRY_POS.x, z: FAIRY_POS.z, r: 0.9 },
    { x: HOUSE.x, z: HOUSE.z, r: 1.55 },
    { x: OWL_POS.x, z: OWL_POS.z, r: 0.6 },
    { x: MUSIC.x, z: MUSIC.z, r: 0.35 }, // the magic bud in the middle of the singing flowers
    { x: SHOP.x, z: SHOP.z, r: 0.95 }, // Kiki's shop stall
    { x: MAMA_DUCK.x, z: MAMA_DUCK.z, r: 0.35 },
    ...LANTERN_POSTS.map((l) => ({ x: l.x, z: l.z, r: 0.18 })),
    ...GARDEN_BEDS.map((b) => ({ x: b.x, z: b.z, r: 0.5 })),
    { x: GARDEN_STUMP.x, z: GARDEN_STUMP.z, r: 0.4 },
    { x: TREEHOUSE.x, z: TREEHOUSE.z, r: 1.05 }, // the tree-house oak
  ];
  return { height: terrainHeight, colliders, platforms: [...PLATFORMS, ...LILY_PLATFORMS, ...SPRING_PLATFORMS], boundaryRadius: 40, surfaceAt: (x, z) => (distToPath(x, z) < 1.6 ? 'dirt' : 'grass') };
}
