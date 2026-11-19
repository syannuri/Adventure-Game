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
  flower_singer: { id: 'flower_singer', title: 'Flower Singer', description: "Sang all three songs of Lumi's singing flowers.", icon: '♫' },
  crystal_keeper: { id: 'crystal_keeper', title: 'Crystal Keeper', description: 'Lit up the Crystal Cave for Drako.', icon: '◇' },
  light_master: { id: 'light_master', title: 'Light Master', description: 'Guided the sunbeam to the Heart Crystal.', icon: '✧' },
  gem_collector: { id: 'gem_collector', title: 'Gem Collector', description: 'Collected every little gem in the Crystal Cave.', icon: '◆' },
  pillar_climber: { id: 'pillar_climber', title: 'Pillar Climber', description: 'Reached the crystal on the tallest stone pillar.', icon: '▲' },
  night_light: { id: 'night_light', title: 'Light Bringer', description: "Lit every lantern for Lumi's Light Party.", icon: '☾' },
  sky_hopper: { id: 'sky_hopper', title: 'Spring Jumper', description: 'Bounced up to the lantern treasure in the giant tree.', icon: '⇑' },
  riddle_solver: { id: 'riddle_solver', title: 'Clever Explorer', description: "Solved all of Olli's animal riddles.", icon: '?' },
  lily_hopper: { id: 'lily_hopper', title: 'Lily Hopper', description: 'Hopped across the lily pads to the golden lotus.', icon: '❁' },
  forest_champion: { id: 'forest_champion', title: 'Forest Champion', description: 'Won the Great Forest Match against Grumble.', icon: '♛' },
  kusut_friend: { id: 'kusut_friend', title: 'Monster Friend', description: 'Made friends with Grumble the messy monster.', icon: '♥' },
  tree_house: { id: 'tree_house', title: 'Tree House Builder', description: 'Built a whole tree house in the oak tree.', icon: '⌂' },
  swing_high: { id: 'swing_high', title: 'Swing High', description: 'Had a swing on the tree-house swing.', icon: '◡' },
  leaf_racer: { id: 'leaf_racer', title: 'Leaf Racer', description: 'Beat the duck in the leaf race down the stream.', icon: '❧' },
  bubble_catcher: { id: 'bubble_catcher', title: 'Bubble Catcher', description: 'Popped every bubble in one leaf race.', icon: '○' },
  green_thumb: { id: 'green_thumb', title: 'Little Gardener', description: 'Grew your first plant in the magic garden.', icon: '❦' },
  rainbow_garden: { id: 'rainbow_garden', title: 'Rainbow Garden', description: 'Grew all three magic plants in the garden.', icon: '✿' },
  duck_helper: { id: 'duck_helper', title: 'Duck Helper', description: 'Brought all four ducklings home to Mama Duck.', icon: '◒' },
  sticker_collector: { id: 'sticker_collector', title: 'Sticker Collector', description: 'Filled the whole animal sticker book.', icon: '▣' },
  stylish: { id: 'stylish', title: 'Stylish Explorer', description: "Bought something nice at Kiki's shop.", icon: '✿' },
  bunny_friend: { id: 'bunny_friend', title: 'Bunny Buddy', description: "Found all of Pip's little brothers.", icon: '♥' },
  candy_helper: { id: 'candy_helper', title: 'Candy Hero', description: 'Helped Koko bake the Rainbow Cake.', icon: '❀' },
  sorting_star: { id: 'sorting_star', title: 'Sorting Star', description: 'Sorted every candy into the right jar.', icon: '✚' },
  donut_hopper: { id: 'donut_hopper', title: 'Donut Hopper', description: 'Reached the top of the donut tower.', icon: '◎' },
  candy_collector: { id: 'candy_collector', title: 'Peppermint Collector', description: 'Collected every peppermint candy in Candy Village.', icon: '✺' },
};
