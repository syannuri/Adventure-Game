import { create } from 'zustand';
import { loadSave, writeSave, type GardenSave, type SaveData, type Settings } from './save';
import { audio } from '../components/audio/audioEngine';
import { setLangSource, tr } from '../i18n';
import { COSMETICS } from '../data/cosmetics';

export type Screen = 'menu' | 'story' | 'worlds' | 'playing' | 'complete';
export type Overlay = null | 'settings' | 'about' | 'shop' | 'stickers';

export interface DialogueLine {
  speaker: 'anett' | 'lumi' | 'pip' | 'olli' | 'koko' | 'kiki' | 'duck' | 'dragon';
  text: string;
}

export type ForestStage = 'meetFairy' | 'collectStars' | 'findWand' | 'returnWand' | 'done' | 'night';
/** World 2 (Candy Village) mission stages. */
export type CandyStage = 'meetChef' | 'collectIngredients' | 'returnIngredients' | 'sortCandy' | 'done';
/** World 3 (Crystal Cave) mission stages. */
export type CaveStage = 'meetDragon' | 'collectCrystals' | 'returnCrystals' | 'lightPuzzle';
export type Stage = ForestStage | CandyStage | CaveStage;

export type CinematicKind = 'intro' | 'reveal' | 'finale';

export interface Cinematic {
  kind: CinematicKind;
  start: number;
  duration: number;
  focus?: [number, number, number];
}

export type AnettEmote = 'wave' | 'dance' | 'celebrate' | 'surprise' | 'collect' | 'talk';

interface LevelState {
  /** quest items: Wishing Stars (World 1) or candy ingredients (World 2) */
  stars: string[];
  coins: string[];
  treasures: string[];
  stage: Stage;
  hasWand: boolean;
  /** colour flower puzzle in front of the wand log: current colour index of each flower */
  flowers: number[];
  puzzleSolved: boolean;
  /** candy sorting puzzle (World 2): candies already in the right jar, and the candy Anet is carrying */
  sorted: string[];
  holding: string | null;
  /** World 1 side quest: Pip's little brothers playing hide-and-seek */
  bunnyQuest: 'none' | 'active' | 'done';
  bunnies: string[];
  /** lily-pad hop: golden lotus picked */
  lotus: boolean;
  /** spring mushroom: lantern treasure opened */
  lantern: boolean;
  /** Olli's riddles: -1 not started, 0..2 current riddle, 3 all solved */
  riddle: number;
  /** night forest (after World 1): fireflies caught, lanterns lit, and the night mission step */
  fireflies: string[];
  lanterns: string[];
  nightStage: 'collect' | 'return' | 'done';
  /** crystal cave light puzzle: direction of each mirror crystal */
  mirrors: number[];
  /** magic garden: carrying the watering can, and how many pours of water are in it */
  hasCan: boolean;
  water: number;
  /** duckling escort side quest */
  duckQuest: 'none' | 'active' | 'done';
  ducklings: string[];
  startedAt: number;
  lastProgressAt: number;
}

interface GameState {
  screen: Screen;
  overlay: Overlay;
  paused: boolean;
  save: SaveData;
  worldId: string | null;
  /** night version of the Enchanted Forest (unlocked after finishing it) */
  night: boolean;
  runId: number;
  /** false while a world is mounting / compiling shaders (shows the loading screen) */
  worldReady: boolean;
  setWorldReady: () => void;
  level: LevelState;
  dialogue: { lines: DialogueLine[]; index: number; onComplete?: () => void } | null;
  prompt: string | null;
  /** what the action button does right now (label on the touch button) */
  promptVerb: 'talk' | 'take' | 'open' | 'touch' | null;
  cinematic: Cinematic | null;
  emote: { name: AnettEmote; id: number; duration: number } | null;
  toasts: { id: number; title: string; text: string; icon: string }[];
  newAchievements: string[];

  setScreen: (s: Screen) => void;
  setOverlay: (o: Overlay) => void;
  setPaused: (p: boolean) => void;
  startWorld: (id: string, opts?: { night?: boolean }) => void;
  collect: (kind: 'stars' | 'coins' | 'treasures', id: string) => void;
  setStage: (s: Stage) => void;
  setHasWand: (v: boolean) => void;
  openDialogue: (lines: DialogueLine[], onComplete?: () => void) => void;
  advanceDialogue: () => void;
  setPrompt: (p: string | null, verb?: 'talk' | 'take' | 'open' | 'touch' | null) => void;
  playCinematic: (c: Omit<Cinematic, 'start'>) => void;
  endCinematic: () => void;
  playEmote: (name: AnettEmote, duration?: number) => void;
  unlockAchievement: (id: string, title: string, icon: string) => void;
  dismissToast: (id: number) => void;
  completeWorld: (worldId: string, coinsFound: number) => void;
  updateSettings: (s: Partial<Settings>) => void;
  markIntroSeen: () => void;
  /** golden acorns in the pouch (kept between games) */
  addAcorns: (n: number) => void;
  buyCosmetic: (id: string) => boolean;
  equipCosmetic: (id: string) => void;
  unequipSlot: (slot: string) => void;
  setMetKiki: () => void;
  setGarden: (g: GardenSave) => void;
  setLeafRace: (r: NonNullable<SaveData['leafRace']>) => void;
  /** returns true if the sticker is new */
  addSticker: (id: string) => boolean;
  resetProgress: () => void;
}

const freshLevel = (worldId: string | null = null, night = false): LevelState => ({
  stars: [],
  coins: [],
  treasures: [],
  stage: worldId === 'candy-village' ? 'meetChef' : worldId === 'crystal-cave' ? 'meetDragon' : night ? 'night' : 'meetFairy',
  hasWand: false,
  flowers: [0, 0, 1],
  puzzleSolved: false,
  sorted: [],
  holding: null,
  bunnyQuest: 'none',
  bunnies: [],
  lotus: false,
  lantern: false,
  riddle: -1,
  fireflies: [],
  lanterns: [],
  nightStage: 'collect',
  mirrors: [1, 0, 3],
  duckQuest: 'none',
  ducklings: [],
  hasCan: false,
  water: 0,
  startedAt: performance.now(),
  lastProgressAt: performance.now(),
});

let toastId = 1;
let emoteId = 1;

export const useGame = create<GameState>((set, get) => ({
  screen: 'menu',
  overlay: null,
  paused: false,
  save: loadSave(),
  worldId: null,
  night: false,
  runId: 0,
  worldReady: false,
  setWorldReady: () => {
    if (!get().worldReady) set({ worldReady: true });
  },
  level: freshLevel(),
  dialogue: null,
  prompt: null,
  promptVerb: null,
  cinematic: null,
  emote: null,
  toasts: [],
  newAchievements: [],

  setScreen: (screen) => {
    set({ screen, paused: false, dialogue: null, prompt: null, cinematic: null });
    if (screen === 'menu' || screen === 'worlds' || screen === 'story') audio.playMusic('menu');
  },
  setOverlay: (overlay) => set({ overlay }),
  setPaused: (paused) => set({ paused }),

  startWorld: (id, opts) => {
    const night = !!opts?.night && id === 'enchanted-forest';
    set((s) => ({
      worldId: id,
      night,
      screen: 'playing',
      paused: false,
      runId: s.runId + 1,
      worldReady: false,
      level: freshLevel(id, night),
      dialogue: null,
      prompt: null,
      emote: null,
      newAchievements: [],
      cinematic: { kind: 'intro', start: -1, duration: 5200 }, // starts on the first rendered frame
    }));
    audio.playMusic(id === 'candy-village' ? 'candy' : id === 'crystal-cave' ? 'cave' : 'forest');
  },

  collect: (kind, id) => {
    const lvl = get().level;
    if (lvl[kind].includes(id)) return;
    set({ level: { ...lvl, [kind]: [...lvl[kind], id], lastProgressAt: performance.now() } });
  },
  setStage: (stage) => set((s) => ({ level: { ...s.level, stage, lastProgressAt: performance.now() } })),
  setHasWand: (hasWand) => set((s) => ({ level: { ...s.level, hasWand } })),

  openDialogue: (lines, onComplete) => {
    set({ dialogue: { lines, index: 0, onComplete }, prompt: null });
  },
  advanceDialogue: () => {
    const d = get().dialogue;
    if (!d) return;
    if (d.index + 1 < d.lines.length) {
      set({ dialogue: { ...d, index: d.index + 1 } });
    } else {
      set({ dialogue: null });
      d.onComplete?.();
    }
  },
  setPrompt: (prompt, verb = null) => {
    if (get().prompt !== prompt || get().promptVerb !== verb) set({ prompt, promptVerb: prompt ? verb : null });
  },
  playCinematic: (c) => set({ cinematic: { ...c, start: performance.now() } }),
  endCinematic: () => set({ cinematic: null }),
  playEmote: (name, duration = 1.6) => set({ emote: { name, id: emoteId++, duration } }),

  unlockAchievement: (id, title, icon) => {
    const s = get();
    if (s.save.achievements.includes(id)) return;
    const save = { ...s.save, achievements: [...s.save.achievements, id] };
    writeSave(save);
    const toast = { id: toastId++, title: tr().toasts.achievement, text: tr().achievements[id]?.title ?? title, icon };
    set({ save, toasts: [...s.toasts, toast], newAchievements: [...s.newAchievements, id] });
    audio.sfx('achievement');
    setTimeout(() => get().dismissToast(toast.id), 3800);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  completeWorld: (worldId, coinsFound) => {
    const s = get();
    const already = s.save.completedWorlds.includes(worldId);
    const save: SaveData = {
      ...s.save,
      completedWorlds: already ? s.save.completedWorlds : [...s.save.completedWorlds, worldId],
      magicStars: already ? s.save.magicStars : s.save.magicStars + 1,
      bestCoins: { ...s.save.bestCoins, [worldId]: Math.max(s.save.bestCoins[worldId] ?? 0, coinsFound) },
    };
    writeSave(save);
    set({ save, screen: 'complete', dialogue: null, prompt: null });
    audio.playMusic('victory');
  },

  updateSettings: (patch) => {
    const s = get();
    const save = { ...s.save, settings: { ...s.save.settings, ...patch } };
    writeSave(save);
    set({ save });
    audio.setVolumes(save.settings.musicVolume, save.settings.sfxVolume);
  },
  addAcorns: (n) => {
    const save = { ...get().save, acorns: Math.max(0, (get().save.acorns ?? 0) + n) };
    writeSave(save);
    set({ save });
  },
  buyCosmetic: (id) => {
    const s = get().save;
    const item = COSMETICS.find((c) => c.id === id);
    if (!item || s.owned.includes(id) || s.acorns < item.price) return false;
    const save = { ...s, acorns: s.acorns - item.price, owned: [...s.owned, id], equipped: { ...s.equipped, [item.slot]: id } };
    writeSave(save);
    set({ save });
    return true;
  },
  equipCosmetic: (id) => {
    const s = get().save;
    const item = COSMETICS.find((c) => c.id === id);
    if (!item || !s.owned.includes(id)) return;
    const save = { ...s, equipped: { ...s.equipped, [item.slot]: id } };
    writeSave(save);
    set({ save });
  },
  unequipSlot: (slot) => {
    const s = get().save;
    const equipped = { ...s.equipped };
    delete equipped[slot];
    const save = { ...s, equipped };
    writeSave(save);
    set({ save });
  },
  setLeafRace: (leafRace) => {
    const save = { ...get().save, leafRace };
    writeSave(save);
    set({ save });
  },
  setGarden: (garden) => {
    const save = { ...get().save, garden };
    writeSave(save);
    set({ save });
  },
  setMetKiki: () => {
    const save = { ...get().save, metKiki: true };
    writeSave(save);
    set({ save });
  },
  addSticker: (id) => {
    const s = get().save;
    const stickers = s.stickers ?? [];
    if (stickers.includes(id)) return false;
    const save = { ...s, stickers: [...stickers, id] };
    writeSave(save);
    set({ save });
    return true;
  },
  markIntroSeen: () => {
    const save = { ...get().save, seenIntro: true };
    writeSave(save);
    set({ save });
  },
  resetProgress: () => {
    const settings = get().save.settings;
    const save: SaveData = { ...loadSaveDefaultsWith(settings) };
    writeSave(save);
    set({ save });
  },
}));

function loadSaveDefaultsWith(settings: Settings): SaveData {
  return {
    version: 1,
    completedWorlds: [],
    magicStars: 0,
    achievements: [],
    bestCoins: {},
    seenIntro: false,
    settings,
    acorns: 0,
    owned: [],
    equipped: {},
    metKiki: false,
    stickers: [],
  };
}

// i18n reads the current language from the saved settings
setLangSource(() => useGame.getState().save.settings.language ?? 'id');
