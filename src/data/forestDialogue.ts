/** All Enchanted Forest dialogue. Simple, positive, child-friendly language. */
import type { DialogueLine } from '../systems/store';

const L = (speaker: DialogueLine['speaker'], text: string): DialogueLine => ({ speaker, text });

export const FOREST_DIALOGUE = {
  lumiIntro: [
    L('anett', 'Hello! Are you a real fairy? You look a little sad.'),
    L('lumi', "Hi! I'm Lumi. Oh, Anett, I lost my magic wand! Without it, the flowers can't sparkle."),
    L('lumi', 'Five Wishing Stars are hidden in the forest. Their light can show us where my wand is!'),
    L('anett', "Don't worry, Lumi. I'll find all five stars for you!"),
    L('lumi', 'Thank you! Look around, follow the glowing paths, and jump up high!'),
  ],
  lumiIntroAlreadyStars: [
    L('anett', 'Hello! Are you a real fairy?'),
    L('lumi', "Hi! I'm Lumi. I lost my magic wand… Wait! You already found all the Wishing Stars?"),
    L('lumi', 'Wonderful! Their light will show us the way!'),
  ],
  lumiReminder: (found: number, total: number) => [
    L('lumi', found === 0 ? `The Wishing Stars twinkle in high places and hidden corners. You can do it!` : `You found ${found} of ${total} Wishing Stars! Only ${total - found} more to go!`),
    L('lumi', 'Tip: hold Shift to run, and press Space to jump onto mushrooms and stumps.'),
  ],
  allStars: [
    L('lumi', 'Anett! You found all five Wishing Stars!'),
    L('lumi', 'Look! Their light is shining over by the waterfall. My wand must be there!'),
    L('anett', "I see it! I'll go and get it!"),
  ],
  lumiFindWand: [L('lumi', 'Follow the beam of light near the waterfall. You are so close!')],
  foundWand: [L('anett', 'I found it! The magic wand! Let me bring it back to Lumi!')],
  lumiReturn: [
    L('anett', 'Lumi! Here is your magic wand!'),
    L('lumi', 'My wand! Oh thank you, thank you, Anett! You are so brave and kind!'),
    L('lumi', 'Now watch… let the whole forest sparkle!'),
  ],
  pip: {
    meetFairy: [
      L('pip', "Hi there! I'm Pip. Lumi the fairy lives in the middle of the forest."),
      L('pip', 'She looks sad today. Maybe you can help her?'),
    ],
    findWand: [L('pip', 'Did you see that light by the waterfall? Hop hop, go and look!')],
    returnWand: [L('pip', 'Wow, a real magic wand! Lumi will be so happy!')],
    done: [L('pip', 'Yay! The forest is sparkling again! Let\'s dance!')],
  },
  pipHints: {
    'star-mushroom': 'I saw a star on top of the giant mushrooms! Jump from one mushroom to the next!',
    'star-pond': 'One star is twinkling near the pond with the ducks!',
    'star-flowers': 'There is a star hiding in the big flower meadow on the far side!',
    'star-stump': 'Look for the tree stumps by the path! A star is sitting on the tall one.',
    'star-rocks': 'Climb the stepping rocks at the back of the forest to find a star!',
  } as Record<string, string>,
  olli: [
    L('olli', 'Hoo-hoo! Hello, young explorer. I am Olli, the wise owl.'),
    L('olli', 'Three treasure chests are hidden near the edges of the forest. Can you find them all?'),
    L('olli', 'And pick up the golden acorns along the paths. Hoo! They shine like little suns.'),
  ],
  olliDone: [L('olli', 'Hoo-hoo! Splendid work, Anett. The whole forest is proud of you!')],
};
