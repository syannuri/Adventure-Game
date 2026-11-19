/**
 * Picnic for the forest friends (World 1). A checked blanket and an empty basket wait in a clearing
 * in the east. Anet finds the food lying around the forest (a soft beam of light marks each one),
 * then the friends come to the picnic. Each guest has a thought bubble showing the food they like:
 * pick a food up from the blanket and give it to the right friend. A wrong food is never a failure:
 * the friend says kindly what they would like instead and the food goes back on the blanket.
 * Grumble joins the picnic too once he is Anet's friend (after his chapter).
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGame, type DialogueLine } from '../../../systems/store';
import { player } from '../../../systems/playerState';
import { getWorldPhysics, type CircleCollider } from '../../../systems/physics';
import { registerInteractable } from '../interaction/interactions';
import { PICNIC, PICNIC_FOOD, terrainHeight } from '../../worlds/EnchantedForest/layout';
import { Rabbit } from '../../characters/npc/Rabbit';
import { Duck } from '../../characters/npc/Duck';
import { Kiki } from '../../characters/npc/Squirrel';
import { Owl } from '../../characters/npc/Owl';
import { Kusut } from '../../characters/npc/Kusut';
import { audio } from '../../audio/audioEngine';
import { spawnBurst } from '../../effects/Bursts';
import { forestDialogue as D } from '../../../data/forestDialogue';
import { ACHIEVEMENTS } from '../../../data/achievements';
import { tr } from '../../../i18n';
import { rewardAcorns } from '../shop/KikiShopQuest';
import { writeSave } from '../../../systems/save';

type Food = 'carrot' | 'bread' | 'walnut' | 'apple' | 'honey';
interface Guest {
  id: string;
  speaker: DialogueLine['speaker'];
  food: Food;
  /** angle around the blanket (0 = south, toward where Anet comes from) */
  a: number;
}
const ALL_GUESTS: Guest[] = [
  { id: 'rabbit', speaker: 'pip', food: 'carrot', a: 1.25 },
  { id: 'duck', speaker: 'duck', food: 'bread', a: 2.15 },
  { id: 'owl', speaker: 'olli', food: 'apple', a: Math.PI },
  { id: 'squirrel', speaker: 'kiki', food: 'walnut', a: 4.1 },
  { id: 'kusut', speaker: 'kusut', food: 'honey', a: 5.0 },
];
const SEAT_R = 2.0;
const GY = terrainHeight(PICNIC.x, PICNIC.z);
const seat = (g: Guest) => ({ x: PICNIC.x + Math.sin(g.a) * SEAT_R, z: PICNIC.z + Math.cos(g.a) * SEAT_R });
/** where each food lies on the blanket */
const plate = (i: number, n: number) => {
  const a = (i / n) * Math.PI * 2 + 0.4;
  return { x: PICNIC.x + Math.sin(a) * 0.62, z: PICNIC.z + Math.cos(a) * 0.62 };
};

/** Grumble only comes once he is a friend */
const guests = () => ALL_GUESTS.filter((g) => g.id !== 'kusut' || useGame.getState().save.achievements.includes('kusut_friend'));
const foods = () => guests().map((g) => g.food);
const picnic = () => useGame.getState().level.picnic;
const setPicnic = (p: Partial<ReturnType<typeof picnic>>) => useGame.setState((s) => ({ level: { ...s.level, picnic: { ...s.level.picnic, ...p }, lastProgressAt: performance.now() } }));

function toast(title: string, text: string, icon: string) {
  useGame.setState((s) => ({ toasts: [...s.toasts, { id: Date.now() + Math.random(), title, text, icon }] }));
  const id = useGame.getState().toasts.at(-1)!.id;
  window.setTimeout(() => useGame.getState().dismissToast(id), 2400);
}

export function picnicStatus() {
  const p = picnic();
  const t = tr().picnic;
  if (p.stage === 'collect') return '🧺 ' + t.foodCount(p.foods.length, foods().length);
  if (p.stage === 'serve') return '🧺 ' + t.fedCount(p.served.length, guests().length);
  return null;
}

function giveTo(g: Guest) {
  const st = useGame.getState();
  const p = picnic();
  const s = seat(g);
  player.lookAt = s;
  if (!p.holding) {
    st.openDialogue([{ speaker: g.speaker, text: D().picnicWant[g.food] }]);
    return;
  }
  const food = p.holding as Food;
  if (food !== g.food) {
    setPicnic({ holding: null });
    audio.sfx('pop', { pitch: 0.8 });
    st.openDialogue([{ speaker: g.speaker, text: D().picnicWrong(tr().picnic.foods[food], D().picnicWant[g.food]) }]);
    return;
  }
  const served = [...p.served, g.id];
  setPicnic({ holding: null, served });
  audio.sfx('star', { pitch: 1 + served.length * 0.08 });
  spawnBurst(s.x, GY + 1.0, s.z, '#ff8fb3', 30, { speed: 2 });
  st.playEmote('collect', 1);
  toast(tr().picnic.fed, tr().picnic.fedCount(served.length, guests().length), '♥');
  if (served.length >= guests().length) window.setTimeout(party, 700);
  else st.openDialogue([{ speaker: g.speaker, text: D().picnicThanks[g.food] }]);
}

function party() {
  const g = useGame.getState();
  setPicnic({ stage: 'done' });
  g.playEmote('dance', 4);
  audio.sfx('achievement');
  g.unlockAchievement('picnic_host', ACHIEVEMENTS.picnic_host.title, ACHIEVEMENTS.picnic_host.icon);
  const colors = ['#ff8fb3', '#ffd23f', '#9df07a', '#7fd6ff', '#c9a7ff'];
  let n = 0;
  const iv = window.setInterval(() => {
    const a = Math.random() * Math.PI * 2;
    spawnBurst(PICNIC.x + Math.cos(a) * 2.5, GY + 1.5 + Math.random() * 2, PICNIC.z + Math.sin(a) * 2.5, colors[n % colors.length], 24, { speed: 2.4 });
    if (++n > 14) window.clearInterval(iv);
  }, 220);
  if (!g.save.picnicDone) {
    const save = { ...useGame.getState().save, picnicDone: true };
    writeSave(save);
    useGame.setState({ save });
    rewardAcorns(5);
  }
  g.openDialogue(D().picnicParty);
}

export function PicnicQuest() {
  const stage = useGame((s) => s.level.picnic.stage);
  const collected = useGame((s) => s.level.picnic.foods);
  const served = useGame((s) => s.level.picnic.served);
  const holding = useGame((s) => s.level.picnic.holding);
  const friend = useGame((s) => s.save.achievements.includes('kusut_friend'));
  const held = useRef<THREE.Group>(null!);
  const list = useMemo(() => ALL_GUESTS.filter((g) => g.id !== 'kusut' || friend), [friend]);
  const foodList = list.map((g) => g.food);

  // the guests are solid while they sit round the blanket
  useEffect(() => {
    if (stage !== 'serve' && stage !== 'done') return;
    const w = getWorldPhysics();
    const cols: CircleCollider[] = list.map((g) => ({ ...seat(g), r: g.id === 'owl' ? 0.55 : 0.35 }));
    w.colliders.push(...cols);
    return () => {
      w.colliders = w.colliders.filter((c) => !cols.includes(c));
    };
  }, [stage, list]);

  useEffect(() => {
    const offs = [
      ...ALL_GUESTS.map((g) =>
        registerInteractable({
          id: `picnic-${g.id}`,
          x: seat(g).x,
          z: seat(g).z,
          radius: 1.5,
          approach: 1.0,
          label: () => {
            const h = picnic().holding as Food | null;
            const name = tr().dialogue.speakers[g.speaker];
            return h ? tr().picnic.give(tr().picnic.foods[h], name) : tr().picnic.ask(name);
          },
          verb: 'talk',
          enabled: () => picnic().stage === 'serve' && !picnic().served.includes(g.id) && guests().includes(g),
          onInteract: () => giveTo(g),
        }),
      ),
      ...foods().map((food, i, fs) =>
        registerInteractable({
          id: `picnic-food-${food}`,
          ...plate(i, fs.length),
          radius: 0.75,
          approach: 0.3,
          label: () => tr().picnic.take(tr().picnic.foods[food]),
          verb: 'take',
          enabled: () => {
            const p = picnic();
            return p.stage === 'serve' && !p.holding && !p.served.some((id) => ALL_GUESTS.find((x) => x.id === id)?.food === food);
          },
          onInteract: () => {
            setPicnic({ holding: food });
            audio.sfx('pop', { pitch: 1.2 });
            useGame.getState().playEmote('collect', 1);
          },
        }),
      ),
    ];
    return () => offs.forEach((f) => f());
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const g = useGame.getState();
    const p = player.position;
    // the food Anet carries floats above her head
    held.current.visible = !!g.level.picnic.holding;
    held.current.position.set(p.x, p.y + 2.05 + Math.sin(t * 3) * 0.05, p.z);
    held.current.rotation.y = t * 1.5;
    if (g.paused || g.dialogue || g.cinematic || g.screen !== 'playing') return;
    const pc = g.level.picnic;
    const dBlanket = Math.hypot(p.x - PICNIC.x, p.z - PICNIC.z);
    if (pc.stage === 'none' && dBlanket < 4.5) {
      setPicnic({ stage: 'collect' });
      g.openDialogue(D().picnicIntro(foods().map((f) => tr().picnic.foods[f])));
      return;
    }
    if (pc.stage === 'collect') {
      for (const f of PICNIC_FOOD) {
        if (!foods().includes(f.id as Food) || pc.foods.includes(f.id)) continue;
        if (Math.hypot(p.x - f.x, p.z - f.z) < 1.1) {
          const got = [...pc.foods, f.id];
          setPicnic({ foods: got });
          audio.sfx('coin', { pitch: 1.1 });
          spawnBurst(f.x, terrainHeight(f.x, f.z) + 0.6, f.z, '#fff3a0', 24, { speed: 2 });
          g.playEmote('collect', 1);
          toast(tr().picnic.found(tr().picnic.foods[f.id]), tr().picnic.foodCount(got.length, foods().length), '🧺');
          if (got.length >= foods().length) g.openDialogue(D().picnicAllFood);
          return;
        }
      }
      if (pc.foods.length >= foods().length && dBlanket < 4) {
        setPicnic({ stage: 'serve' });
        audio.sfx('magic');
        guests().forEach((gu, i) => window.setTimeout(() => spawnBurst(seat(gu).x, GY + 0.8, seat(gu).z, '#c9a7ff', 20, { speed: 2 }), i * 150));
        g.openDialogue(D().picnicGuests);
      }
    }
  });

  return (
    <group>
      <Blanket />
      {/* food lying around the forest, marked with a soft beam of light */}
      {stage === 'collect' &&
        PICNIC_FOOD.filter((f) => foodList.includes(f.id as Food) && !collected.includes(f.id)).map((f) => (
          <group key={f.id} position={[f.x, terrainHeight(f.x, f.z), f.z]}>
            <Bob>
              <FoodModel food={f.id as Food} scale={1.6} />
            </Bob>
            <mesh position={[0, 3, 0]}>
              <cylinderGeometry args={[0.18, 0.4, 6, 12, 1, true]} />
              <meshBasicMaterial color="#fff3a0" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            <Sparkles count={10} scale={[1, 1.2, 1]} position={[0, 0.6, 0]} size={4} speed={0.6} color="#fff3a0" />
          </group>
        ))}
      {/* food on the blanket, ready to serve */}
      {(stage === 'serve' || stage === 'done') &&
        foodList.map((f, i) => {
          const eaten = served.some((id) => list.find((g) => g.id === id)?.food === f);
          if (holding === f) return null;
          const at = eaten ? seat(list.find((g) => g.food === f)!) : plate(i, foodList.length);
          return (
            <group key={f} position={[eaten ? PICNIC.x + (at.x - PICNIC.x) * 0.72 : at.x, GY + 0.06, eaten ? PICNIC.z + (at.z - PICNIC.z) * 0.72 : at.z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
                <circleGeometry args={[0.2, 20]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <FoodModel food={f} />
            </group>
          );
        })}
      {(stage === 'serve' || stage === 'done') && list.map((g) => <GuestSeat key={g.id} guest={g} fed={served.includes(g.id)} party={stage === 'done'} />)}
      <group ref={held} visible={false}>
        {holding && <FoodModel food={holding as Food} scale={1.6} />}
      </group>
    </group>
  );
}


// ------------------------------------------------------------------------------------- visuals

function Bob({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    ref.current.position.y = 0.45 + Math.sin(clock.elapsedTime * 2) * 0.1;
    ref.current.rotation.y = clock.elapsedTime;
  });
  return <group ref={ref}>{children}</group>;
}

function Blanket() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        g.fillStyle = (x + y) % 2 ? '#ffffff' : '#ff6f7d';
        g.fillRect(x * 8, y * 8, 8, 8);
      }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    return t;
  }, []);
  return (
    <group position={[PICNIC.x, GY, PICNIC.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0.2]} position={[0, 0.03, 0]} receiveShadow>
        <planeGeometry args={[2.7, 2.7]} />
        <meshStandardMaterial map={tex} roughness={0.95} />
      </mesh>
      {/* the basket */}
      <group position={[0.75, 0, -0.75]}>
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.2, 0.3, 14, 1, true]} />
          <meshStandardMaterial color="#c9915a" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.02, 14]} />
          <meshStandardMaterial color="#b07a45" />
        </mesh>
        <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.22, 0.025, 6, 20, Math.PI]} />
          <meshStandardMaterial color="#a8703f" />
        </mesh>
      </group>
    </group>
  );
}

function FoodModel({ food, scale = 1 }: { food: Food; scale?: number }) {
  switch (food) {
    case 'carrot':
      return (
        <group scale={scale} rotation={[0, 0, 1.2]} position={[0, 0.07, 0]}>
          <mesh position={[0, -0.05, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.06, 0.28, 10]} />
            <meshStandardMaterial color="#ff8a2a" roughness={0.6} />
          </mesh>
          {[-0.4, 0, 0.4].map((a) => (
            <mesh key={a} position={[Math.sin(a) * 0.03, 0.13, 0]} rotation={[0, 0, a]}>
              <coneGeometry args={[0.02, 0.14, 5]} />
              <meshStandardMaterial color="#4fae4a" />
            </mesh>
          ))}
        </group>
      );
    case 'bread':
      return (
        <group scale={scale} position={[0, 0.07 * scale, 0]}>
          <mesh scale={[0.2, 0.09, 0.11]} castShadow>
            <sphereGeometry args={[1, 16, 10]} />
            <meshStandardMaterial color="#d79a55" roughness={0.8} />
          </mesh>
          {[-0.08, 0, 0.08].map((x) => (
            <mesh key={x} position={[x, 0.075, 0]} rotation={[0, 0, 0.4]} scale={[0.012, 0.012, 0.07]}>
              <sphereGeometry args={[1, 6, 4]} />
              <meshStandardMaterial color="#f3d2a0" />
            </mesh>
          ))}
        </group>
      );
    case 'walnut':
      return (
        <group scale={scale} position={[0, 0.09 * scale, 0]}>
          <mesh scale={[1, 0.92, 1.1]} castShadow>
            <icosahedronGeometry args={[0.09, 1]} />
            <meshStandardMaterial color="#9a6a3e" roughness={0.9} flatShading />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.088, 0.01, 6, 16]} />
            <meshStandardMaterial color="#6e4526" />
          </mesh>
        </group>
      );
    case 'apple':
      return (
        <group scale={scale} position={[0, 0.11 * scale, 0]}>
          <mesh scale={[1, 0.92, 1]} castShadow>
            <sphereGeometry args={[0.11, 16, 12]} />
            <meshStandardMaterial color="#e83a3a" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.008, 0.01, 0.06, 5]} />
            <meshStandardMaterial color="#6e4526" />
          </mesh>
          <mesh position={[0.04, 0.13, 0]} rotation={[0, 0, -0.8]} scale={[0.045, 0.012, 0.025]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#4fae4a" />
          </mesh>
        </group>
      );
    case 'honey':
      return (
        <group scale={scale} position={[0, 0.1 * scale, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.1, 0.18, 14]} />
            <meshStandardMaterial color="#ffb928" emissive="#c77a00" emissiveIntensity={0.25} roughness={0.25} transparent opacity={0.92} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.04, 14]} />
            <meshStandardMaterial color="#ff6f7d" />
          </mesh>
        </group>
      );
  }
}

/** a friend sitting at the blanket with a thought bubble showing the food they like */
function GuestSeat({ guest, fed, party }: { guest: Guest; fed: boolean; party: boolean }) {
  const s = seat(guest);
  const y = terrainHeight(s.x, s.z);
  const face = Math.atan2(PICNIC.x - s.x, PICNIC.z - s.z);
  const bubble = useRef<THREE.Group>(null!);
  const hop = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + guest.a;
    bubble.current.position.y = 1.75 + Math.sin(t * 2) * 0.06;
    hop.current.position.y = party ? Math.abs(Math.sin(t * 5)) * 0.25 : fed ? Math.abs(Math.sin(t * 3)) * 0.05 : 0;
  });
  return (
    <group position={[s.x, y, s.z]}>
      <group ref={hop} rotation={[0, face, 0]}>
        {guest.id === 'rabbit' && <Rabbit x={0} y={0} z={0} npc={false} controlled />}
        {guest.id === 'duck' && <Duck scale={1.4} />}
        {guest.id === 'squirrel' && <Kiki wx={s.x} wz={s.z} rot={face} />}
        {guest.id === 'owl' && <Owl x={0} y={-0.25} z={0} />}
        {guest.id === 'kusut' && <Kusut happy scale={0.75} />}
      </group>
      <group ref={bubble}>
        {fed ? null : (
          <>
            <mesh scale={[0.42, 0.34, 0.2]}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.6} />
            </mesh>
            <mesh position={[0.15, -0.42, 0]}>
              <sphereGeometry args={[0.07, 10, 8]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <group position={[0, -0.1, 0.16]}>
              <FoodModel food={guest.food} scale={1.4} />
            </group>
          </>
        )}
        {fed && <Sparkles count={8} scale={[0.8, 0.6, 0.8]} size={5} speed={0.6} color="#ff8fb3" />}
      </group>
    </group>
  );
}
