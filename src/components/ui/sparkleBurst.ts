/** A little burst of glowing dots at a screen position (DOM only, cleans itself up). */
export function sparkleBurst(x: number, y: number, colors: string[] = ['#ffe27a', '#ff9ec7', '#ffffff'], count = 14) {
  if (typeof document === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.className = 'ui-burst';
    const a = Math.random() * Math.PI * 2;
    const r = 40 + Math.random() * 60;
    const c = colors[i % colors.length];
    p.style.cssText = `left:${x - 5}px;top:${y - 5}px;background:${c};box-shadow:0 0 8px ${c};--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px`;
    document.body.appendChild(p);
    window.setTimeout(() => p.remove(), 850);
  }
}
