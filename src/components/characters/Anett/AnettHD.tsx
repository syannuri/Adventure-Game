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
      {createPortal(<Face joints={joints} />, bones.neck)}
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

function Face({ joints }: { joints: Props['joints'] }) {
  const lids = useMemo(() => [new THREE.Group(), new THREE.Group()], []);
  const lidMeshes = useMemo(() => [new THREE.Group(), new THREE.Group()], []);
  const mouth = useMemo(() => new THREE.Group(), []);
  const mats = useMemo(
    () => ({
      lid: new THREE.MeshStandardMaterial({ color: LID_COLOR, roughness: 0.62 }),
      lash: new THREE.MeshStandardMaterial({ color: '#2a1610', roughness: 0.6 }),
      inner: new THREE.MeshStandardMaterial({ color: '#4a1a1e', roughness: 0.9 }),
      teeth: new THREE.MeshStandardMaterial({ color: '#fbf6ef', roughness: 0.5 }),
      tongue: new THREE.MeshStandardMaterial({ color: '#d9656b', roughness: 0.8 }),
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
    mouth.visible = open > 0;
    if (open > 0) {
      const chatter = 0.85 + 0.15 * Math.sin(clock.elapsedTime * 15);
      mouth.scale.set(wide, open * chatter, 1);
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
      <primitive object={mouth} position={MOUTH_POS} rotation={[-0.12, 0, 0]}>
        {/* a "D"-shaped open smile: flat top under the upper lip, round bottom */}
        <mesh material={mats.inner} position={[0, 0.002, 0]} scale={[0.021, 0.013, 0.004]}>
          <sphereGeometry args={[1, 28, 14, 0, Math.PI * 2, Math.PI * 0.32, Math.PI * 0.68]} />
        </mesh>
        <mesh material={mats.teeth} position={[0, 0.0068, 0.0022]} scale={[0.0135, 0.0024, 0.0025]}>
          <sphereGeometry args={[1, 16, 8]} />
        </mesh>
        <mesh material={mats.tongue} position={[0, -0.0062, 0.0018]} scale={[0.012, 0.0045, 0.0028]}>
          <sphereGeometry args={[1, 16, 8]} />
        </mesh>
      </primitive>
    </>
  );
}

export function preloadAnettHD() {
  if (ANET_HD_ENABLED) useGLTF.preload(ANET_HD_URL);
}
