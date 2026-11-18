/** Animated backdrop for menus: Anett on a little floating island with the glowing magic map. */
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment, Float, Lightformer, Sparkles } from '@react-three/drei';
import { AnettModel, type AnettRig } from '../../characters/Anett/AnettModel';
import { AnettAnimator } from '../../characters/Anett/AnettAnimator';
import type { AnimState } from '../../characters/Anett/AnettAnimations';
import { Sky } from '../EnchantedForest/Sky';
import { useGame } from '../../../systems/store';
import { lumpy, prep } from '../EnchantedForest/Trees';
import { glowTexture } from '../../effects/textures';

const CYCLE: { s: AnimState | null; d: number }[] = [
  { s: 'wave', d: 2.6 },
  { s: null, d: 2.5 },
  { s: 'dance', d: 4.5 },
  { s: null, d: 2 },
  { s: 'celebrate', d: 2.2 },
  { s: null, d: 3 },
];

function MenuAnett() {
  const rig = useRef<AnettRig>(null);
  const root = useRef<THREE.Group>(null!);
  const animator = useMemo(() => new AnettAnimator(), []);
  const clock = useRef(0);
  const overlay = useGame((s) => s.overlay);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    clock.current += dt;
    let t = clock.current % CYCLE.reduce((a, c) => a + c.d, 0);
    let state: AnimState | null = null;
    for (const c of CYCLE) {
      if (t < c.d) {
        state = c.s;
        break;
      }
      t -= c.d;
    }
    if (overlay === 'about') state = 'dance';
    if (REVIEW_VIEW) state = REVIEW_POSE;
    animator.update(rig.current, dt, { speed: 0, airborne: false, vy: 0, land: 0, action: state, overlay: 0, idleTime: REVIEW_VIEW ? 0 : 6 });
    root.current.rotation.y = REVIEW_VIEW ? 0 : Math.sin(clock.current * 0.3) * 0.25 + (state === 'dance' ? Math.sin(clock.current * 1.6) * 0.5 : 0);
  });
  return (
    <group ref={root} position={[0, 0, 0]} scale={1.15}>
      <AnettModel ref={rig} />
    </group>
  );
}

function Island() {
  const rock = useMemo(() => {
    const g = prep(new THREE.ConeGeometry(2.6, 3.2, 12, 4));
    lumpy(g, 2, 0.1);
    g.rotateX(Math.PI);
    g.translate(0, -1.7, 0);
    return g;
  }, []);
  return (
    <group>
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <cylinderGeometry args={[2.6, 2.5, 0.25, 32]} />
        <meshStandardMaterial color="#6fbf55" roughness={0.9} />
      </mesh>
      <mesh geometry={rock} castShadow>
        <meshStandardMaterial color="#9a7a5e" roughness={0.95} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const c = ['#ff9ec7', '#ffd36b', '#c9a7ff', '#ffffff'][i % 4];
        return (
          <mesh key={i} position={[Math.cos(a) * 2.1, 0.12, Math.sin(a) * 2.1]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.3} />
          </mesh>
        );
      })}
      <group position={[-1.5, 0, -0.9]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 0.5, 12]} />
          <meshStandardMaterial color="#f6ecd6" />
        </mesh>
        <mesh position={[0, 0.5, 0]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.45, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ef6a5a" />
        </mesh>
      </group>
      <group position={[1.6, 0, -0.6]}>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.36, 10]} />
          <meshStandardMaterial color="#f6ecd6" />
        </mesh>
        <mesh position={[0, 0.36, 0]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#7fe3ff" emissive="#53cfff" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function MagicMap() {
  const glow = useMemo(() => glowTexture(), []);
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 170;
    const g = c.getContext('2d')!;
    g.fillStyle = '#f6e3b4';
    g.fillRect(0, 0, 256, 170);
    g.strokeStyle = '#c99a5a';
    g.lineWidth = 6;
    g.strokeRect(4, 4, 248, 162);
    g.setLineDash([8, 8]);
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(30, 140);
    g.bezierCurveTo(80, 80, 120, 140, 150, 90);
    g.bezierCurveTo(180, 50, 210, 70, 230, 30);
    g.stroke();
    const dots = [
      [30, 140, '#5fbf6f'],
      [90, 110, '#ff9ccf'],
      [150, 90, '#8fd8ff'],
      [195, 62, '#5fe0d6'],
      [230, 30, '#ffd27a'],
    ] as const;
    g.setLineDash([]);
    for (const [x, y, col] of dots) {
      g.fillStyle = col;
      g.beginPath();
      g.arc(x, y, 12, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#7a5a30';
      g.lineWidth = 2;
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={1.2}>
      <group position={[1.7, 1.9, 0.4]} rotation={[-0.2, -0.5, 0.1]}>
        <mesh>
          <planeGeometry args={[1.3, 0.86]} />
          <meshStandardMaterial map={tex} side={THREE.DoubleSide} emissive="#ffe9a8" emissiveIntensity={0.25} />
        </mesh>
        <sprite scale={2.6} position={[0, 0, -0.05]}>
          <spriteMaterial map={glow} color="#ffd86b" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        <Sparkles count={30} scale={[1.6, 1.2, 0.6]} size={4} speed={0.6} color="#fff3a0" />
      </group>
    </Float>
  );
}

const closeup = typeof location !== 'undefined' && location.hash === '#closeup';
/** Character review mode: ?view=face|front|side|back (menus hidden, Anett idles). */
export const REVIEW_VIEW = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('view') : null;
/** Optional pose for review mode: ?pose=surprise|celebrate|wave|dance|talk … */
const REVIEW_POSE = (typeof location !== 'undefined' ? new URLSearchParams(location.search).get('pose') : null) as AnimState | null;
const REVIEW_CAMS: Record<string, { pos: [number, number, number]; look: [number, number, number] }> = {
  face: { pos: [0.15, 1.2, 1.25], look: [0, 1.15, 0] },
  front: { pos: [0.4, 1.0, 3.0], look: [0, 0.68, 0] },
  side: { pos: [3.0, 1.0, 0.4], look: [0, 0.68, 0] },
  back: { pos: [-0.5, 1.1, -3.0], look: [0, 0.7, 0] },
};

export function MenuScene() {
  const { camera, size } = useThree();
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += Math.min(dt, 0.05);
    const portrait = size.width < size.height;
    const rc = REVIEW_VIEW ? REVIEW_CAMS[REVIEW_VIEW] : null;
    if (rc) {
      camera.position.set(...rc.pos);
      camera.lookAt(...rc.look);
      return;
    }
    if (closeup) {
      // "photo mode" close-up used for character review (#closeup in the URL)
      camera.position.set(0.3, 1.25, 2.1);
      camera.lookAt(0, 0.95, 0);
      return;
    }
    // wide screens show the island on the right (menu UI on the left), portrait keeps it centered
    const wide = size.width / size.height > 1.25;
    const d = portrait ? 6.6 : 4.9;
    const sx = wide ? -1.9 : 0;
    camera.position.set(sx + Math.sin(t.current * 0.12) * 0.8, 1.55 + Math.sin(t.current * 0.2) * 0.1, d);
    camera.lookAt(sx, portrait ? -0.12 : wide ? 0.75 : 0.5, 0);
  });
  return (
    <>
      <color attach="background" args={['#bfe2ff']} />
      <fog attach="fog" args={['#cfe7f5', 20, 80]} />
      <hemisphereLight args={['#e0f0ff', '#7a9a60', 1.2]} />
      <directionalLight position={[4, 8, 5]} intensity={2.6} color="#fff1d6" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />
      <Environment resolution={64} frames={1} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={2} color="#fff2d8" position={[5, 8, -5]} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={1} color="#bfe3ff" position={[-6, 4, 6]} scale={[10, 6, 1]} />
      </Environment>
      <Sky top="#5aa9ee" horizon="#ffe9cf" />
      <Float speed={REVIEW_VIEW ? 0 : 1} rotationIntensity={0.05} floatIntensity={REVIEW_VIEW ? 0 : 0.4}>
        <group position={[0, -0.2, 0]}>
          <Island />
          <MenuAnett />
          {!REVIEW_VIEW && <MagicMap />}
        </group>
      </Float>
      <Sparkles count={120} scale={[14, 8, 10]} position={[0, 2, -2]} size={4} speed={0.3} color="#fff6b8" />
    </>
  );
}
