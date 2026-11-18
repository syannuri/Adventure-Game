export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // short symbol rendered in a badge
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_star: { id: 'first_star', title: 'First Sparkle', description: 'Found your very first Wishing Star.', icon: '★' },
  fairy_friend: { id: 'fairy_friend', title: 'Fairy Friend', description: 'Helped Lumi find her magic wand.', icon: '✦' },
  coin_collector: { id: 'coin_collector', title: 'Acorn Collector', description: 'Collected every golden acorn in the forest.', icon: '●' },
  treasure_hunter: { id: 'treasure_hunter', title: 'Treasure Hunter', description: 'Found all hidden treasure chests.', icon: '◆' },
  dancer: { id: 'dancer', title: 'Forest Dancer', description: 'Danced with the woodland friends.', icon: '♪' },
  puzzle_master: { id: 'puzzle_master', title: 'Flower Wizard', description: 'Solved the colour flower puzzle.', icon: '✿' },
  high_jumper: { id: 'high_jumper', title: 'Mushroom Hopper', description: 'Reached the top of the giant mushrooms.', icon: '▲' },
};
