/**
 * Candy Village props: lollipop trees, gumdrops, candy canes, giant strawberries, sprinkles,
 * ice-cream towers, cupcake houses, Koko's bakery, donut / marshmallow / cake platforms and the
 * cookie bridge. Repeated props are instanced so the whole village stays light on phones.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  BAKERY,
  BRIDGE,
  CANES,
  GUMDROPS,
  HOUSES,
  ICE_CREAMS,
  LOLLIPOPS,
  PLATFORM_DEFS,
  PLATFORMS,
  SPRINKLES,
  STRAWBERRIES,
  bridgeDeck,
  terrainHeight,
  type Prop,
} from './layout';
import { caneTexture, cookieTexture, strawberryTexture, swirlTexture, waffleTexture, wrapperTexture } from './candyTextures';
import { windify } from '../../effects/wind';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

function useInstances(ref: React.RefObject<THREE.InstancedMesh | null>, items: { x: number; z: number; s: number; rot: number }[], y: (i: number) => number, scale: (s: number) => [number, number, number] = (s) => [s, s, s], tilt = 0, colors?: (i: number) => THREE.Color) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((it, i) => {
      _e.set(Math.sin(it.rot * 3) * tilt, it.rot, Math.cos(it.rot * 5) * tilt);
      _q.setFromEuler(_e);
      _p.set(it.x, y(i), it.z);
      _s.set(...scale(it.s));
      mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
      if (colors) mesh.setColorAt(i, colors(i));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, items, y, scale, tilt, colors]);
}

// ------------------------------------------------------------------ lollipop trees

const LOLLI_COLORS = ['#ff5fa2', '#3fc6b5', '#ffb52e', '#9b6bff'];

function LollipopVariant({ items, color, shadows }: { items: Prop[]; color: string; shadows: boolean }) {
  const sticks = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);
  const stickGeo = useMemo(() => new THREE.CylinderGeometry(0.06, 0.075, 2.2, 8).translate(0, 1.1, 0), []);
  const headGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 40, 1);
    g.rotateX(Math.PI / 2);
    g.translate(0, 2.75, 0);
    return g;
  }, []);
  const headMat = useMemo(() => windify(new THREE.MeshStandardMaterial({ map: swirlTexture(color), roughness: 0.25, metalness: 0.05 }), 0.04, 0.3), [color]);
  const ys = useMemo(() => items.map((it) => terrainHeight(it.x, it.z) - 0.05), [items]);
  const y = useMemo(() => (i: number) => ys[i], [ys]);
  useInstances(sticks, items, y);
  useInstances(heads, items, y);
  return (
    <>
      <instancedMesh ref={sticks} args={[stickGeo, undefined, items.length]} castShadow={shadows}>
        <meshStandardMaterial color="#fff8f0" roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[headGeo, headMat, items.length]} castShadow={shadows} />
    </>
  );
}

export function Lollipops({ shadows }: { shadows: boolean }) {
  const groups = useMemo(() => LOLLI_COLORS.map((_, k) => LOLLIPOPS.filter((_, i) => i % LOLLI_COLORS.length === k)), []);
  return (
    <>
      {groups.map((items, k) => (
        <LollipopVariant key={k} items={items} color={LOLLI_COLORS[k]} shadows={shadows} />
      ))}
    </>
  );
}

// ------------------------------------------------------------------ gumdrops

const GUM_COLORS = ['#ff6b8b', '#ffd23f', '#6fd36b', '#ff9f43', '#a77bff', '#4cc9f0'].map((c) => new THREE.Color(c));

export function Gumdrops() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const a = t * Math.PI * 0.5;
      pts.push(new THREE.Vector2(Math.cos(a) * 0.5 * (1 - t * 0.12), Math.sin(a) * 0.62));
    }
    pts.unshift(new THREE.Vector2(0, 0));
    return new THREE.LatheGeometry(pts, 24);
  }, []);
  const ys = useMemo(() => GUMDROPS.map((g) => terrainHeight(g.x, g.z) - 0.03), []);
  const y = useMemo(() => (i: number) => ys[i], [ys]);
  const colors = useMemo(() => (i: number) => GUM_COLORS[Math.floor(GUMDROPS[i].c * GUM_COLORS.length)], []);
  useInstances(ref, GUMDROPS, y, (s) => [s, s, s], 0, colors);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, GUMDROPS.length]} castShadow receiveShadow>
      <meshPhysicalMaterial roughness={0.55} sheen={1} sheenColor="#ffffff" sheenRoughness={0.4} clearcoat={0.3} />
    </instancedMesh>
  );
}

// ------------------------------------------------------------------ candy canes

export function CandyCanes({ shadows }: { shadows: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const path = new THREE.CurvePath<THREE.Vector3>();
    path.add(new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 2.2, 0)));
    const arc = new THREE.EllipseCurve(0.42, 2.2, 0.42, 0.42, Math.PI, 0, true);
    const pts = arc.getPoints(16).map((p) => new THREE.Vector3(p.x, p.y, 0));
    pts.push(new THREE.Vector3(0.84, 1.85, 0));
    path.add(new THREE.CatmullRomCurve3(pts));
    return new THREE.TubeGeometry(path, 64, 0.13, 12, false);
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: caneTexture(), roughness: 0.25 }), []);
  const ys = useMemo(() => CANES.map((c) => terrainHeight(c.x, c.z) - 0.1), []);
  const y = useMemo(() => (i: number) => ys[i], [ys]);
  useInstances(ref, CANES, y);
  return <instancedMesh ref={ref} args={[geo, mat, CANES.length]} castShadow={shadows} />;
}

// ------------------------------------------------------------------ giant strawberries

export function Strawberries() {
  const body = useRef<THREE.InstancedMesh>(null);
  const crown = useRef<THREE.InstancedMesh>(null);
  const bodyGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const r = Math.sin(t * Math.PI) * (0.35 + t * 0.32) + 0.01;
      pts.push(new THREE.Vector2(r, t * 1.0));
    }
    return new THREE.LatheGeometry(pts, 28);
  }, []);
  const crownGeo = useMemo(() => new THREE.ConeGeometry(0.42, 0.18, 7, 1).translate(0, 1.02, 0), []);
  const ys = useMemo(() => STRAWBERRIES.map((s) => terrainHeight(s.x, s.z) - 0.02), []);
  const y = useMemo(() => (i: number) => ys[i], [ys]);
  useInstances(body, STRAWBERRIES, y, (s) => [s, s, s], 0.08);
  useInstances(crown, STRAWBERRIES, y, (s) => [s, s, s], 0.08);
  return (
    <>
      <instancedMesh ref={body} args={[bodyGeo, undefined, STRAWBERRIES.length]} castShadow receiveShadow>
        <meshStandardMaterial map={strawberryTexture()} roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={crown} args={[crownGeo, undefined, STRAWBERRIES.length]}>
        <meshStandardMaterial color="#3fae4a" roughness={0.7} />
      </instancedMesh>
    </>
  );
}

// ------------------------------------------------------------------ sprinkles on the ground

const SPRINKLE_COLORS = ['#ff5fa2', '#ffd23f', '#4cc9f0', '#7ee081', '#ffffff', '#a77bff'].map((c) => new THREE.Color(c));

export function GroundSprinkles({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => SPRINKLES.slice(0, count), [count]);
  const geo = useMemo(() => new THREE.CapsuleGeometry(0.025, 0.09, 2, 6).rotateZ(Math.PI / 2), []);
  const ys = useMemo(() => items.map((s) => terrainHeight(s.x, s.z) + 0.02), [items]);
  const y = useMemo(() => (i: number) => ys[i], [ys]);
  const colors = useMemo(() => (i: number) => SPRINKLE_COLORS[Math.floor(items[i].c * SPRINKLE_COLORS.length)], [items]);
  useInstances(ref, items, y, (s) => [s, s, s], 0, colors);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, items.length]}>
      <meshStandardMaterial roughness={0.4} />
    </instancedMesh>
  );
}

// ------------------------------------------------------------------ ice-cream towers (landmarks)

export function IceCreamTowers() {
  const waffle = useMemo(() => waffleTexture(), []);
  const scoops = ['#ffb3d1', '#fff1c7', '#9ee6c4', '#c8a2ff', '#ffcf8a'];
  return (
    <>
      {ICE_CREAMS.map((ic, k) => (
        <group key={k} position={[ic.x, terrainHeight(ic.x, ic.z) - 0.2, ic.z]} scale={ic.s}>
          <mesh position={[0, 1.2, 0]} rotation={[Math.PI, 0, 0]} castShadow>
            <coneGeometry args={[0.85, 2.4, 24, 1, true]} />
            <meshStandardMaterial map={waffle} roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.sin(i * 2.1) * 0.12, 2.65 + i * 0.75, Math.cos(i * 2.1) * 0.12]} castShadow>
              <sphereGeometry args={[0.95 - i * 0.12, 24, 18]} />
              <meshStandardMaterial color={scoops[(k + i) % scoops.length]} roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[0, 4.55, 0]}>
            <sphereGeometry args={[0.24, 16, 12]} />
            <meshStandardMaterial color="#e3173e" roughness={0.2} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ------------------------------------------------------------------ cupcake houses and the bakery

const WRAP_COLORS = ['#ff8fbf', '#7fd6ff', '#ffd35c', '#b58cff'];
const FROSTING = ['#fff4fa', '#ffd6ea', '#fff2c4', '#e6f8ff'];

function Cupcake({ radius, height, wrap, frosting, door = true, windows = 2 }: { radius: number; height: number; wrap: string; frosting: string; door?: boolean; windows?: number }) {
  const wrapTex = useMemo(() => wrapperTexture(wrap), [wrap]);
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 0.82, height, 32, 1]} />
        <meshStandardMaterial map={wrapTex} roughness={0.7} />
      </mesh>
      {/* swirled frosting roof: three stacked rings and a top dollop */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, height + 0.12 + i * radius * 0.32, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[radius * (1.0 - i * 0.28), radius * 0.26, 14, 36]} />
          <meshStandardMaterial color={frosting} roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, height + radius * 1.05, 0]} castShadow>
        <sphereGeometry args={[radius * 0.32, 20, 14]} />
        <meshStandardMaterial color={frosting} roughness={0.55} />
      </mesh>
      <mesh position={[0, height + radius * 1.42, 0]}>
        <sphereGeometry args={[radius * 0.17, 16, 12]} />
        <meshStandardMaterial color="#e3173e" roughness={0.2} />
      </mesh>
      {door && (
        <group position={[0, 0, radius * 0.93]}>
          <mesh position={[0, height * 0.32, 0]}>
            <boxGeometry args={[radius * 0.5, height * 0.62, 0.08]} />
            <meshStandardMaterial color="#8a4b2a" roughness={0.8} />
          </mesh>
          <mesh position={[0, height * 0.63, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[radius * 0.25, radius * 0.25, 0.08, 20, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#8a4b2a" roughness={0.8} />
          </mesh>
          <mesh position={[radius * 0.15, height * 0.3, 0.06]}>
            <sphereGeometry args={[0.05, 10, 8]} />
            <meshStandardMaterial color="#ffd23f" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      )}
      {Array.from({ length: windows }, (_, i) => {
        const a = (i % 2 ? 1 : -1) * 0.75;
        return (
          <mesh key={i} position={[Math.sin(a) * radius * 0.97, height * 0.62, Math.cos(a) * radius * 0.97]} rotation={[0, a, 0]}>
            <circleGeometry args={[radius * 0.17, 20]} />
            <meshStandardMaterial color="#fff6b0" emissive="#ffd86b" emissiveIntensity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

export function CupcakeHouses() {
  return (
    <>
      {HOUSES.map((h, i) => (
        <group key={i} position={[h.x, terrainHeight(h.x, h.z) - 0.05, h.z]} rotation={[0, h.rot, 0]} scale={h.s}>
          <Cupcake radius={1.45} height={1.9} wrap={WRAP_COLORS[h.c]} frosting={FROSTING[h.c]} />
        </group>
      ))}
    </>
  );
}

/** Koko's bakery: a giant cupcake with an awning, a chimney puffing sugar clouds and a cake sign. */
export function Bakery() {
  const puff = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    puff.current.children.forEach((c, i) => {
      const k = ((t * 0.35 + i / 3) % 1);
      c.position.y = k * 2.2;
      c.scale.setScalar(0.25 + k * 0.6);
      ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.85 * (1 - k);
    });
  });
  const y = terrainHeight(BAKERY.x, BAKERY.z) - 0.05;
  return (
    <group position={[BAKERY.x, y, BAKERY.z]}>
      <Cupcake radius={3.2} height={3.4} wrap="#ff8fbf" frosting="#fff4fa" windows={4} />
      {/* striped awning over the door */}
      <mesh position={[0, 2.55, 3.35]} rotation={[0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[1.3, 1.3, 0.12, 24, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial map={caneTexture('#ff5fa2')} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* sign: a round cookie with a little cake on it */}
      <group position={[0, 3.25, 3.25]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.12, 32]} />
          <meshStandardMaterial map={cookieTexture()} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.05, 0.12]}>
          <cylinderGeometry args={[0.28, 0.3, 0.26, 20]} />
          <meshStandardMaterial color="#ff8fbf" />
        </mesh>
        <mesh position={[0, 0.12, 0.12]}>
          <sphereGeometry args={[0.1, 12, 10]} />
          <meshStandardMaterial color="#e3173e" />
        </mesh>
      </group>
      {/* chimney (a candle) with sugar puffs */}
      <group position={[1.6, 3.4, -1.0]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 2.2, 16]} />
          <meshStandardMaterial map={caneTexture('#5ab8ff')} roughness={0.4} />
        </mesh>
        <group ref={puff} position={[0, 2.8, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i}>
              <sphereGeometry args={[0.5, 14, 10]} />
              <meshStandardMaterial color="#ffe6f3" transparent opacity={0.8} roughness={1} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

// ------------------------------------------------------------------ platforms

function Donut({ r, color }: { r: number; color: string }) {
  const R = r * 0.66;
  const tube = r * 0.36;
  const sprinkles = useMemo(() => Array.from({ length: 26 }, (_, i) => ({ a: (i / 26) * Math.PI * 2 + i * 0.37, k: (i * 7) % 6, w: ((i * 13) % 10) / 10 })), []);
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <torusGeometry args={[R, tube, 18, 40]} />
        <meshStandardMaterial color="#e2a35c" roughness={0.75} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} scale={[1, 1, 0.75]}>
        <torusGeometry args={[R, tube * 0.98, 18, 40, Math.PI * 2]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      {sprinkles.map((s, i) => (
        <mesh key={i} position={[Math.cos(s.a) * (R + (s.w - 0.5) * tube), tube * 0.86, Math.sin(s.a) * (R + (s.w - 0.5) * tube)]} rotation={[Math.PI / 2, 0, s.a * 3]}>
          <capsuleGeometry args={[0.03, 0.1, 2, 6]} />
          <meshStandardMaterial color={SPRINKLE_COLORS[s.k].getStyle()} />
        </mesh>
      ))}
    </group>
  );
}

export function CandyPlatforms() {
  return (
    <>
      {PLATFORM_DEFS.map((p, i) => {
        const g = terrainHeight(p.x, p.z);
        const top = PLATFORMS[i].top;
        if (p.kind === 'donut') {
          const tube = p.r * 0.36;
          return (
            <group key={i} position={[p.x, g, p.z]}>
              <mesh position={[0, (top - g) / 2, 0]} castShadow>
                <cylinderGeometry args={[0.16, 0.2, top - g, 12]} />
                <meshStandardMaterial map={caneTexture('#ff5fa2')} roughness={0.35} />
              </mesh>
              <group position={[0, top - g - tube * 0.95, 0]}>
                <Donut r={p.r} color={['#ff8fbf', '#8a4b2a', '#fff2c4'][i % 3]} />
              </group>
            </group>
          );
        }
        if (p.kind === 'marshmallow') {
          const n = Math.max(1, Math.round((top - g) / 0.55));
          const h = (top - g + 0.2) / n;
          return (
            <group key={i} position={[p.x, g - 0.2, p.z]}>
              {Array.from({ length: n }, (_, k) => (
                <mesh key={k} position={[0, h * k + h / 2, 0]} rotation={[0, k * 0.5, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[p.r * (k % 2 ? 0.96 : 1), p.r * (k % 2 ? 0.96 : 1), h * 0.96, 28]} />
                  <meshStandardMaterial color={k % 2 ? '#ffd6ea' : '#fffaff'} roughness={0.95} />
                </mesh>
              ))}
            </group>
          );
        }
        if (p.kind === 'cake') {
          const H = top - g + 0.2;
          return (
            <group key={i} position={[p.x, g - 0.2, p.z]}>
              {[0, 1, 2].map((k) => (
                <group key={k}>
                  <mesh position={[0, (H / 3) * k + H / 6, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[p.r * (1.25 - k * 0.12), p.r * (1.25 - k * 0.12), H / 3, 32]} />
                    <meshStandardMaterial color={['#ffc4dc', '#fff2c4', '#c9f0dc'][k]} roughness={0.7} />
                  </mesh>
                  <mesh position={[0, (H / 3) * (k + 1) - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[p.r * (1.25 - k * 0.12), 0.07, 8, 40]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.6} />
                  </mesh>
                </group>
              ))}
            </group>
          );
        }
        // cupcake stool
        return (
          <group key={i} position={[p.x, g - 0.05, p.z]}>
            <Cupcake radius={p.r} height={top - g - p.r * 0.4} wrap="#7fd6ff" frosting="#ffd6ea" door={false} windows={0} />
          </group>
        );
      })}
    </>
  );
}

// ------------------------------------------------------------------ cookie bridge

export function CookieBridge() {
  const cookie = useMemo(() => cookieTexture(), []);
  const cane = useMemo(() => caneTexture(), []);
  const planks = useMemo(() => Array.from({ length: 9 }, (_, k) => (k / 8) * 2 - 1), []);
  const posts = useMemo(() => [-1, -0.5, 0, 0.5, 1], []);
  return (
    <group position={[BRIDGE.x, 0, BRIDGE.z]}>
      {planks.map((u, k) => (
        <mesh key={k} position={[0, bridgeDeck(u) - 0.08, u * (BRIDGE.len / 2)]} castShadow receiveShadow>
          <cylinderGeometry args={[BRIDGE.w / 2 + 0.15, BRIDGE.w / 2 + 0.15, 0.16, 32]} />
          <meshStandardMaterial map={cookie} roughness={0.85} />
        </mesh>
      ))}
      {[1, -1].map((side) => (
        <group key={side}>
          {posts.map((u, k) => (
            <mesh key={k} position={[side * (BRIDGE.w / 2 + 0.05), bridgeDeck(u) + 0.35, u * (BRIDGE.len / 2) * 0.95]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 0.8, 10]} />
              <meshStandardMaterial map={cane} roughness={0.3} />
            </mesh>
          ))}
          {/* liquorice rope rail along the arch */}
          <mesh>
            <tubeGeometry
              args={[
                new THREE.CatmullRomCurve3(posts.map((u) => new THREE.Vector3(side * (BRIDGE.w / 2 + 0.05), bridgeDeck(u) + 0.72, u * (BRIDGE.len / 2) * 0.95))),
                40,
                0.05,
                8,
                false,
              ]}
            />
            <meshStandardMaterial color="#e2265a" roughness={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
