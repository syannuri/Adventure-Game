/**
 * Pooled particle bursts (collect sparkles, magic effects). Call `spawnBurst` from anywhere.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sparkleTexture } from './textures';

const MAX = 600;

interface Req {
  x: number;
  y: number;
  z: number;
  color: string;
  count: number;
  speed: number;
  up: number;
  life: number;
}
const queue: Req[] = [];

export function spawnBurst(x: number, y: number, z: number, color = '#ffe27a', count = 40, opts: { speed?: number; up?: number; life?: number } = {}) {
  queue.push({ x, y, z, color, count, speed: opts.speed ?? 3, up: opts.up ?? 2.5, life: opts.life ?? 1.1 });
}

export function Bursts() {
  const ref = useRef<THREE.Points>(null!);
  const data = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(MAX * 3);
    const col = new Float32Array(MAX * 3);
    const size = new Float32Array(MAX);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
    const vel = new Float32Array(MAX * 3);
    const life = new Float32Array(MAX);
    const maxLife = new Float32Array(MAX);
    const baseSize = new Float32Array(MAX);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: sparkleTexture() } },
      vertexShader: `
        attribute float size; attribute vec3 color; varying vec3 vColor;
        void main(){ vColor = color; vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_PointSize = min(size * (140.0 / -mv.z), 48.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `
        uniform sampler2D uTex; varying vec3 vColor;
        void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vColor * 2.0, t.a); if (t.a < 0.02) discard; }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo, pos, col, size, vel, life, maxLife, baseSize, mat, next: 0 };
  }, []);

  const c = useMemo(() => new THREE.Color(), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const d = data;
    while (queue.length) {
      const q = queue.shift()!;
      c.set(q.color);
      for (let k = 0; k < q.count; k++) {
        const i = d.next;
        d.next = (d.next + 1) % MAX;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(Math.random() * 2 - 1);
        const sp = q.speed * (0.4 + Math.random() * 0.6);
        d.pos[i * 3] = q.x;
        d.pos[i * 3 + 1] = q.y;
        d.pos[i * 3 + 2] = q.z;
        d.vel[i * 3] = Math.sin(ph) * Math.cos(th) * sp;
        d.vel[i * 3 + 1] = Math.abs(Math.cos(ph)) * sp * 0.6 + q.up * Math.random();
        d.vel[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * sp;
        const tint = 0.75 + Math.random() * 0.25;
        d.col[i * 3] = c.r * tint;
        d.col[i * 3 + 1] = c.g * tint;
        d.col[i * 3 + 2] = c.b * tint;
        d.life[i] = d.maxLife[i] = q.life * (0.6 + Math.random() * 0.6);
        d.baseSize[i] = 0.18 + Math.random() * 0.24;
      }
    }
    for (let i = 0; i < MAX; i++) {
      if (d.life[i] <= 0) {
        d.size[i] = 0;
        continue;
      }
      d.life[i] -= dt;
      d.vel[i * 3 + 1] -= 3.2 * dt;
      d.vel[i * 3] *= 0.97;
      d.vel[i * 3 + 2] *= 0.97;
      d.pos[i * 3] += d.vel[i * 3] * dt;
      d.pos[i * 3 + 1] += d.vel[i * 3 + 1] * dt;
      d.pos[i * 3 + 2] += d.vel[i * 3 + 2] * dt;
      const t = d.life[i] / d.maxLife[i];
      d.size[i] = d.baseSize[i] * Math.sin(Math.min(1, t * 1.4) * Math.PI * 0.5) * (0.8 + 0.4 * Math.sin(i + t * 20));
    }
    d.geo.attributes.position.needsUpdate = true;
    d.geo.attributes.color.needsUpdate = true;
    d.geo.attributes.size.needsUpdate = true;
  });

  return <points ref={ref} geometry={data.geo} material={data.mat} frustumCulled={false} />;
}
