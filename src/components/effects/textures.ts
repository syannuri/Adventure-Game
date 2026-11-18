/** Runtime-generated textures (no external image files needed). */
import * as THREE from 'three';

let glow: THREE.Texture | null = null;
/** Soft round sprite used for particles and glows. */
export function glowTexture() {
  if (glow) return glow;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  grd.addColorStop(0.6, 'rgba(255,255,255,0.18)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  glow = new THREE.CanvasTexture(c);
  glow.colorSpace = THREE.SRGBColorSpace;
  return glow;
}

let sparkle: THREE.Texture | null = null;
/** Four-point twinkle star sprite. */
export function sparkleTexture() {
  if (sparkle) return sparkle;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 18);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.beginPath();
  g.moveTo(32, 2);
  g.quadraticCurveTo(35, 29, 62, 32);
  g.quadraticCurveTo(35, 35, 32, 62);
  g.quadraticCurveTo(29, 35, 2, 32);
  g.quadraticCurveTo(29, 29, 32, 2);
  g.fill();
  sparkle = new THREE.CanvasTexture(c);
  sparkle.colorSpace = THREE.SRGBColorSpace;
  return sparkle;
}

let contact: THREE.Texture | null = null;
/** Soft contact shadow: dark in the middle, fading smoothly to nothing (no hard disc edge). */
export function contactShadowTexture() {
  if (contact) return contact;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(0,0,0,1)');
  grd.addColorStop(0.35, 'rgba(0,0,0,0.6)');
  grd.addColorStop(0.7, 'rgba(0,0,0,0.15)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  contact = new THREE.CanvasTexture(c);
  return contact;
}
