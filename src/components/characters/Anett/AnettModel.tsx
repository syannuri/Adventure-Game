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
import { useFrame } from '@react-three/fiber';
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
 * Anet's hair as ONE continuous surface (no stacked layers):
 *  - crown: a smooth dome over the head
 *  - front: the dome itself ends in a straight-cut fringe (bangs) just above the brows
 *  - sides & back: the same surface continues down past the shoulders with soft waves,
 *    opening only around the face
 * Built with an outer and an inner layer so the edges look solid.
 */
function unifiedHair() {
  const seg = 112;
  const R = 0.286; // crown radius
  const yOff = 0.016; // dome centre offset (a little volume on top)
  const yBangs = 0.084; // fringe line, just above the brows
  const thetaB = Math.acos((yBangs - yOff) / R);
  const capRows = 20;
  const lenRows = 24;
  const bottom = -0.37;
  const thick = 0.032;
  type Row = { y: number; r: number; open: number; t: number; cap: boolean };
  const rows: Row[] = [];
  for (let k = 0; k <= capRows; k++) {
    const th = Math.max(0.02, thetaB * (k / capRows));
    rows.push({ y: yOff + R * Math.cos(th), r: R * Math.sin(th), open: 0, t: 0, cap: true });
  }
  const rTop = R * Math.sin(thetaB);
  for (let k = 0; k <= lenRows; k++) {
    const t = k / lenRows;
    const y = yBangs - 0.003 - (yBangs - 0.003 - bottom) * t;
    const r = rTop + 0.078 * Math.pow(t, 1.3) - 0.022 * smoothstep(0.86, 1, t);
    rows.push({ y, r, open: 0.98 - 0.4 * smoothstep(0.35, 1, t), t, cap: false });
  }
  const nR = rows.length;
  const ring = nR * (seg + 1);
  const pos: number[] = [];
  const idx: number[] = [];
  for (const layer of [0, 1]) {
    for (const row of rows) {
      for (let j = 0; j <= seg; j++) {
        const u = j / seg;
        const th = row.open + u * (Math.PI * 2 - 2 * row.open); // 0 = straight ahead (+z)
        const a = Math.abs(th - Math.PI); // mirror-symmetric angle from the back
        let r = row.r;
        if (!row.cap) r += Math.cos(a * 4 + row.t * 4) * 0.012 * smoothstep(0.2, 0.7, row.t); // soft waves
        r *= 1 + Math.cos(a * 44) * 0.0035 * Math.min(1, row.r / 0.2); // fine strands, fading at the crown
        if (layer === 1) r -= thick;
        let y = row.y;
        if (!row.cap && row.t === 1) y += Math.cos(a * 3) * 0.012 + 0.01 + (layer === 1 ? 0.012 : 0);
        const back = Math.cos(th) < 0 ? 1 + 0.07 * smoothstep(0, 0.3, row.t) : 1; // room for the backpack
        const front = Math.cos(th) > 0 && row.cap ? 1 - 0.03 * Math.cos(th) : 1; // fringe hugs the forehead
        pos.push(Math.sin(th) * r, y, Math.cos(th) * r * back * front);
      }
    }
  }
  const at = (layer: number, i: number, j: number) => layer * ring + i * (seg + 1) + j;
  for (let i = 0; i < nR - 1; i++)
    for (let j = 0; j < seg; j++) {
      idx.push(at(0, i, j), at(0, i + 1, j), at(0, i, j + 1), at(0, i, j + 1), at(0, i + 1, j), at(0, i + 1, j + 1));
      idx.push(at(1, i, j), at(1, i, j + 1), at(1, i + 1, j), at(1, i, j + 1), at(1, i + 1, j + 1), at(1, i + 1, j));
    }
  const last = nR - 1;
  for (let j = 0; j < seg; j++) idx.push(at(0, last, j), at(1, last, j), at(0, last, j + 1), at(0, last, j + 1), at(1, last, j), at(1, last, j + 1));
  // close the edges around the face (from the fringe line down)
  for (const j of [0, seg])
    for (let i = capRows + 1; i < last; i++) idx.push(at(0, i, j), at(1, i, j), at(0, i + 1, j), at(0, i + 1, j), at(1, i, j), at(1, i + 1, j));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

let blushTex: THREE.Texture | null = null;
/** Soft radial blush that fades to nothing at the edges (no hard outline). */
function blushTexture() {
  if (blushTex) return blushTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,0.75)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.4)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  blushTex = new THREE.CanvasTexture(c);
  return blushTex;
}

/**
 * A patch of the head sphere around one cheek, so the blush lies exactly on the skin's curve.
 * Sphere angles: x = -r·cos(phi)·sin(theta), y = r·cos(theta), z = r·sin(phi)·sin(theta).
 */
function cheekPatch(side: 1 | -1) {
  const phiC = side === 1 ? 2.12 : Math.PI - 2.12;
  const thetaC = 1.92;
  return new THREE.SphereGeometry(0.2512, 20, 14, phiC - 0.36, 0.72, thetaC - 0.27, 0.54);
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
      cheek: new THREE.MeshBasicMaterial({
        color: P.cheek,
        map: blushTexture(),
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      lips: mat(P.lips, 0.45),
      mouthInner: mat('#7a2a30', 0.6),
    };
  }, []);
}

const capsule = (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 6, 18);

/**
 * Hair dynamics: the lower part of the hair mass bends toward an offset vector (head space) that a
 * damped spring drives from the head's real motion, plus a light strand flutter while moving.
 * Upper hair (crown and fringe) stays attached to the head.
 */
function createMovingHairMaterial(base: THREE.MeshPhysicalMaterial) {
  const mat = base.clone();
  const uniforms = { uSwing: { value: new THREE.Vector3() }, uFlutter: { value: 0 }, uTime: { value: 0 } };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      'uniform vec3 uSwing;\nuniform float uFlutter;\nuniform float uTime;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        // 0 at chin level (-0.08) -> 1 at the hair ends (-0.37); quadratic so it bends like hair
        float hw = clamp((-0.08 - position.y) / 0.29, 0.0, 1.0);
        hw = hw * hw;
        transformed += uSwing * hw;
        float ang = atan(position.x, position.z);
        vec2 radial = normalize(position.xz + vec2(1e-5));
        transformed.xz += radial * sin(uTime * 9.0 + ang * 5.0) * uFlutter * hw;
        transformed.y += cos(uTime * 7.0 + ang * 4.0) * uFlutter * 0.5 * hw;`,
      );
  };
  mat.customProgramCacheKey = () => 'anett-moving-hair';
  mat.userData.hairUniforms = uniforms; // inspectable in tests
  return { mat, uniforms };
}

const _anchor = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _off = new THREE.Vector3();
const HAIR_REST = new THREE.Vector3(0, -0.28, -0.05); // head-space point near the hair ends

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

  const movingHair = useMemo(() => createMovingHairMaterial(m.hair), [m.hair]);
  const headRef = useRef<THREE.Group>(null!);
  const hairSim = useRef({ init: false, tip: new THREE.Vector3(), vel: new THREE.Vector3(), prevAnchor: new THREE.Vector3(), speed: 0 });

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    if (dt <= 0 || !headRef.current) return;
    const h = hairSim.current;
    const head = headRef.current;
    head.updateWorldMatrix(true, false);
    _anchor.copy(HAIR_REST).applyMatrix4(head.matrixWorld);
    head.getWorldQuaternion(_q);
    head.getWorldScale(_s);
    if (!h.init || h.tip.distanceTo(_anchor) > 3) {
      // first frame or teleport: start at rest
      h.init = true;
      h.tip.copy(_anchor);
      h.vel.set(0, 0, 0);
      h.prevAnchor.copy(_anchor);
    }
    // anchor speed drives the flutter amount
    const sp = h.prevAnchor.distanceTo(_anchor) / dt;
    h.prevAnchor.copy(_anchor);
    h.speed += (Math.min(sp, 7) - h.speed) * Math.min(1, dt * 6);
    // damped spring (slightly under-damped so the hair sways and settles)
    const K = 70;
    const D = 7.5;
    _off.copy(_anchor).sub(h.tip).multiplyScalar(K).addScaledVector(h.vel, -D);
    h.vel.addScaledVector(_off, dt);
    h.tip.addScaledVector(h.vel, dt);
    // leash: on slow frames the tip is pulled along instead of snapping back to rest
    _off.copy(h.tip).sub(_anchor);
    if (_off.length() > 0.35) h.tip.copy(_anchor).addScaledVector(_off.setLength(0.35), 1);
    // offset in head space
    _off.copy(h.tip).sub(_anchor).applyQuaternion(_q.invert()).divideScalar(_s.x || 1);
    // soft limits (smooth saturation instead of hard stops)
    const soft = (v: number, lo: number, hi: number) => (v >= 0 ? hi * Math.tanh(v / hi) : -lo * Math.tanh(-v / lo));
    _off.x = soft(_off.x, 0.09, 0.09);
    _off.y = soft(_off.y, 0.05, 0.07);
    _off.z = soft(_off.z, 0.11, 0.03); // little forward travel so hair never enters the face/chest
    movingHair.uniforms.uSwing.value.lerp(_off, Math.min(1, dt * 30));
    movingHair.uniforms.uTime.value += dt;
    movingHair.uniforms.uFlutter.value = 0.008 * smoothstep(0.6, 5.5, h.speed);
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
      mantle: unifiedHair(),
      eyeWhite: new THREE.SphereGeometry(0.062, 28, 20),
      iris: new THREE.CircleGeometry(0.05, 40),
      hl: new THREE.SphereGeometry(0.013, 10, 8),
      lashArc: new THREE.TorusGeometry(0.062, 0.0075, 6, 24, Math.PI * 0.95),
      smile: new THREE.TorusGeometry(0.036, 0.0055, 8, 32, Math.PI * 0.7),
      lowerLip: new THREE.SphereGeometry(0.016, 16, 10),
      cheekL: cheekPatch(1),
      cheekR: cheekPatch(-1),
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
            <group position={[0, 0.13, -0.235]}>
              <RoundedBox args={[0.3, 0.4, 0.16]} radius={0.06} smoothness={4} material={m.pack} />
              <RoundedBox args={[0.31, 0.11, 0.165]} radius={0.05} smoothness={4} material={m.packDark} position={[0, 0.2, 0.012]} />
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
              <group ref={headRef} position={[0, 0.06 + 0.22 * 1.1, 0]} scale={1.1}>
                <mesh geometry={geo.head} material={m.skin} scale={[1.03, 0.97, 0.97]} />
                <Eye side={1} eref={r.eyeL} />
                <Eye side={-1} eref={r.eyeR} />
                {/* soft brows (mostly hidden by the bangs, like the reference) */}
                {[1, -1].map((s) => (
                  <mesh key={s} material={m.brow} position={[0.098 * s, 0.072, 0.225]} rotation={[0.25, 0.3 * s, 0.08 * s]}>
                    <capsuleGeometry args={[0.007, 0.045, 4, 8]} />
                  </mesh>
                ))}
                {/* small soft nose: a gentle bump in the same skin tone, read by shading only */}
                <mesh material={m.skin} position={[0, -0.078, 0.221]} scale={[1.15, 0.8, 0.62]}>
                  <sphereGeometry args={[0.019, 16, 12]} />
                </mesh>
                {/* mouth: small closed smile sitting on the face surface, with a hint of lower lip */}
                <group position={[0, -0.142, 0.196]} rotation={[0.62, 0, 0]}>
                  <mesh ref={r.mouthSmile} geometry={geo.smile} material={m.lips} position={[0, 0.012, 0.002]} rotation={[0, 0, Math.PI + Math.PI * 0.15]} scale={[1, 0.7, 1]} />
                  <mesh geometry={geo.lowerLip} material={m.cheek} position={[0, -0.012, 0.0]} scale={[1.1, 0.45, 0.25]} />
                  <mesh ref={r.mouthOpen} material={m.mouthInner} position={[0, 0, 0.0]} scale={[1, 0.8, 0.45]} visible={false}>
                    <sphereGeometry args={[0.03, 16, 12]} />
                  </mesh>
                </group>
                {/* natural blush painted on the cheek curve */}
                <mesh geometry={geo.cheekL} material={m.cheek} scale={[1.03, 0.97, 0.97]} renderOrder={1} />
                <mesh geometry={geo.cheekR} material={m.cheek} scale={[1.03, 0.97, 0.97]} renderOrder={1} />

                {/* voluminous wavy dark hair */}
                {/* hair: one continuous piece (crown + fringe + long hair) */}
                <group ref={r.hairBack}>
                  <mesh geometry={geo.mantle} material={movingHair.mat} />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});
