/**
 * Anett – procedural stylized 3D character.
 *
 * DESIGN REFERENCE: docs/anett-reference.jpg (the official look).
 *  - voluminous, wavy dark-brown/black hair falling past the shoulders, full straight-cut bangs
 *  - round face, fair light skin (Indonesian / East-Asian fair tone), big amber-brown eyes with long lashes, small nose, soft smile
 *  - orange hooded zip-up jacket: ribbed darker-orange cuffs & hem, chest pockets with flaps,
 *    silver zipper, white hood drawstrings
 *  - big khaki hiking backpack with grey shoulder straps, sternum strap and dangling strap ends
 *  - cream shorts, thick slouchy cream socks, tan lace-up hiking boots with cream soles
 *
 * PLACEHOLDER NOTICE: built from Three.js primitives + generated geometry until a sculpted & rigged
 * GLB (Blender / Mixamo pipeline) is available. The joint groups (hips, spine, neck, shoulders,
 * elbows, legs, knees) form the skeleton that AnettAnimations drives. Never change proportions or
 * colours between scenes: every scene uses this one component and the palette below.
 */
import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { smoothstep } from '../../../utils/math';

export const ANETT_PALETTE = {
  skin: '#f9dcc6', // fair, light warm-ivory (Indonesian / East-Asian fair skin)
  skinShade: '#efc2a6',
  hair: '#2b221e',
  hairSheen: '#8c7b70',
  irisInner: '#f2a145',
  irisMid: '#b8621d',
  irisRim: '#4a230b',
  lash: '#1e1512',
  brow: '#4a352b',
  jacket: '#e9843b',
  jacketRib: '#c8622a',
  zipper: '#c9c9cf',
  drawstring: '#f3ece0',
  shorts: '#efe6d4',
  sock: '#ece3d3',
  boot: '#c99468',
  bootDark: '#a9744d',
  sole: '#f2e7d4',
  pack: '#b39b76',
  packDark: '#9b8463',
  packLight: '#c4ae8a',
  strap: '#7f7a70',
  strapDark: '#3a3936',
  cheek: '#ff9b8f',
  lips: '#c4655c',
};

export interface AnettRig {
  root: THREE.Group;
  body: THREE.Group;
  hips: THREE.Group;
  spine: THREE.Group;
  neck: THREE.Group;
  shoulderL: THREE.Group;
  elbowL: THREE.Group;
  shoulderR: THREE.Group;
  elbowR: THREE.Group;
  legL: THREE.Group;
  kneeL: THREE.Group;
  legR: THREE.Group;
  kneeR: THREE.Group;
  eyeL: THREE.Group;
  eyeR: THREE.Group;
  mouthSmile: THREE.Mesh;
  mouthOpen: THREE.Mesh;
  hairBack: THREE.Group;
}

// ------------------------------------------------------------------ generated geometry helpers

/** Fine vertical ridges around the Y axis (hair strands, knit ribbing). */
function ridges<T extends THREE.BufferGeometry>(g: T, count = 22, depth = 0.02): T {
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const a = Math.atan2(x, z);
    const k = 1 + Math.sin(a * count) * depth + Math.sin(a * count * 2.3 + 1) * depth * 0.4;
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * The big wavy hair mass: a surface of revolution around the head that is open at the front
 * (for the face), widens toward the shoulders, has soft large waves, fine strands and an
 * uneven wavy bottom edge.
 */
function hairMantle() {
  const rows = 22;
  const seg = 96;
  const top = 0.1;
  const bottom = -0.38;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    const open = 0.98 - 0.42 * smoothstep(0.35, 1, t); // face opening narrows below the chin
    for (let j = 0; j <= seg; j++) {
      const u = j / seg;
      const th = open + u * (Math.PI * 2 - 2 * open); // 0 = straight ahead (+z)
      // mirror-symmetric angle measured from the back of the head
      const a = Math.abs(th - Math.PI);
      let r = 0.272 + 0.11 * Math.pow(t, 1.2) + 0.045 * smoothstep(0.65, 1, t);
      r += (Math.cos(a * 6 + t * 6.5) * 0.03 + Math.cos(a * 11 - t * 4) * 0.012) * smoothstep(0.12, 0.6, t);
      r *= 1 + Math.cos(a * 50) * 0.006 + Math.cos(a * 21 + 2) * 0.009;
      let y = top + (bottom - top) * t;
      if (i === rows) y += Math.cos(a * 8) * 0.035 + Math.cos(a * 4.5 + 1) * 0.02 + 0.02;
      pos.push(Math.sin(th) * r, y, Math.cos(th) * r);
    }
  }
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j;
      const b = a + seg + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Full straight-cut bangs with a slightly uneven (wispy) lower edge. */
function bangsGeometry() {
  const g = new THREE.SphereGeometry(0.284, 80, 18, Math.PI / 2 - 1.08, 2.16, 0.16, 1.1);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < 0.13) {
      const x = pos.getX(i);
      pos.setY(i, y - (Math.sin(x * 140) * 0.5 + 0.5) * 0.014 - Math.abs(Math.sin(x * 37)) * 0.008);
    }
  }
  g.computeVertexNormals();
  return g;
}

let irisTex: THREE.Texture | null = null;
/** Painted amber iris with radial streaks, dark limbal ring and pupil. */
function irisTexture() {
  if (irisTex) return irisTex;
  const P = ANETT_PALETTE;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  grd.addColorStop(0, P.irisInner);
  grd.addColorStop(0.55, P.irisMid);
  grd.addColorStop(0.86, '#7a3a12');
  grd.addColorStop(1, P.irisRim);
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  g.globalAlpha = 0.22;
  for (let i = 0; i < 70; i++) {
    const a = (i / 70) * Math.PI * 2;
    g.strokeStyle = i % 2 ? '#ffd08a' : '#5a2a0c';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(64 + Math.cos(a) * 22, 64 + Math.sin(a) * 22);
    g.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.fillStyle = '#120804';
  g.beginPath();
  g.arc(64, 64, 25, 0, Math.PI * 2);
  g.fill();
  irisTex = new THREE.CanvasTexture(c);
  irisTex.colorSpace = THREE.SRGBColorSpace;
  return irisTex;
}

function useMaterials() {
  return useMemo(() => {
    const P = ANETT_PALETTE;
    const mat = (color: string, roughness = 0.7, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
      new THREE.MeshPhysicalMaterial({ color, roughness, metalness: 0, ...extra });
    return {
      skin: mat(P.skin, 0.55, { sheen: 0.3, sheenColor: new THREE.Color('#ffe2d2'), sheenRoughness: 0.6, emissive: new THREE.Color('#ff9f7a'), emissiveIntensity: 0.07 }),
      skinShade: mat(P.skinShade, 0.6),
      hair: mat(P.hair, 0.5, { sheen: 1, sheenColor: new THREE.Color(P.hairSheen), sheenRoughness: 0.4, clearcoat: 0.2, clearcoatRoughness: 0.5, side: THREE.DoubleSide }),
      eyeWhite: mat('#fffdf8', 0.2, { clearcoat: 1 }),
      iris: mat('#ffffff', 0.2, { map: irisTexture(), clearcoat: 1, clearcoatRoughness: 0.05 }),
      highlight: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      lash: mat(P.lash, 0.6),
      brow: mat(P.brow, 0.8),
      jacket: mat(P.jacket, 0.62, { sheen: 0.6, sheenColor: new THREE.Color('#ffc59a'), sheenRoughness: 0.5, clearcoat: 0.15 }),
      jacketRib: mat(P.jacketRib, 0.85),
      zipper: mat(P.zipper, 0.3, { metalness: 0.8 }),
      drawstring: mat(P.drawstring, 0.8),
      shorts: mat(P.shorts, 0.85, { sheen: 0.4, sheenColor: new THREE.Color('#ffffff') }),
      sock: mat(P.sock, 0.95),
      boot: mat(P.boot, 0.6, { sheen: 0.3, sheenColor: new THREE.Color('#f0c8a4') }),
      bootDark: mat(P.bootDark, 0.7),
      sole: mat(P.sole, 0.7),
      pack: mat(P.pack, 0.8, { sheen: 0.4, sheenColor: new THREE.Color('#e6d7bd') }),
      packDark: mat(P.packDark, 0.8),
      packLight: mat(P.packLight, 0.8),
      strap: mat(P.strap, 0.75),
      strapDark: mat(P.strapDark, 0.5),
      cheek: new THREE.MeshBasicMaterial({ color: P.cheek, transparent: true, opacity: 0.22, depthWrite: false }),
      lips: mat(P.lips, 0.45),
      mouthInner: mat('#7a2a30', 0.6),
    };
  }, []);
}

const capsule = (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 6, 18);

/**
 * Layered hair locks: curved ribbons that follow the scalp from the crown down the sides and back,
 * giving soft volume and strand groups instead of a smooth helmet.
 */
const HAIR_LOCKS = Array.from({ length: 16 }, (_, i) => ({
  phi: 1.0 + (i / 15) * (Math.PI * 2 - 2.0), // around the head, skipping the face
  from: 0.1 + (i % 3) * 0.05, // polar angle (from the crown) where the lock starts
  to: 1.72 + (i % 2) * 0.12,
  w: 0.062 + (i % 3) * 0.01,
  lift: (i % 2) * 0.008,
}));

function lockGeometry(from: number, to: number, w: number, lift: number) {
  const R = 0.298 + lift;
  const thin = 0.026;
  const g = new THREE.TorusGeometry(R, thin, 6, 20, to - from);
  g.scale(1, 1, w / thin); // wide ribbon sideways, thin radially
  g.rotateZ(Math.PI / 2 - to); // arc spans polar angles [from, to]
  g.rotateY(-Math.PI / 2); // into the front meridian plane (y/z)
  return g;
}

export interface AnettModelProps {
  scale?: number;
  /** Optional object held in the right hand (e.g. the magic wand). */
  rightHandItem?: React.ReactNode;
}

export const AnettModel = forwardRef<AnettRig, AnettModelProps>(function AnettModel({ scale = 1, rightHandItem }, ref) {
  const m = useMaterials();
  const r = {
    root: useRef<THREE.Group>(null!),
    body: useRef<THREE.Group>(null!),
    hips: useRef<THREE.Group>(null!),
    spine: useRef<THREE.Group>(null!),
    neck: useRef<THREE.Group>(null!),
    shoulderL: useRef<THREE.Group>(null!),
    elbowL: useRef<THREE.Group>(null!),
    shoulderR: useRef<THREE.Group>(null!),
    elbowR: useRef<THREE.Group>(null!),
    legL: useRef<THREE.Group>(null!),
    kneeL: useRef<THREE.Group>(null!),
    legR: useRef<THREE.Group>(null!),
    kneeR: useRef<THREE.Group>(null!),
    eyeL: useRef<THREE.Group>(null!),
    eyeR: useRef<THREE.Group>(null!),
    mouthSmile: useRef<THREE.Mesh>(null!),
    mouthOpen: useRef<THREE.Mesh>(null!),
    hairBack: useRef<THREE.Group>(null!),
  };

  useImperativeHandle(ref, () => {
    const out = {} as Record<string, unknown>;
    for (const [k, v] of Object.entries(r)) out[k] = v.current;
    return out as unknown as AnettRig;
  });

  const geo = useMemo(() => {
    const rib = (g: THREE.BufferGeometry, n: number, d: number) => ridges(g, n, d);
    const hemTorus = new THREE.TorusGeometry(0.168, 0.034, 10, 48);
    hemTorus.rotateX(Math.PI / 2);
    const cuffTorus = new THREE.TorusGeometry(0.05, 0.022, 8, 32);
    cuffTorus.rotateX(Math.PI / 2);
    const collar = new THREE.TorusGeometry(0.1, 0.046, 12, 40);
    collar.rotateX(Math.PI / 2);
    return {
      head: new THREE.SphereGeometry(0.25, 48, 36),
      hairCap: new THREE.SphereGeometry(0.28, 64, 26, 0, Math.PI * 2, 0, 1.4),
      bangs: bangsGeometry(),
      mantle: hairMantle(),
      locks: HAIR_LOCKS.map((l) => lockGeometry(l.from, l.to, l.w, l.lift)),
      eyeWhite: new THREE.SphereGeometry(0.062, 28, 20),
      iris: new THREE.CircleGeometry(0.05, 40),
      hl: new THREE.SphereGeometry(0.013, 10, 8),
      lashArc: new THREE.TorusGeometry(0.062, 0.0075, 6, 24, Math.PI * 0.95),
      smile: new THREE.TorusGeometry(0.032, 0.008, 8, 24, Math.PI * 0.8),
      hem: rib(hemTorus, 70, 0.03),
      cuff: rib(cuffTorus, 30, 0.05),
      collar: rib(collar, 50, 0.02),
      sock: rib(new THREE.CylinderGeometry(0.064, 0.059, 0.1, 28, 1), 26, 0.04),
      sockFold: rib(new THREE.TorusGeometry(0.063, 0.02, 8, 28).rotateX(Math.PI / 2), 26, 0.05),
    };
  }, []);

  useLayoutEffect(() => {
    r.root.current.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && mesh.material !== m.cheek && mesh.material !== m.highlight) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    // stylized look: the face never receives self-shadow from hair / bangs
    r.neck.current.traverse((o) => {
      (o as THREE.Mesh).receiveShadow = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Eye = ({ side, eref }: { side: 1 | -1; eref: React.RefObject<THREE.Group> }) => (
    <group ref={eref} position={[0.097 * side, -0.02, 0.196]} rotation={[0, 0.3 * side, 0]}>
      <mesh geometry={geo.eyeWhite} material={m.eyeWhite} scale={[1, 1.1, 0.5]} />
      <mesh geometry={geo.iris} material={m.iris} position={[0, -0.003, 0.0312]} scale={[1, 1.06, 1]} />
      {/* highlights: same side on both eyes (single key light) */}
      <mesh geometry={geo.hl} material={m.highlight} position={[-0.017, 0.022, 0.037]} />
      <mesh geometry={geo.hl} material={m.highlight} position={[0.016, -0.02, 0.036]} scale={0.5} />
      {/* upper lash line + outer flicks */}
      <mesh geometry={geo.lashArc} material={m.lash} position={[0, -0.004, 0.012]} rotation={[0.35, 0, 0.02]} scale={[1.02, 1.04, 1]} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={m.lash} position={[(0.058 - i * 0.012) * side, 0.04 + i * 0.01, 0.014]} rotation={[0, 0, (-0.9 + i * 0.25) * side]}>
          <boxGeometry args={[0.026, 0.006, 0.006]} />
        </mesh>
      ))}
    </group>
  );

  const Arm = ({ side, sref, eref, item }: { side: 1 | -1; sref: React.RefObject<THREE.Group>; eref: React.RefObject<THREE.Group>; item?: React.ReactNode }) => (
    <group ref={sref} position={[0.185 * side, 0.285, 0]}>
      <mesh geometry={capsule(0.066, 0.09)} material={m.jacket} position={[0, -0.075, 0]} />
      <group ref={eref} position={[0, -0.165, 0]}>
        <mesh geometry={capsule(0.059, 0.075)} material={m.jacket} position={[0, -0.055, 0.004]} />
        <mesh geometry={geo.cuff} material={m.jacketRib} position={[0, -0.125, 0.004]} />
        <mesh material={m.skin} position={[0, -0.168, 0.01]} scale={[0.92, 1.05, 0.88]}>
          <sphereGeometry args={[0.05, 18, 14]} />
        </mesh>
        {/* thumb */}
        <mesh material={m.skin} position={[-0.03 * side, -0.155, 0.035]} scale={[0.6, 0.9, 0.6]}>
          <sphereGeometry args={[0.025, 10, 8]} />
        </mesh>
        {item && <group position={[0, -0.175, 0.03]}>{item}</group>}
      </group>
    </group>
  );

  const Leg = ({ side, lref, kref }: { side: 1 | -1; lref: React.RefObject<THREE.Group>; kref: React.RefObject<THREE.Group> }) => (
    <group ref={lref} position={[0.082 * side, -0.02, 0]}>
      {/* short leg opening */}
      <mesh material={m.shorts} position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.084, 0.086, 0.12, 22]} />
      </mesh>
      <mesh geometry={capsule(0.064, 0.11)} material={m.skin} position={[0, -0.13, 0]} />
      <group ref={kref} position={[0, -0.225, 0]}>
        <mesh geometry={capsule(0.058, 0.1)} material={m.skin} position={[0, -0.07, 0]} />
        {/* thick slouchy socks */}
        <mesh geometry={geo.sock} material={m.sock} position={[0, -0.15, 0]} />
        <mesh geometry={geo.sockFold} material={m.sock} position={[0, -0.1, 0]} />
        {/* hiking boot */}
        <group position={[0, -0.225, 0.028]}>
          <mesh material={m.boot} position={[0, 0.035, -0.03]}>
            <cylinderGeometry args={[0.068, 0.07, 0.07, 22]} />
          </mesh>
          <RoundedBox args={[0.142, 0.1, 0.215]} radius={0.045} smoothness={4} material={m.boot} />
          <RoundedBox args={[0.144, 0.05, 0.08]} radius={0.024} smoothness={3} material={m.bootDark} position={[0, -0.012, 0.07]} />
          <RoundedBox args={[0.152, 0.036, 0.228]} radius={0.016} smoothness={3} material={m.sole} position={[0, -0.048, 0.003]} />
          {/* tongue + laces */}
          <RoundedBox args={[0.06, 0.03, 0.09]} radius={0.012} smoothness={2} material={m.bootDark} position={[0, 0.05, 0.02]} rotation={[0.35, 0, 0]} />
          {[0, 1, 2].map((i) => (
            <mesh key={i} material={m.drawstring} position={[0, 0.054 - i * 0.012, 0.0 + i * 0.03]} rotation={[0.35, 0, 0]}>
              <boxGeometry args={[0.08, 0.008, 0.01]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );

  return (
    <group ref={r.root} scale={scale}>
      <group ref={r.body}>
        <group ref={r.hips} position={[0, 0.535, 0]}>
          {/* cream shorts */}
          <mesh material={m.shorts} position={[0, 0.0, 0]}>
            <cylinderGeometry args={[0.158, 0.178, 0.16, 28]} />
          </mesh>
          <Leg side={1} lref={r.legL} kref={r.kneeL} />
          <Leg side={-1} lref={r.legR} kref={r.kneeR} />

          <group ref={r.spine} position={[0, 0.06, 0]}>
            {/* orange zip jacket */}
            <mesh geometry={capsule(0.172, 0.14)} material={m.jacket} position={[0, 0.165, 0]} scale={[1, 1, 0.9]} />
            <mesh geometry={geo.hem} material={m.jacketRib} position={[0, 0.035, 0]} scale={[1, 1, 0.9]} />
            {/* zipper */}
            <mesh material={m.zipper} position={[0, 0.17, 0.156]}>
              <boxGeometry args={[0.012, 0.25, 0.008]} />
            </mesh>
            <mesh material={m.zipper} position={[0.008, 0.27, 0.163]}>
              <boxGeometry args={[0.012, 0.03, 0.006]} />
            </mesh>
            {/* chest pockets with flaps */}
            {[1, -1].map((s) => (
              <group key={s} position={[0.085 * s, 0.105, 0.138]} rotation={[0, 0.42 * s, 0]}>
                <RoundedBox args={[0.085, 0.075, 0.022]} radius={0.01} smoothness={2} material={m.jacket} />
                <RoundedBox args={[0.09, 0.025, 0.026]} radius={0.01} smoothness={2} material={m.jacketRib} position={[0, 0.036, 0.002]} />
              </group>
            ))}
            {/* hood collar + hood */}
            <mesh geometry={geo.collar} material={m.jacket} position={[0, 0.305, 0.0]} />
            <mesh material={m.jacket} position={[0, 0.31, -0.1]} scale={[1.25, 0.7, 0.75]}>
              <sphereGeometry args={[0.12, 20, 14]} />
            </mesh>
            {/* drawstrings */}
            {[1, -1].map((s) => (
              <group key={s} position={[0.035 * s, 0.27, 0.15]}>
                <mesh material={m.drawstring} position={[0, -0.04, 0]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.08, 6]} />
                </mesh>
                <mesh material={m.drawstring} position={[0, -0.085, 0]} scale={[1, 1.4, 1]}>
                  <sphereGeometry args={[0.011, 8, 6]} />
                </mesh>
              </group>
            ))}

            {/* big khaki hiking backpack */}
            <group position={[0, 0.16, -0.245]}>
              <RoundedBox args={[0.3, 0.4, 0.16]} radius={0.06} smoothness={4} material={m.pack} />
              <RoundedBox args={[0.31, 0.11, 0.18]} radius={0.05} smoothness={4} material={m.packDark} position={[0, 0.2, 0.005]} />
              <RoundedBox args={[0.2, 0.17, 0.05]} radius={0.03} smoothness={3} material={m.packLight} position={[0, -0.07, -0.09]} />
              <mesh material={m.strapDark} position={[0, -0.0, -0.117]}>
                <boxGeometry args={[0.16, 0.006, 0.004]} />
              </mesh>
              {[1, -1].map((s) => (
                <RoundedBox key={s} args={[0.055, 0.18, 0.1]} radius={0.025} smoothness={3} material={m.packLight} position={[0.165 * s, -0.08, 0.0]} />
              ))}
              {[-0.02, -0.12].map((y) => (
                <mesh key={y} material={m.strap} position={[0, y, -0.12]}>
                  <boxGeometry args={[0.24, 0.018, 0.008]} />
                </mesh>
              ))}
              {/* little orange loop */}
              <mesh material={m.jacket} position={[-0.11, 0.25, 0.0]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.026, 0.009, 6, 14]} />
              </mesh>
            </group>
            {/* shoulder straps over the shoulders and down the front */}
            {[1, -1].map((s) => (
              <group key={s}>
                <mesh material={m.strap} position={[0.1 * s, 0.205, -0.04]} rotation={[0, Math.PI / 2, 0]} scale={[1.05, 1, 1]}>
                  <torusGeometry args={[0.16, 0.017, 6, 22, Math.PI * 0.8]} />
                </mesh>
                <mesh material={m.strap} position={[0.098 * s, 0.13, 0.158]} rotation={[0.04, 0, 0.1 * s]}>
                  <boxGeometry args={[0.042, 0.26, 0.014]} />
                </mesh>
                <mesh material={m.strapDark} position={[0.104 * s, 0.03, 0.165]}>
                  <boxGeometry args={[0.044, 0.025, 0.012]} />
                </mesh>
                {/* dangling strap end */}
                <mesh material={m.strap} position={[0.112 * s, -0.06, 0.16]} rotation={[0.05, 0, -0.05 * s]}>
                  <boxGeometry args={[0.024, 0.17, 0.008]} />
                </mesh>
                <mesh material={m.strapDark} position={[0.116 * s, -0.15, 0.16]}>
                  <boxGeometry args={[0.028, 0.024, 0.012]} />
                </mesh>
              </group>
            ))}
            {/* sternum strap + buckle */}
            <mesh material={m.strap} position={[0, 0.205, 0.164]}>
              <boxGeometry args={[0.19, 0.02, 0.008]} />
            </mesh>
            <mesh material={m.strapDark} position={[0, 0.205, 0.17]}>
              <boxGeometry args={[0.036, 0.03, 0.012]} />
            </mesh>

            <Arm side={1} sref={r.shoulderL} eref={r.elbowL} />
            <Arm side={-1} sref={r.shoulderR} eref={r.elbowR} item={rightHandItem} />

            {/* neck + head (head slightly oversized for the chibi look) */}
            <group ref={r.neck} position={[0, 0.315, 0]}>
              <mesh material={m.skin} position={[0, 0.02, 0]}>
                <cylinderGeometry args={[0.048, 0.054, 0.07, 14]} />
              </mesh>
              <group position={[0, 0.06 + 0.22 * 1.1, 0]} scale={1.1}>
                <mesh geometry={geo.head} material={m.skin} scale={[1.03, 0.97, 0.97]} />
                <Eye side={1} eref={r.eyeL} />
                <Eye side={-1} eref={r.eyeR} />
                {/* soft brows (mostly hidden by the bangs, like the reference) */}
                {[1, -1].map((s) => (
                  <mesh key={s} material={m.brow} position={[0.098 * s, 0.072, 0.225]} rotation={[0.25, 0.3 * s, 0.08 * s]}>
                    <capsuleGeometry args={[0.007, 0.045, 4, 8]} />
                  </mesh>
                ))}
                {/* button nose */}
                <mesh material={m.skinShade} position={[0, -0.085, 0.243]} scale={[1.25, 0.85, 1]}>
                  <sphereGeometry args={[0.02, 12, 10]} />
                </mesh>
                {/* mouth */}
                <mesh ref={r.mouthSmile} geometry={geo.smile} material={m.lips} position={[0, -0.148, 0.222]} rotation={[0.3, 0, Math.PI + Math.PI * 0.1]} />
                <mesh ref={r.mouthOpen} material={m.mouthInner} position={[0, -0.15, 0.22]} scale={[1, 0.8, 0.45]} visible={false}>
                  <sphereGeometry args={[0.032, 16, 12]} />
                </mesh>
                {/* blush */}
                {[1, -1].map((s) => (
                  <mesh key={s} material={m.cheek} position={[0.128 * s, -0.095, 0.2]} rotation={[0, 0.6 * s, 0]} scale={[1.1, 0.65, 0.15]}>
                    <sphereGeometry args={[0.036, 16, 10]} />
                  </mesh>
                ))}

                {/* voluminous wavy dark hair */}
                <mesh geometry={geo.hairCap} material={m.hair} position={[0, 0.012, -0.005]} scale={[1.05, 1.06, 1.04]} />
                <mesh geometry={geo.bangs} material={m.hair} position={[0, 0.008, 0.004]} scale={[1.03, 1, 1]} />
                {geo.locks.map((g, i) => (
                  <mesh key={i} geometry={g} material={m.hair} rotation={[0, HAIR_LOCKS[i].phi, 0]} position={[0, 0.012, 0]} scale={[1.04, 1.05, 1.03]} />
                ))}
                <group ref={r.hairBack}>
                  <mesh geometry={geo.mantle} material={m.hair} />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});
