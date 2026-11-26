/**
 * Rain and the rainbow (World 1, daytime). A while after arriving, a gentle rain shower passes over
 * the forest: the sky turns grey, rain streaks fall and puddles form on the paths. When it stops a
 * big rainbow appears in the sky, but its colours are pale: seven colour drops fell into the forest.
 * Find red, orange, yellow, green, blue, indigo and violet (the name of each colour is shown) to make
 * the rainbow bright again. Jumping into the puddles makes a big splash.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame } from '../../../systems/store';
import { player, cameraState } from '../../../systems/playerState';
import { input } from '../../../systems/input';
import { terrainHeight } from '../../worlds/EnchantedForest/layout';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { forestDialogue as D } from '../../../data/forestDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { tr } from '../../../i18n';
import { rewardAcorns } from '../shop/KikiShopQuest';
import { writeSave } from '../../../systems/save';

export const RAINBOW = [
  { id: 'red', color: '#ff3b3b', x: 14.5, z: -4 },
  { id: 'orange', color: '#ff9a1f', x: 22, z: 2 },
  { id: 'yellow', color: '#ffe02a', x: 13, z: 15.5 },
  { id: 'green', color: '#3fcf4a', x: -20, z: 4 },
  { id: 'blue', color: '#2f8cff', x: -23, z: -8.5 },
  { id: 'indigo', color: '#4b3fd0', x: -16, z: -24.5 },
  { id: 'violet', color: '#b04fe0', x: 2, z: -20.5 },
];
const PUDDLES = [
  [0.3, 18],
  [-0.3, 9],
  [2, -6],
  [6.5, -9],
  [11.5, -9.5],
  [-5, -4.5],
  [-10.5, -6.5],
  [-16, -10.5],
  [5, 2],
  [9.5, 6.5],
].map(([x, z], i) => ({ id: `puddle-${i}`, x, z, r: 0.95, rot: i * 1.3 }));
const PUDDLE_GOAL = 5;

/** seconds of play before the shower, and how long it rains (tests can change these) */
export const weather = { rainAt: 50, rainLen: 22, t: 0, amount: 0, phase: 'clear' as 'clear' | 'rain' | 'after', splashed: new Set<string>() };
if (typeof window !== 'undefined') Object.assign(window, { __anettWeather: weather });

const lvl = () => useGame.getState().level;
const setRain = (p: Partial<ReturnType<typeof lvl>['rain']>) => useGame.setState((s) => ({ level: { ...s.level, rain: { ...s.level.rain, ...p }, lastProgressAt: performance.now() } }));

function toast(title: string, text: string, icon: string) {
  useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now() + Math.random(), title, text, icon }] }));
  const id = useGame.getState().toasts.at(-1)!.id;
  window.setTimeout(() => useGame.getState().dismissToast(id), 2400);
}

export function rainStatus() {
  const r = lvl().rain;
  if (r.stage === 'rain') return '🌧 ' + tr().rain.raining;
  if (r.stage === 'after' && r.colors.length < RAINBOW.length) return '🌈 ' + tr().rain.colorCount(r.colors.length, RAINBOW.length);
  return null;
}

export function RainbowQuest() {
  const stage = useGame((s) => s.level.rain.stage);
  const colors = useGame((s) => s.level.rain.colors);
  const { scene } = useThree();
  const baseFog = useRef<THREE.Color | null>(null);
  const lights = useRef<{ l: THREE.Light; base: number }[] | null>(null);
  const wasAir = useRef(false);

  useEffect(() => {
    weather.t = 0;
    weather.amount = 0;
    weather.phase = 'clear';
    weather.splashed = new Set();
    return () => {
      audio.setAmbience('rain', 0);
      if (scene.fog && baseFog.current) (scene.fog as THREE.Fog).color.copy(baseFog.current);
      lights.current?.forEach(({ l, base }) => (l.intensity = base));
    };
  }, [scene]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const g = useGame.getState();
    const l = g.level;
    const busy = g.paused || !!g.dialogue || !!g.cinematic || g.screen !== 'playing' || !g.worldReady;

    // ---- the shower
    if (!busy) {
      weather.t += dt;
      if (l.rain.stage === 'none' && weather.t > weather.rainAt) {
        setRain({ stage: 'rain' });
        weather.t = 0;
        toast(tr().rain.startTitle, tr().rain.startText, '🌧');
      } else if (l.rain.stage === 'rain' && weather.t > weather.rainLen) {
        setRain({ stage: 'after' });
        audio.sfx('magic', { pitch: 1.2 });
        lookUpUntil = performance.now() + 6000;
        window.setTimeout(() => useGame.getState().openDialogue(D().rainbowAppears), 1800);
      }
    }
    // when the rainbow appears the camera turns to the north and looks up at it
    if (performance.now() < lookUpUntil) {
      const want = 0; // camera south of Anet, looking north at the rainbow
      cameraState.yaw += Math.atan2(Math.sin(want - cameraState.yaw), Math.cos(want - cameraState.yaw)) * Math.min(1, dt * 2);
      cameraState.pitch += (-0.05 - cameraState.pitch) * Math.min(1, dt * 2);
      cameraState.distance += (6 - cameraState.distance) * Math.min(1, dt * 2);
      input.lastLookTime = performance.now();
    }
    weather.phase = l.rain.stage === 'rain' ? 'rain' : l.rain.stage === 'after' ? 'after' : 'clear';
    const want = l.rain.stage === 'rain' ? 1 : 0;
    weather.amount += (want - weather.amount) * Math.min(1, dt * 0.6);
    audio.setAmbience('rain', weather.amount > 0.05 ? weather.amount : 0);
    // grey sky and dimmer light while it rains
    if (!lights.current) {
      lights.current = [];
      scene.traverse((o) => {
        const li = o as THREE.Light;
        if (li.isLight && !(li as THREE.PointLight).isPointLight) lights.current!.push({ l: li, base: li.intensity });
      });
    }
    for (const { l, base } of lights.current) l.intensity = base * (1 - 0.45 * weather.amount);
    if (scene.fog) {
      const fog = scene.fog as THREE.Fog;
      if (!baseFog.current) baseFog.current = fog.color.clone();
      fog.color.copy(baseFog.current).lerp(GREY, weather.amount * 0.7);
    }

    if (busy) return;
    const p = player.position;
    // ---- colour drops
    if (l.rain.stage === 'after') {
      for (const c of RAINBOW) {
        if (l.rain.colors.includes(c.id)) continue;
        if (Math.hypot(p.x - c.x, p.z - c.z) < 1.2) {
          const got = [...l.rain.colors, c.id];
          setRain({ colors: got });
          audio.sfx('star', { pitch: 0.9 + got.length * 0.08 });
          spawnBurst(c.x, terrainHeight(c.x, c.z) + 1, c.z, c.color, 40, { speed: 2.6 });
          g.playEmote('collect', 1);
          toast(tr().rain.colors[c.id], tr().rain.colorCount(got.length, RAINBOW.length), '●');
          if (got.length >= RAINBOW.length) window.setTimeout(rainbowDone, 900);
          break;
        }
      }
    }
    // ---- splashing in puddles (landing in one after a jump)
    const air = !player.grounded;
    if (wasAir.current && !air && l.rain.stage !== 'none') {
      const pd = PUDDLES.find((q) => Math.hypot(p.x - q.x, p.z - q.z) < q.r);
      if (pd) {
        audio.sfx('splash', { volume: 0.9, pitch: 1.1 + Math.random() * 0.2 });
        spawnBurst(p.x, p.y + 0.15, p.z, '#bfe9ff', 26, { speed: 2.2, up: 2 });
        ripples.push({ x: pd.x, z: pd.z, t: performance.now() });
        if (!weather.splashed.has(pd.id)) {
          weather.splashed.add(pd.id);
          if (weather.splashed.size === PUDDLE_GOAL) g.unlockAchievement('puddle_jumper', ACHIEVEMENTS.puddle_jumper.title, ACHIEVEMENTS.puddle_jumper.icon);
        }
      }
    }
    wasAir.current = air;
  });

  return (
    <group>
      <Rain />
      <Clouds />
      <Puddles show={stage !== 'none'} />
      {stage === 'after' && <Rainbow lit={colors} />}
      {stage === 'after' &&
        RAINBOW.filter((c) => !colors.includes(c.id)).map((c) => <ColourDrop key={c.id} color={c.color} x={c.x} z={c.z} />)}
    </group>
  );
}

function rainbowDone() {
  const g = useGame.getState();
  g.unlockAchievement('rainbow_hunter', ACHIEVEMENTS.rainbow_hunter.title, ACHIEVEMENTS.rainbow_hunter.icon);
  g.playEmote('celebrate', 2);
  audio.sfx('achievement');
  if (!useGame.getState().save.rainbowDone) {
    const save = { ...useGame.getState().save, rainbowDone: true };
    writeSave(save);
    useGame.setState({ save });
    rewardAcorns(5);
  }
  g.openDialogue(D().rainbowDone);
}

const GREY = new THREE.Color('#9aa4b0');
/**
 * A layer of the sky: drawn with the opaque objects right after the sky dome (renderOrder), blended
 * by hand, without depth, so trees and hills always cover it.
 */
function skyLayer<M extends THREE.Material>(m: M): M {
  m.transparent = false;
  m.blending = THREE.CustomBlending;
  m.blendSrc = THREE.SrcAlphaFactor;
  m.blendDst = THREE.OneMinusSrcAlphaFactor;
  m.depthTest = false;
  m.depthWrite = false;
  return m;
}
let lookUpUntil = 0;
const ripples: { x: number; z: number; t: number }[] = [];

// ------------------------------------------------------------------------------------- visuals

/** rain streaks in a box that follows Anet */
function Rain() {
  const quality = useGame((s) => s.save.settings.quality);
  const N = quality === 'high' ? 2200 : 1200;
  const BOX = 26;
  const H = 16;
  const { geo, drops } = useMemo(() => {
    const pos = new Float32Array(N * 6);
    const drops = Array.from({ length: N }, () => ({ x: (Math.random() - 0.5) * BOX, y: Math.random() * H, z: (Math.random() - 0.5) * BOX, v: 12 + Math.random() * 4 }));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geo: g, drops };
  }, [N]);
  const mat = useMemo(() => new THREE.LineBasicMaterial({ color: '#f2f7ff', transparent: true, opacity: 0, depthWrite: false }), []);
  const ref = useRef<THREE.LineSegments>(null!);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const a = weather.amount;
    ref.current.visible = a > 0.02;
    mat.opacity = 0.85 * a;
    if (!ref.current.visible) return;
    const p = player.position;
    const arr = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < N; i++) {
      const d = drops[i];
      d.y -= d.v * dt;
      if (d.y < -1) {
        d.y = H;
        d.x = (Math.random() - 0.5) * BOX;
        d.z = (Math.random() - 0.5) * BOX;
      }
      const x = p.x + d.x;
      const z = p.z + d.z;
      const y = p.y + d.y - 2;
      arr.set([x, y, z, x + 0.04, y + 0.7, z + 0.03], i * 6);
    }
    geo.attributes.position.needsUpdate = true;
  });
  return <lineSegments ref={ref} geometry={geo} material={mat} frustumCulled={false} />;
}

/** a grey veil over the sky while it rains */
function Clouds() {
  // drawn right after the sky dome and before everything else (opaque list, own blending), so it greys only the sky
  const mat = useMemo(() => skyLayer(new THREE.MeshBasicMaterial({ color: '#8d98a6', opacity: 0, side: THREE.BackSide, fog: false })), []);
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    mat.opacity = 0.7 * weather.amount;
    ref.current.visible = weather.amount > 0.01;
  });
  return (
    <mesh ref={ref} material={mat} renderOrder={-4}>
      <sphereGeometry args={[300, 24, 12]} />
    </mesh>
  );
}

function Puddles({ show }: { show: boolean }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7fb4d6', roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0 }), []);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), []);
  const grow = useRef(0);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    grow.current = Math.min(1, grow.current + (show ? dt * 0.08 : 0));
    mat.opacity = 0.78 * grow.current;
    // splash ripples
    const now = performance.now();
    rings.current.forEach((r, i) => {
      if (!r) return;
      const rp = ripples[ripples.length - 1 - i];
      const age = rp ? (now - rp.t) / 1000 : 9;
      r.visible = age < 1;
      if (!rp || age >= 1) return;
      r.position.set(rp.x, terrainHeight(rp.x, rp.z) + 0.04, rp.z);
      r.scale.setScalar(0.3 + age * 1.2);
      (r.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - age);
    });
    if (ripples.length > 20) ripples.splice(0, ripples.length - 4);
  });
  if (!show) return null;
  return (
    <group>
      {PUDDLES.map((q) => (
        <mesh key={q.id} material={mat} position={[q.x, terrainHeight(q.x, q.z) + 0.025, q.z]} rotation={[-Math.PI / 2, 0, q.rot]} scale={[1.25, 0.85, 1]} receiveShadow>
          <circleGeometry args={[q.r, 24]} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (rings.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} material={ringMat.clone()} visible={false}>
          <ringGeometry args={[0.8, 0.9, 32]} />
        </mesh>
      ))}
    </group>
  );
}

/** the big rainbow in the sky: pale bands become bright as their colour drop is found */
function Rainbow({ lit }: { lit: string[] }) {
  const R = 150;
  const T = 14;
  const ref = useRef<THREE.Mesh>(null!);
  const mat = useMemo(
    () =>
      skyLayer(new THREE.ShaderMaterial({
        fog: false,
        uniforms: {
          uColors: { value: RAINBOW.map((c) => new THREE.Color(c.color)) },
          uLit: { value: RAINBOW.map(() => 0.22) },
          uFade: { value: 0 },
          uInner: { value: R - T },
          uWidth: { value: 2 * T },
        },
        vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform vec3 uColors[7]; uniform float uLit[7]; uniform float uFade, uInner, uWidth; varying vec2 vP;
          void main(){
            float k = clamp((length(vP) - uInner) / uWidth, 0.0, 0.999);
            int b = 6 - int(k * 7.0);
            vec3 c = uColors[0]; float lit = uLit[0];
            for (int i = 0; i < 7; i++) { if (i == b) { c = uColors[i]; lit = uLit[i]; } }
            float edge = smoothstep(0.0, 0.08, k) * smoothstep(1.0, 0.92, k);
            gl_FragColor = vec4(mix(vec3(1.0), c, 0.35 + lit * 0.65), (0.18 + lit * 0.62) * edge * uFade);
          }`,
      })),
    [],
  );
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    // far away in the sky to the north, moving along with Anet like the real sky
    ref.current.position.set(player.position.x, player.position.y - 100, player.position.z - 220);
    mat.uniforms.uFade.value = Math.min(1, mat.uniforms.uFade.value + dt * 0.3);

    RAINBOW.forEach((c, i) => {
      const want = lit.includes(c.id) ? 1 : 0.22;
      mat.uniforms.uLit.value[i] += (want - mat.uniforms.uLit.value[i]) * Math.min(1, dt * 2);
    });
  });
  return (
    <mesh ref={ref} material={mat} renderOrder={-5} frustumCulled={false}>
      <torusGeometry args={[R, T, 12, 96, Math.PI]} />
    </mesh>
  );
}

/** a glowing colour drop floating above the grass */
function ColourDrop({ color, x, z }: { color: string; x: number; z: number }) {
  const ref = useRef<THREE.Group>(null!);
  const y = terrainHeight(x, z);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + x;
    ref.current.position.y = y + 1.0 + Math.sin(t * 2) * 0.12;
    ref.current.rotation.y = t;
  });
  return (
    <group position={[x, y, z]}>
      <group ref={ref}>
        <mesh scale={[1, 1.05, 1]}>
          <sphereGeometry args={[0.24, 18, 14]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.15} transparent opacity={0.92} />
        </mesh>
        <mesh position={[0, 0.27, 0]}>
          <coneGeometry args={[0.2, 0.34, 18]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.15} transparent opacity={0.92} />
        </mesh>
        <mesh position={[-0.08, 0.08, 0.17]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.15, 0.35, 6, 12, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Sparkles count={10} scale={[1, 1.4, 1]} position={[0, 1, 0]} size={4} speed={0.6} color={color} />
    </group>
  );
}
