/**
 * Animation state machine + blend tree for Anett.
 *
 * Inputs each frame: locomotion speed, airborne flag, vertical velocity, landing timer,
 * an optional full-body state (emote) and an optional upper-body overlay (collect).
 * Output: joint rotations written to the rig, smoothly damped (no snapping between states).
 */
import { damp, smoothstep } from '../../../utils/math';
import type { AnettRig } from './AnettModel';
import { JOINTS, POSES, UPPER_BODY, copyPose, emptyPose, mixPose, type AnimState, type Pose } from './AnettAnimations';

export interface AnimInput {
  speed: number;
  airborne: boolean;
  vy: number;
  /** 0..1 landing squash weight */
  land: number;
  /** full-body state that overrides locomotion */
  action: AnimState | null;
  /** upper-body overlay weight for the collect animation (0..1) */
  overlay: number;
  /** seconds without input (drives the look-around idle variation) */
  idleTime: number;
}

export class AnettAnimator {
  t = 0;
  phase = 0;
  private current = emptyPose();
  private target = emptyPose();
  private tmpA = emptyPose();
  private tmpB = emptyPose();
  private blinkTimer = 2;
  private blinkT = -1;
  private actionWeight = 0;
  private lastAction: AnimState = 'wave';
  private actionTime = 0;
  /** last value of the mouth parameter, used by face rendering */
  mouth = 0;

  update(rig: AnettRig | null, dt: number, inp: AnimInput) {
    this.t += dt;
    const t = this.t;

    // ---- locomotion blend tree: idle <-> walk <-> run
    const stride = inp.speed > 4.5 ? 2.15 : 2.35;
    this.phase += dt * inp.speed * stride;
    const wWalk = smoothstep(0.08, 1.4, inp.speed);
    const wRun = smoothstep(3.6, 5.8, inp.speed);
    const idleKind = inp.idleTime > 5 ? 'lookAround' : 'idle';
    const loco = this.tmpA;
    copyPose(loco, POSES[idleKind](t, this.phase));
    if (wWalk > 0) mixPose(loco, loco, POSES.walk(t, this.phase), wWalk);
    if (wRun > 0) mixPose(loco, loco, POSES.run(t, this.phase), wRun);

    // ---- airborne: jump (rising) -> fall (descending)
    if (inp.airborne) {
      const air = this.tmpB;
      copyPose(air, POSES.jump(t, this.phase));
      mixPose(air, air, POSES.fall(t, this.phase), smoothstep(1.5, -3.5, inp.vy));
      mixPose(loco, loco, air, 1);
    }
    if (inp.land > 0) mixPose(loco, loco, POSES.land(t, this.phase), inp.land);

    // ---- full-body actions (wave, dance, celebrate, surprise, talk)
    if (inp.action) {
      if (inp.action !== this.lastAction) this.actionTime = 0;
      this.lastAction = inp.action;
    }
    this.actionTime += dt;
    this.actionWeight += ((inp.action ? 1 : 0) - this.actionWeight) * damp(8, dt);
    copyPose(this.target, loco);
    if (this.actionWeight > 0.001) mixPose(this.target, this.target, POSES[this.lastAction](this.actionTime, this.phase), this.actionWeight);

    // ---- layered upper body overlay (collect)
    if (inp.overlay > 0) {
      const ov = POSES.collect(t, this.phase);
      for (const j of UPPER_BODY) {
        const a = this.target.joints[j];
        const b = ov.joints[j];
        for (let i = 0; i < 3; i++) a[i] += (b[i] - a[i]) * inp.overlay;
      }
      this.target.mouth = Math.max(this.target.mouth, ov.mouth * inp.overlay);
    }

    // ---- damp current toward target
    const k = damp(inp.land > 0.3 ? 22 : 13, dt);
    dampPose(this.current, this.target, k);

    // ---- blink
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0 && this.blinkT < 0) {
      this.blinkT = 0;
      this.blinkTimer = 2 + Math.random() * 3.5;
    }
    let eyeScale = 1;
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      const b = this.blinkT / 0.16;
      eyeScale = b < 0.5 ? 1 - b * 1.85 : 0.075 + (b - 0.5) * 1.85;
      if (b >= 1) {
        this.blinkT = -1;
        eyeScale = 1;
      }
    }
    if (this.current.mouth > 0.75) eyeScale = Math.min(eyeScale, 1.08);

    if (rig) applyPose(rig, this.current, eyeScale);
    this.mouth = this.current.mouth;
  }
}

function dampPose(cur: Pose, target: Pose, k: number) {
  for (const j of JOINTS) {
    const c = cur.joints[j];
    const g = target.joints[j];
    c[0] += (g[0] - c[0]) * k;
    c[1] += (g[1] - c[1]) * k;
    c[2] += (g[2] - c[2]) * k;
  }
  cur.bodyY += (target.bodyY - cur.bodyY) * k;
  cur.mouth += (target.mouth - cur.mouth) * k;
}

function applyPose(rig: AnettRig, p: Pose, eyeScale: number) {
  for (const j of JOINTS) {
    const g = rig[j];
    if (!g) continue;
    const r = p.joints[j];
    g.rotation.set(r[0], r[1], r[2]);
  }
  rig.body.position.y = p.bodyY;
  // secondary motion: hair lags behind head pitch slightly
  rig.hairBack.rotation.x = 0; // hair motion is simulated in AnettModel (spring + shader)
  rig.eyeL.scale.y = eyeScale;
  rig.eyeR.scale.y = eyeScale;
  const open = p.mouth;
  rig.mouthOpen.visible = open > 0.25;
  rig.mouthOpen.scale.set(0.8 + open * 0.3, 0.45 + open * 0.55, 0.45);
  rig.mouthSmile.visible = open <= 0.25;
}
