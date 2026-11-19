/** All Crystal Cave dialogue in every language. Simple, positive, child-friendly language. */
import type { DialogueLine } from '../systems/store';
import { currentLang } from '../i18n';

const L = (speaker: DialogueLine['speaker'], text: string): DialogueLine => ({ speaker, text });

const EN = {
  arrive: [L('anett', 'Wow, a cave full of glowing crystals! But it is a bit dark in here…')],
  drakoIntro: [
    L('anett', 'Hello! Are you… a little dragon? Why are you sad?'),
    L('dragon', "Sniff… Hi, I'm Drako. The Heart Crystal lights up my whole cave, but it went dark!"),
    L('dragon', 'Its five little crystals rolled away. Without them, the Heart Crystal can not catch the sunlight.'),
    L('anett', "Don't worry, Drako! I'll find all five crystals for you!"),
    L('dragon', 'Thank you! One is on the tall stone pillars, one by the glowing lake, and one in the mushroom grove!'),
  ],
  drakoIntroAlready: [
    L('anett', 'Hello, little dragon! I found some shiny crystals!'),
    L('dragon', "Sniff… Oh! Those are the Heart Crystal's crystals! You found all five?! I'm Drako. Thank you!"),
  ],
  drakoReminder: (found: number, total: number) => [
    L('dragon', found === 0 ? 'The crystals are hiding all over the cave. Look at your little map!' : `You found ${found} of ${total} crystals! Only ${total - found} more!`),
  ],
  allCrystals: [L('anett', 'I found all five crystals! Let me bring them back to Drako!')],
  drakoReturn: [
    L('anett', 'Drako! Here are all five crystals!'),
    L('dragon', 'Yay! Let me put them around the Heart Crystal… there!'),
    L('dragon', 'Now the sunbeam from the hole in the roof must reach the Heart Crystal. The three mirror crystals are turned the wrong way!'),
    L('dragon', 'Touch a mirror crystal to turn it. Make the light jump from crystal to crystal!'),
  ],
  drakoPuzzle: [L('dragon', 'Touch the mirror crystals to turn them. Follow the light from the sunbeam!')],
  beamDone: [
    L('dragon', 'The light reached the Heart Crystal! Look, look!'),
    L('dragon', 'My cave is glowing again! You are the best, Anet! Wheee, I can fly again!'),
    L('anett', 'Hooray! It is so beautiful!'),
  ],
  pip: {
    meetDragon: [L('pip', 'Hop hop! It is dark and sparkly in here! The little dragon is by the big crystal in the middle.')],
    returnCrystals: [L('pip', 'You found them all! Hurry back to Drako!')],
    lightPuzzle: [L('pip', 'Follow the light, Anet! Turn each mirror until the beam reaches the next crystal!')],
    done: [L('pip', 'Everything sparkles! Hop hop hooray!')],
  } as Record<string, DialogueLine[]>,
  pipSecret: 'Looking for crystals? I know where one is!',
  pipAllFound: 'You found them all! Take them to Drako!',
  pipHints: {
    'cr-pillar': 'One is on top of the tall stone pillars in the east. Jump from pillar to pillar!',
    'cr-lake': 'One is twinkling on the shore of the glowing lake in the west.',
    'cr-mushroom': 'One is hiding in the glowing mushroom grove, south-east.',
    'cr-ledge': 'One is up on the high ledge in the north-east. Climb the steps!',
    'cr-north': 'One rolled all the way to the north, at the end of the path past the Heart Crystal.',
  } as Record<string, string>,
};

const ID: typeof EN = {
  arrive: [L('anett', 'Wah, gua yang penuh kristal bercahaya! Tapi agak gelap di sini…')],
  drakoIntro: [
    L('anett', 'Halo! Apakah kamu… naga kecil? Kenapa kamu sedih?'),
    L('dragon', 'Hiks… Hai, aku Drako. Kristal Jantung menerangi seluruh guaku, tapi sekarang padam!'),
    L('dragon', 'Lima kristal kecilnya menggelinding pergi. Tanpa mereka, Kristal Jantung tidak bisa menangkap sinar matahari.'),
    L('anett', 'Jangan khawatir, Drako! Aku akan menemukan kelima kristal itu untukmu!'),
    L('dragon', 'Terima kasih! Satu ada di pilar batu yang tinggi, satu di dekat danau bercahaya, dan satu di kebun jamur!'),
  ],
  drakoIntroAlready: [
    L('anett', 'Halo, naga kecil! Aku menemukan kristal-kristal berkilau!'),
    L('dragon', 'Hiks… Oh! Itu kristal-kristal Kristal Jantung! Kamu menemukan kelimanya?! Aku Drako. Terima kasih!'),
  ],
  drakoReminder: (found, total) => [
    L('dragon', found === 0 ? 'Kristal-kristalnya tersembunyi di seluruh gua. Lihat peta kecilmu!' : `Kamu sudah menemukan ${found} dari ${total} kristal! Tinggal ${total - found} lagi!`),
  ],
  allCrystals: [L('anett', 'Aku menemukan kelima kristal! Ayo bawa kembali ke Drako!')],
  drakoReturn: [
    L('anett', 'Drako! Ini kelima kristalnya!'),
    L('dragon', 'Horee! Aku pasang di sekeliling Kristal Jantung… selesai!'),
    L('dragon', 'Sekarang sinar matahari dari lubang di atap harus sampai ke Kristal Jantung. Tapi tiga cermin kristal menghadap ke arah yang salah!'),
    L('dragon', 'Sentuh cermin kristal untuk memutarnya. Buat cahayanya melompat dari kristal ke kristal!'),
  ],
  drakoPuzzle: [L('dragon', 'Sentuh cermin kristal untuk memutarnya. Ikuti cahaya dari sinar matahari!')],
  beamDone: [
    L('dragon', 'Cahayanya sampai ke Kristal Jantung! Lihat, lihat!'),
    L('dragon', 'Guaku bercahaya lagi! Kamu hebat sekali, Anet! Wiii, aku bisa terbang lagi!'),
    L('anett', 'Horeee! Indah sekali!'),
  ],
  pip: {
    meetDragon: [L('pip', 'Hop hop! Di sini gelap dan berkilau! Naga kecil ada di dekat kristal besar di tengah.')],
    returnCrystals: [L('pip', 'Semuanya sudah ketemu! Cepat kembali ke Drako!')],
    lightPuzzle: [L('pip', 'Ikuti cahayanya, Anet! Putar setiap cermin sampai sinarnya mengenai kristal berikutnya!')],
    done: [L('pip', 'Semuanya berkilau! Hop hop horee!')],
  },
  pipSecret: 'Mencari kristal? Aku tahu satu tempatnya!',
  pipAllFound: 'Semuanya sudah ketemu! Bawa ke Drako!',
  pipHints: {
    'cr-pillar': 'Satu ada di puncak pilar-pilar batu tinggi di sebelah timur. Lompat dari pilar ke pilar!',
    'cr-lake': 'Satu berkilau di tepi danau bercahaya di sebelah barat.',
    'cr-mushroom': 'Satu bersembunyi di kebun jamur bercahaya, di tenggara.',
    'cr-ledge': 'Satu ada di atas tebing tinggi di timur laut. Naiki tangganya!',
    'cr-north': 'Satu menggelinding jauh ke utara, di ujung jalan melewati Kristal Jantung.',
  },
};

export function caveDialogue(): typeof EN {
  return currentLang() === 'en' ? EN : ID;
}
