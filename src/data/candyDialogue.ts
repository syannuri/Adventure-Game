/** All Candy Village dialogue in every language. Simple, positive, child-friendly language. */
import type { DialogueLine } from '../systems/store';
import { currentLang } from '../i18n';

const L = (speaker: DialogueLine['speaker'], text: string): DialogueLine => ({ speaker, text });

const EN = {
  arrive: [L('anett', 'Wow! Everything here is made of candy! Lollipop trees… and a chocolate river!')],
  kokoIntro: [
    L('anett', 'Hello! Are you a cookie? You look worried.'),
    L('koko', "Oh! Hello, I'm Koko, the candy chef! Tonight is the big Candy Party, and I must bake the Rainbow Cake…"),
    L('koko', 'But a naughty wind blew my five ingredients all over the village! And my candy jars got all mixed up!'),
    L('anett', "Don't worry, Koko! I'll find your ingredients!"),
    L('koko', 'Thank you! Look for the strawberry, the chocolate, the honey, the sugar crystals and the mint leaf!'),
    L('koko', 'Some are up high, so jump on the donuts and marshmallows. You can even walk through the chocolate river!'),
  ],
  kokoIntroAlready: [
    L('anett', 'Hello! Are you the candy chef? I found some ingredients!'),
    L('koko', "Hello, I'm Koko! Oh my sprinkles… you found ALL five ingredients already? You're amazing!"),
  ],
  kokoReminder: (found: number, total: number) => [
    L('koko', found === 0 ? 'The ingredients are hiding all over the village. Look at your little map!' : `You found ${found} of ${total} ingredients! Only ${total - found} more!`),
  ],
  allIngredients: [L('anett', 'I found all five ingredients! Let me bring them back to Koko at the bakery!')],
  kokoReturn: [
    L('anett', 'Koko! Here are all your ingredients!'),
    L('koko', 'Hooray! Strawberry, chocolate, honey, sugar and mint! Thank you, Anet!'),
    L('koko', 'Now one last thing: the candy machine needs the candies sorted. Can you help?'),
    L('koko', 'Pick up a candy from the tray and put it in the jar with the same colour. Pink with pink, yellow with yellow, blue with blue!'),
  ],
  kokoSorting: [L('koko', 'Put each candy in the jar with the same colour and shape. You can do it!')],
  wrongJar: (candy: string, jar: string) => [L('anett', `Hmm, this candy is ${candy}, but this jar is ${jar}. Let me find the ${candy} jar!`)],
  sortDone: [
    L('koko', 'You sorted every candy! Listen… the candy machine is working!'),
    L('koko', 'Here it comes… the RAINBOW CAKE! The Candy Party is saved!'),
    L('anett', 'Yay! It looks so yummy!'),
  ],
  colorNames: ['pink', 'yellow', 'blue'],
  pip: {
    meetChef: [L('pip', 'Hop hop! Anet, I came along too! Koko the chef is at the big cupcake bakery.'), L('pip', 'He looks very worried. Go and say hello!')],
    returnIngredients: [L('pip', 'You have everything! Hurry back to Koko at the bakery!')],
    sortCandy: [L('pip', 'Pink, yellow, blue… match the candy to the jar! Hop hop!')],
    done: [L('pip', 'Rainbow Cake! Yummy! This is the best party ever!')],
  } as Record<string, DialogueLine[]>,
  pipSecret: 'Looking for ingredients? I know where one is!',
  pipAllFound: 'You found them all! Take them to Koko!',
  pipHints: {
    'ing-strawberry': 'The strawberry is in the strawberry field to the east, between the giant strawberries!',
    'ing-choco': 'I saw chocolate on the cookie bridge over the chocolate river!',
    'ing-honey': 'The honey jar is on top of the donut tower in the west. Jump from donut to donut!',
    'ing-sugar': 'The sugar crystals are on the big cake across the river. Climb the marshmallows!',
    'ing-mint': 'The mint leaf is in the candy cane garden across the river, past the bridge!',
  } as Record<string, string>,
};

const ID: typeof EN = {
  arrive: [L('anett', 'Wah! Semuanya di sini terbuat dari permen! Pohon lolipop… dan sungai cokelat!')],
  kokoIntro: [
    L('anett', 'Halo! Apakah kamu kue? Kamu kelihatan khawatir.'),
    L('koko', 'Oh! Halo, aku Koko, koki permen! Malam ini ada Pesta Permen besar, dan aku harus membuat Kue Pelangi…'),
    L('koko', 'Tapi angin nakal menerbangkan lima bahan kueku ke seluruh desa! Dan toples permenku jadi tercampur semua!'),
    L('anett', 'Jangan khawatir, Koko! Aku akan mencari bahan-bahanmu!'),
    L('koko', 'Terima kasih! Carilah stroberi, cokelat, madu, kristal gula, dan daun mint!'),
    L('koko', 'Ada yang di tempat tinggi, jadi melompatlah ke atas donat dan marshmallow. Kamu juga boleh menyeberangi sungai cokelat!'),
  ],
  kokoIntroAlready: [
    L('anett', 'Halo! Apakah kamu koki permen? Aku menemukan beberapa bahan!'),
    L('koko', 'Halo, aku Koko! Astaga… kamu sudah menemukan KELIMA bahannya? Kamu hebat sekali!'),
  ],
  kokoReminder: (found, total) => [
    L('koko', found === 0 ? 'Bahan-bahannya tersembunyi di seluruh desa. Lihat peta kecilmu!' : `Kamu sudah menemukan ${found} dari ${total} bahan! Tinggal ${total - found} lagi!`),
  ],
  allIngredients: [L('anett', 'Aku menemukan kelima bahan! Ayo bawa kembali ke Koko di toko kue!')],
  kokoReturn: [
    L('anett', 'Koko! Ini semua bahan-bahanmu!'),
    L('koko', 'Horeee! Stroberi, cokelat, madu, gula, dan mint! Terima kasih, Anet!'),
    L('koko', 'Satu hal lagi: mesin permen perlu permen yang sudah disortir. Maukah kamu membantu?'),
    L('koko', 'Ambil permen dari nampan, lalu masukkan ke toples yang warnanya sama. Merah muda dengan merah muda, kuning dengan kuning, biru dengan biru!'),
  ],
  kokoSorting: [L('koko', 'Masukkan setiap permen ke toples yang warna dan bentuknya sama. Kamu pasti bisa!')],
  wrongJar: (candy, jar) => [L('anett', `Hmm, permen ini ${candy}, tapi toples ini ${jar}. Ayo cari toples yang ${candy}!`)],
  sortDone: [
    L('koko', 'Kamu sudah menyortir semua permen! Dengar… mesin permennya bekerja!'),
    L('koko', 'Ini dia… KUE PELANGI! Pesta Permen terselamatkan!'),
    L('anett', 'Horeee! Kelihatannya enak sekali!'),
  ],
  colorNames: ['merah muda', 'kuning', 'biru'],
  pip: {
    meetChef: [L('pip', 'Hop hop! Anet, aku ikut juga! Koko si koki ada di toko kue cupcake yang besar.'), L('pip', 'Dia kelihatan khawatir sekali. Ayo sapa dia!')],
    returnIngredients: [L('pip', 'Bahannya sudah lengkap! Cepat kembali ke Koko di toko kue!')],
    sortCandy: [L('pip', 'Merah muda, kuning, biru… cocokkan permen dengan toplesnya! Hop hop!')],
    done: [L('pip', 'Kue Pelangi! Nyam! Ini pesta terbaik!')],
  },
  pipSecret: 'Mencari bahan kue? Aku tahu satu tempatnya!',
  pipAllFound: 'Semuanya sudah ketemu! Bawa ke Koko!',
  pipHints: {
    'ing-strawberry': 'Stroberinya ada di kebun stroberi di sebelah timur, di antara stroberi raksasa!',
    'ing-choco': 'Aku melihat cokelat di atas jembatan kue di sungai cokelat!',
    'ing-honey': 'Toples madunya ada di puncak menara donat di sebelah barat. Lompat dari donat ke donat!',
    'ing-sugar': 'Kristal gulanya ada di atas kue besar di seberang sungai. Panjat marshmallow-nya!',
    'ing-mint': 'Daun mint ada di taman tongkat permen di seberang sungai, lewat jembatan!',
  },
};

export function candyDialogue(): typeof EN {
  return currentLang() === 'en' ? EN : ID;
}
