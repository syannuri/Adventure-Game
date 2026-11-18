/**
 * Third-person follow camera.
 *  - smooth follow with separate horizontal / vertical damping
 *  - orbit with mouse drag or touch drag, zoom with the mouse wheel / pinch
 *  - gentle auto-align behind Anett while running (only when the player isn't steering the camera)
 *  - camera collision against trees/rocks and terrain
 *  - cinematic shots: world intro fly-in, story "reveal" shots and the finale orbit
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { cameraState, player } from '../../systems/playerState';
import { input } from '../../systems/input';
import { getWorldPhysics, segmentHitFraction } from '../../systems/physics';
import { useGame } from '../../systems/store';
import { angleDelta, clamp, damp, easeInOut, smoothstep } from '../../utils/math';

const tmpTarget = new THREE.Vector3();
const desired = new THREE.Vector3();
const lookPoint = new THREE.Vector3();
const cineLook = new THREE.Vector3();
const cinePos = new THREE.Vector3();

export function FollowCamera({ introCenter = new THREE.Vector3(0, 1, -2) }: { introCenter?: THREE.Vector3 }) {
  const { camera, gl } = useThree();
  const st = useRef({ init: false, snapped: false, frames: 0, idle: 0, target: new THREE.Vector3(), look: new THREE.Vector3() });

  // ---- pointer orbit & zoom (attached to the canvas only, so UI buttons never rotate the camera)
  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const down = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        p.x = e.clientX;
        p.y = e.clientY;
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinch) input.zoomDelta += (pinch - d) * 0.02;
        pinch = d;
        return;
      }
      input.lookDelta.x += e.clientX - p.x;
      input.lookDelta.y += e.clientY - p.y;
      input.lastLookTime = performance.now();
      p.x = e.clientX;
      p.y = e.clientY;
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      pinch = 0;
    };
    const wheel = (e: WheelEvent) => {
      input.zoomDelta += Math.sign(e.deltaY) * 0.6;
      e.preventDefault();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    el.style.touchAction = 'none';
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [gl]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const g = useGame.getState();
    const s = st.current;
    const world = getWorldPhysics();
    s.frames++;

    // ---- orbit input
    if (!g.paused) {
      cameraState.yaw -= input.lookDelta.x * 0.0055;
      cameraState.pitch = clamp(cameraState.pitch + input.lookDelta.y * 0.0035, -0.05, 1.05);
      cameraState.distance = clamp(cameraState.distance + input.zoomDelta, 3.6, 11);
    }
    input.lookDelta.x = 0;
    input.lookDelta.y = 0;
    input.zoomDelta = 0;

    // gentle auto-follow at a 3/4 angle (slightly to the side) so Anet's face shows more often
    const sinceLook = performance.now() - input.lastLookTime;
    s.idle = player.speed < 0.15 && player.grounded ? s.idle + dt : 0;
    if (sinceLook > 1800 && player.speed > 1 && !g.dialogue) {
      const side = angleDelta(player.facing + Math.PI, cameraState.yaw) >= 0 ? 1 : -1;
      const threeQuarter = player.facing + Math.PI + 0.42 * side;
      const d = angleDelta(cameraState.yaw, threeQuarter);
      if (Math.abs(d) < 2.4) cameraState.yaw += d * damp(0.55 * Math.min(1, player.speed / 4), dt);
    } else if (sinceLook > 3000 && s.idle > 2.5 && !g.dialogue && !g.cinematic) {
      // standing still: drift round to a front 3/4 view to show her face
      const side = angleDelta(player.facing, cameraState.yaw) >= 0 ? 1 : -1;
      const portrait = player.facing + 1.15 * side;
      const d = angleDelta(cameraState.yaw, portrait);
      cameraState.yaw += d * damp(0.35, dt);
    }

    // ---- follow target
    tmpTarget.set(player.position.x, player.position.y + 1.05, player.position.z);
    if (!s.init) {
      s.target.copy(tmpTarget);
      s.init = true;
    }
    s.target.x += (tmpTarget.x - s.target.x) * damp(12, dt);
    s.target.z += (tmpTarget.z - s.target.z) * damp(12, dt);
    s.target.y += (tmpTarget.y - s.target.y) * damp(player.grounded ? 7 : 3, dt);

    const cp = Math.cos(cameraState.pitch);
    let dist = cameraState.distance;
    const ox = Math.sin(cameraState.yaw) * cp;
    const oz = Math.cos(cameraState.yaw) * cp;
    const oy = Math.sin(cameraState.pitch);
    // collision with trees / rocks
    const frac = segmentHitFraction(s.target.x, s.target.z, s.target.x + ox * dist, s.target.z + oz * dist);
    dist *= frac;
    desired.set(s.target.x + ox * dist, s.target.y + oy * dist + 0.35, s.target.z + oz * dist);
    const gh = world.height(desired.x, desired.z) + 0.45;
    if (desired.y < gh) desired.y = gh;
    lookPoint.copy(s.target);

    // ---- cinematics
    const c = g.cinematic;
    if (c && c.start < 0 && s.frames >= 2) c.start = performance.now(); // begin once the world is actually on screen
    if (c) {
      const t = c.start < 0 ? 0 : clamp((performance.now() - c.start) / c.duration, 0, 1);
      if (c.kind === 'intro') {
        const a = 0.9 - t * 1.1;
        cinePos.set(introCenter.x + Math.sin(a) * (26 - t * 8), 14 - t * 6, introCenter.z + Math.cos(a) * (26 - t * 8));
        cineLook.copy(introCenter);
        const w = 1 - easeInOut(smoothstep(0.55, 1, t));
        desired.lerp(cinePos, w);
        lookPoint.lerp(cineLook, w);
      } else if (c.kind === 'reveal' && c.focus) {
        cineLook.set(c.focus[0], c.focus[1], c.focus[2]);
        const dx = player.position.x - cineLook.x;
        const dz = player.position.z - cineLook.z;
        const dl = Math.hypot(dx, dz) || 1;
        cinePos.set(cineLook.x + (dx / dl) * 7.5 + (dz / dl) * 2.5, cineLook.y + 3.2, cineLook.z + (dz / dl) * 7.5 - (dx / dl) * 2.5);
        const w = smoothstep(0, 0.18, t) * (1 - smoothstep(0.82, 1, t));
        desired.lerp(cinePos, w);
        lookPoint.lerp(cineLook, w);
      } else if (c.kind === 'finale') {
        const a = player.facing + 0.35 + ((performance.now() - c.start) / 1000) * 0.32;
        cinePos.set(player.position.x + Math.sin(a) * 4.4, player.position.y + 1.7, player.position.z + Math.cos(a) * 4.4);
        cineLook.set(player.position.x, player.position.y + 0.85, player.position.z);
        const w = smoothstep(0, 0.25, t);
        desired.lerp(cinePos, w);
        lookPoint.lerp(cineLook, w);
      }
      if (t >= 1 && c.kind !== 'finale') g.endCinematic();
    }

    // the first frame (shader compilation) has been presented once we get here a second time
    if (s.frames === 2) g.setWorldReady();
    if (!s.snapped) {
      s.snapped = true;
      camera.position.copy(desired);
      s.look.copy(lookPoint);
    }
    camera.position.lerp(desired, c ? damp(5, dt) : damp(9, dt));
    s.look.lerp(lookPoint, damp(c ? 5 : 14, dt));
    camera.lookAt(s.look);
  });

  return null;
}
