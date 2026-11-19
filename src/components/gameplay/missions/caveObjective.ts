import type { Stage } from '../../../systems/store';
import { CRYSTALS, DRAKO_POS, MIRRORS } from '../../worlds/CrystalCave/layout';
import { player } from '../../../systems/playerState';
import { tr } from '../../../i18n';
import type { Objective } from './forestObjective';
import { beamReach } from '../puzzles/LightPuzzle';

export function caveObjective(stage: Stage, found: string[], mirrors: number[]): Objective {
  const t = tr().caveObjectives;
  switch (stage) {
    case 'meetDragon':
      return { text: t.meetDragon, target: DRAKO_POS };
    case 'collectCrystals': {
      let best: { x: number; z: number } | null = null;
      let bd = Infinity;
      for (const s of CRYSTALS) {
        if (found.includes(s.id)) continue;
        const d = Math.hypot(s.x - player.position.x, s.z - player.position.z);
        if (d < bd) {
          bd = d;
          best = s;
        }
      }
      return { text: t.collect(found.length, CRYSTALS.length), target: best };
    }
    case 'returnCrystals':
      return { text: t.returnCrystals, target: DRAKO_POS };
    case 'lightPuzzle': {
      const reach = beamReach(mirrors);
      return { text: t.lightPuzzle(reach), target: MIRRORS[Math.min(reach, MIRRORS.length - 1)] };
    }
    default:
      return { text: t.done, target: null };
  }
}
