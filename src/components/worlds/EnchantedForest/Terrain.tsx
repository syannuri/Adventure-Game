import { useMemo } from 'react';
import * as THREE from 'three';
import { distToPath, MEADOW, POND, terrainHeight } from './layout';
import { mulberry32, smoothstep } from '../../../utils/math';

/** Height-mapped ground with painted vertex colours: grass variation, dirt path, shore, meadow. */
export function Terrain() {
  const geo = useMemo(() => {
    const size = 150;
    const seg = 190;
    const g = new THREE.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const grassA = new THREE.Color('#6fbf55');
    const grassB = new THREE.Color('#4f9e45');
    const grassC = new THREE.Color('#8fcf62');
    const hill = new THREE.Color('#3f8445');
    const path = new THREE.Color('#d8b47a');
    const pathEdge = new THREE.Color('#b99a5e');
    const sand = new THREE.Color('#e3d39a');
    const meadow = new THREE.Color('#9fd86c');
    const c = new THREE.Color();
    const rnd = mulberry32(5);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = terrainHeight(x, z);
      pos.setY(i, y);
      const n = Math.sin(x * 0.21 + Math.cos(z * 0.17) * 2) * 0.5 + 0.5;
      const n2 = Math.sin(x * 0.9 + z * 0.7) * 0.5 + 0.5;
      c.copy(grassA).lerp(grassB, n * 0.75).lerp(grassC, n2 * 0.25 + rnd() * 0.06);
      const r = Math.hypot(x, z);
      c.lerp(hill, smoothstep(34, 55, r) * 0.7);
      const dm = Math.hypot(x - MEADOW.x, z - MEADOW.z);
      c.lerp(meadow, (1 - smoothstep(MEADOW.r * 0.4, MEADOW.r + 2, dm)) * 0.6);
      const dp = distToPath(x, z);
      const pathW = 1 - smoothstep(0.9, 1.9, dp);
      const pathEdgeW = 1 - smoothstep(1.6, 2.4, dp);
      c.lerp(pathEdge, pathEdgeW * 0.35);
      c.lerp(path, pathW * (0.8 + n2 * 0.15));
      const dPond = Math.hypot(x - POND.x, z - POND.z);
      c.lerp(sand, (1 - smoothstep(POND.r - 0.5, POND.r + 1.6, dPond)) * 0.8);
      // subtle darkening in hollows -> fake ambient occlusion
      c.multiplyScalar(0.9 + smoothstep(-1.2, 1.5, y) * 0.12);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
    </mesh>
  );
}
