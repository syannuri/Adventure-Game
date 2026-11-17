import type { ForestStage } from '../../../systems/store';
import { FAIRY_POS, STARS, WAND_POS } from '../../worlds/EnchantedForest/layout';
import { player } from '../../../systems/playerState';

export interface Objective {
  text: string;
  target: { x: number; z: number } | null;
}

export function forestObjective(stage: ForestStage, stars: string[]): Objective {
  switch (stage) {
    case 'meetFairy':
      return { text: 'Find Lumi the fairy in the middle of the forest', target: FAIRY_POS };
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
      return { text: `Collect the Wishing Stars  ${stars.length} / ${STARS.length}`, target: best };
    }
    case 'findWand':
      return { text: "Follow the light to find Lumi's wand", target: WAND_POS };
    case 'returnWand':
      return { text: 'Bring the magic wand back to Lumi', target: FAIRY_POS };
    case 'done':
      return { text: 'Hooray! You helped Lumi!', target: null };
  }
}

export const FOREST_HINTS: Record<ForestStage, string> = {
  meetFairy: 'Follow the glowing path stones to the middle of the forest!',
  collectStars: 'Look at the little map! The pink dot shows where a Wishing Star is.',
  findWand: 'Look for the tall beam of light near the waterfall!',
  returnWand: 'Lumi is waiting in the middle of the forest!',
  done: '',
};
