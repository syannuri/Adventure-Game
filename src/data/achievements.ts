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
  bunny_friend: { id: 'bunny_friend', title: 'Bunny Buddy', description: "Found all of Pip's little brothers.", icon: '♥' },
  candy_helper: { id: 'candy_helper', title: 'Candy Hero', description: 'Helped Koko bake the Rainbow Cake.', icon: '❀' },
  sorting_star: { id: 'sorting_star', title: 'Sorting Star', description: 'Sorted every candy into the right jar.', icon: '✚' },
  donut_hopper: { id: 'donut_hopper', title: 'Donut Hopper', description: 'Reached the top of the donut tower.', icon: '◎' },
  candy_collector: { id: 'candy_collector', title: 'Peppermint Collector', description: 'Collected every peppermint candy in Candy Village.', icon: '✺' },
};
