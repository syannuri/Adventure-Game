export interface WorldInfo {
  id: string;
  index: number;
  name: string;
  tagline: string;
  mission: string;
  /** Is the world playable in this build? Worlds that are not built yet are shown as "coming soon". */
  built: boolean;
  colors: [string, string];
}

export const WORLDS: WorldInfo[] = [
  {
    id: 'enchanted-forest',
    index: 1,
    name: 'Enchanted Forest',
    tagline: 'Giant trees, glowing flowers and a fairy who needs help.',
    mission: "Help Lumi the fairy find her magic wand.",
    built: true,
    colors: ['#5fbf6f', '#1f6b4a'],
  },
  {
    id: 'candy-village',
    index: 2,
    name: 'Candy Village',
    tagline: 'Lollipop trees and chocolate rivers.',
    mission: 'Help the candy makers find missing ingredients.',
    built: true,
    colors: ['#ff9ccf', '#c2508f'],
  },
  {
    id: 'crystal-cave',
    index: 3,
    name: 'Crystal Cave',
    tagline: 'Glowing crystals under the mountain.',
    mission: 'Collect five crystals and solve the light puzzle.',
    built: false,
    colors: ['#8fd8ff', '#4b4bbd'],
  },
  {
    id: 'ocean-kingdom',
    index: 4,
    name: 'Ocean Kingdom',
    tagline: 'Coral reefs and sunken treasure.',
    mission: 'Help rescue a baby sea turtle.',
    built: false,
    colors: ['#5fe0d6', '#1c6aa3'],
  },
  {
    id: 'sky-castle',
    index: 5,
    name: 'Sky Castle',
    tagline: 'Floating islands and rainbow bridges.',
    mission: 'Find the magic stars and open the Crystal Castle.',
    built: false,
    colors: ['#ffd27a', '#8a6bdc'],
  },
];
