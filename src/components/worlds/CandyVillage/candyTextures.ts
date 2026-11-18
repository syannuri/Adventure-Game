/** Canvas-painted textures for the candy world (all procedural, made once and cached). */
import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

function canvasTex(key: string, size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, repeat?: [number, number]) {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  cache.set(key, t);
  return t;
}

/** Lollipop swirl: a spiral of the candy colour and white. */
export function swirlTexture(color: string) {
  return canvasTex('swirl' + color, 256, (g, s) => {
    g.fillStyle = '#fffaf4';
    g.fillRect(0, 0, s, s);
    g.translate(s / 2, s / 2);
    g.fillStyle = color;
    // three spiral arms drawn as overlapping dots that grow toward the rim
    for (let arm = 0; arm < 3; arm++) {
      for (let i = 0; i <= 400; i++) {
        const t = i / 400;
        const a = arm * ((Math.PI * 2) / 3) + t * Math.PI * 4.4;
        const r = t * s * 0.5;
        g.beginPath();
        g.arc(Math.cos(a) * r, Math.sin(a) * r, 2 + t * s * 0.085, 0, Math.PI * 2);
        g.fill();
      }
    }
    // glossy rim
    const grad = g.createRadialGradient(-s * 0.12, -s * 0.14, 2, 0, 0, s * 0.5);
    grad.addColorStop(0, 'rgba(255,255,255,0.35)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(-s / 2, -s / 2, s, s);
  });
}

/** Diagonal red-and-white candy cane stripes. */
export function caneTexture(color = '#e8344c') {
  return canvasTex(
    'cane' + color,
    128,
    (g, s) => {
      g.fillStyle = '#fffaf6';
      g.fillRect(0, 0, s, s);
      g.fillStyle = color;
      for (let k = -2; k < 4; k++) {
        g.beginPath();
        g.moveTo(k * s * 0.5, 0);
        g.lineTo(k * s * 0.5 + s * 0.22, 0);
        g.lineTo(k * s * 0.5 + s * 0.22 + s, s);
        g.lineTo(k * s * 0.5 + s, s);
        g.closePath();
        g.fill();
      }
    },
    [1, 6],
  );
}

/** Strawberry skin: red with little golden seeds. */
export function strawberryTexture() {
  return canvasTex(
    'strawberry',
    256,
    (g, s) => {
      const grad = g.createLinearGradient(0, 0, 0, s);
      grad.addColorStop(0, '#ff4f5e');
      grad.addColorStop(1, '#d81e3a');
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
      for (let y = 10; y < s; y += 22) {
        for (let x = (y / 22) % 2 ? 11 : 0; x < s; x += 22) {
          g.fillStyle = 'rgba(120,0,20,0.35)';
          g.beginPath();
          g.ellipse(x, y + 1, 4.5, 6, 0, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#ffe08a';
          g.beginPath();
          g.ellipse(x, y, 2.4, 3.6, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
    },
    [2, 1],
  );
}

/** Waffle cone pattern. */
export function waffleTexture() {
  return canvasTex(
    'waffle',
    128,
    (g, s) => {
      g.fillStyle = '#e3a65a';
      g.fillRect(0, 0, s, s);
      g.strokeStyle = '#b8783a';
      g.lineWidth = 7;
      for (let k = -s; k < s * 2; k += 32) {
        g.beginPath();
        g.moveTo(k, 0);
        g.lineTo(k + s, s);
        g.stroke();
        g.beginPath();
        g.moveTo(k + s, 0);
        g.lineTo(k, s);
        g.stroke();
      }
    },
    [4, 2],
  );
}

/** Cookie: golden baked surface with chocolate chips. */
export function cookieTexture() {
  return canvasTex('cookie', 256, (g, s) => {
    g.fillStyle = '#d99a52';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${150 + Math.random() * 60},${90 + Math.random() * 40},40,0.25)`;
      g.fillRect(Math.random() * s, Math.random() * s, 3, 3);
    }
    for (let i = 0; i < 14; i++) {
      g.fillStyle = '#5a3018';
      g.beginPath();
      g.ellipse(Math.random() * s, Math.random() * s, 8 + Math.random() * 5, 6 + Math.random() * 4, Math.random() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** Cupcake wrapper: vertical pleats. */
export function wrapperTexture(color: string) {
  return canvasTex(
    'wrap' + color,
    128,
    (g, s) => {
      g.fillStyle = color;
      g.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 16) {
        g.fillStyle = 'rgba(255,255,255,0.35)';
        g.fillRect(x, 0, 5, s);
        g.fillStyle = 'rgba(0,0,0,0.08)';
        g.fillRect(x + 9, 0, 4, s);
      }
    },
    [6, 1],
  );
}
