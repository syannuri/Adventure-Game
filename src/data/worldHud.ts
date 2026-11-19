/**
 * Per-world data for the HUD and the level-complete screen: counters, minimap drawing,
 * the current objective (text + map marker) and the gentle hint shown when a child seems stuck.
 */
import type { Spot } from '../components/worlds/EnchantedForest/layout';
import * as Forest from '../components/worlds/EnchantedForest/layout';
import * as Candy from '../components/worlds/CandyVillage/layout';
import { useGame } from '../systems/store';
import { forestObjective, FOREST_HINTS, type Objective } from '../components/gameplay/missions/forestObjective';
import { candyObjective } from '../components/gameplay/missions/candyObjective';
import { matchedCount } from '../components/gameplay/puzzles/FlowerPuzzle';
import { tr } from '../i18n';
import type { ForestStage } from '../systems/store';

export interface WorldHud {
  index: number;
  stars: Spot[];
  coins: Spot[];
  treasures: Spot[];
  starIcon: string;
  starColor: string;
  coinIcon: string;
  coinColor: string;
  map: {
    ground: string;
    paths: [number, number][][];
    pathColor: string;
    /** extra map lines (e.g. the chocolate river) */
    lines?: { pts: [number, number][]; color: string; width: number }[];
    landmarks: { x: number; z: number; r: number; fill: string }[];
  };
  objective: () => Objective;
  hint: () => string;
  /** optional side-quest line shown under the mission */
  side?: () => string | null;
}

const level = () => useGame.getState().level;

export const WORLD_HUD: Record<string, WorldHud> = {
  'enchanted-forest': {
    index: 1,
    stars: Forest.STARS,
    coins: Forest.COINS,
    treasures: Forest.TREASURES,
    starIcon: '★',
    starColor: '#f2a900',
    coinIcon: '●',
    coinColor: '#c77a10',
    map: {
      ground: '#bfe6a8',
      paths: Forest.PATHS,
      pathColor: '#e7cd98',
      landmarks: [
        { x: Forest.POND.x, z: Forest.POND.z, r: Forest.POND.r, fill: '#7fd0e0' },
        { x: Forest.FAIRY_POS.x, z: Forest.FAIRY_POS.z, r: 1.6, fill: '#b8a2ff' },
      ],
    },
    objective: () => {
      const l = level();
      return forestObjective(l.stage as ForestStage, l.stars, l.puzzleSolved, matchedCount(l.flowers));
    },
    hint: () => FOREST_HINTS()[level().stage as ForestStage] ?? '',
    side: () => {
      const l = level();
      return l.bunnyQuest === 'active' ? '🐰 ' + tr().hud.bunnies(l.bunnies.length, 3) : null;
    },
  },
  'candy-village': {
    index: 2,
    stars: Candy.INGREDIENTS,
    coins: Candy.CANDIES,
    treasures: Candy.GIFTS,
    starIcon: '❀',
    starColor: '#ff5fa2',
    coinIcon: '✺',
    coinColor: '#e8344c',
    map: {
      ground: '#ffd6e8',
      paths: Candy.PATHS,
      pathColor: '#fff3dc',
      lines: [{ pts: Candy.RIVER, color: '#8a5232', width: Candy.RIVER_W * 1.6 }],
      landmarks: [
        { x: Candy.BAKERY.x, z: Candy.BAKERY.z, r: 3.2, fill: '#ff8fbf' },
        { x: Candy.SORT.x, z: Candy.SORT.z, r: 1.4, fill: '#5ab8ff' },
        { x: Candy.FIELD.x, z: Candy.FIELD.z, r: Candy.FIELD.r, fill: '#c2f0a8' },
      ],
    },
    objective: () => {
      const l = level();
      return candyObjective(l.stage, l.stars, l.sorted, l.holding);
    },
    hint: () => tr().candyHints[level().stage] ?? '',
  },
};

export const worldHud = (id: string | null) => WORLD_HUD[id ?? 'enchanted-forest'] ?? WORLD_HUD['enchanted-forest'];
