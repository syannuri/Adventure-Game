import type { ForestStage } from '../../../systems/store';
import { FAIRY_POS, STARS, WAND_POS } from '../../worlds/EnchantedForest/layout';
import { player } from '../../../systems/playerState';
import { tr } from '../../../i18n';

export interface Objective {
  text: string;
  target: { x: number; z: number } | null;
}

export function forestObjective(stage: ForestStage, stars: string[], solved = false, matched = 0): Objective {
  switch (stage) {
    case 'meetFairy':
      return { text: tr().objectives.meetFairy, target: FAIRY_POS };
    case 'collectStars': {
      // point at the nearest star that is still missing
      let best: { x: number; z: number } | null = null;
      let bd = Infinity;
      for (const s of STARS) {
        if (stars.includes(s.id)) continue;
        const d = Math.hypot(s.x - player.position.x, s.z - player.position.z);
        if (d < bd) {
          bd = d;
          best = s;
        }
      }
      return { text: tr().objectives.collectStars(stars.length, STARS.length), target: best };
    }
    case 'findWand':
      return {
        text:
          Math.hypot(player.position.x - WAND_POS.x, player.position.z - WAND_POS.z) < 7
            ? solved
              ? tr().objectives.takeWand
              : tr().objectives.flowerPuzzle(matched)
            : tr().objectives.findWand,
        target: WAND_POS,
      };
    case 'returnWand':
      return { text: tr().objectives.returnWand, target: FAIRY_POS };
    case 'done':
      return { text: tr().objectives.done, target: null };
  }
}

/** Gentle hints shown when a child seems stuck (current language). */
export const FOREST_HINTS = (): Record<ForestStage, string> => tr().hints;
