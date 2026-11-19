/** What the match overlay shows (written by the Si Kusut match in the scene, read by the HUD). */
import { create } from 'zustand';

export interface MatchHudState {
  round: number;
  anet: number;
  kusut: number;
  results: (boolean | null)[];
  /** what the current game shows */
  game: null | { kind: 'count'; n: number } | { kind: 'fireflies'; time: number; mine: number; theirs: number } | { kind: 'tug'; v: number; time: number };
}

export const useMatchHud = create<{ hud: MatchHudState | null }>(() => ({ hud: null }));

/** the tug-of-war pull (button / Space / E); set by the match while tug of war is on */
export const matchInput = { pull: null as null | (() => void) };
