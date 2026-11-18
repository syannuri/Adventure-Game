import type { Stage } from '../../../systems/store';
import { INGREDIENTS, KOKO_POS, SORT, SORT_CANDIES, SORT_COLORS } from '../../worlds/CandyVillage/layout';
import { player } from '../../../systems/playerState';
import { tr } from '../../../i18n';
import type { Objective } from './forestObjective';

export function candyObjective(stage: Stage, found: string[], sorted: string[], holding: string | null): Objective {
  const t = tr().candyObjectives;
  switch (stage) {
    case 'meetChef':
      return { text: t.meetChef, target: KOKO_POS };
    case 'collectIngredients': {
      let best: { x: number; z: number } | null = null;
      let bd = Infinity;
      for (const s of INGREDIENTS) {
        if (found.includes(s.id)) continue;
        const d = Math.hypot(s.x - player.position.x, s.z - player.position.z);
        if (d < bd) {
          bd = d;
          best = s;
        }
      }
      return { text: t.collect(found.length, INGREDIENTS.length), target: best };
    }
    case 'returnIngredients':
      return { text: t.returnIngredients, target: KOKO_POS };
    case 'sortCandy': {
      const held = holding ? SORT_CANDIES.find((c) => c.id === holding) : null;
      if (held) return { text: t.holding(tr().candyColors[held.color]), target: SORT };
      return { text: t.sortCandy(sorted.length, SORT_CANDIES.length), target: SORT };
    }
    default:
      return { text: t.done, target: null };
  }
}

export { SORT_COLORS };
