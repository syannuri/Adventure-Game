/**
 * Candy Village layout: terrain height, the chocolate river, paths, quest positions, collectibles,
 * platforms and deterministic decoration placement.
 *
 * Map (top view, -z is "north"):
 *   north of the river: Sugar Cake Hill (marshmallow steps) and the Candy Cane Garden
 *   the river:          a shallow chocolate stream with a cookie bridge (you can wade through it)
 *   middle:             Koko's giant cupcake bakery and the candy sorting machine
 *   east:               the strawberry field        west: the donut tower
 *   south:              the village gate where Anet arrives
 */
import { lerp, mulberry32, smoothstep } from '../../../utils/math';
import type { CircleCollider, Platform, WorldPhysics } from '../../../systems/physics';
import type { Spot } from '../EnchantedForest/layout';

export const SPAWN = { x: 0, z: 19, facing: Math.PI };
export const BAKERY = { x: 0, z: -4.5 };
export const KOKO_POS = { x: 2.6, z: -0.6 };
export const PIP_POS = { x: 5.5, z: 11 };
/** Where the Rainbow Cake appears at the end (in front of the bakery door). */
export const CAKE_POS = { x: -1.6, z: 0.6 };

/** Candy sorting machine next to the bakery: three jars on a counter and a tray of mixed candies. */
export const SORT = { x: -7.5, z: -1.5 };
export const SORT_COLORS = ['#ff6fae', '#ffcf3a', '#5ab8ff'] as const; // pink, yellow, blue
export const SORT_JARS = [-1, 0, 1].map((i, k) => ({ x: SORT.x + i * 1.35, z: SORT.z - 0.9, color: k }));
/** The six candies: colour index per candy, mixed up on the tray. */
export const SORT_CANDIES = [1, 0, 2, 0, 2, 1].map((color, k) => ({ id: `candy-${k}`, color, x: SORT.x - 2.6 + k * 1.04, z: SORT.z + 1.55 }));

/** Shallow chocolate river (centre line) crossing the village from west to east. */
export const RIVER: [number, number][] = [
  [-48, -11],
  [-30, -15],
  [-16, -12.5],
  [-4, -14.5],
  [8, -13.5],
  [22, -11.5],
  [34, -14],
  [48, -12],
];
export const RIVER_W = 2.6;
export const RIVER_LEVEL = -0.32;
export const BRIDGE = { x: 8, z: -13.5, len: 8.5, w: 2.3, top: 0 };

/** Walkable paths (frosting-coloured ground). */
export const PATHS: [number, number][][] = [
  [
    [0, 24],
    [0.4, 14],
    [-0.4, 6],
    [0.5, 1.5],
  ],
  [
    [2, 3],
    [8, 5],
    [14, 6.5],
    [21, 5.5],
  ],
  [
    [-2, 3],
    [-6, 3.5],
    [-11, 5.5],
  ],
  [
    [3, -6],
    [7, -8.5],
    [8, -18],
    [12, -23],
    [19, -24],
  ],
  [
    [-3, -7],
    [-5, -11],
    [-6, -17],
    [-6.5, -22],
  ],
];

function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}
function distToLine(x: number, z: number, line: [number, number][]) {
  let d = Infinity;
  for (let i = 0; i < line.length - 1; i++) d = Math.min(d, distToSegment(x, z, line[i][0], line[i][1], line[i + 1][0], line[i + 1][1]));
  return d;
}
export function distToPath(x: number, z: number) {
  let d = Infinity;
  for (const p of PATHS) d = Math.min(d, distToLine(x, z, p));
  return d;
}
export const distToRiver = (x: number, z: number) => distToLine(x, z, RIVER);

export function terrainHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  let h = Math.sin(x * 0.09 + 0.6) * 0.45 + Math.cos(z * 0.08) * 0.4 + Math.sin((x - z) * 0.13) * 0.18;
  // flat village square around the bakery and the sorting machine
  h *= lerp(0.15, 1, smoothstep(5, 14, Math.hypot(x - (BAKERY.x - 3), z - BAKERY.z)));
  // soft gumdrop hills around the edge
  h += smoothstep(32, 56, r) * 8;
  // Sugar Cake Hill north of the river
  h += (1 - smoothstep(2, 9, Math.hypot(x + 6.5, z + 27))) * 1.6;
  // shallow chocolate river bed
  const dr = distToRiver(x, z);
  h = lerp(h, -0.62, 1 - smoothstep(RIVER_W * 0.55, RIVER_W + 1.6, dr));
  return h;
}

// --------------------------------------------------------------------- platforms

// the cookie bridge: a gentle arch from bank to bank (deck height at both ends follows the banks)
const BANK_N = terrainHeight(BRIDGE.x, BRIDGE.z - BRIDGE.len / 2);
const BANK_S = terrainHeight(BRIDGE.x, BRIDGE.z + BRIDGE.len / 2);
/** Deck height along the bridge, u = -1 (north end) .. 1 (south end). */
export const bridgeDeck = (u: number) => lerp(BANK_N, BANK_S, (u + 1) / 2) + 0.1 + (1 - u * u) * 0.25;
BRIDGE.top = bridgeDeck(0);

export const PLATFORM_DEFS = [
  // donut tower (west): three stacked donut steps
  { x: -13.6, z: 6.2, r: 1.25, h: 0.8, kind: 'donut' as const },
  { x: -16.2, z: 8.6, r: 1.25, h: 1.6, kind: 'donut' as const },
  { x: -19.0, z: 6.6, r: 1.45, h: 2.45, kind: 'donut' as const },
  // marshmallow steps up the Sugar Cake Hill (north)
  { x: -4.2, z: -23.5, r: 1.0, h: 0.6, kind: 'marshmallow' as const },
  { x: -6.0, z: -25.6, r: 1.0, h: 1.3, kind: 'marshmallow' as const },
  { x: -8.6, z: -26.6, r: 1.6, h: 2.1, kind: 'cake' as const },
  // little cupcake stools in the strawberry field
  { x: 19.5, z: 1.0, r: 0.8, h: 0.6, kind: 'cupcake' as const },
];

export const PLATFORMS: Platform[] = PLATFORM_DEFS.map((p) => ({ x: p.x, z: p.z, r: p.r, top: terrainHeight(p.x, p.z) + p.h }));
/** The cookie bridge is walkable: seven overlapping discs following the arch. */
export const BRIDGE_PLATFORMS: Platform[] = [-3, -2, -1, 0, 1, 2, 3].map((k) => ({ x: BRIDGE.x, z: BRIDGE.z + k * 1.35, r: 1.2, top: bridgeDeck((k * 1.35) / (BRIDGE.len / 2)) }));

const top = (i: number) => PLATFORMS[i].top;

// --------------------------------------------------------------------- quest items

/** The five missing candy ingredients (kept in `level.stars`). */
export const INGREDIENTS: Spot[] = [
  { id: 'ing-strawberry', x: 23.5, z: 9.5, y: 0.9 },
  { id: 'ing-choco', x: BRIDGE.x, z: BRIDGE.z, y: BRIDGE.top + 0.95, abs: true },
  { id: 'ing-honey', x: -19.0, z: 6.6, y: top(2) + 1.0, abs: true },
  { id: 'ing-sugar', x: -8.6, z: -26.6, y: top(5) + 1.0, abs: true },
  { id: 'ing-mint', x: 20.5, z: -26, y: 0.9 },
];

export const GIFTS: Spot[] = [
  { id: 'gift-west', x: -27, z: -3, y: 0 },
  { id: 'gift-east', x: 28.5, z: -4.5, y: 0 },
  { id: 'gift-north', x: 4.5, z: -31, y: 0 },
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

/** Peppermint candies (the village's "coins"). */
export const CANDIES: Spot[] = [
  ...along('mint-a', [[0.3, 15], [-0.3, 7]], 4),
  ...along('mint-b', [[5, 4], [17, 6.3]], 5),
  ...along('mint-c', [[-4, 3.2], [-10, 5]], 3),
  ...along('mint-d', [[7.5, -8.5], [8.5, -20], [16, -24]], 5),
  ...along('mint-e', [[-5, -11], [-6.2, -20]], 3),
];

// --------------------------------------------------------------------- decoration

const KEEP_CLEAR: { x: number; z: number; r: number }[] = [
  { x: BAKERY.x, z: BAKERY.z, r: 6.5 },
  { x: SORT.x, z: SORT.z, r: 4.6 },
  { x: KOKO_POS.x, z: KOKO_POS.z, r: 2.5 },
  { x: PIP_POS.x, z: PIP_POS.z, r: 2.5 },
  { x: SPAWN.x, z: SPAWN.z, r: 4 },
  { x: BRIDGE.x, z: BRIDGE.z, r: 6 },
  ...INGREDIENTS.map((s) => ({ x: s.x, z: s.z, r: 3 })),
  ...GIFTS.map((s) => ({ x: s.x, z: s.z, r: 2.2 })),
  ...PLATFORM_DEFS.map((p) => ({ x: p.x, z: p.z, r: p.r + 1.4 })),
];

const clearAt = (x: number, z: number, extra = 0) =>
  KEEP_CLEAR.every((k) => Math.hypot(x - k.x, z - k.z) > k.r + extra) && distToPath(x, z) > 2.4 + extra && distToRiver(x, z) > RIVER_W + 0.8 + extra;

export interface Prop {
  x: number;
  z: number;
  s: number;
  c: number;
  rot: number;
  v: number;
}

function placeMany(seed: number, count: number, rMin: number, rMax: number, gap: number, minDist: number, sMin: number, sMax: number, extraTest?: (x: number, z: number) => boolean): Prop[] {
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
    if (extraTest && !extraTest(x, z)) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < minDist * (o.s + s) * 0.5)) continue;
    out.push({ x, z, s, c: rnd(), rot: rnd() * Math.PI * 2, v: Math.floor(rnd() * 4) });
  }
  return out;
}

/** Strawberry field (east). */
export const FIELD = { x: 21, z: 8, r: 7 };
const inField = (x: number, z: number) => Math.hypot(x - FIELD.x, z - FIELD.z) < FIELD.r;

/** Candy cane garden (north-east, across the river). */
export const CANE_GARDEN = { x: 20, z: -25, r: 7 };

export const LOLLIPOPS = [...placeMany(101, 46, 9, 36, 0.4, 3.2, 0.9, 1.6, (x, z) => !inField(x, z)), ...placeMany(102, 70, 37, 52, 0, 3, 1.4, 2.4)];
export const GUMDROPS = placeMany(103, 90, 5, 40, 0.1, 1.5, 0.5, 1.1, (x, z) => !inField(x, z));
export const CANES = [
  ...placeMany(104, 26, 6, 38, 0.3, 2, 0.8, 1.3, (x, z) => !inField(x, z) && Math.hypot(x - CANE_GARDEN.x, z - CANE_GARDEN.z) > CANE_GARDEN.r),
  // the garden itself: a ring of tall candy canes
  ...Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return { x: CANE_GARDEN.x + Math.cos(a) * CANE_GARDEN.r * 0.8, z: CANE_GARDEN.z + Math.sin(a) * CANE_GARDEN.r * 0.8, s: 1.5 + (i % 3) * 0.25, c: i / 14, rot: -a, v: i % 2 };
  }).filter((c) => distToPath(c.x, c.z) > 1.8),
];
/** Giant strawberries planted in loose rows across the field (leaving the ingredient spot and the path free). */
export const STRAWBERRIES: Prop[] = (() => {
  const rnd = mulberry32(105);
  const out: Prop[] = [];
  for (let row = -2; row <= 2; row++) {
    for (let col = -3; col <= 3; col++) {
      const x = FIELD.x + col * 2.1 + (rnd() - 0.5) * 0.7 + (row % 2) * 1.05;
      const z = FIELD.z + row * 2.3 + (rnd() - 0.5) * 0.6;
      if (Math.hypot(x - FIELD.x, z - FIELD.z) > FIELD.r - 0.4) continue;
      if (distToPath(x, z) < 2.2) continue;
      if (Math.hypot(x - 23.5, z - 9.5) < 2.0) continue; // the strawberry ingredient sits in a little clearing
      if (Math.hypot(x - 19.5, z - 1.0) < 1.8) continue; // cupcake stool
      out.push({ x, z, s: 0.8 + rnd() * 0.45, c: rnd(), rot: rnd() * Math.PI * 2, v: 0 });
    }
  }
  return out;
})();
export const SPRINKLES = placeMany(106, 1400, 0, 44, -2.2, 0, 0.6, 1.4);
export const ICE_CREAMS = [
  { x: -30, z: -30, s: 3.2 },
  { x: 33, z: 22, s: 2.8 },
  { x: -36, z: 18, s: 3.4 },
  { x: 30, z: -34, s: 3 },
];
/** Little cupcake houses around the square. */
export const HOUSES = [
  { x: -12.5, z: -7, s: 1, rot: 0.6, c: 0 },
  { x: 12.5, z: -3.5, s: 1.1, rot: -0.5, c: 1 },
  { x: -10.5, z: 14, s: 0.95, rot: 2.6, c: 2 },
  { x: 11.5, z: 15, s: 1, rot: -2.4, c: 3 },
];

export function buildCandyPhysics(): WorldPhysics {
  const colliders: CircleCollider[] = [
    ...LOLLIPOPS.map((t) => ({ x: t.x, z: t.z, r: 0.18 * t.s + 0.12 })),
    ...GUMDROPS.filter((g) => g.s > 0.85).map((g) => ({ x: g.x, z: g.z, r: 0.42 * g.s })),
    ...CANES.map((c) => ({ x: c.x, z: c.z, r: 0.14 * c.s + 0.1 })),
    ...STRAWBERRIES.map((s) => ({ x: s.x, z: s.z, r: 0.38 * s.s })),
    ...ICE_CREAMS.map((i) => ({ x: i.x, z: i.z, r: 0.9 * i.s })),
    ...HOUSES.map((h) => ({ x: h.x, z: h.z, r: 1.85 * h.s })),
    { x: BAKERY.x, z: BAKERY.z, r: 3.9 }, // includes the overhanging frosting so the camera never clips inside
    { x: KOKO_POS.x, z: KOKO_POS.z, r: 0.55 },
    { x: PIP_POS.x, z: PIP_POS.z, r: 0.4 },
    // sorting machine counter and the candy machine behind it
    ...[-1.6, -0.55, 0.55, 1.6].map((f) => ({ x: SORT.x + f, z: SORT.z - 0.9, r: 0.5 })),
    { x: SORT.x, z: SORT.z - 3, r: 1.4 },
    ...SORT_CANDIES.map((c) => ({ x: c.x, z: c.z, r: 0.26 })),
    ...GIFTS.map((g) => ({ x: g.x, z: g.z, r: 0.5 })),
  ];
  return {
    height: terrainHeight,
    colliders,
    platforms: [...PLATFORMS, ...BRIDGE_PLATFORMS],
    boundaryRadius: 40,
    surfaceAt: (x, z) => (distToRiver(x, z) < RIVER_W ? 'dirt' : distToPath(x, z) < 1.6 ? 'dirt' : 'grass'),
  };
}
