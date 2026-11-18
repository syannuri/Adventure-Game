/**
 * Anet HD: the sculpted, textured 3D model (generated from the cover illustration with Krea / Tripo,
 * then auto-skinned in tools/anet-rig) driven by the same joint rig as the procedural model.
 *
 * How it works: AnettModel keeps its joint groups (hips, spine, neck, shoulders, elbows, legs, knees)
 * and the animator keeps writing joint rotations into them. This component builds a THREE.Skeleton with
 * the sculpt's own bone lengths and, every time the scene's matrices update, copies each joint's local
 * rotation onto the matching bone. So all 13 animations, the state machine and the controller work
 * unchanged. The procedural meshes are hidden once the HD model has loaded and are the fallback when it
 * can't load (offline, very old device, or `?procedural` in the URL).
 */
import { useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { createPortal, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import type { AnettRig } from './AnettModel';
import RIG from './anetRig.json';

export const ANET_HD_URL = `${import.meta.env.BASE_URL}models/anet.glb`;
export const ANET_HD_ENABLED = typeof location === 'undefined' || !new URLSearchParams(location.search).has('procedural');

type JointKey = keyof AnettRig;

interface Props {
  /** the procedural rig whose joint groups drive the bones */
  joints: Record<string, React.RefObject<THREE.Object3D | null>>;
  rightHandItem?: React.ReactNode;
  onReady: (ready: boolean) => void;
  /** the backpack (procedural geometry, fitted to the sculpt's back) */
  backpack?: React.ReactNode;
}

export function AnettHD({ joints, rightHandItem, onReady, backpack }: Props) {
  const gltf = useGLTF(ANET_HD_URL);

  const { mesh, bones } = useMemo(() => {
    let src: THREE.Mesh | null = null;
    gltf.scene.traverse((o) => {
      if (!src && (o as THREE.Mesh).isMesh) src = o as THREE.Mesh;
    });
    const source = src as unknown as THREE.Mesh;
    source.updateWorldMatrix(true, false);
    const bones = RIG.joints.map((name, i) => {
      const b = new THREE.Bone();
      b.name = name;
      b.position.fromArray(RIG.local[i]);
      return b;
    });
    RIG.parent.forEach((p, i) => p >= 0 && bones[p].add(bones[i]));
    const skeleton = new THREE.Skeleton(
      bones,
      RIG.boneInverses.map((a) => new THREE.Matrix4().fromArray(a)),
    );
    const material = (source.material as THREE.MeshStandardMaterial).clone();
    material.side = THREE.FrontSide; // double-sided rendering shows hatching where back faces sit right behind the skin
    material.roughness = 0.82;
    material.envMapIntensity = 0.9;
    const mesh = new THREE.SkinnedMesh(source.geometry, material);
    mesh.name = 'anet-hd';
    mesh.add(bones[0]);
    // the geometry is quantized: its de-quantization transform becomes the bind matrix
    mesh.bind(skeleton, source.matrixWorld.clone());
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    // no self-shadowing: shadow-map acne shows as a dotted pattern on the skin
    mesh.receiveShadow = false;
    mesh.userData.hd = true;
    return { mesh, bones: Object.fromEntries(RIG.joints.map((n, i) => [n, bones[i]])) as Record<string, THREE.Bone> };
  }, [gltf]);

  // each bone reads its joint's rotation right when three.js updates matrices (no one-frame lag)
  useLayoutEffect(() => {
    for (const name of RIG.joints) {
      const bone = bones[name];
      const ref = joints[name as JointKey];
      bone.updateMatrix = function () {
        const g = ref?.current;
        if (g) this.quaternion.setFromEuler(g.rotation);
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.matrixWorldNeedsUpdate = true;
      };
    }
  }, [bones, joints]);

  useEffect(() => {
    onReady(true);
    return () => onReady(false);
  }, [onReady]);

  useEffect(
    () => () => {
      (mesh.material as THREE.Material).dispose();
      mesh.skeleton.dispose();
    },
    [mesh],
  );

  return (
    <>
      <primitive object={mesh} />
      {rightHandItem &&
        createPortal(
          <group position={RIG.handR.pos as [number, number, number]}>{rightHandItem}</group>,
          bones.elbowR,
        )}
      {createPortal(<Face joints={joints} mesh={mesh} />, bones.neck)}
      {backpack && createPortal(<group position={RIG.backpack as [number, number, number]}>{backpack}</group>, bones.spine)}
    </>
  );
}

// ---- face: eyelids that blink / squint and an opening mouth, placed on the sculpt's eyes and lips.
// Positions are in the neck bone's space (sculpt units), measured on the model (tools/anet-rig).
const EYES = [
  { side: 1, pos: [0.05, 0.193, 0.107] as const },
  { side: -1, pos: [-0.0475, 0.193, 0.107] as const },
];
const MOUTH_POS = [0, 0.1195, 0.1395] as const;
const LID_H = 0.019;
const LID_COLOR = '#c98a6c';
/** `?face=closed` / `?face=open` freeze the face for reviewing it */
const FACE_DEBUG = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('face');

/** Soft-edged open mouth painted on a canvas: warm dark-red inside, upper teeth, tongue, lip-coloured rim. */
function mouthTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const cx = S / 2, top = S * 0.33, w = S * 0.37, h = S * 0.38;
  const shape = () => {
    g.beginPath();
    g.moveTo(cx - w, top + h * 0.06);
    g.quadraticCurveTo(cx, top - h * 0.1, cx + w, top + h * 0.06); // gently curved upper lip line
    g.bezierCurveTo(cx + w * 0.9, top + h * 0.9, cx + w * 0.35, top + h * 1.05, cx, top + h * 1.05);
    g.bezierCurveTo(cx - w * 0.35, top + h * 1.05, cx - w * 0.9, top + h * 0.9, cx - w, top + h * 0.06);
    g.closePath();
  };
  g.filter = 'blur(2.5px)';
  shape();
  const grad = g.createRadialGradient(cx, top + h * 0.45, 4, cx, top + h * 0.45, w);
  grad.addColorStop(0, '#5a1d24');
  grad.addColorStop(0.7, '#7a2c33');
  grad.addColorStop(1, '#a8494c');
  g.fillStyle = grad;
  g.fill();
  g.save();
  shape();
  g.clip();
  g.filter = 'blur(1.5px)';
  // upper teeth
  g.fillStyle = '#efe2d8';
  g.beginPath();
  g.ellipse(cx, top + h * 0.0, w * 0.55, h * 0.16, 0, 0, Math.PI * 2);
  g.fill();
  // tongue
  g.fillStyle = '#d8676c';
  g.beginPath();
  g.ellipse(cx, top + h * 1.0, w * 0.55, h * 0.38, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  // soft lip rim so the edge melts into the sculpted lips
  g.filter = 'blur(3px)';
  g.lineWidth = 5;
  g.strokeStyle = 'rgba(196, 104, 104, 0.75)';
  shape();
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.center.set(0.5, 0.5);
  t.anisotropy = 4;
  return t;
}

/** Neck joint position in sculpt space (the neck bone's rest position). */
function neckRest() {
  const v = new THREE.Vector3();
  let i = RIG.joints.indexOf('neck');
  while (i >= 0) {
    v.add(new THREE.Vector3().fromArray(RIG.local[i]));
    i = RIG.parent[i];
  }
  return v;
}

function Face({ joints, mesh }: { joints: Props['joints']; mesh: THREE.SkinnedMesh }) {
  const lids = useMemo(() => [new THREE.Group(), new THREE.Group()], []);
  const lidMeshes = useMemo(() => [new THREE.Group(), new THREE.Group()], []);
  // the open mouth is a decal projected onto the sculpted lips, so it follows their curve from every angle
  const mouthDecal = useMemo(() => {
    const neck = neckRest();
    const proxy = new THREE.Mesh(mesh.geometry);
    proxy.matrixWorld.copy(mesh.bindMatrix); // de-quantized sculpt space
    const center = new THREE.Vector3(MOUTH_POS[0], MOUTH_POS[1], MOUTH_POS[2]).add(neck);
    const geo = new DecalGeometry(proxy, center, new THREE.Euler(0.15, 0, 0), new THREE.Vector3(0.05, 0.04, 0.045));
    geo.translate(-neck.x, -neck.y, -neck.z);
    const map = mouthTexture();
    const mat = new THREE.MeshStandardMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: 0.75 });
    const m = new THREE.Mesh(geo, mat);
    m.renderOrder = 2;
    m.visible = false;
    return m;
  }, [mesh]);
  useEffect(
    () => () => {
      mouthDecal.geometry.dispose();
      const mat = mouthDecal.material as THREE.MeshStandardMaterial;
      mat.map?.dispose();
      mat.dispose();
    },
    [mouthDecal],
  );
  const mats = useMemo(
    () => ({
      lid: new THREE.MeshStandardMaterial({ color: LID_COLOR, roughness: 0.62 }),
      lash: new THREE.MeshStandardMaterial({ color: '#2a1610', roughness: 0.6 }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  useFrame(({ clock }) => {
    const eye = joints.eyeL?.current;
    const mo = joints.mouthOpen?.current;
    // the animator writes eye openness into the procedural eyes' scale.y (1 open, ~0.07 closed)
    let closed = eye ? Math.min(1, Math.max(0, (1 - eye.scale.y) / 0.92)) : 0;
    if (FACE_DEBUG === 'closed') closed = 1;
    for (const m of lidMeshes) {
      m.visible = closed > 0.03;
      m.scale.y = Math.max(0.001, closed);
    }
    let open = mo?.visible ? mo.scale.y : 0;
    let wide = mo?.visible ? mo.scale.x : 1;
    if (FACE_DEBUG === 'open') (open = 1), (wide = 1);
    mouthDecal.visible = open > 0;
    if (open > 0) {
      const chatter = 0.8 + 0.2 * Math.sin(clock.elapsedTime * 15);
      // shrink the painted mouth inside the decal: repeat > 1 makes it smaller (scaled about the centre)
      const map = (mouthDecal.material as THREE.MeshStandardMaterial).map!;
      map.repeat.set(1 / Math.max(0.3, wide), 1 / Math.max(0.12, open * chatter));
    }
  });

  return (
    <>
      {EYES.map((e, i) => (
        <primitive key={i} object={lids[i]} position={e.pos} rotation={[0.08, 0.32 * e.side, 0]}>
          {/* the lid hangs from the top of the eye and grows downward */}
          <primitive object={lidMeshes[i]} position={[0, LID_H * 1.02, -0.0085]}>
            <group position={[0, -LID_H, 0]}>
              <mesh material={mats.lid} scale={[0.0295, LID_H, 0.0145]}>
                <sphereGeometry args={[1, 24, 16]} />
              </mesh>
              {/* lashes along the lid edge, curving down at the outer corner */}
              <mesh material={mats.lash} position={[0, -LID_H * 0.74, 0.0118]} rotation={[0, 0, -0.08 * e.side]} scale={[0.025, 0.0028, 0.0042]}>
                <sphereGeometry args={[1, 16, 8]} />
              </mesh>
            </group>
          </primitive>
        </primitive>
      ))}
      <primitive object={mouthDecal} />
    </>
  );
}

export function preloadAnettHD() {
  if (ANET_HD_ENABLED) useGLTF.preload(ANET_HD_URL);
}
