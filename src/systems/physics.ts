/**
 * Lightweight custom character physics.
 *
 * The worlds are built on an analytic height function (terrain), plus:
 *  - circle colliders (tree trunks, rocks, pond) the player is pushed out of
 *  - cylindrical platforms (stumps, mushroom caps) the player can land on
 * This keeps collision fast and fully deterministic on mobile devices.
 */
export interface CircleCollider {
  x: number;
  z: number;
  r: number;
  /** water (the pond): blocks walking in, but Anet can jump over it onto lily pads */
  water?: boolean;
}

export interface Platform {
  x: number;
  z: number;
  r: number;
  /** absolute world height of the walkable top */
  top: number;
}

export interface WorldPhysics {
  height: (x: number, z: number) => number;
  colliders: CircleCollider[];
  platforms: Platform[];
  boundaryRadius: number;
  /** what the ground is made of (for footstep sounds) */
  surfaceAt?: (x: number, z: number) => Surface;
}

export type Surface = 'grass' | 'dirt' | 'wood';

let world: WorldPhysics = {
  height: () => 0,
  colliders: [],
  platforms: [],
  boundaryRadius: 50,
};

export function setWorldPhysics(w: WorldPhysics) {
  world = w;
}

export function getWorldPhysics() {
  return world;
}

const STEP = 0.35;

/** Height of whatever is directly below the feet (terrain or platform). */
export function groundHeightAt(x: number, z: number, feetY: number) {
  let g = world.height(x, z);
  for (const p of world.platforms) {
    const dx = x - p.x;
    const dz = z - p.z;
    if (dx * dx + dz * dz < p.r * p.r && feetY >= p.top - STEP && p.top > g) g = p.top;
  }
  return g;
}

/** Surface under the feet: platforms (stumps, mushroom caps, rocks) sound like wood, else ask the world. */
export function surfaceAt(x: number, z: number, feetY: number): Surface {
  if (feetY > world.height(x, z) + 0.08) return 'wood';
  return world.surfaceAt ? world.surfaceAt(x, z) : 'grass';
}

/** Push a moving circle (the player) out of all solid obstacles. Mutates pos. */
export function resolveCollisions(pos: { x: number; y: number; z: number }, radius: number) {
  for (const c of world.colliders) {
    if (c.water && pos.y > world.height(pos.x, pos.z) + 0.2) continue;
    pushOut(pos, c.x, c.z, c.r + radius);
  }
  for (const p of world.platforms) {
    if (pos.y < p.top - STEP) pushOut(pos, p.x, p.z, p.r + radius * 0.6);
  }
  const r = Math.hypot(pos.x, pos.z);
  if (r > world.boundaryRadius) {
    pos.x *= world.boundaryRadius / r;
    pos.z *= world.boundaryRadius / r;
  }
}

function pushOut(pos: { x: number; z: number }, cx: number, cz: number, minDist: number) {
  const dx = pos.x - cx;
  const dz = pos.z - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 < minDist * minDist) {
    const d = Math.sqrt(d2) || 0.0001;
    pos.x = cx + (dx / d) * minDist;
    pos.z = cz + (dz / d) * minDist;
  }
}

/** Does the segment a->b (xz plane) pass through any collider? Returns the hit fraction 0..1 or 1. */
export function segmentHitFraction(ax: number, az: number, bx: number, bz: number, pad = 0.4) {
  let best = 1;
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  if (len2 < 1e-6) return 1;
  for (const c of world.colliders) {
    if (c.r > 4) continue; // skip big area colliders such as ponds
    const rr = c.r + pad;
    // where does the segment first enter the (padded) circle?
    const t = ((c.x - ax) * dx + (c.z - az) * dz) / len2;
    const px = ax + dx * t - c.x;
    const pz = az + dz * t - c.z;
    const d2 = px * px + pz * pz;
    if (d2 >= rr * rr) continue;
    const tEnter = t - Math.sqrt(rr * rr - d2) / Math.sqrt(len2);
    if (tEnter >= 1 || t <= 0) continue;
    best = Math.min(best, Math.max(0.15, tEnter - 0.04));
  }
  return best;
}
