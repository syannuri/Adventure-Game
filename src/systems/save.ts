/**
 * Local progress persistence (browser storage).
 * Everything is wrapped in try/catch: private windows or blocked storage must never break the game.
 */
export interface SaveData {
  version: 1;
  completedWorlds: string[];
  magicStars: number;
  achievements: string[];
  bestCoins: Record<string, number>;
  seenIntro: boolean;
  settings: Settings;
  /** golden acorns kept in Anet's pouch (spent at Kiki's shop) */
  acorns: number;
  /** cosmetics bought at the shop, and which one is worn in each slot */
  owned: string[];
  equipped: Record<string, string>;
  /** Kiki gives a little welcome gift on the first visit */
  metKiki: boolean;
}

export interface Settings {
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  quality: 'high' | 'low';
  /** UI / dialogue language (Bahasa Indonesia by default) */
  language: 'id' | 'en';
}

const KEY = 'anett-magical-adventure-save-v1';

export const defaultSave = (): SaveData => ({
  version: 1,
  completedWorlds: [],
  magicStars: 0,
  achievements: [],
  bestCoins: {},
  seenIntro: false,
  settings: { musicVolume: 0.6, sfxVolume: 0.8, quality: detectQuality(), language: 'id' },
  acorns: 0,
  owned: [],
  equipped: {},
  metKiki: false,
});

function detectQuality(): 'high' | 'low' {
  try {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    return coarse ? 'low' : 'high';
  } catch {
    return 'high';
  }
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const base = defaultSave();
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      version: 1,
    };
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable – progress just won't persist */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
