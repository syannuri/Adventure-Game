// Step 2: automatic skinning of the prepared Anet mesh to the game's joint rig.
// Writes JOINTS_0 / WEIGHTS_0, compresses (meshopt + webp) and emits the rig data (rest pose) as JSON.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { prune, dedup, textureCompress, reorder, quantize, simplify, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
import * as THREE from 'three';

const [, , inp, out, jsonOut, ratioArg] = process.argv;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---- joint positions measured on the mesh (rest pose of the sculpt)
const LM = JSON.parse(fs.readFileSync(process.env.LANDMARKS, 'utf8'));
const M = Object.fromEntries(Object.entries(LM.joints).map(([k, v]) => [k, V(...v)]));
const SPLIT_X = LM.splitX ?? 0;
const JOINTS = ['hips', 'spine', 'neck', 'shoulderL', 'elbowL', 'shoulderR', 'elbowR', 'legL', 'kneeL', 'legR', 'kneeR'];
const PARENT = { hips: null, spine: 'hips', neck: 'spine', shoulderL: 'spine', elbowL: 'shoulderL', shoulderR: 'spine', elbowR: 'shoulderR', legL: 'hips', kneeL: 'legL', legR: 'hips', kneeR: 'legR' };
const J = Object.fromEntries(JOINTS.map((j, i) => [j, i]));
// limb end points (child joint of each limb bone, in the sculpt)
const END = { shoulderL: 'elbowL', elbowL: 'wristL', shoulderR: 'elbowR', elbowR: 'wristR', legL: 'kneeL', kneeL: 'ankleL', legR: 'kneeR', kneeR: 'ankleR' };
// canonical (game rest pose) limb directions: arms hang down with a small outward angle, legs straight down
const CAN_DIR = {
  shoulderL: V(0.16, -1, 0).normalize(), elbowL: V(0.16, -1, 0).normalize(),
  shoulderR: V(-0.16, -1, 0).normalize(), elbowR: V(-0.16, -1, 0).normalize(),
  legL: V(0, -1, 0), kneeL: V(0, -1, 0), legR: V(0, -1, 0), kneeR: V(0, -1, 0),
};
// canonical joint positions + correction rotations (sculpt limb direction -> canonical)
const CAN = {}, CORR = {};
for (const j of JOINTS) {
  const par = PARENT[j];
  if (!par) CAN[j] = M[j].clone();
  else if (END[par] === j) {
    const len = M[j].distanceTo(M[par]);
    CAN[j] = CAN[par].clone().addScaledVector(CAN_DIR[par], len);
  } else CAN[j] = CAN[par].clone().add(M[j].clone().sub(M[par]));
  CORR[j] = END[j] ? new THREE.Quaternion().setFromUnitVectors(M[END[j]].clone().sub(M[j]).normalize(), CAN_DIR[j]) : new THREE.Quaternion();
}
// boneInverse = inverse(T(Mpos) * R^-1): maps sculpt space -> bone space of the canonical pose
const boneInverses = JOINTS.map((j) => {
  const m = new THREE.Matrix4().compose(M[j], CORR[j].clone().invert(), V(1, 1, 1));
  return m.invert().toArray();
});
const local = JOINTS.map((j) => (PARENT[j] ? CAN[j].clone().sub(CAN[PARENT[j]]).toArray() : CAN[j].toArray()));
const forearmR = M.handR.distanceTo(M.elbowR);

// ---- geometry helpers
const segT = (p, a, b) => {
  const ab = b.clone().sub(a);
  const t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq()));
  return { t, d: p.distanceTo(a.clone().addScaledVector(ab, t)) };
};
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hsv = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; } h = (h * 60 + 360) % 360; return [h, mx ? d / mx : 0, mx]; };

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const doc = await io.read(inp);
if (ratioArg) await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: Number(ratioArg), error: 0.001, lockBorder: true }));
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const pos = prim.getAttribute('POSITION');
const uv = prim.getAttribute('TEXCOORD_0');
const tex = doc.getRoot().listTextures()[0];
const { data, info } = await sharp(Buffer.from(tex.getImage())).raw().toBuffer({ resolveWithObject: true });
const n = pos.getCount();
const joints = new Uint8Array(n * 4), weights = new Float32Array(n * 4);
// ---- pre-pass: leg side by geodesic distance from each boot (thighs that touch in the sculpt get split cleanly)
const legSide = new Int8Array(n); // 0 unknown, 1 = L, 2 = R
{
  const PX = new Float32Array(n * 3);
  const legRegion = new Uint8Array(n);
  const tt = [0, 0, 0], uu = [0, 0];
  for (let i = 0; i < n; i++) {
    pos.getElement(i, tt); uv.getElement(i, uu); PX.set(tt, i * 3);
    const px = Math.min(info.width - 1, Math.max(0, Math.round(uu[0] * (info.width - 1))));
    const py = Math.min(info.height - 1, Math.max(0, Math.round(uu[1] * (info.height - 1))));
    const o = (py * info.width + px) * info.channels;
    const [h, s, v] = hsv([data[o], data[o + 1], data[o + 2]]);
    const dress = h > 24 && h < 42 && s > 0.62 && v > 0.35 && tt[1] > 0.42;
    legRegion[i] = tt[1] < 0.64 && !dress ? 1 : 0;
  }
  const ia = prim.getIndices().getArray();
  const adj = Array.from({ length: n }, () => []);
  for (let k = 0; k < ia.length; k += 3) for (let e = 0; e < 3; e++) { const a = ia[k + e], b = ia[k + (e + 1) % 3]; if (legRegion[a] && legRegion[b]) { adj[a].push(b); adj[b].push(a); } }
  const dist = new Float64Array(n).fill(Infinity); console.log("adj edges", adj.reduce((a, x) => a + x.length, 0));
  // simple bucketed Dijkstra (binary heap)
  const heap = [];
  const push = (d, i) => { heap.push([d, i]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
  const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
  for (let i = 0; i < n; i++) {
    if (!legRegion[i] || PX[i * 3 + 1] > 0.12) continue;
    const sgn = PX[i * 3] - SPLIT_X;
    legSide[i] = sgn > 0 ? 1 : 2; dist[i] = 0; push(0, i);
  }
  console.log("seeds", heap.length); let pops = 0;
  while (heap.length) { if (++pops % 200000 === 0) console.log("pops", pops, heap.length);
    const [d, i] = pop();
    if (d > dist[i]) continue;
    for (const j of adj[i]) {
      const dx = PX[i * 3] - PX[j * 3], dy = PX[i * 3 + 1] - PX[j * 3 + 1], dz = PX[i * 3 + 2] - PX[j * 3 + 2];
      const nd = d + Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (nd < dist[j]) { dist[j] = nd; legSide[j] = legSide[i]; push(nd, j); }
    }
  }
}
const stats = {};
const tmp = [0, 0, 0], t2 = [0, 0];
for (let i = 0; i < n; i++) {
  pos.getElement(i, tmp); uv.getElement(i, t2);
  const p = V(...tmp);
  const px = Math.min(info.width - 1, Math.max(0, Math.round(t2[0] * (info.width - 1))));
  const py = Math.min(info.height - 1, Math.max(0, Math.round(t2[1] * (info.height - 1))));
  const o = (py * info.width + px) * info.channels;
  const [h, s, v] = hsv([data[o], data[o + 1], data[o + 2]]);
  const hair = v < 0.5 && s < 0.85 && p.y > 0.75;
  const dress = h > 24 && h < 42 && s > 0.62 && v > 0.35 && p.y < 0.98 && p.y > 0.42;
  const skin = !hair && h < 30 && s < 0.62 && v > 0.55;
  const w = new Map();
  const add = (j, x) => x > 0 && w.set(j, (w.get(j) ?? 0) + x);
  let cls = 'torso';

  // arms
  let arm = null;
  for (const side of ['L', 'R']) {
    if (hair) break;
    const sh = M['shoulder' + side], el = M['elbow' + side], wr = M['wrist' + side], hd = M['hand' + side];
    const a = segT(p, sh, el), b = segT(p, el, wr), c = segT(p, wr, hd);
    const sideOk = side === 'L' ? p.x > (LM.armSideX ?? 0.115) : p.x < -(LM.armSideX ?? 0.115);
    if (!sideOk) continue;
    const upperOk = a.d < 0.075 && !dress && (a.t > 0.12 || Math.abs(p.x) > Math.abs(sh.x) - 0.005);
    const foreOk = b.d < 0.06 && !dress;
    const handOk = c.d < 0.1 && !dress;
    if (!(upperOk || foreOk || handOk)) continue;
    const best = Math.min(upperOk ? a.d : 9, foreOk ? b.d : 9, handOk ? c.d : 9);
    if (arm && arm.best < best) continue;
    arm = { side, best, seg: best === (upperOk ? a.d : 9) ? 'upper' : 'fore', t: best === (upperOk ? a.d : 9) ? a.t : b.t };
  }
  if (arm) {
    cls = 'arm' + arm.side;
    const S = J['shoulder' + arm.side], E = J['elbow' + arm.side];
    if (arm.seg === 'upper') {
      const toSpine = 1 - ss(0.0, 0.3, arm.t);
      const toElbow = ss(0.78, 1.0, arm.t) * 0.5;
      add(J.spine, toSpine * 0.6);
      add(E, toElbow);
      add(S, 1 - toSpine * 0.6 - toElbow);
    } else {
      const toSh = (1 - ss(0, 0.22, arm.t)) * 0.5;
      add(S, toSh);
      add(E, 1 - toSh);
    }
  } else if (p.y < 0.62 && (p.y < 0.47 ? !dress : skin)) {
    // legs (boots included)
    let best = null;
    for (const side of ['L', 'R']) {
      const hip = M['leg' + side], kn = M['knee' + side], an = M['ankle' + side], to = M['toe' + side];
      const a = segT(p, hip, kn), b = segT(p, kn, an), c = segT(p, an, to);
      let d = Math.min(a.d, b.d, c.d);
      if (p.y < 0.24) {
        // feet: the two boots are cleanly separated by the plane between their centres
        const sgn = p.x - SPLIT_X;
        d = (sgn > 0) === (side === 'L') ? 0 : 1;
      }
      if (legSide[i]) d = legSide[i] === (side === 'L' ? 1 : 2) ? Math.min(a.d, b.d, c.d) * 0.001 : 9;
      if (!best || d < best.d) best = { side, d, seg: a.d <= Math.min(b.d, c.d) ? 'thigh' : 'shin', t: a.d <= Math.min(b.d, c.d) ? a.t : b.t };
    }
    cls = 'leg' + best.side;
    const L = J['leg' + best.side], K = J['knee' + best.side];
    if (best.seg === 'thigh') {
      const toHips = (1 - ss(0, 0.25, best.t)) * 0.5;
      const toKnee = ss(0.75, 1, best.t) * 0.5;
      add(J.hips, toHips); add(K, toKnee); add(L, 1 - toHips - toKnee);
    } else {
      const toLeg = (1 - ss(0, 0.2, best.t)) * 0.5;
      add(L, toLeg); add(K, 1 - toLeg);
    }
  } else {
    // torso, head, hair, dress
    cls = hair ? 'hair' : dress ? 'dress' : 'torso';
    const neckW = hair ? ss(0.98, 1.14, p.y) : ss(1.035, 1.11, p.y);
    const spineW = (1 - neckW) * ss(0.6, 0.78, p.y);
    const hipsW = 1 - neckW - spineW;
    add(J.neck, neckW); add(J.spine, spineW);
    // skirt follows the legs a little so thighs don't poke through when walking
    if (hipsW > 0 && p.y < 0.58) {
      const legShare = hipsW * 0.45 * ss(0.58, 0.46, p.y);
      const side = p.x > 0.0 ? 'L' : 'R';
      const k = ss(0.0, 0.07, Math.abs(p.x));
      add(J['leg' + side], legShare * (0.5 + 0.5 * k));
      add(J['leg' + (side === 'L' ? 'R' : 'L')], legShare * (0.5 - 0.5 * k));
      add(J.hips, hipsW - legShare);
    } else add(J.hips, hipsW);
  }
  stats[cls] = (stats[cls] ?? 0) + 1;
  const top = [...w.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const sum = top.reduce((a, e) => a + e[1], 0) || 1;
  top.forEach(([j, x], k) => { joints[i * 4 + k] = j; weights[i * 4 + k] = x / sum; });
}
console.log('classes', stats);
// cut triangles that glue unrelated body parts together (hand resting on the hip, touching thighs)
const RELATED = new Set(['hips-spine', 'spine-neck', 'spine-shoulderL', 'spine-shoulderR', 'shoulderL-elbowL', 'shoulderR-elbowR', 'hips-legL', 'hips-legR', 'legL-kneeL', 'legR-kneeR', 'neck-shoulderL', 'neck-shoulderR']);
const dom = (i) => joints[i * 4];
const rel = (a, b) => a === b || RELATED.has(JOINTS[a] + '-' + JOINTS[b]) || RELATED.has(JOINTS[b] + '-' + JOINTS[a]);
const idx = prim.getIndices();
const ia = idx.getArray();
const kept = [];
let cut = 0;
for (let k = 0; k < ia.length; k += 3) {
  const a = dom(ia[k]), b = dom(ia[k + 1]), c = dom(ia[k + 2]);
  if (rel(a, b) && rel(b, c) && rel(a, c)) kept.push(ia[k], ia[k + 1], ia[k + 2]);
  else cut++;
}
console.log('cut triangles', cut);
idx.setArray(new Uint32Array(kept));
prim.setAttribute('JOINTS_0', doc.createAccessor().setType('VEC4').setArray(joints).setBuffer(pos.getBuffer()));
prim.setAttribute('WEIGHTS_0', doc.createAccessor().setType('VEC4').setArray(weights).setBuffer(pos.getBuffer()));
// the vertex colour class is useful for debugging only; drop normals' precision etc. via quantize
doc.getRoot().listMaterials()[0].setRoughnessFactor(0.85).setMetallicFactor(0).setDoubleSided(true);
await doc.transform(
  dedup(),
  prune({ keepAttributes: true }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [2048, 2048], quality: 88 }),
  reorder({ encoder: MeshoptEncoder }),
  quantize(),
);
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await io.write(out, doc);
const p2 = doc.getRoot().listMeshes()[0].listPrimitives()[0];
console.log('verts', p2.getAttribute('POSITION').getCount(), 'tris', p2.getIndices().getCount() / 3, 'bytes', fs.statSync(out).size);
fs.writeFileSync(jsonOut, JSON.stringify({ joints: JOINTS, parent: JOINTS.map((j) => (PARENT[j] ? J[PARENT[j]] : -1)), local, boneInverses, handR: { pos: V(0, 0, 0).addScaledVector(CAN_DIR.elbowR, forearmR * (LM.gripAt ?? 0.8)).add(V(0, 0, 0.02)).toArray() }, backpack: LM.backpack ? V(...LM.backpack).sub(CAN.spine).toArray() : [0, 0.2, -0.2] }));
