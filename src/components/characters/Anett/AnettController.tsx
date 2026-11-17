/**
 * Player controller: camera-relative movement, acceleration, jumping with coyote time and
 * jump buffering, gravity, ground / platform detection, landing detection, collisions,
 * auto-approach for interactions, emotes and the animation state machine hookup.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnettModel, type AnettRig } from './AnettModel';
import { AnettAnimator } from './AnettAnimator';
import type { AnimState } from './AnettAnimations';
import { input } from '../../../systems/input';
import { cameraState, player } from '../../../systems/playerState';
import { groundHeightAt, resolveCollisions } from '../../../systems/physics';
import { useGame } from '../../../systems/store';
import { angleDelta, damp } from '../../../utils/math';
import { audio } from '../../audio/audioEngine';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { Wand } from '../../gameplay/collectibles/Wand';

const WALK_SPEED = 3.3;
const RUN_SPEED = 6.4;
const JUMP_VELOCITY = 8.3;
const GRAVITY = 24;
const RADIUS = 0.3;

export interface AnettControllerProps {
  spawn: { x: number; z: number; facing: number };
  /** Called every frame after movement – worlds use it for proximity checks. */
  onAfterMove?: (dt: number) => void;
}

export function AnettController({ spawn, onAfterMove }: AnettControllerProps) {
  const group = useRef<THREE.Group>(null!);
  const rig = useRef<AnettRig>(null);
  const animator = useMemo(() => new AnettAnimator(), []);
  const hasWand = useGame((s) => s.level.hasWand);
  const st = useRef({
    vy: 0,
    grounded: true,
    coyote: 0,
    jumpBuffer: 0,
    airTime: 0,
    land: 0,
    idleTime: 0,
    action: null as null | { name: AnimState; time: number; duration: number },
    overlay: 0,
    overlayTime: 0,
    lastStep: 0,
    hv: new THREE.Vector2(),
  });

  // teleport / spawn
  useEffect(() => {
    player.teleport = (x, y, z, facing) => {
      player.position.set(x, y, z);
      player.velocity.set(0, 0, 0);
      player.facing = facing;
      st.current.vy = 0;
      st.current.hv.set(0, 0);
      if (group.current) {
        group.current.position.set(x, y, z);
        group.current.rotation.y = facing;
      }
    };
    const y = groundHeightAt(spawn.x, spawn.z, 100);
    player.teleport(spawn.x, y, spawn.z, spawn.facing);
    player.autoTarget = null;
    player.lookAt = null;
    // fresh camera behind Anett for every new run
    cameraState.yaw = spawn.facing + Math.PI;
    cameraState.pitch = 0.3;
    cameraState.distance = 5.4;
  }, [spawn.x, spawn.z, spawn.facing]);

  // emotes requested through the store
  useEffect(
    () =>
      useGame.subscribe((s, prev) => {
        if (s.emote && s.emote !== prev.emote) {
          if (s.emote.name === 'collect') {
            st.current.overlayTime = 0.9;
          } else {
            st.current.action = { name: s.emote.name, time: 0, duration: s.emote.duration };
          }
        }
      }),
    [],
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const g = useGame.getState();
    if (g.paused) return;
    const s = st.current;
    const pos = player.position;
    const locked = !!g.dialogue || (!!g.cinematic && g.cinematic.kind !== 'finale') || g.screen !== 'playing';
    const finale = g.cinematic?.kind === 'finale' || g.screen === 'complete';

    // ------------------------------------------------ desired horizontal velocity
    const yaw = cameraState.yaw;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    let dx = 0;
    let dz = 0;
    let speedWanted = 0;
    const mlen = Math.hypot(input.move.x, input.move.y);
    if (!locked && !finale && mlen > 0.05) {
      dx = rx * input.move.x + fx * input.move.y;
      dz = rz * input.move.x + fz * input.move.y;
      const l = Math.hypot(dx, dz) || 1;
      dx /= l;
      dz /= l;
      speedWanted = (input.run ? RUN_SPEED : WALK_SPEED) * Math.min(1, mlen);
      player.autoTarget = null;
      s.idleTime = 0;
      if (s.action) s.action = null; // moving cancels emotes
    } else if (player.autoTarget && !finale) {
      const at = player.autoTarget;
      const ddx = at.x - pos.x;
      const ddz = at.z - pos.z;
      const d = Math.hypot(ddx, ddz);
      if (d <= at.stopDist) {
        player.autoTarget = null;
        at.onArrive();
      } else {
        dx = ddx / d;
        dz = ddz / d;
        speedWanted = WALK_SPEED * Math.min(1, d);
      }
    }
    const tvx = dx * speedWanted;
    const tvz = dz * speedWanted;
    const accel = speedWanted > 0 ? 14 : 18;
    const k = damp(s.grounded ? accel : accel * 0.35, dt);
    s.hv.x += (tvx - s.hv.x) * k;
    s.hv.y += (tvz - s.hv.y) * k;

    // ------------------------------------------------ jumping
    if (input.jumpPressed && !locked && !finale) s.jumpBuffer = 0.15;
    s.jumpBuffer -= dt;
    s.coyote -= dt;
    if (s.jumpBuffer > 0 && (s.grounded || s.coyote > 0)) {
      s.vy = JUMP_VELOCITY;
      s.grounded = false;
      s.coyote = 0;
      s.jumpBuffer = 0;
      s.action = null;
      audio.sfx('jump', { pitch: 0.95 + Math.random() * 0.1 });
    }

    // ------------------------------------------------ integrate
    s.vy -= GRAVITY * dt;
    pos.x += s.hv.x * dt;
    pos.z += s.hv.y * dt;
    pos.y += s.vy * dt;
    resolveCollisions(pos, RADIUS);

    const ground = groundHeightAt(pos.x, pos.z, pos.y);
    if (pos.y <= ground) {
      if (!s.grounded && s.airTime > 0.18) {
        s.land = Math.min(1, 0.35 + -s.vy * 0.06);
        audio.sfx('land', { volume: Math.min(1, -s.vy / 12) });
      }
      pos.y = ground;
      s.vy = 0;
      s.grounded = true;
    } else if (s.grounded && s.vy <= 0 && pos.y - ground < 0.32) {
      pos.y = ground; // stick to slopes / small steps down
      s.vy = 0;
    } else {
      if (s.grounded) s.coyote = 0.12;
      s.grounded = false;
    }
    if (s.grounded) s.airTime = 0;
    else s.airTime += dt;
    if (pos.y < -8) player.teleport(spawn.x, groundHeightAt(spawn.x, spawn.z, 100), spawn.z, spawn.facing);
    s.land = Math.max(0, s.land - dt * 3.2);

    // ------------------------------------------------ facing
    const hs = Math.hypot(s.hv.x, s.hv.y);
    if (hs > 0.25) {
      const want = Math.atan2(s.hv.x, s.hv.y);
      player.facing += angleDelta(player.facing, want) * damp(11, dt);
    } else if (player.lookAt) {
      const want = Math.atan2(player.lookAt.x - pos.x, player.lookAt.z - pos.z);
      player.facing += angleDelta(player.facing, want) * damp(7, dt);
    }

    // ------------------------------------------------ emotes from keyboard / touch
    if (input.emote && !locked && !finale && s.grounded) {
      g.playEmote(input.emote, input.emote === 'dance' ? 4.5 : 2.0);
      if (input.emote === 'dance') g.unlockAchievement('dancer', ACHIEVEMENTS.dancer.title, ACHIEVEMENTS.dancer.icon);
    }

    // ------------------------------------------------ choose animation state
    let action: AnimState | null = null;
    if (s.action) {
      s.action.time += dt;
      if (s.action.time > s.action.duration) s.action = null;
      else action = s.action.name;
    }
    if (finale) action = 'celebrate';
    else if (g.dialogue && g.dialogue.lines[g.dialogue.index]?.speaker === 'anett') action = 'talk';
    if (s.grounded && hs < 0.2 && !action && !player.autoTarget) s.idleTime += dt;
    s.overlayTime = Math.max(0, s.overlayTime - dt);
    const overlay = Math.min(1, s.overlayTime / 0.25) * Math.min(1, (0.9 - s.overlayTime) / 0.12 + 0.2);

    const prevPhase = animator.phase;
    animator.update(rig.current, dt, {
      speed: s.grounded ? hs : hs * 0.3,
      airborne: !s.grounded && s.airTime > 0.06,
      vy: s.vy,
      land: s.land,
      action,
      overlay: Math.max(0, overlay),
      idleTime: s.idleTime,
    });

    // footsteps on each foot plant
    if (s.grounded && hs > 0.6) {
      const a = Math.floor(prevPhase / Math.PI);
      const b = Math.floor(animator.phase / Math.PI);
      if (a !== b) audio.sfx('step', { volume: hs > 4.5 ? 1 : 0.7 });
    }

    // ------------------------------------------------ write transforms
    player.velocity.set(s.hv.x, s.vy, s.hv.y);
    player.grounded = s.grounded;
    player.speed = hs;
    group.current.position.copy(pos);
    group.current.rotation.y = player.facing;

    onAfterMove?.(dt);
  });

  return (
    <group ref={group}>
      <AnettModel
        ref={rig}
        rightHandItem={
          hasWand ? (
            <group rotation={[Math.PI * 0.55, 0, 0]} position={[0, -0.02, 0.02]} scale={0.6}>
              <Wand />
            </group>
          ) : null
        }
      />
      {/* soft contact shadow blob – keeps her grounded visually on any device */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} renderOrder={-1}>
        <circleGeometry args={[0.32, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}
