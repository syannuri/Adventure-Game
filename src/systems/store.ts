import { create } from 'zustand';
import { loadSave, writeSave, type SaveData, type Settings } from './save';
import { audio } from '../components/audio/audioEngine';
import { setLangSource, tr } from '../i18n';

export type Screen = 'menu' | 'story' | 'worlds' | 'playing' | 'complete';
export type Overlay = null | 'settings' | 'about';

export interface DialogueLine {
  speaker: 'anett' | 'lumi' | 'pip' | 'olli';
  text: string;
}

export type ForestStage = 'meetFairy' | 'collectStars' | 'findWand' | 'returnWand' | 'done';

export type CinematicKind = 'intro' | 'reveal' | 'finale';

export interface Cinematic {
  kind: CinematicKind;
  start: number;
  duration: number;
  focus?: [number, number, number];
}

export type AnettEmote = 'wave' | 'dance' | 'celebrate' | 'surprise' | 'collect' | 'talk';

interface LevelState {
  stars: string[];
  coins: string[];
  treasures: string[];
  stage: ForestStage;
  hasWand: boolean;
  /** colour flower puzzle in front of the wand log: current colour index of each flower */
  flowers: number[];
  puzzleSolved: boolean;
  startedAt: number;
  lastProgressAt: number;
}

interface GameState {
  screen: Screen;
  overlay: Overlay;
  paused: boolean;
  save: SaveData;
  worldId: string | null;
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
  startWorld: (id: string) => void;
  collect: (kind: 'stars' | 'coins' | 'treasures', id: string) => void;
  setStage: (s: ForestStage) => void;
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
  resetProgress: () => void;
}

const freshLevel = (): LevelState => ({
  stars: [],
  coins: [],
  treasures: [],
  stage: 'meetFairy',
  hasWand: false,
  flowers: [0, 0, 1],
  puzzleSolved: false,
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

  startWorld: (id) => {
    set((s) => ({
      worldId: id,
      screen: 'playing',
      paused: false,
      runId: s.runId + 1,
      worldReady: false,
      level: freshLevel(),
      dialogue: null,
      prompt: null,
      emote: null,
      newAchievements: [],
      cinematic: { kind: 'intro', start: -1, duration: 5200 }, // starts on the first rendered frame
    }));
    audio.playMusic('forest');
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
  };
}

// i18n reads the current language from the saved settings
setLangSource(() => useGame.getState().save.settings.language ?? 'id');
