/**
 * Per-world data for the HUD and the level-complete screen: counters, minimap drawing,
 * the current objective (text + map marker) and the gentle hint shown when a child seems stuck.
 */
import type { Spot } from '../components/worlds/EnchantedForest/layout';
import * as Forest from '../components/worlds/EnchantedForest/layout';
import * as Candy from '../components/worlds/CandyVillage/layout';
import * as Cave from '../components/worlds/CrystalCave/layout';
import { caveObjective } from '../components/gameplay/missions/caveObjective';
import { useGame } from '../systems/store';
import { forestObjective, FOREST_HINTS, type Objective } from '../components/gameplay/missions/forestObjective';
import { candyObjective } from '../components/gameplay/missions/candyObjective';
import { matchedCount } from '../components/gameplay/puzzles/FlowerPuzzle';
import { tr } from '../i18n';
import { musicStatus } from '../components/gameplay/puzzles/MusicFlowers';
import { duckStatus } from '../components/gameplay/sidequests/DucklingQuest';
import { riddleStatus } from '../components/gameplay/sidequests/OlliRiddles';
import { nightObjective } from '../components/gameplay/missions/NightQuest';
import { gardenStatus } from '../components/gameplay/sidequests/MagicGarden';
import { treehouseStatus } from '../components/gameplay/sidequests/TreeHouse';
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
      lines: [{ pts: Forest.STREAM.filter((_, i) => i % 4 === 0).map((p) => [p.x, p.z] as [number, number]), color: '#7fd0e0', width: Forest.STREAM_HALF * 2 }],
      landmarks: [
        { x: Forest.POND.x, z: Forest.POND.z, r: Forest.POND.r, fill: '#7fd0e0' },
        { x: Forest.FAIRY_POS.x, z: Forest.FAIRY_POS.z, r: 1.6, fill: '#b8a2ff' },
        { x: Forest.GARDEN.x, z: Forest.GARDEN.z, r: 2.3, fill: '#c9a26b' },
        { x: Forest.TREEHOUSE.x, z: Forest.TREEHOUSE.z, r: 2.4, fill: '#e0625a' },
      ],
    },
    objective: () => {
      const l = level();
      if (useGame.getState().night) return nightObjective();
      return forestObjective(l.stage as ForestStage, l.stars, l.puzzleSolved, matchedCount(l.flowers));
    },
    hint: () => (useGame.getState().night ? (level().nightStage === 'collect' ? tr().night.hint : '') : (FOREST_HINTS()[level().stage as ForestStage] ?? '')),
    side: () => {
      const l = level();
      const parts = [musicStatus(), riddleStatus(), duckStatus(), gardenStatus(), treehouseStatus(), l.bunnyQuest === 'active' ? '🐰 ' + tr().hud.bunnies(l.bunnies.length, 3) : null].filter(Boolean);
      return parts.length ? parts.join('  ·  ') : null;
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

WORLD_HUD['crystal-cave'] = {
  index: 3,
  stars: Cave.CRYSTALS,
  coins: Cave.GEMS,
  treasures: Cave.CAVE_CHESTS,
  starIcon: '◇',
  starColor: '#9b6bff',
  coinIcon: '◆',
  coinColor: '#2fb6d9',
  map: {
    ground: '#6a5f96',
    paths: Cave.PATHS,
    pathColor: '#b6a8ec',
    lines: [{ pts: [[Cave.SOURCE.x, Cave.SOURCE.z], ...Cave.MIRRORS.map((m) => [m.x, m.z] as [number, number]), [Cave.HEART.x, Cave.HEART.z]], color: '#fff3b0', width: 0.6 }],
    landmarks: [
      { x: Cave.LAKE.x, z: Cave.LAKE.z, r: Cave.LAKE.r, fill: '#5fe0e8' },
      { x: Cave.HEART.x, z: Cave.HEART.z, r: 1.8, fill: '#c9a7ff' },
    ],
  },
  objective: () => {
    const l = level();
    return caveObjective(l.stage, l.stars, l.mirrors);
  },
  hint: () => tr().caveHints[level().stage] ?? '',
};

export const worldHud = (id: string | null) => WORLD_HUD[id ?? 'enchanted-forest'] ?? WORLD_HUD['enchanted-forest'];
