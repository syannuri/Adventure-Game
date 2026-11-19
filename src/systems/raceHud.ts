/** What the race overlay shows (written by the leaf race in the 3D scene, read by the HUD). */
import { create } from 'zustand';

export type RacePhase = 'idle' | 'count' | 'race' | 'glide';
export interface RaceHudState {
  phase: RacePhase;
  count: number;
  time: string;
  n: number;
  total: number;
  /** progress 0..1 of Anet's leaf and of the duck */
  me: number;
  duck: number;
}

export const useRaceHud = create<{ hud: RaceHudState | null }>(() => ({ hud: null }));
