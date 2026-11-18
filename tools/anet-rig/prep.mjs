// Step 1: orient (face +Z), put feet on y=0, scale to game height, simplify, shrink texture.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, prune, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

const [, , inp, out, ratioArg] = process.argv;
const HEIGHT = 1.45;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const pos = prim.getAttribute('POSITION');
const nrm = prim.getAttribute('NORMAL');
const n = pos.getCount();
const p = [0, 0, 0], q = [0, 0, 0];
// rotate -90deg around Y: (x,y,z) -> (-z, y, x)
let minY = Infinity, maxY = -Infinity;
for (let i = 0; i < n; i++) {
  pos.getElement(i, p);
  minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
}
const s = HEIGHT / (maxY - minY);
// feet centre: average x/z of the lowest 4% of vertices
let fx = 0, fz = 0, fc = 0;
for (let i = 0; i < n; i++) {
  pos.getElement(i, p);
  if (p[1] < minY + (maxY - minY) * 0.04) { fx += -p[2]; fz += p[0]; fc++; }
}
fx /= fc; fz /= fc;
for (let i = 0; i < n; i++) {
  pos.getElement(i, p);
  pos.setElement(i, [(-p[2] - fx) * s, (p[1] - minY) * s, (p[0] - fz) * s]);
  if (nrm) { nrm.getElement(i, q); nrm.setElement(i, [-q[2], q[1], q[0]]); }
}
await MeshoptSimplifier.ready;
await doc.transform(
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: Number(ratioArg || 0.04), error: 0.0008, lockBorder: true }),
  dedup(),
  prune(),
);
const p2 = doc.getRoot().listMeshes()[0].listPrimitives()[0];
console.log('verts', p2.getAttribute('POSITION').getCount(), 'tris', p2.getIndices().getCount() / 3, 'min', p2.getAttribute('POSITION').getMin([]), 'max', p2.getAttribute('POSITION').getMax([]));
await io.write(out, doc);
