/**
 * Unified input state. Keyboard and touch controls both write into this mutable object,
 * gameplay systems read from it every frame (no React re-renders involved).
 */
export const input = {
  /** Movement vector in screen space: x = right, y = forward. Length 0..1 */
  move: { x: 0, y: 0 },
  run: false,
  /** Run toggle (R key or the on-screen Run button) – kid friendly, no need to hold a key */
  runToggle: false,
  /** true while the touch joystick is steering (speed follows how far it is pushed) */
  analog: false,
  /** Edge-triggered flags; consumers reset them after reading. */
  jumpPressed: false,
  interactPressed: false,
  advancePressed: false,
  emote: null as null | 'wave' | 'dance',
  /** Joystick vector from the touch UI */
  touchMove: { x: 0, y: 0 },
  /** Camera orbit deltas accumulated from mouse / touch drag. */
  lookDelta: { x: 0, y: 0 },
  zoomDelta: 0,
  lastLookTime: 0,
};

const keys = new Set<string>();

/** Joystick zones: below JOY_WALK the speed ramps up to walking; past JOY_RUN she runs. */
export const JOY_WALK = 0.5;
export const JOY_RUN = 0.62;

/** Analog joystick -> speed factor: 0..1 = walking speeds, 1..2 = walk→run blend. */
export function joystickSpeed(mag: number) {
  if (mag <= JOY_WALK) return mag / JOY_WALK;
  const t = Math.min(1, (mag - JOY_WALK) / (0.92 - JOY_WALK));
  return 1 + t * t * (3 - 2 * t);
}

function recompute() {
  let x = 0;
  let y = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) y -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  const tl = Math.hypot(input.touchMove.x, input.touchMove.y);
  if (tl > 0.05) {
    x = input.touchMove.x;
    y = input.touchMove.y;
    input.run = input.runToggle || tl > JOY_RUN;
    input.analog = true;
  } else {
    const len = Math.hypot(x, y);
    if (len > 0) {
      x /= len;
      y /= len;
    }
    input.run = input.runToggle || keys.has('ShiftLeft') || keys.has('ShiftRight');
    input.analog = false;
  }
  input.move.x = x;
  input.move.y = y;
}

/** Switch running on/off (R key / Run button). Notifies listeners so the UI can show the state. */
export function toggleRun(on = !input.runToggle) {
  input.runToggle = on;
  recompute();
  runListeners.forEach((f) => f(on));
}
const runListeners = new Set<(on: boolean) => void>();
export function onRunToggle(f: (on: boolean) => void) {
  runListeners.add(f);
  return () => {
    runListeners.delete(f);
  };
}

export function setTouchMove(x: number, y: number) {
  input.touchMove.x = x;
  input.touchMove.y = y;
  recompute();
}

let installed = false;
export function installKeyboard() {
  if (installed) return;
  installed = true;
  window.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    if (e.repeat) {
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
      return;
    }
    keys.add(e.code);
    if (e.code === 'Space') {
      input.jumpPressed = true;
      input.advancePressed = true;
      e.preventDefault();
    }
    if (e.code === 'KeyE' || e.code === 'Enter') {
      input.interactPressed = true;
      input.advancePressed = true;
    }
    if (e.code === 'KeyF') input.emote = 'wave';
    if (e.code === 'KeyR') toggleRun();
    if (e.code === 'KeyG') input.emote = 'dance';
    if (e.code.startsWith('Arrow')) e.preventDefault();
    recompute();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    recompute();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    recompute();
  });
}

export function resetEdges() {
  input.jumpPressed = false;
  input.interactPressed = false;
  input.advancePressed = false;
  input.emote = null;
}
