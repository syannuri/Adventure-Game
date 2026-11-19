/**
 * Procedural animation library for Anett.
 *
 * Every animation is a pose function of time. The controller evaluates the poses for the active
 * states, mixes them with weights (blend tree) and then damps each joint toward the result, which
 * gives smooth transitions between any two states (animation blending).
 *
 * Rotation conventions (character faces +Z):
 *   leg/shoulder rotation.x < 0  -> limb swings forward
 *   knee rotation.x > 0          -> lower leg bends back
 *   elbow rotation.x < 0         -> forearm bends forward
 *   shoulderL rotation.z > 0 / shoulderR rotation.z < 0 -> arm raised out to the side
 */
export type JointName =
  | 'hips'
  | 'spine'
  | 'neck'
  | 'shoulderL'
  | 'elbowL'
  | 'shoulderR'
  | 'elbowR'
  | 'legL'
  | 'kneeL'
  | 'legR'
  | 'kneeR';

export const JOINTS: JointName[] = ['hips', 'spine', 'neck', 'shoulderL', 'elbowL', 'shoulderR', 'elbowR', 'legL', 'kneeL', 'legR', 'kneeR'];

export type Vec3 = [number, number, number];

export interface Pose {
  joints: Record<JointName, Vec3>;
  /** vertical body offset (bounce / squash) */
  bodyY: number;
  /** 0 = smile, 1 = open mouth */
  mouth: number;
  /** 0 = relaxed brows, 1 = brows raised high (surprise / excitement) */
  brow: number;
  /** 0 = open eyes, 1 = happy squint (laughing) */
  squint: number;
}

export type AnimState =
  | 'idle'
  | 'lookAround'
  | 'walk'
  | 'run'
  | 'crouch'
  | 'jump'
  | 'leap'
  | 'climb'
  | 'apex'
  | 'fall'
  | 'land'
  | 'wave'
  | 'dance'
  | 'celebrate'
  | 'surprise'
  | 'collect'
  | 'talk';

const S = Math.sin;
const C = Math.cos;

export function emptyPose(): Pose {
  const joints = {} as Record<JointName, Vec3>;
  for (const j of JOINTS) joints[j] = [0, 0, 0];
  return { joints, bodyY: 0, mouth: 0, brow: 0, squint: 0 };
}

function base(t: number): Pose {
  const p = emptyPose();
  const breathe = S(t * 2.1);
  p.joints.spine = [breathe * 0.025, 0, 0];
  p.joints.neck = [-breathe * 0.015, S(t * 0.45) * 0.08, S(t * 0.7) * 0.03];
  p.joints.hips = [0, 0, S(t * 0.9) * 0.02];
  p.joints.shoulderL = [0.05, 0, 0.13 + breathe * 0.02];
  p.joints.shoulderR = [0.05, 0, -0.13 - breathe * 0.02];
  p.joints.elbowL = [-0.18, 0, 0];
  p.joints.elbowR = [-0.18, 0, 0];
  p.joints.legL = [0, 0, 0.02];
  p.joints.legR = [0, 0, -0.02];
  p.bodyY = breathe * 0.004;
  return p;
}

export const POSES: Record<AnimState, (t: number, phase: number) => Pose> = {
  idle: (t) => base(t),

  lookAround: (t) => {
    const p = base(t);
    const k = S(t * 0.9);
    p.joints.neck = [-0.08 + S(t * 1.8) * 0.04, k * 0.75, k * 0.08];
    p.joints.spine[1] = k * 0.15;
    p.joints.shoulderR = [-0.1, 0, -0.18];
    return p;
  },

  walk: (_t, ph) => {
    const p = emptyPose();
    const s = S(ph);
    const c = C(ph);
    p.joints.legL = [-s * 0.55, 0, 0.02];
    p.joints.legR = [s * 0.55, 0, -0.02];
    p.joints.kneeL = [Math.max(0, c) * 0.85 + 0.08, 0, 0];
    p.joints.kneeR = [Math.max(0, -c) * 0.85 + 0.08, 0, 0];
    p.joints.shoulderL = [s * 0.5, 0, 0.12];
    p.joints.shoulderR = [-s * 0.5, 0, -0.12];
    p.joints.elbowL = [-0.35 - Math.max(0, -s) * 0.3, 0, 0];
    p.joints.elbowR = [-0.35 - Math.max(0, s) * 0.3, 0, 0];
    p.joints.hips = [0, -s * 0.12, c * 0.03];
    p.joints.spine = [0.06, s * 0.1, 0];
    p.joints.neck = [-0.03, -s * 0.05, 0];
    p.bodyY = Math.abs(c) * 0.035 - 0.012;
    return p;
  },

  run: (_t, ph) => {
    const p = emptyPose();
    const s = S(ph);
    const c = C(ph);
    p.joints.legL = [-s * 0.95 - 0.1, 0, 0.03];
    p.joints.legR = [s * 0.95 - 0.1, 0, -0.03];
    p.joints.kneeL = [Math.max(0, c) * 1.5 + 0.25, 0, 0];
    p.joints.kneeR = [Math.max(0, -c) * 1.5 + 0.25, 0, 0];
    p.joints.shoulderL = [s * 0.95, 0, 0.18];
    p.joints.shoulderR = [-s * 0.95, 0, -0.18];
    p.joints.elbowL = [-1.25, 0, 0];
    p.joints.elbowR = [-1.25, 0, 0];
    p.joints.hips = [0, -s * 0.18, 0];
    p.joints.spine = [0.24, s * 0.16, 0];
    p.joints.neck = [-0.16, -s * 0.08, 0];
    p.bodyY = Math.abs(c) * 0.075 - 0.03;
    return p;
  },

  /**
   * Anticipation before take-off (a split second): knees bend, hips drop, the body leans forward and
   * both arms swing back, ready to throw the body up.
   */
  crouch: () => {
    const p = emptyPose();
    p.joints.legL = [-0.72, 0, 0.06];
    p.joints.kneeL = [1.3, 0, 0];
    p.joints.legR = [-0.72, 0, -0.06];
    p.joints.kneeR = [1.3, 0, 0];
    p.joints.hips = [0.05, 0, 0];
    p.joints.spine = [0.4, 0, 0];
    p.joints.neck = [-0.28, 0, 0];
    p.joints.shoulderL = [0.75, 0, 0.18];
    p.joints.shoulderR = [0.75, 0, -0.18];
    p.joints.elbowL = [-0.25, 0, 0];
    p.joints.elbowR = [-0.25, 0, 0];
    p.bodyY = -0.15;
    p.brow = 0.15;
    return p;
  },

  /**
   * Take-off / rising: the legs have just pushed off (stretched, toes trailing), the arms have swung
   * forward and up past the shoulders, the chest opens and she looks up where she is going.
   */
  jump: () => {
    const p = emptyPose();
    p.joints.legL = [-0.22, 0, 0.05];
    p.joints.kneeL = [0.3, 0, 0];
    p.joints.legR = [0.08, 0, -0.05];
    p.joints.kneeR = [0.18, 0, 0];
    p.joints.shoulderL = [-2.35, 0, 0.22];
    p.joints.shoulderR = [-2.35, 0, -0.22];
    p.joints.elbowL = [-0.3, 0, 0];
    p.joints.elbowR = [-0.3, 0, 0];
    p.joints.spine = [-0.1, 0, 0];
    p.joints.neck = [-0.14, 0, 0];
    p.bodyY = 0.02;
    p.mouth = 0.3;
    p.brow = 0.35;
    return p;
  },

  /** Top of the jump: knees drawn up a little, arms coming down to the front, weightless for a moment. */
  apex: () => {
    const p = emptyPose();
    p.joints.legL = [-0.78, 0, 0.08];
    p.joints.kneeL = [1.3, 0, 0];
    p.joints.legR = [-0.55, 0, -0.08];
    p.joints.kneeR = [1.15, 0, 0];
    p.joints.shoulderL = [-1.45, 0, 0.55];
    p.joints.shoulderR = [-1.45, 0, -0.55];
    p.joints.elbowL = [-0.45, 0, 0];
    p.joints.elbowR = [-0.45, 0, 0];
    p.joints.spine = [0.06, 0, 0];
    p.joints.neck = [-0.04, 0, 0];
    p.mouth = 0.45;
    p.brow = 0.3;
    p.squint = 0.2;
    return p;
  },

  /** Coming down: legs reach for the ground with soft knees, arms open out for balance, eyes on the landing spot. */
  fall: (t) => {
    const p = emptyPose();
    const w = S(t * 7) * 0.06;
    p.joints.legL = [-0.28, 0, 0.07];
    p.joints.kneeL = [0.42, 0, 0];
    p.joints.legR = [-0.12, 0, -0.07];
    p.joints.kneeR = [0.32, 0, 0];
    p.joints.shoulderL = [-0.55, 0, 1.0 + w];
    p.joints.shoulderR = [-0.55, 0, -1.0 - w];
    p.joints.elbowL = [-0.35, 0, 0];
    p.joints.elbowR = [-0.35, 0, 0];
    p.joints.spine = [0.12, 0, 0];
    p.joints.neck = [0.14, 0, 0];
    p.mouth = 0.3;
    p.brow = 0.3;
    return p;
  },

  /**
   * Running jump: a long stride in the air – the front leg reaches forward, the back leg trails, and
   * the arms swing opposite to the legs like in a real leap.
   */
  leap: (t) => {
    const p = emptyPose();
    p.joints.legL = [-1.05, 0, 0.04];
    p.joints.kneeL = [0.75, 0, 0];
    p.joints.legR = [0.5, 0, -0.04];
    p.joints.kneeR = [0.85, 0, 0];
    p.joints.shoulderL = [0.65, 0, 0.3];
    p.joints.shoulderR = [-1.35, 0, -0.3];
    p.joints.elbowL = [-0.5, 0, 0];
    p.joints.elbowR = [-0.7, 0, 0];
    p.joints.spine = [0.18, 0.08, 0];
    p.joints.hips = [0, -0.12, 0];
    p.joints.neck = [-0.1, -0.06, S(t * 3) * 0.02];
    p.mouth = 0.35;
    p.brow = 0.3;
    return p;
  },

  /**
   * Climbing a ladder (facing it): hands reach up for the rungs and the feet step up, the left hand
   * moving with the right foot and the other way round. `ph` advances by PI per rung.
   */
  climb: (_t, ph) => {
    const p = emptyPose();
    const s = S(ph);
    const up = (v: number) => Math.max(0, v);
    // legs: the stepping leg lifts its knee high, the standing leg pushes straight
    p.joints.legL = [-0.35 - up(s) * 0.85, 0, 0.08];
    p.joints.kneeL = [0.35 + up(s) * 1.25, 0, 0];
    p.joints.legR = [-0.35 - up(-s) * 0.85, 0, -0.08];
    p.joints.kneeR = [0.35 + up(-s) * 1.25, 0, 0];
    // arms: reaching up for the next rung, the other hand holding lower with a bent elbow
    p.joints.shoulderL = [-2.45 - up(-s) * 0.35 + up(s) * 0.5, 0, 0.18];
    p.joints.shoulderR = [-2.45 - up(s) * 0.35 + up(-s) * 0.5, 0, -0.18];
    p.joints.elbowL = [-0.35 - up(s) * 0.75, 0, 0];
    p.joints.elbowR = [-0.35 - up(-s) * 0.75, 0, 0];
    p.joints.spine = [0.16, s * 0.05, 0];
    p.joints.hips = [0, s * 0.08, s * 0.04];
    p.joints.neck = [-0.3, 0, 0];
    p.bodyY = -0.02;
    return p;
  },

  /** Landing: knees bend to soak up the fall, hips drop, the body leans forward and the arms reach out in front. */
  land: () => {
    const p = emptyPose();
    p.joints.legL = [-0.8, 0, 0.07];
    p.joints.kneeL = [1.4, 0, 0];
    p.joints.legR = [-0.8, 0, -0.07];
    p.joints.kneeR = [1.4, 0, 0];
    p.joints.hips = [0.04, 0, 0];
    p.joints.spine = [0.42, 0, 0];
    p.joints.neck = [-0.25, 0, 0];
    p.joints.shoulderL = [-0.95, 0, 0.35];
    p.joints.shoulderR = [-0.95, 0, -0.35];
    p.joints.elbowL = [-0.4, 0, 0];
    p.joints.elbowR = [-0.4, 0, 0];
    p.bodyY = -0.15;
    return p;
  },

  wave: (t) => {
    const p = base(t);
    p.joints.shoulderR = [-0.2, 0, -2.55];
    p.squint = 0.35;
    p.brow = 0.3;
    p.joints.elbowR = [0, 0, S(t * 11) * 0.45 - 0.2];
    p.joints.neck = [0.02, -0.12, -0.12];
    p.joints.spine[2] = 0.05;
    p.joints.hips[2] = 0.04;
    return p;
  },

  dance: (t) => {
    const p = emptyPose();
    const b = S(t * 6.3);
    const sw = S(t * 3.15);
    p.bodyY = Math.abs(b) * 0.06 - 0.02;
    p.joints.hips = [0, sw * 0.35, sw * 0.12];
    p.joints.spine = [0, -sw * 0.2, -sw * 0.12];
    p.joints.neck = [0, sw * 0.15, sw * 0.18];
    p.joints.shoulderL = [-0.3, 0, 2.3 + sw * 0.35];
    p.joints.shoulderR = [-0.3, 0, -2.3 + sw * 0.35];
    p.joints.elbowL = [0, 0, 0.6 + b * 0.25];
    p.joints.elbowR = [0, 0, -0.6 + b * 0.25];
    p.joints.legL = [-Math.max(0, sw) * 0.4, 0, 0.08];
    p.joints.kneeL = [Math.max(0, sw) * 0.7 + 0.1, 0, 0];
    p.joints.legR = [-Math.max(0, -sw) * 0.4, 0, -0.08];
    p.joints.kneeR = [Math.max(0, -sw) * 0.7 + 0.1, 0, 0];
    p.mouth = 0.4;
    p.squint = 0.45;
    p.brow = 0.2;
    return p;
  },

  celebrate: (t) => {
    const p = emptyPose();
    const hop = Math.abs(S(t * 6.5));
    p.bodyY = hop * 0.2;
    p.joints.shoulderL = [-0.25, 0, 2.7 + S(t * 13) * 0.12];
    p.joints.shoulderR = [-0.25, 0, -2.7 - S(t * 13) * 0.12];
    p.joints.elbowL = [0, 0, 0.25];
    p.joints.elbowR = [0, 0, -0.25];
    p.joints.legL = [-hop * 0.5, 0, 0.1];
    p.joints.kneeL = [hop * 1.0 + 0.1, 0, 0];
    p.joints.legR = [-hop * 0.5, 0, -0.1];
    p.joints.kneeR = [hop * 1.0 + 0.1, 0, 0];
    p.joints.spine = [-0.1, 0, 0];
    p.joints.neck = [-0.22, 0, S(t * 4) * 0.1];
    p.mouth = 1;
    p.squint = 0.75;
    p.brow = 0.4;
    return p;
  },

  surprise: (t) => {
    const p = base(t);
    p.joints.spine = [-0.18, 0, 0];
    p.joints.neck = [-0.12, 0, 0];
    p.joints.shoulderL = [-1.9, 0, 0.35];
    p.joints.shoulderR = [-1.9, 0, -0.35];
    p.joints.elbowL = [-1.9, 0, 0];
    p.joints.elbowR = [-1.9, 0, 0];
    p.joints.legL = [0.12, 0, 0.08];
    p.joints.legR = [-0.15, 0, -0.08];
    p.joints.kneeR = [0.25, 0, 0];
    p.bodyY = 0.02;
    p.mouth = 1;
    p.brow = 1;
    return p;
  },

  collect: (t) => {
    const p = base(t);
    p.joints.shoulderL = [-0.5, 0, 2.2];
    p.joints.shoulderR = [-0.5, 0, -2.2];
    p.joints.elbowL = [-0.2, 0, 0.3];
    p.joints.elbowR = [-0.2, 0, -0.3];
    p.joints.neck = [-0.25, 0, 0];
    p.joints.spine = [-0.08, 0, 0];
    p.bodyY = 0.03;
    p.mouth = 0.8;
    p.brow = 0.6;
    p.squint = 0.25;
    return p;
  },

  talk: (t) => {
    const p = base(t);
    p.joints.shoulderR = [-0.65 + S(t * 2.6) * 0.2, 0, -0.25];
    p.joints.elbowR = [-1.3 + S(t * 3.1) * 0.2, 0, 0];
    p.joints.shoulderL = [-0.15, 0, 0.18 + S(t * 2) * 0.05];
    p.joints.neck = [S(t * 4.5) * 0.06, S(t * 1.3) * 0.08, 0.08];
    p.mouth = S(t * 15) > 0.1 ? 0.45 : 0;
    p.brow = 0.25 + S(t * 2.2) * 0.25;
    return p;
  },
};

/** out = a*(1-w) + b*w, written into `out` (may alias a). */
export function mixPose(out: Pose, a: Pose, b: Pose, w: number): Pose {
  if (w <= 0) {
    if (out !== a) copyPose(out, a);
    return out;
  }
  for (const j of JOINTS) {
    const ja = a.joints[j];
    const jb = b.joints[j];
    const o = out.joints[j];
    o[0] = ja[0] + (jb[0] - ja[0]) * w;
    o[1] = ja[1] + (jb[1] - ja[1]) * w;
    o[2] = ja[2] + (jb[2] - ja[2]) * w;
  }
  out.bodyY = a.bodyY + (b.bodyY - a.bodyY) * w;
  out.mouth = a.mouth + (b.mouth - a.mouth) * w;
  out.brow = a.brow + (b.brow - a.brow) * w;
  out.squint = a.squint + (b.squint - a.squint) * w;
  return out;
}

export function copyPose(out: Pose, a: Pose) {
  for (const j of JOINTS) {
    out.joints[j][0] = a.joints[j][0];
    out.joints[j][1] = a.joints[j][1];
    out.joints[j][2] = a.joints[j][2];
  }
  out.bodyY = a.bodyY;
  out.mouth = a.mouth;
  out.brow = a.brow;
  out.squint = a.squint;
}

/** Upper-body joints used for layered (overlay) animations such as "collect" while running. */
export const UPPER_BODY: JointName[] = ['shoulderL', 'elbowL', 'shoulderR', 'elbowR', 'neck'];
