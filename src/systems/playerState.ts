import * as THREE from 'three';
import type { AnimState } from '../components/characters/Anett/AnettAnimations';

/**
 * Mutable per-frame player data shared between the controller, camera, minimap and gameplay
 * systems. Kept outside React state on purpose: it changes every frame.
 */
export const player = {
  position: new THREE.Vector3(0, 0, 0),
  velocity: new THREE.Vector3(),
  facing: 0,
  grounded: true,
  speed: 0,
  /** When set, the controller walks Anett toward this point (used for "approach" interactions). */
  autoTarget: null as null | { x: number; z: number; stopDist: number; onArrive: () => void },
  /** Point Anett should turn toward (talking to an NPC). */
  lookAt: null as null | { x: number; z: number },
  /** riding something (the leaf race): the controller just places Anet here, no walking physics */
  ride: null as null | { x: number; y: number; z: number; facing: number; pose?: AnimState; phase?: number },
  /** reset hook set by the controller */
  teleport: (_x: number, _y: number, _z: number, _facing: number) => {},
};

/** Camera yaw is shared so movement is camera-relative. */
export const cameraState = {
  yaw: 0,
  pitch: 0.3,
  distance: 5.4,
};
