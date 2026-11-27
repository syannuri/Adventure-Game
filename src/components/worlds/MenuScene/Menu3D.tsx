/**
 * The 3D layer of the home screen. A transparent WebGL canvas drawn over the painted sky (and under
 * the illustrated Anet and the menu): the five world islands float in 3D as little animated
 * dioramas, puffy clouds drift past at different depths, a trail of fairy dust links the islands in
 * order, Lumi flies loops leaving sparkles, birds cross the sky, butterflies and petals drift over
 * the meadow, and everything moves with a gentle parallax when the mouse or finger moves.
 * Tapping an island makes it bounce and shows its name.
 *
 * It is loaded after the painted menu has appeared, so the first paint stays instant; if WebGL is
 * not available the painted menu (with its 2D islands) simply stays as it is.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Lightformer, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { WORLDS } from '../../../data/worlds';
import { ISLAND_SPOTS } from '../../../data/menuIslands';
import { useGame } from '../../../systems/store';
import { audio } from '../../audio/audioEngine';
import { sparkleBurst } from '../../ui/sparkleBurst';
import { useT } from '../../../i18n/useT';
import { glowTexture } from '../../effects/textures';
import { mulberry32 } from '../../../utils/math';

const BASE_CAM = new THREE.Vector3(0, 1.6, 10);
const LOOK = new THREE.Vector3(0, 2.4, 0);
/** how far from the camera each island floats (further back = smaller and slower parallax) */
const DEPTH = [13, 15, 13.5, 17, 19];
const pointer = { x: 0, y: 0, at: 0 };
/** on tall phone screens the islands sit in the free space beside Anet: [centre x %, centre y %, width vw] */
/** iPad and other 4:3-ish screens held sideways: the gap between the menu column and Anet, and the sky above */
const TABLET_LAND_3D = [
  [56, 52, 9],
  [50, 13, 7],
  [57, 76, 7],
  [62, 33, 6],
  [67, 10, 6],
] as const;
/** phones held sideways (short screens): the top strip and the gap right of the Play button */
const PHONE_LAND_3D = [
  [57, 66, 7.5],
  [49, 21, 6],
  [37, 28, 5],
  [31, 10, 4.5],
  [42, 9, 5],
] as const;
const PORTRAIT_3D = [
  [14, 38, 22],
  [83, 22, 22],
  [15, 52, 18],
  [84, 50, 18],
  [15, 19, 17],
] as const;

// ------------------------------------------------------------------------------------- helpers

/** an inverted lumpy rock: the underside of a floating island */
function rockGeometry(seed: number, r = 1, h = 1.5) {
  const g = new THREE.ConeGeometry(r, h, 14, 5);
  g.rotateX(Math.PI);
  g.translate(0, -h / 2 - 0.05, 0);
  const rnd = mulberry32(seed);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const bumps = Array.from({ length: 8 }, () => ({ a: rnd() * Math.PI * 2, y: -rnd() * h, s: 0.12 + rnd() * 0.12 }));
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y > -0.06) continue;
    const a = Math.atan2(z, x);
    let k = 1;
    for (const b of bumps) k += Math.cos(a - b.a) * Math.exp(-(((y - b.y) / 0.35) ** 2)) * b.s;
    pos.setXYZ(i, x * k, y, z * k);
  }
  g.computeVertexNormals();
  return g;
}

function useSwirlTexture(a: string, b: string) {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    g.fillStyle = a;
    g.fillRect(0, 0, 64, 64);
    g.strokeStyle = b;
    g.lineWidth = 7;
    g.beginPath();
    for (let t = 0; t < 14; t += 0.1) g.lineTo(32 + Math.cos(t) * t * 2.2, 32 + Math.sin(t) * t * 2.2);
    g.stroke();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [a, b]);
}

const std = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });

// ------------------------------------------------------------------------------------- the five dioramas

function ForestIsland() {
  const trees = useRef<THREE.Group>(null!);
  const fall = useRef<THREE.Mesh>(null!);
  const fallMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform float uTime; varying vec2 vUv; void main(){ float s = fract(vUv.y * 4.0 + uTime * 1.6 + sin(vUv.x * 20.0) * 0.1); vec3 c = mix(vec3(0.55,0.85,1.0), vec3(1.0), smoothstep(0.6,1.0,s)); gl_FragColor = vec4(c, 0.8 * smoothstep(0.0,0.15,vUv.x) * smoothstep(1.0,0.85,vUv.x) * smoothstep(0.0,0.3,vUv.y)); }',
      }),
    [],
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    trees.current.children.forEach((c, i) => (c.rotation.z = Math.sin(t * 1.3 + i) * 0.05));
    fallMat.uniforms.uTime.value = t;
    void fall;
  });
  return (
    <group>
      <group ref={trees}>
        {[
          [-0.4, -0.15, 1],
          [0.35, -0.35, 0.8],
          [0.1, 0.4, 1.15],
        ].map(([x, z, s], i) => (
          <group key={i} position={[x, 0, z]} scale={s}>
            <mesh position={[0, 0.3, 0]} material={std('#8a5a36')}>
              <cylinderGeometry args={[0.06, 0.09, 0.6, 7]} />
            </mesh>
            <mesh position={[0, 0.75, 0]} material={std(i % 2 ? '#4fae4a' : '#5fbf55', { flatShading: true })}>
              <icosahedronGeometry args={[0.36, 1]} />
            </mesh>
            <mesh position={[0.12, 0.98, 0.05]} material={std('#6fcf5f', { flatShading: true })}>
              <icosahedronGeometry args={[0.24, 1]} />
            </mesh>
          </group>
        ))}
      </group>
      <group position={[0.6, 0, 0.35]}>
        <mesh position={[0, 0.12, 0]} material={std('#f6ecd6')}>
          <cylinderGeometry args={[0.05, 0.06, 0.24, 8]} />
        </mesh>
        <mesh position={[0, 0.25, 0]} scale={[1, 0.6, 1]} material={std('#ef5a5a')}>
          <sphereGeometry args={[0.17, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>
      {/* a little waterfall pouring off the edge */}
      <mesh ref={fall} position={[-0.2, -0.7, 0.93]} material={fallMat}>
        <planeGeometry args={[0.32, 1.5]} />
      </mesh>
    </group>
  );
}

function CandyIsland() {
  const pops = useRef<THREE.Group>(null!);
  const swirlA = useSwirlTexture('#ffffff', '#ff5aa0');
  const swirlB = useSwirlTexture('#fff3a0', '#7ad0ff');
  useFrame(({ clock }) => {
    pops.current.children.forEach((c, i) => (c.rotation.z = clock.elapsedTime * (i ? -0.8 : 0.6)));
  });
  return (
    <group>
      {/* frosting drips around the rim */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.98, -0.12 - (i % 3) * 0.05, Math.sin(a) * 0.98]} scale={[1, 1.6, 1]} material={std('#fff4fb')}>
            <sphereGeometry args={[0.09, 8, 6]} />
          </mesh>
        );
      })}
      {/* cupcake house */}
      <group position={[0.05, 0, -0.1]}>
        <mesh position={[0, 0.28, 0]} material={std('#e6b88a')}>
          <cylinderGeometry args={[0.42, 0.34, 0.56, 16]} />
        </mesh>
        <mesh position={[0, 0.62, 0]} scale={[1, 0.75, 1]} material={std('#ff9ccf')}>
          <sphereGeometry args={[0.46, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 1.0, 0]} material={std('#e8304a', { roughness: 0.3 })}>
          <sphereGeometry args={[0.1, 12, 10]} />
        </mesh>
        <mesh position={[0, 0.2, 0.37]} material={std('#8a5a36')}>
          <boxGeometry args={[0.18, 0.3, 0.04]} />
        </mesh>
      </group>
      <group ref={pops}>
        {[
          [-0.62, 0.25, swirlA],
          [0.62, 0.3, swirlB],
        ].map(([x, z, tex], i) => (
          <group key={i} position={[x as number, 0.75, z as number]}>
            <mesh>
              <cylinderGeometry args={[0.2, 0.2, 0.05, 20]} />
              <meshStandardMaterial map={tex as THREE.Texture} roughness={0.35} />
            </mesh>
          </group>
        ))}
      </group>
      {[-0.62, 0.62].map((x, i) => (
        <mesh key={i} position={[x, 0.37, i ? 0.3 : 0.25]} material={std('#ffffff')}>
          <cylinderGeometry args={[0.02, 0.02, 0.75, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function CrystalIsland() {
  const glow = useRef<THREE.MeshStandardMaterial[]>([]);
  useFrame(({ clock }) => {
    glow.current.forEach((m, i) => m && (m.emissiveIntensity = 1.1 + Math.sin(clock.elapsedTime * 2 + i) * 0.5));
  });
  const shards = [
    [0, 0, 0.55, 0, '#c9a7ff'],
    [0.3, 0.15, 0.4, 0.4, '#8ff3ff'],
    [-0.28, 0.1, 0.38, -0.35, '#ff9ee0'],
    [0.1, -0.35, 0.3, 0.2, '#c9a7ff'],
    [-0.45, -0.3, 0.26, -0.5, '#8ff3ff'],
    [0.55, -0.25, 0.24, 0.6, '#ff9ee0'],
  ] as const;
  return (
    <group>
      {shards.map(([x, z, h, tilt, c], i) => (
        <mesh key={i} position={[x, h * 0.9, z]} rotation={[0, i, tilt * 0.4]} scale={[0.5, 1.6, 0.5]}>
          <octahedronGeometry args={[h * 0.6, 0]} />
          <meshStandardMaterial ref={(m) => m && (glow.current[i] = m)} color={c} emissive={c} emissiveIntensity={1.2} roughness={0.1} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function OceanIsland() {
  const water = useRef<THREE.Mesh>(null!);
  const turtle = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    water.current.rotation.z = t * 0.2;
    turtle.current.position.set(Math.cos(t * 0.6) * 0.45, 0.07 + Math.sin(t * 2) * 0.02, Math.sin(t * 0.6) * 0.45);
    turtle.current.rotation.y = -t * 0.6;
  });
  return (
    <group>
      <mesh ref={water} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.82, 32]} />
        <meshStandardMaterial color="#5fe0d6" emissive="#2aa8c8" emissiveIntensity={0.35} roughness={0.1} metalness={0.2} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos(i * 2.1) * 0.62, 0.22, Math.sin(i * 2.1) * 0.62]} rotation={[0, i, 0.3]} material={std(['#ff7a8a', '#ffb36b', '#c79bff'][i])}>
          <coneGeometry args={[0.08, 0.36, 6]} />
        </mesh>
      ))}
      <group ref={turtle} scale={0.6}>
        <mesh scale={[1, 0.5, 1.2]} material={std('#3fa86a')}>
          <sphereGeometry args={[0.16, 12, 8]} />
        </mesh>
        <mesh position={[0, 0.02, 0.2]} material={std('#8fd88a')}>
          <sphereGeometry args={[0.07, 10, 8]} />
        </mesh>
      </group>
    </group>
  );
}

function CastleIsland() {
  const flags = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    flags.current.children.forEach((f, i) => (f.rotation.y = Math.sin(clock.elapsedTime * 3 + i) * 0.4));
  });
  const towers = [
    [0, 0, 0.18, 1.0],
    [-0.42, 0.1, 0.13, 0.7],
    [0.42, 0.1, 0.13, 0.75],
    [0, -0.35, 0.12, 0.6],
  ] as const;
  return (
    <group>
      <mesh position={[0, 0.2, 0.05]} material={std('#fff4fb')}>
        <boxGeometry args={[0.9, 0.4, 0.5]} />
      </mesh>
      {towers.map(([x, z, r, h], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, h / 2, 0]} material={std('#fff4fb')}>
            <cylinderGeometry args={[r, r * 1.1, h, 12]} />
          </mesh>
          <mesh position={[0, h + r * 1.1, 0]} material={std('#ff8fbf')}>
            <coneGeometry args={[r * 1.35, r * 2.4, 12]} />
          </mesh>
        </group>
      ))}
      <group ref={flags}>
        {towers.map(([x, z, r, h], i) => (
          <mesh key={i} position={[x + 0.1, h + r * 2.5, z]} material={std('#ffd23f', { side: THREE.DoubleSide })}>
            <planeGeometry args={[0.18, 0.1]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

const DIORAMA = [ForestIsland, CandyIsland, CrystalIsland, OceanIsland, CastleIsland];
const TOPS = ['#6fbf55', '#ffc4e1', '#8a78c8', '#f3e2b0', '#ffffff'];
const ROCKS = ['#9a7a5e', '#c98a5a', '#5e5388', '#c7a77a', '#e8eef8'];

/** one floating world island; its place follows the painted layout's screen spots */
function WorldIsland({ i, spot }: { i: number; spot: { pos: THREE.Vector3; scale: number } }) {
  const w = WORLDS[i];
  const done = useGame((s) => s.save.completedWorlds.includes(w.id));
  const t = useT();
  const ref = useRef<THREE.Group>(null!);
  const bounce = useRef(-10);
  const [label, setLabel] = useState(false);
  const timer = useRef(0);
  const born = useRef(-1);
  const rock = useMemo(() => rockGeometry(i * 7 + 3), [i]);
  const Diorama = DIORAMA[i];
  const cloudBase = i === 4;
  const star = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t2 = clock.elapsedTime;
    if (born.current < 0) born.current = t2;
    // fly in from below, one after the other
    const k = Math.min(1, Math.max(0, (t2 - born.current - 0.25 - i * 0.18) / 1.1));
    const ease = 1 - Math.pow(1 - k, 3) * Math.cos(k * 4.2);
    const since = performance.now() / 1000 - bounce.current;
    const b = since < 0.8 ? Math.exp(-since * 5) * Math.sin(since * 22) * 0.18 : 0;
    ref.current.position.set(spot.pos.x, spot.pos.y + Math.sin(t2 * 0.8 + i * 1.7) * 0.12 * spot.scale - (1 - ease) * 4, spot.pos.z);
    ref.current.scale.setScalar(spot.scale * Math.max(0.001, ease) * (1 + b));
    ref.current.rotation.y = Math.sin(t2 * 0.25 + i) * 0.35 - 0.2;
    // tip the island toward the camera so its little world on top shows
    ref.current.rotation.x = 0.38 + Math.sin(t2 * 0.6 + i) * 0.04;
    if (star.current) star.current.rotation.y = t2 * 1.5;
  });
  return (
    <group
      ref={ref}
      onPointerDown={(e) => {
        e.stopPropagation();
        bounce.current = performance.now() / 1000;
        audio.unlock();
        audio.sfx(w.built ? 'star' : 'pop', { pitch: w.built ? 1.2 : 0.8, volume: 0.6 });
        sparkleBurst(e.nativeEvent.clientX, e.nativeEvent.clientY, ['#fff3a0', '#ffb3d1', '#c9a7ff', w.colors[0]]);
        setLabel(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setLabel(false), 1800);
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* top: grass, frosting, crystal rock, sand, or a cloud */}
      {cloudBase ? (
        <Puff color="#ffffff" shade="#f3d9ff" scale={1.05} y={-0.1} />
      ) : (
        <>
          <mesh position={[0, -0.06, 0]} material={std(TOPS[i])}>
            <cylinderGeometry args={[1, 0.98, 0.16, 28]} />
          </mesh>
          <mesh geometry={rock} material={std(ROCKS[i], { flatShading: true })} />
        </>
      )}
      <Diorama />
      {!w.built && (
        <group position={[0, 1.55, 0]}>
          <mesh material={std('#ffd23f', { metalness: 0.4, roughness: 0.3 })}>
            <boxGeometry args={[0.32, 0.26, 0.12]} />
          </mesh>
          <mesh position={[0, 0.17, 0]} material={std('#ffd23f', { metalness: 0.4, roughness: 0.3 })}>
            <torusGeometry args={[0.1, 0.03, 6, 14, Math.PI]} />
          </mesh>
        </group>
      )}
      {done && (
        <group ref={star} position={[0, 1.7, 0]}>
          <mesh material={std('#ffc928', { emissive: '#ffb300', emissiveIntensity: 0.8, metalness: 0.3, roughness: 0.3 })}>
            <extrudeGeometry args={[starShape, { depth: 0.08, bevelEnabled: false }]} />
          </mesh>
        </group>
      )}
      {label && (
        <Html position={[0, 1.9, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div className="island-tag">
            {t.worlds[w.id]?.name ?? w.name} {done ? '✓' : w.built ? '' : '🔒'}
          </div>
        </Html>
      )}
    </group>
  );
}

const starShape = (() => {
  const s = new THREE.Shape();
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 0.1 : 0.24;
    const a = (k / 10) * Math.PI * 2 + Math.PI / 2;
    if (k === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
})();

/** a soft cloud made of a few balls, white on top and blushing pink underneath */
function Puff({ color = '#fffaf2', shade = '#ffd0cc', scale = 1, y = 0 }: { color?: string; shade?: string; scale?: number; y?: number }) {
  const balls = useMemo(
    () => [
      [0, 0, 0, 0.62],
      [-0.6, -0.1, 0.1, 0.45],
      [0.6, -0.08, 0, 0.5],
      [0.25, 0.25, -0.15, 0.42],
      [-0.3, 0.2, 0.2, 0.36],
    ],
    [],
  );
  const top = useMemo(() => std(color, { roughness: 1, emissive: color, emissiveIntensity: 0.25 }), [color]);
  const under = useMemo(() => std(shade, { roughness: 1, emissive: shade, emissiveIntensity: 0.25 }), [shade]);
  return (
    <group scale={scale} position={[0, y, 0]}>
      {balls.map(([x, yy, z, r], i) => (
        <mesh key={i} position={[x, yy, z]} material={top}>
          <sphereGeometry args={[r, 18, 12]} />
        </mesh>
      ))}
      <mesh position={[0, -0.28, 0]} scale={[1.6, 0.35, 0.8]} material={under}>
        <sphereGeometry args={[0.62, 18, 10]} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------------------------- sky life

/** clouds drifting slowly across at different depths */
function Clouds({ small }: { small: boolean }) {
  const list = useMemo(() => {
    const r = mulberry32(5);
    return Array.from({ length: small ? 5 : 7 }, (_, i) => ({ x: -16 + r() * 32, y: 3 + r() * 6, z: -6 - r() * 22, s: (1.2 + r() * 1.8) * (small ? 0.55 : 1), v: 0.15 + r() * 0.25, k: i }));
  }, [small]);
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    list.forEach((c, i) => {
      c.x += c.v * dt;
      if (c.x > 22) c.x = -22;
      const g = refs.current[i];
      if (g) g.position.set(c.x, c.y + Math.sin(c.x * 0.3 + i) * 0.2, c.z);
    });
  });
  return (
    <>
      {list.map((c, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} scale={c.s}>
          <Puff />
        </group>
      ))}
    </>
  );
}

/** Lumi, a little glowing fairy, flying loops between the islands with a trail of sparkles */
function Fairy({ path }: { path: THREE.CatmullRomCurve3 | null }) {
  const glow = useMemo(() => glowTexture(), []);
  const head = useRef<THREE.Sprite>(null!);
  const trail = useRef<(THREE.Sprite | null)[]>([]);
  const hist = useRef<THREE.Vector3[]>(Array.from({ length: 18 }, () => new THREE.Vector3()));
  useFrame(({ clock }) => {
    if (!path) return;
    const t = clock.elapsedTime;
    const u = (t * 0.045) % 1;
    const p = path.getPointAt(u);
    p.x += Math.sin(t * 2.3) * 0.5;
    p.y += Math.sin(t * 3.1) * 0.35 + 0.6;
    p.z += Math.cos(t * 1.7) * 0.4;
    head.current.position.copy(p);
    head.current.scale.setScalar(0.9 + Math.sin(t * 9) * 0.15);
    const h = hist.current;
    h.unshift(h.pop()!.copy(p));
    trail.current.forEach((s, i) => {
      if (!s) return;
      s.position.copy(h[i + 1]);
      s.scale.setScalar(0.35 * (1 - i / 18));
    });
  });
  return (
    <>
      <sprite ref={head}>
        <spriteMaterial map={glow} color="#f3e6ff" transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      {Array.from({ length: 16 }, (_, i) => (
        <sprite key={i} ref={(el) => (trail.current[i] = el)}>
          <spriteMaterial map={glow} color={i % 2 ? '#fff3a0' : '#ffc4f0'} transparent opacity={0.9 - i * 0.05} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
      ))}
    </>
  );
}

/** fairy dust flowing along the path that links the worlds in order */
function DustPath({ path }: { path: THREE.CatmullRomCurve3 | null }) {
  const glow = useMemo(() => glowTexture(), []);
  const N = 46;
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  useFrame(({ clock }) => {
    if (!path) return;
    const t = clock.elapsedTime;
    refs.current.forEach((s, i) => {
      if (!s) return;
      const u = ((i / N + t * 0.03) % 1 + 1) % 1;
      s.position.copy(path.getPointAt(u));
      s.position.y += Math.sin(t * 2 + i) * 0.05;
      const tw = 0.5 + 0.5 * Math.sin(t * 4 + i * 1.7);
      s.scale.setScalar(0.12 + tw * 0.12);
    });
  });
  return (
    <>
      {Array.from({ length: N }, (_, i) => (
        <sprite key={i} ref={(el) => (refs.current[i] = el)}>
          <spriteMaterial map={glow} color={i % 3 ? '#fff1a8' : '#ffd0f0'} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
      ))}
    </>
  );
}

/** a small flock of birds gliding across the sky now and then */
function Birds() {
  const group = useRef<THREE.Group>(null!);
  const wings = useRef<THREE.Group[]>([]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#5a4a7a', side: THREE.DoubleSide, transparent: true, opacity: 0.75 }), []);
  const wingGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.35, 0.02, -0.08, 0.1, 0, 0.12], 3));
    return g;
  }, []);
  const birds = useMemo(() => [0, 1, 2, 3, 4].map((i) => ({ dx: -i * 0.7, dy: (i % 2) * 0.35 - i * 0.12, ph: i })), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const cyc = (t * 0.06) % 1;
    group.current.position.set(-24 + cyc * 48, 7 + Math.sin(t * 0.3) * 0.6, -20);
    wings.current.forEach((w, i) => {
      if (!w) return;
      const f = Math.sin(t * 9 + birds[i].ph) * 0.7;
      (w.children[0] as THREE.Object3D).rotation.z = f;
      (w.children[1] as THREE.Object3D).rotation.z = -f;
    });
  });
  return (
    <group ref={group}>
      {birds.map((b, i) => (
        <group key={i} ref={(el) => el && (wings.current[i] = el)} position={[b.dx, b.dy, 0]} rotation={[0.3, Math.PI / 2, 0]}>
          <mesh geometry={wingGeo} material={mat} />
          <mesh geometry={wingGeo} material={mat} scale={[-1, 1, 1]} />
        </group>
      ))}
    </group>
  );
}

/** butterflies over the meadow and petals drifting down */
function Meadow() {
  const flies = useRef<(THREE.Group | null)[]>([]);
  const petals = useRef<(THREE.Mesh | null)[]>([]);
  const fl = useMemo(() => [0, 1, 2].map((i) => ({ x: -3 + i * 3.2, y: -0.4 + i * 0.3, c: ['#ff8fc8', '#ffd23f', '#8fd8ff'][i] })), []);
  const pl = useMemo(() => {
    const r = mulberry32(9);
    return Array.from({ length: 14 }, () => ({ x: -9 + r() * 18, y: r() * 8, z: 1 - r() * 6, s: 0.6 + r() * 0.6, ph: r() * 6, c: ['#ffc4dc', '#ffffff', '#fff1a8'][Math.floor(r() * 3)] }));
  }, []);
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    flies.current.forEach((f, i) => {
      if (!f) return;
      const b = fl[i];
      f.position.set(b.x + Math.sin(t * 0.5 + i * 2) * 1.6, b.y + Math.sin(t * 1.3 + i) * 0.4, 3 + Math.cos(t * 0.4 + i) * 1.2);
      const flap = Math.abs(Math.sin(t * 14 + i)) * 1.1;
      (f.children[0] as THREE.Object3D).rotation.y = flap;
      (f.children[1] as THREE.Object3D).rotation.y = -flap;
      f.rotation.y = Math.sin(t * 0.5 + i * 2) > 0 ? 0.6 : 2.5;
    });
    petals.current.forEach((p, i) => {
      if (!p) return;
      const d = pl[i];
      d.y -= dt * 0.35;
      if (d.y < -2) d.y = 8;
      p.position.set(d.x + Math.sin(t * 0.7 + d.ph) * 0.8, d.y, d.z);
      p.rotation.set(t * 1.2 + d.ph, t * 0.8, t + d.ph);
    });
  });
  return (
    <>
      {fl.map((b, i) => (
        <group key={i} ref={(el) => (flies.current[i] = el)} scale={0.32}>
          {[1, -1].map((side) => (
            <group key={side}>
              <mesh position={[0.26 * side, 0.1, 0]} scale={[1, 1.15, 1]}>
                <circleGeometry args={[0.24, 16]} />
                <meshBasicMaterial color={b.c} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0.2 * side, -0.18, 0]}>
                <circleGeometry args={[0.15, 14]} />
                <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.85} />
              </mesh>
            </group>
          ))}
          <mesh scale={[0.05, 0.3, 0.05]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color="#3a2a3a" />
          </mesh>
        </group>
      ))}
      {pl.map((d, i) => (
        <mesh key={i} ref={(el) => (petals.current[i] = el)} scale={[0.09 * d.s, 0.05 * d.s, 1]}>
          <circleGeometry args={[1, 8]} />
          <meshBasicMaterial color={d.c} side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
      ))}
    </>
  );
}

// ------------------------------------------------------------------------------------- scene

function Scene({ onReady }: { onReady: () => void }) {
  const { camera, size } = useThree();
  const [spots, setSpots] = useState<{ pos: THREE.Vector3; scale: number }[] | null>(null);
  const [path, setPath] = useState<THREE.CatmullRomCurve3 | null>(null);
  const ready = useRef(false);

  // place the islands where the painted layout wants them: screen spot -> ray from the camera
  useEffect(() => {
    const cam = (camera as THREE.PerspectiveCamera).clone();
    cam.position.copy(BASE_CAM);
    cam.lookAt(LOOK);
    cam.aspect = size.width / size.height;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    const portrait = size.width < size.height;
    // pick the layout for this screen shape; the special tables give island centres directly
    const aspect = size.width / size.height;
    const centred = portrait ? PORTRAIT_3D : size.height <= 500 ? PHONE_LAND_3D : aspect < 1.6 ? TABLET_LAND_3D : null;
    const table = centred ? centred.map(([x, y, w]) => [x - w / 2, y, w] as const) : ISLAND_SPOTS.land;
    const list = table.map(([l, tp, wv], i) => {
      const wPx = (wv / 100) * size.width * (centred ? 1 : 1.35);
      const cx = (l / 100) * size.width + ((wv / 100) * size.width) / 2;
      const cy = centred ? (tp / 100) * size.height : (tp / 100) * size.height + ((wv / 100) * size.width) * 0.55;
      const ndc = new THREE.Vector3((cx / size.width) * 2 - 1, -(cy / size.height) * 2 + 1, 0.5);
      const dir = ndc.unproject(cam).sub(cam.position).normalize();
      const pos = cam.position.clone().addScaledVector(dir, DEPTH[i]);
      // width of the view at that distance -> island scale (the dioramas are about 2 units wide)
      const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * DEPTH[i];
      const scale = ((wPx / size.height) * viewH) / 2;
      return { pos, scale };
    });
    setSpots(list);
    setPath(new THREE.CatmullRomCurve3(list.map((s) => s.pos.clone().add(new THREE.Vector3(0, s.scale * 0.2, 0))), false, 'catmullrom', 0.4));
  }, [camera, size.width, size.height]);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    // parallax: follow the pointer, or drift slowly by itself
    const t = clock.elapsedTime;
    const auto = performance.now() - pointer.at > 4000;
    const px = auto ? Math.sin(t * 0.23) * 0.35 : pointer.x;
    const py = auto ? Math.cos(t * 0.19) * 0.2 : pointer.y;
    const want = new THREE.Vector3(BASE_CAM.x + px * 1.2, BASE_CAM.y - py * 0.6, BASE_CAM.z);
    camera.position.lerp(want, Math.min(1, dt * 2));
    camera.lookAt(LOOK);
    if (!ready.current && spots) {
      ready.current = true;
      onReady();
    }
  });

  return (
    <>
      <hemisphereLight args={['#fff2e0', '#b8a0e0', 1.25]} />
      <directionalLight position={[6, 3, 6]} intensity={2.2} color="#ffd9a8" />
      <directionalLight position={[-6, 6, -4]} intensity={0.8} color="#c9b6ff" />
      <Environment resolution={32} frames={1} environmentIntensity={0.6}>
        <Lightformer form="rect" intensity={2} color="#ffe9c8" position={[5, 4, 6]} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={1} color="#c9b6ff" position={[-6, 6, -4]} scale={[10, 6, 1]} />
      </Environment>
      <Clouds small={size.width < size.height} />
      <Birds />
      {spots && spots.map((s, i) => <WorldIsland key={i} i={i} spot={s} />)}
      <DustPath path={path} />
      <Fairy path={path} />
      <Meadow />
      <Sparkles count={60} scale={[22, 10, 8]} position={[0, 3, -2]} size={5} speed={0.35} color="#fff6c8" />
    </>
  );
}

export default function Menu3D() {
  const quality = useGame((s) => s.save.settings.quality);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
      pointer.at = performance.now();
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.classList.remove('menu3d');
      document.body.style.cursor = '';
    };
  }, []);
  return (
    <div className={'mb-3d' + (shown ? ' on' : '')}>
      <Canvas
        dpr={quality === 'high' ? [1, 1.75] : [0.75, 1.25]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: typeof location !== 'undefined' && location.search.includes('capture') }}
        camera={{ fov: 45, near: 0.1, far: 200, position: BASE_CAM.toArray() }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.NeutralToneMapping;
        }}
      >
        <Scene
          onReady={() => {
            setShown(true);
            document.documentElement.classList.add('menu3d');
          }}
        />
      </Canvas>
    </div>
  );
}
