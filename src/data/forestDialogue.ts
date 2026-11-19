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
  olliDone: [L('olli', 'Hoo-hoo! Splendid work, Anet. The whole forest is proud of you!')],  springFound: [L('anett', 'A blue mushroom that wobbles like jelly! If I jump on it, maybe it bounces me up to that lantern in the tree!')],
  lanternOpen: [L('anett', 'A lantern treasure, high up in the tree! It is full of golden acorns!')],
  riddleIntro: [
    L('olli', 'Hoo-hoo! Do you like riddles, Anet? I have three animal riddles for you.'),
    L('olli', 'Listen carefully, then go and find the animal. When you are close to it, you have the answer!'),
  ],
  riddles: [
    'I am white and round, I swim on the pond, and I say "quack quack"! Who am I?',
    'I have colourful wings, I flutter from flower to flower, and I was once a caterpillar! Who am I?',
    'I have a big fluffy tail, I love acorns, and I have a little shop in the forest! Who am I?',
  ],
  riddleAnswers: ['the duck', 'the butterfly', 'the squirrel'],
  riddleRight: (answer: string) => [L('olli', `Hoo! Correct, it is ${answer}! Here comes the next riddle…`)],
  riddleCorrect: (answer: string) => [L('olli', `Hoo! Correct, it is ${answer}!`)],
  riddleDone: [L('olli', 'Hoo-hoo-hooray! You solved every riddle. You are a very clever explorer! Here, some acorns for you.')],
  duckIntro: [
    L('duck', 'Quack quack! Oh dear, oh dear! My four little ducklings wandered off into the forest!'),
    L('duck', 'They peep when they are scared. Can you find them and bring them home to the pond?'),
    L('anett', "Of course, Mama Duck! I'll bring them all back!"),
  ],
  duckReminder: (n: number, t: number) => [L('duck', n ? `Quack! You found ${n} of my ${t} ducklings! Listen for the peeping!` : 'Listen for little peeps! My ducklings are somewhere in the forest.')],
  duckHints: {
    'duckling-1': 'One waddled toward the path where you came into the forest.',
    'duckling-2': 'One followed the path west, past the owl.',
    'duckling-3': 'One went to the stepping rocks at the back of the forest.',
    'duckling-4': 'One is near the far north edge, by the acorn path.',
  } as Record<string, string>,
  duckThanks: [
    L('duck', 'My babies! All four of them! Quack quack hooray!'),
    L('duck', 'Thank you, Anet! Come on, little ones, swimming time!'),
  ],
  lilyFound: [L('anett', 'Ooh, lily pads! If I jump from pad to pad, I can reach that little island with the golden flower!')],
  lilySplash: [L('anett', 'Splash! Brr, a bit wet. Let me try again, one hop at a time!')],
  lotusPicked: [L('anett', 'A golden lotus! It is full of shiny acorns!')],
  kikiHello: [
    L('kiki', "Chitter-chatter! Hello, I'm Kiki! Welcome to my little shop!"),
    L('kiki', 'I trade pretty things for golden acorns. Here, a little welcome present: five acorns for you!'),
  ],
  kikiAgain: [L('kiki', 'Chitter! Come and see what I have today!')],
  musicFound: [
    L('anett', 'Wow, these giant flowers can sing! Every flower sings a different note.'),
    L('anett', 'If I touch the magic bud in the middle, they sing a song. Then I step on the flowers in the same order!'),
  ],
  musicAgain: [L('anett', 'Oops, that was a different flower. Let me listen one more time!')],
  musicWin: [
    L('anett', 'I sang all three flower songs!'),
    L('anett', 'Now the flowers can play any song I like. La la la!'),
  ],
  bunnyIntro: [
    L('pip', 'Oh, Anet! My three little brothers are playing hide-and-seek, and now they won\'t come home!'),
    L('pip', 'They giggle when someone comes close. Listen carefully: the louder the giggle, the closer you are!'),
    L('anett', "I'm good at hide-and-seek! I'll find them all, Pip!"),
  ],
  bunnyHints: {
    'bunny-bush': 'One loves hiding behind a big bush, to the left of where you came into the forest.',
    'bunny-log': 'One always crawls into the fallen log on the sunny east side.',
    'bunny-tree': 'One is hiding behind the giant lantern tree, near the owl.',
  } as Record<string, string>,
  bunnyReminder: (n: number, t: number) => `You found ${n} of ${t}. Listen for the giggles!`,
  bunnyAllFound: 'You found everyone! Bring them back to me, please!',
  bunnyThanks: [
    L('pip', 'My little brothers! You found all three! Thank you, Anet!'),
    L('pip', 'Hop hop hooray! You are the best hide-and-seek player in the whole forest!'),
  ],
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
  olliDone: [L('olli', 'Hu-hu! Kerja yang luar biasa, Anet. Seluruh hutan bangga padamu!')],  springFound: [L('anett', 'Jamur biru yang bergoyang seperti agar-agar! Kalau aku melompat di atasnya, mungkin aku terpental sampai ke lentera di pohon itu!')],
  lanternOpen: [L('anett', 'Harta lentera di atas pohon! Isinya biji ek emas!')],
  riddleIntro: [
    L('olli', 'Hu-hu! Kamu suka teka-teki, Anet? Aku punya tiga teka-teki hewan untukmu.'),
    L('olli', 'Dengarkan baik-baik, lalu cari hewannya. Kalau kamu sudah dekat dengannya, berarti jawabanmu benar!'),
  ],
  riddles: [
    'Aku putih dan bulat, aku berenang di kolam, dan aku bilang "kwek kwek"! Siapakah aku?',
    'Sayapku berwarna-warni, aku terbang dari bunga ke bunga, dan dulu aku seekor ulat! Siapakah aku?',
    'Ekorku besar dan lebat, aku suka biji ek, dan aku punya toko kecil di hutan! Siapakah aku?',
  ],
  riddleAnswers: ['bebek', 'kupu-kupu', 'tupai'],
  riddleRight: (answer) => [L('olli', `Hu! Benar, jawabannya ${answer}! Ini teka-teki berikutnya…`)],
  riddleCorrect: (answer) => [L('olli', `Hu! Benar, jawabannya ${answer}!`)],
  riddleDone: [L('olli', 'Hu-hu-horee! Kamu menjawab semua teka-teki. Kamu penjelajah yang pintar sekali! Ini biji ek untukmu.')],
  duckIntro: [
    L('duck', 'Kwek kwek! Aduh, aduh! Empat anak bebekku tersesat ke dalam hutan!'),
    L('duck', 'Kalau takut, mereka bercicit. Maukah kamu mencari dan mengantar mereka pulang ke kolam?'),
    L('anett', 'Tentu, Mama Bebek! Aku akan membawa mereka semua pulang!'),
  ],
  duckReminder: (n, t) => [L('duck', n ? `Kwek! Kamu sudah menemukan ${n} dari ${t} anakku! Dengarkan cicitannya!` : 'Dengarkan cicitan kecil! Anak-anakku ada di suatu tempat di hutan.')],
  duckHints: {
    'duckling-1': 'Satu berjalan ke arah jalan tempat kamu masuk ke hutan.',
    'duckling-2': 'Satu mengikuti jalan ke barat, melewati burung hantu.',
    'duckling-3': 'Satu pergi ke batu-batu pijakan di bagian belakang hutan.',
    'duckling-4': 'Satu ada di ujung utara, dekat jalan biji ek.',
  },
  duckThanks: [
    L('duck', 'Anak-anakku! Keempatnya! Kwek kwek horee!'),
    L('duck', 'Terima kasih, Anet! Ayo anak-anak, waktunya berenang!'),
  ],
  lilyFound: [L('anett', 'Wah, daun teratai! Kalau aku melompat dari daun ke daun, aku bisa sampai ke pulau kecil dengan bunga emas itu!')],
  lilySplash: [L('anett', 'Byur! Brr, sedikit basah. Ayo coba lagi, satu lompatan demi satu lompatan!')],
  lotusPicked: [L('anett', 'Teratai emas! Isinya biji ek yang berkilau!')],
  kikiHello: [
    L('kiki', 'Cicit-cicit! Halo, aku Kiki! Selamat datang di toko kecilku!'),
    L('kiki', 'Aku menukar barang-barang cantik dengan biji ek emas. Ini hadiah kecil untukmu: lima biji ek!'),
  ],
  kikiAgain: [L('kiki', 'Cicit! Ayo lihat barang-barangku hari ini!')],
  musicFound: [
    L('anett', 'Wah, bunga-bunga raksasa ini bisa bernyanyi! Setiap bunga punya nada yang berbeda.'),
    L('anett', 'Kalau aku sentuh kuncup ajaib di tengah, mereka menyanyikan lagu. Lalu aku injak bunganya dengan urutan yang sama!'),
  ],
  musicAgain: [L('anett', 'Ups, itu bunga yang lain. Ayo dengarkan sekali lagi!')],
  musicWin: [
    L('anett', 'Aku berhasil menyanyikan ketiga lagu bunga!'),
    L('anett', 'Sekarang bunga-bunga bisa memainkan lagu apa saja. La la la!'),
  ],
  bunnyIntro: [
    L('pip', 'Oh, Anet! Tiga adik kecilku sedang main petak umpet, dan sekarang mereka tidak mau pulang!'),
    L('pip', 'Mereka suka cekikikan kalau ada yang mendekat. Dengarkan baik-baik: makin keras cekikikannya, makin dekat kamu!'),
    L('anett', 'Aku jago main petak umpet! Aku akan menemukan mereka semua, Pip!'),
  ],
  bunnyHints: {
    'bunny-bush': 'Satu suka bersembunyi di balik semak besar, di sebelah kiri tempat kamu masuk ke hutan.',
    'bunny-log': 'Satu selalu masuk ke batang kayu tumbang di sisi timur yang cerah.',
    'bunny-tree': 'Satu bersembunyi di balik pohon lentera raksasa, dekat burung hantu.',
  },
  bunnyReminder: (n, t) => `Kamu sudah menemukan ${n} dari ${t}. Dengarkan cekikikannya!`,
  bunnyAllFound: 'Semuanya sudah ketemu! Tolong bawa mereka kembali padaku!',
  bunnyThanks: [
    L('pip', 'Adik-adikku! Kamu menemukan ketiganya! Terima kasih, Anet!'),
    L('pip', 'Hop hop horee! Kamu pemain petak umpet terhebat di seluruh hutan!'),
  ],
};

/** Dialogue in the current language. */
export function forestDialogue(): typeof EN {
  return currentLang() === 'en' ? EN : ID;
}
