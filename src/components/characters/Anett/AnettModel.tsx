/**
 * Anett – procedural stylized 3D character.
 *
 * PLACEHOLDER NOTICE: this is a code-generated model (Three.js primitives with a joint hierarchy)
 * used until a sculpted & rigged GLB (Blender / Mixamo pipeline) is available. It follows the
 * character sheet exactly: straight shiny black hair with bangs, fair skin, big dark-brown eyes,
 * yellow adventure jacket, white T-shirt, denim shorts, colorful sneakers and a pink backpack.
 *
 * The joint groups (hips, spine, neck, shoulders, elbows, legs, knees) form a skeleton that
 * AnettAnimations drives procedurally. Never change proportions/colours between scenes:
 * all instances use the same component and the same palette below.
 */
import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

export const ANETT_PALETTE = {
  skin: '#f7d9c8',
  skinShade: '#efc1ac',
  hair: '#15121a',
  eyeIris: '#4a2a17',
  jacket: '#f7c531',
  jacketTrim: '#e9a91c',
  shirt: '#fbfbf7',
  denim: '#4f7fc4',
  denimDark: '#3d679f',
  shoe: '#ff6f91',
  shoeAccent: '#3fd0c9',
  sole: '#ffffff',
  backpack: '#ff92bd',
  backpackDark: '#e46f9d',
  cheek: '#ff9aaa',
  mouth: '#b4485c',
};

export interface AnettRig {
  root: THREE.Group;
  body: THREE.Group;
  hips: THREE.Group;
  spine: THREE.Group;
  neck: THREE.Group;
  shoulderL: THREE.Group;
  elbowL: THREE.Group;
  shoulderR: THREE.Group;
  elbowR: THREE.Group;
  legL: THREE.Group;
  kneeL: THREE.Group;
  legR: THREE.Group;
  kneeR: THREE.Group;
  eyeL: THREE.Group;
  eyeR: THREE.Group;
  mouthSmile: THREE.Mesh;
  mouthOpen: THREE.Mesh;
  hairBack: THREE.Group;
}

function useMaterials() {
  return useMemo(() => {
    const P = ANETT_PALETTE;
    const std = (color: string, roughness = 0.7, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
      new THREE.MeshPhysicalMaterial({ color, roughness, metalness: 0, ...extra });
    return {
      skin: std(P.skin, 0.55, { sheen: 0.4, sheenColor: new THREE.Color('#ffd6c9'), sheenRoughness: 0.6 }),
      skinShade: std(P.skinShade, 0.6),
      hair: std(P.hair, 0.42, { clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 1, sheenColor: new THREE.Color('#5a5478'), sheenRoughness: 0.45, side: THREE.DoubleSide }),
      eyeWhite: std('#ffffff', 0.15, { clearcoat: 1 }),
      iris: std(P.eyeIris, 0.2, { clearcoat: 1 }),
      pupil: std('#0b0706', 0.1, { clearcoat: 1 }),
      highlight: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      lash: std('#120e12', 0.6),
      jacket: std(P.jacket, 0.62, { sheen: 0.5, sheenColor: new THREE.Color('#fff2b0') }),
      jacketTrim: std(P.jacketTrim, 0.7),
      shirt: std(P.shirt, 0.8),
      denim: std(P.denim, 0.85, { sheen: 0.3, sheenColor: new THREE.Color('#9cc0ff') }),
      denimDark: std(P.denimDark, 0.85),
      shoe: std(P.shoe, 0.5, { clearcoat: 0.4 }),
      shoeAccent: std(P.shoeAccent, 0.5),
      sole: std(P.sole, 0.6),
      sock: std('#ffffff', 0.85),
      backpack: std(P.backpack, 0.6, { sheen: 0.5, sheenColor: new THREE.Color('#ffd1e4') }),
      backpackDark: std(P.backpackDark, 0.65),
      cheek: new THREE.MeshBasicMaterial({ color: P.cheek, transparent: true, opacity: 0.45, depthWrite: false }),
      mouth: std(P.mouth, 0.5),
      mouthInner: std('#7a2234', 0.6),
    };
  }, []);
}

const capsule = (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 6, 16);

/** Adds fine vertical ridges around the Y axis so straight hair reads as strands, not a helmet. */
function strands<T extends THREE.BufferGeometry>(g: T, count = 22, depth = 0.022): T {
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const a = Math.atan2(x, z);
    const k = 1 + Math.sin(a * count) * depth + Math.sin(a * count * 2.3 + 1) * depth * 0.4;
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}

export interface AnettModelProps {
  scale?: number;
  /** Optional object held in the right hand (e.g. the magic wand). */
  rightHandItem?: React.ReactNode;
}

export const AnettModel = forwardRef<AnettRig, AnettModelProps>(function AnettModel({ scale = 1, rightHandItem }, ref) {
  const m = useMaterials();
  const r = {
    root: useRef<THREE.Group>(null!),
    body: useRef<THREE.Group>(null!),
    hips: useRef<THREE.Group>(null!),
    spine: useRef<THREE.Group>(null!),
    neck: useRef<THREE.Group>(null!),
    shoulderL: useRef<THREE.Group>(null!),
    elbowL: useRef<THREE.Group>(null!),
    shoulderR: useRef<THREE.Group>(null!),
    elbowR: useRef<THREE.Group>(null!),
    legL: useRef<THREE.Group>(null!),
    kneeL: useRef<THREE.Group>(null!),
    legR: useRef<THREE.Group>(null!),
    kneeR: useRef<THREE.Group>(null!),
    eyeL: useRef<THREE.Group>(null!),
    eyeR: useRef<THREE.Group>(null!),
    mouthSmile: useRef<THREE.Mesh>(null!),
    mouthOpen: useRef<THREE.Mesh>(null!),
    hairBack: useRef<THREE.Group>(null!),
  };

  useImperativeHandle(ref, () => {
    const out = {} as Record<string, unknown>;
    for (const [k, v] of Object.entries(r)) out[k] = v.current;
    return out as unknown as AnettRig;
  });

  const geo = useMemo(
    () => ({
      head: new THREE.SphereGeometry(0.25, 40, 32),
      hairCap: strands(new THREE.SphereGeometry(0.268, 72, 24, 0, Math.PI * 2, 0, 1.25), 26, 0.012),
      hairBackShell: strands(new THREE.SphereGeometry(0.275, 72, 28, Math.PI - 0.45, Math.PI + 0.9, 0.2, 2.15), 26, 0.016),
      bangs: strands(new THREE.SphereGeometry(0.274, 60, 16, Math.PI / 2 - 0.95, 1.9, 0.18, 1.12), 34, 0.01),
      hairLong: strands(new THREE.CylinderGeometry(0.262, 0.278, 0.3, 72, 4, true, Math.PI / 2 - 0.4, Math.PI + 0.8), 26, 0.02),
      eyeWhite: new THREE.SphereGeometry(0.058, 24, 18),
      iris: new THREE.SphereGeometry(0.043, 24, 18),
      pupil: new THREE.SphereGeometry(0.022, 16, 12),
      hl: new THREE.SphereGeometry(0.012, 10, 8),
      smile: new THREE.TorusGeometry(0.042, 0.009, 8, 24, Math.PI),
    }),
    [],
  );

  useLayoutEffect(() => {
    r.root.current.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && mesh.material !== m.cheek && mesh.material !== m.highlight) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    // stylized look: the face never receives self-shadow from hair / bangs
    r.neck.current.traverse((o) => {
      (o as THREE.Mesh).receiveShadow = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Eye = ({ side, eref }: { side: 1 | -1; eref: React.RefObject<THREE.Group> }) => (
    <group ref={eref} position={[0.092 * side, 0.205, 0.198]} rotation={[0, 0.32 * side, 0]}>
      <mesh geometry={geo.eyeWhite} material={m.eyeWhite} scale={[1, 1.18, 0.55]} />
      <mesh geometry={geo.iris} material={m.iris} position={[0, -0.004, 0.022]} scale={[1, 1.12, 0.45]} />
      <mesh geometry={geo.pupil} material={m.pupil} position={[0, -0.004, 0.036]} scale={[1, 1.1, 0.4]} />
      <mesh geometry={geo.hl} material={m.highlight} position={[0.016 * side, 0.024, 0.044]} />
      <mesh geometry={geo.hl} material={m.highlight} position={[-0.012 * side, -0.02, 0.043]} scale={0.55} />
      {/* upper lash line */}
      <mesh material={m.lash} position={[0.004 * side, 0.066, 0.012]} rotation={[0.25, 0, -0.18 * side]}>
        <boxGeometry args={[0.105, 0.012, 0.02]} />
      </mesh>
      <mesh material={m.lash} position={[0.055 * side, 0.058, 0.006]} rotation={[0, 0, -0.75 * side]}>
        <boxGeometry args={[0.03, 0.008, 0.012]} />
      </mesh>
    </group>
  );

  const Arm = ({ side, sref, eref, item }: { side: 1 | -1; sref: React.RefObject<THREE.Group>; eref: React.RefObject<THREE.Group>; item?: React.ReactNode }) => (
    <group ref={sref} position={[0.168 * side, 0.285, 0]}>
      <mesh geometry={capsule(0.054, 0.1)} material={m.jacket} position={[0, -0.075, 0]} />
      <group ref={eref} position={[0, -0.165, 0]}>
        <mesh material={m.jacketTrim} position={[0, 0.012, 0]}>
          <torusGeometry args={[0.046, 0.014, 8, 18]} />
        </mesh>
        <mesh geometry={capsule(0.04, 0.085)} material={m.skin} position={[0, -0.065, 0]} />
        <mesh material={m.skin} position={[0, -0.14, 0.008]} scale={[0.9, 1.05, 0.85]}>
          <sphereGeometry args={[0.048, 16, 12]} />
        </mesh>
        {item && <group position={[0, -0.15, 0.03]}>{item}</group>}
      </group>
    </group>
  );

  const Leg = ({ side, lref, kref }: { side: 1 | -1; lref: React.RefObject<THREE.Group>; kref: React.RefObject<THREE.Group> }) => (
    <group ref={lref} position={[0.078 * side, -0.02, 0]}>
      <mesh material={m.denim} position={[0, -0.045, 0]}>
        <cylinderGeometry args={[0.078, 0.074, 0.11, 18]} />
      </mesh>
      <mesh geometry={capsule(0.055, 0.12)} material={m.skin} position={[0, -0.12, 0]} />
      <group ref={kref} position={[0, -0.225, 0]}>
        <mesh geometry={capsule(0.05, 0.12)} material={m.skin} position={[0, -0.08, 0]} />
        <mesh material={m.sock} position={[0, -0.17, 0]}>
          <cylinderGeometry args={[0.054, 0.05, 0.05, 16]} />
        </mesh>
        <group position={[0, -0.225, 0.035]}>
          <RoundedBox args={[0.125, 0.085, 0.2]} radius={0.04} smoothness={4} material={m.shoe} />
          <RoundedBox args={[0.132, 0.03, 0.212]} radius={0.014} smoothness={3} material={m.sole} position={[0, -0.036, 0.002]} />
          <mesh material={m.shoeAccent} position={[0.064 * side, 0.004, -0.01]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.034, 0.009, 8, 16, Math.PI]} />
          </mesh>
          <mesh material={m.sole} position={[0, 0.044, 0.04]}>
            <boxGeometry args={[0.06, 0.008, 0.07]} />
          </mesh>
        </group>
      </group>
    </group>
  );

  return (
    <group ref={r.root} scale={scale}>
      <group ref={r.body}>
        <group ref={r.hips} position={[0, 0.535, 0]}>
          {/* denim shorts */}
          <mesh material={m.denim} position={[0, -0.005, 0]}>
            <cylinderGeometry args={[0.148, 0.165, 0.15, 24]} />
          </mesh>
          <mesh material={m.denimDark} position={[0, 0.07, 0]}>
            <torusGeometry args={[0.148, 0.012, 8, 28]} />
          </mesh>
          <Leg side={1} lref={r.legL} kref={r.kneeL} />
          <Leg side={-1} lref={r.legR} kref={r.kneeR} />

          <group ref={r.spine} position={[0, 0.06, 0]}>
            {/* jacket body */}
            <mesh geometry={capsule(0.155, 0.15)} material={m.jacket} position={[0, 0.16, 0]} scale={[1, 1, 0.86]} />
            <mesh material={m.jacketTrim} position={[0, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.86, 1]}>
              <torusGeometry args={[0.152, 0.022, 10, 32]} />
            </mesh>
            {/* white T-shirt visible through the open jacket */}
            <RoundedBox args={[0.11, 0.2, 0.04]} radius={0.018} smoothness={3} material={m.shirt} position={[0, 0.17, 0.118]} />
            {/* jacket lapels */}
            <RoundedBox args={[0.035, 0.22, 0.03]} radius={0.012} smoothness={3} material={m.jacketTrim} position={[0.062, 0.165, 0.127]} rotation={[0, 0, -0.05]} />
            <RoundedBox args={[0.035, 0.22, 0.03]} radius={0.012} smoothness={3} material={m.jacketTrim} position={[-0.062, 0.165, 0.127]} rotation={[0, 0, 0.05]} />
            <mesh material={m.jacketTrim} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.08, 0.026, 10, 24]} />
            </mesh>
            {/* pockets */}
            <RoundedBox args={[0.06, 0.04, 0.02]} radius={0.01} material={m.jacketTrim} position={[0.1, 0.09, 0.115]} rotation={[0, 0.5, 0]} />
            <RoundedBox args={[0.06, 0.04, 0.02]} radius={0.01} material={m.jacketTrim} position={[-0.1, 0.09, 0.115]} rotation={[0, -0.5, 0]} />

            {/* pink adventure backpack */}
            <group position={[0, 0.17, -0.165]}>
              <RoundedBox args={[0.23, 0.25, 0.11]} radius={0.045} smoothness={4} material={m.backpack} />
              <RoundedBox args={[0.235, 0.09, 0.12]} radius={0.04} smoothness={3} material={m.backpackDark} position={[0, 0.085, -0.006]} />
              <RoundedBox args={[0.14, 0.09, 0.04]} radius={0.02} smoothness={3} material={m.backpackDark} position={[0, -0.045, -0.06]} />
              <mesh material={m.shoeAccent} position={[0, -0.02, -0.082]}>
                <sphereGeometry args={[0.014, 10, 8]} />
              </mesh>
            </group>
            {[1, -1].map((s) => (
              <mesh key={s} material={m.backpackDark} position={[0.085 * s, 0.215, -0.01]} rotation={[0, Math.PI / 2, 0]} scale={[1, 1.05, 1]}>
                <torusGeometry args={[0.158, 0.014, 6, 20, Math.PI]} />
              </mesh>
            ))}

            <Arm side={1} sref={r.shoulderL} eref={r.elbowL} />
            <Arm side={-1} sref={r.shoulderR} eref={r.elbowR} item={rightHandItem} />

            {/* neck + head */}
            <group ref={r.neck} position={[0, 0.315, 0]}>
              <mesh material={m.skin} position={[0, 0.02, 0]}>
                <cylinderGeometry args={[0.045, 0.05, 0.07, 14]} />
              </mesh>
              <group position={[0, 0.04, 0]}>
                <mesh geometry={geo.head} material={m.skin} position={[0, 0.22, 0]} scale={[1, 0.96, 0.95]} />
                {/* ears */}
                {[1, -1].map((s) => (
                  <mesh key={s} material={m.skinShade} position={[0.243 * s, 0.2, -0.01]} scale={[0.5, 1, 0.8]}>
                    <sphereGeometry args={[0.05, 14, 10]} />
                  </mesh>
                ))}
                <Eye side={1} eref={r.eyeL} />
                <Eye side={-1} eref={r.eyeR} />
                {/* eyebrows */}
                {[1, -1].map((s) => (
                  <mesh key={s} material={m.lash} position={[0.092 * s, 0.305, 0.215]} rotation={[0.2, 0.3 * s, 0.12 * s]}>
                    <capsuleGeometry args={[0.008, 0.05, 4, 8]} />
                  </mesh>
                ))}
                {/* nose */}
                <mesh material={m.skinShade} position={[0, 0.15, 0.24]} scale={[1.2, 0.9, 1]}>
                  <sphereGeometry args={[0.018, 12, 10]} />
                </mesh>
                {/* mouth */}
                <mesh ref={r.mouthSmile} geometry={geo.smile} material={m.mouth} position={[0, 0.098, 0.228]} rotation={[0.25, 0, Math.PI]} />
                <mesh ref={r.mouthOpen} material={m.mouthInner} position={[0, 0.094, 0.226]} scale={[1, 0.8, 0.45]} visible={false}>
                  <sphereGeometry args={[0.036, 16, 12]} />
                </mesh>
                {/* cheeks */}
                {[1, -1].map((s) => (
                  <mesh key={s} material={m.cheek} position={[0.152 * s, 0.12, 0.185]} rotation={[0, 0.65 * s, 0]} scale={[1.2, 0.8, 0.2]}>
                    <sphereGeometry args={[0.04, 16, 10]} />
                  </mesh>
                ))}

                {/* straight shiny black hair */}
                <mesh geometry={geo.hairCap} material={m.hair} position={[0, 0.235, -0.008]} />
                <mesh geometry={geo.bangs} material={m.hair} position={[0, 0.232, 0.004]} />
                <group ref={r.hairBack}>
                  <mesh geometry={geo.hairBackShell} material={m.hair} position={[0, 0.225, -0.012]} />
                  <mesh geometry={geo.hairLong} material={m.hair} position={[0, 0.1, -0.02]} scale={[1, 1, 0.9]} />
                  <mesh material={m.hair} position={[0, -0.045, -0.035]} rotation={[Math.PI / 2, 0, Math.PI]} scale={[1.08, 0.62, 1]}>
                    <torusGeometry args={[0.245, 0.026, 6, 30, Math.PI]} />
                  </mesh>
                </group>
                {/* side strands framing the face */}
                {[1, -1].map((s) => (
                  <mesh key={s} material={m.hair} position={[0.215 * s, 0.1, 0.07]} rotation={[0.08, 0, 0.05 * s]} scale={[0.75, 1, 0.9]}>
                    <capsuleGeometry args={[0.05, 0.22, 4, 12]} />
                  </mesh>
                ))}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});
