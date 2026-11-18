# Anet HD model pipeline

How `public/models/anet.glb` and `src/components/characters/Anett/anetRig.json` were made, so the
model can be regenerated or replaced.

1. **Turnaround image.** Krea, *Nano Banana Pro*, with the cover illustration
   (`docs/anet-cover-source.png`, cut out on white) as the image reference. The prompt asks for
   the same girl and outfit, in a symmetrical A-pose (arms ~25° out, legs apart) on a plain white
   background. The A-pose matters: in the cover pose the hand rests on the hip and the legs cross,
   and those parts end up fused together in the 3D mesh, which can't be animated cleanly.
   Result: `docs/anet-apose.jpg`.
2. **Image → 3D.** Krea, *Tripo H3.1* (textured mesh, about 1.4M triangles, 2048² colour texture).
3. **Prepare** (`prep.mjs`): turn it to face +Z, put the feet on y = 0, scale to 1.45 m and
   simplify with meshoptimizer to about 60k triangles.
4. **Auto-rig** (`rig.mjs`, joint positions in `landmarks.json`):
   - The 11 bones match the procedural rig's joint names (hips, spine, neck, shoulders, elbows,
     legs, knees).
   - Skin weights come from distance to bone segments, the texture colour (hair, dress, skin), and
     a geodesic flood fill from each boot to split the legs. Joints get smooth blends.
   - Triangles that glue unrelated parts together are removed.
   - Compressed with meshopt and WebP: about 1 MB.
5. **In game** (`AnettHD.tsx`): every bone copies the local rotation of the matching joint group of
   the procedural rig. So the animator, all 13 animations and the controller drive the sculpted
   model unchanged. The limb directions in the bind pose are converted to the procedural rest pose
   (arms down, legs straight).

Run (Node 20+, in a scratch folder with `@gltf-transform/core @gltf-transform/extensions
@gltf-transform/functions meshoptimizer sharp` installed):

```bash
node prep.mjs tripo.glb anet-prep.glb 0.04
LANDMARKS=landmarks.json node rig.mjs anet-prep.glb anet.glb anetRig.json
```

Add `?procedural` to the game URL to compare with the old procedural model.
