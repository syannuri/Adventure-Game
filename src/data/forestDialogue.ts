/** All Enchanted Forest dialogue in every language. Simple, positive, child-friendly language. */
import type { DialogueLine } from '../systems/store';
import { currentLang } from '../i18n';

const L = (speaker: DialogueLine['speaker'], text: string): DialogueLine => ({ speaker, text });

const EN = {
  lumiIntro: [
    L('anett', 'Hello! Are you a real fairy? You look a little sad.'),
    L('lumi', "Hi! I'm Lumi. Oh, Anet, I lost my magic wand! Without it, the flowers can't sparkle."),
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
    L('lumi', found === 0 ? 'The Wishing Stars twinkle in high places and hidden corners. You can do it!' : `You found ${found} of ${total} Wishing Stars! Only ${total - found} more to go!`),
    L('lumi', 'Tip: hold Shift to run, and press Space to jump onto mushrooms and stumps.'),
  ],
  allStars: [
    L('lumi', 'Anet! You found all five Wishing Stars!'),
    L('lumi', 'Look! Their light is shining over by the waterfall. My wand must be there!'),
    L('anett', "I see it! I'll go and get it!"),
  ],
  lumiFindWand: [L('lumi', 'Follow the beam of light near the waterfall. You are so close!')],
  foundWand: [L('anett', 'I found it! The magic wand! Let me bring it back to Lumi!')],
  wandLocked: [
    L('anett', 'Oh! The wand is wrapped in magic vines!'),
    L('anett', 'Look at the stone: three gems. Maybe each flower must be the same colour as the gem above it!'),
    L('anett', 'I will touch the flowers to change their colour.'),
  ],
  lumiReturn: [
    L('anett', 'Lumi! Here is your magic wand!'),
    L('lumi', 'My wand! Oh thank you, thank you, Anet! You are so brave and kind!'),
    L('lumi', 'Now watch… let the whole forest sparkle!'),
  ],
  pip: {
    meetFairy: [L('pip', "Hi there! I'm Pip. Lumi the fairy lives in the middle of the forest."), L('pip', 'She looks sad today. Maybe you can help her?')],
    findWand: [L('pip', 'Did you see that light by the waterfall? Hop hop, go and look!'), L('pip', 'Lumi once told me: the flowers must match the gems on the old stone!')],
    returnWand: [L('pip', 'Wow, a real magic wand! Lumi will be so happy!')],
    done: [L('pip', "Yay! The forest is sparkling again! Let's dance!")],
  } as Record<string, DialogueLine[]>,
  pipSecret: 'Looking for Wishing Stars? I know a secret!',
  pipAllFound: 'You found them all! Go and tell Lumi!',
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
  olliDone: [L('olli', 'Hoo-hoo! Splendid work, Anet. The whole forest is proud of you!')],
};

const ID: typeof EN = {
  lumiIntro: [
    L('anett', 'Halo! Apakah kamu peri sungguhan? Kamu kelihatan sedikit sedih.'),
    L('lumi', 'Hai! Aku Lumi. Aduh, Anet, tongkat ajaibku hilang! Tanpa tongkat itu, bunga-bunga tidak bisa berkilau.'),
    L('lumi', 'Ada lima Bintang Harapan tersembunyi di hutan. Cahayanya bisa menunjukkan di mana tongkatku!'),
    L('anett', 'Jangan khawatir, Lumi. Aku akan menemukan kelima bintang itu untukmu!'),
    L('lumi', 'Terima kasih! Lihat sekelilingmu, ikuti jalan yang bercahaya, dan melompatlah tinggi-tinggi!'),
  ],
  lumiIntroAlreadyStars: [
    L('anett', 'Halo! Apakah kamu peri sungguhan?'),
    L('lumi', 'Hai! Aku Lumi. Tongkat ajaibku hilang… Eh, tunggu! Kamu sudah menemukan semua Bintang Harapan?'),
    L('lumi', 'Hebat sekali! Cahayanya akan menunjukkan jalannya!'),
  ],
  lumiReminder: (found, total) => [
    L('lumi', found === 0 ? 'Bintang Harapan berkelip di tempat tinggi dan sudut tersembunyi. Kamu pasti bisa!' : `Kamu sudah menemukan ${found} dari ${total} Bintang Harapan! Tinggal ${total - found} lagi!`),
    L('lumi', 'Tips: tahan Shift untuk berlari, dan tekan Spasi untuk melompat ke atas jamur dan tunggul kayu.'),
  ],
  allStars: [
    L('lumi', 'Anet! Kamu menemukan kelima Bintang Harapan!'),
    L('lumi', 'Lihat! Cahayanya bersinar di dekat air terjun. Tongkatku pasti ada di sana!'),
    L('anett', 'Aku melihatnya! Aku akan mengambilnya!'),
  ],
  lumiFindWand: [L('lumi', 'Ikuti pancaran cahaya di dekat air terjun. Sedikit lagi!')],
  foundWand: [L('anett', 'Ketemu! Tongkat ajaibnya! Ayo kukembalikan ke Lumi!')],
  wandLocked: [
    L('anett', 'Oh! Tongkatnya dililit sulur ajaib!'),
    L('anett', 'Lihat batu itu: ada tiga permata. Mungkin setiap bunga harus sama warnanya dengan permata di atasnya!'),
    L('anett', 'Aku akan menyentuh bunga-bunga itu untuk mengganti warnanya.'),
  ],
  lumiReturn: [
    L('anett', 'Lumi! Ini tongkat ajaibmu!'),
    L('lumi', 'Tongkatku! Terima kasih, terima kasih, Anet! Kamu berani dan baik hati sekali!'),
    L('lumi', 'Sekarang lihat ya… biar seluruh hutan berkilau!'),
  ],
  pip: {
    meetFairy: [L('pip', 'Hai! Aku Pip. Peri Lumi tinggal di tengah hutan.'), L('pip', 'Hari ini dia kelihatan sedih. Mungkin kamu bisa menolongnya?')],
    findWand: [L('pip', 'Kamu lihat cahaya di dekat air terjun itu? Hop hop, ayo lihat ke sana!'), L('pip', 'Kata Lumi: warna bunga harus sama dengan permata di batu tua!')],
    returnWand: [L('pip', 'Wah, tongkat ajaib sungguhan! Lumi pasti senang sekali!')],
    done: [L('pip', 'Hore! Hutan berkilau lagi! Ayo kita menari!')],
  },
  pipSecret: 'Sedang mencari Bintang Harapan? Aku tahu rahasianya!',
  pipAllFound: 'Kamu sudah menemukan semuanya! Ayo beri tahu Lumi!',
  pipHints: {
    'star-mushroom': 'Aku melihat bintang di atas jamur raksasa! Lompat dari satu jamur ke jamur berikutnya!',
    'star-pond': 'Ada bintang berkelip di dekat kolam bebek!',
    'star-flowers': 'Ada bintang yang bersembunyi di padang bunga besar di ujung sana!',
    'star-stump': 'Cari tunggul kayu di dekat jalan! Ada bintang di atas tunggul yang tinggi.',
    'star-rocks': 'Panjat batu-batu loncatan di bagian belakang hutan untuk menemukan bintang!',
  },
  olli: [
    L('olli', 'Hu-hu! Halo, penjelajah cilik. Aku Olli, si burung hantu bijak.'),
    L('olli', 'Ada tiga peti harta tersembunyi di pinggir hutan. Bisakah kamu menemukan semuanya?'),
    L('olli', 'Ambil juga biji ek emas di sepanjang jalan. Hu! Mereka bersinar seperti matahari kecil.'),
  ],
  olliDone: [L('olli', 'Hu-hu! Kerja yang luar biasa, Anet. Seluruh hutan bangga padamu!')],
};

/** Dialogue in the current language. */
export function forestDialogue(): typeof EN {
  return currentLang() === 'en' ? EN : ID;
}
