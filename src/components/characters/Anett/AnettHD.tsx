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
import { createPortal } from '@react-three/fiber';
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
      {backpack && createPortal(<group position={RIG.backpack as [number, number, number]}>{backpack}</group>, bones.spine)}
    </>
  );
}

export function preloadAnettHD() {
  if (ANET_HD_ENABLED) useGLTF.preload(ANET_HD_URL);
}
