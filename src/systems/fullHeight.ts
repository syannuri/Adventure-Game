/**
 * iPhone / iPad home-screen app (standalone, black-translucent status bar): iOS reports the screen
 * height minus the status bar, so everything sized to "100%" or "inset: 0" stops short and leaves an
 * empty band at the bottom. Measure the real full-screen height from the screen size and give it to
 * the layout as --app-h (only when the app runs full screen, not in iPad Split View / Stage Manager).
 */
export function installFullHeight() {
  if (typeof window === 'undefined') return;
  const nav = navigator as Navigator & { standalone?: boolean };
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = !!nav.standalone || window.matchMedia?.('(display-mode: standalone), (display-mode: fullscreen)').matches;
  if (!ios || !standalone) return;
  const root = document.documentElement;
  const update = () => {
    const long = Math.max(screen.width, screen.height);
    const short = Math.min(screen.width, screen.height);
    const landscape = window.innerWidth > window.innerHeight;
    const fullW = landscape ? long : short;
    const fullH = landscape ? short : long;
    // only when the app fills the whole screen width (not a split-view window)
    if (Math.abs(window.innerWidth - fullW) > 2 || fullH <= window.innerHeight) {
      root.classList.remove('ios-full');
      root.style.removeProperty('--app-h');
      return;
    }
    root.style.setProperty('--app-h', `${fullH}px`);
    root.classList.add('ios-full');
  };
  update();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', () => window.setTimeout(update, 250));
}
