/** Si Kusut chapter dialogue in every language. Cheeky but never mean; the ending is about friendship. */
import type { DialogueLine } from '../systems/store';
import { currentLang } from '../i18n';

const L = (speaker: DialogueLine['speaker'], text: string): DialogueLine => ({ speaker, text });

const EN = {
  arrive: [
    L('lumi', 'Anet! Something strange happened in the forest! Thorny bushes are blocking the paths, and my little bells are gone!'),
    L('kusut', 'Hehehe! That was me! I am Grumble, the messiest monster in the whole forest!'),
    L('kusut', 'I put thorny bushes on the paths and I took all the bells. Catch me if you can! Hehehe!'),
    L('anett', 'Hey! That is not nice! Lumi, what can I do?'),
    L('lumi', 'Use my magic wand! Its light makes the thorny bushes shrink away. Then go after Grumble!'),
  ],
  bramble: [L('anett', 'Shine, little wand! The thorny bush is shrinking away!')],
  bramblesDone: [L('anett', 'All the paths are free again! Now, where is Grumble hiding?')],
  caught: [
    L('kusut', 'Oops, you found me! Here, take a bell. But you will not catch me again! Hehe!'),
    L('kusut', 'Grrr, you are fast! Fine, here is another bell. Bye-bye!'),
    L('kusut', 'Not again! Okay, okay, a bell for you. Catch me one more time if you can!'),
  ],
  challenge: [
    L('kusut', 'Hmph! You caught me four times and got all the bells back!'),
    L('kusut', 'But I bet you can not beat me in a real match! Three games: a leaf race, catching fireflies and tug of war!'),
    L('kusut', 'Come to the flower meadow. If you win, I will stop making a mess. Promise!'),
    L('anett', 'Deal! Let us play!'),
  ],
  matchStart: [
    L('kusut', 'Welcome to the Great Forest Match! Whoever wins two games is the champion!'),
    L('kusut', 'Game one: the leaf race down the stream! Hop on your leaf, I am taking the other one!'),
  ],
  round2: [L('kusut', 'Game two: catching fireflies in the meadow! Whoever catches more in 30 seconds wins!')],
  round3: [L('kusut', 'Game three: tug of war! Press as fast as you can to pull the rope! Ready?')],
  roundWin: [L('kusut', 'Grrr, you won this game!'), L('kusut', 'What? You won again?!'), L('kusut', 'Oh no, you are too strong!')],
  roundLose: [L('kusut', 'Hehe, I won this one!'), L('kusut', 'Ha! This game is mine!'), L('kusut', 'Hehe, I pulled harder!')],
  rematch: [
    L('kusut', 'Hehehe! I won the match! But you played really well...'),
    L('anett', 'Let us play again! I will try even harder!'),
    L('kusut', 'Okay! Rematch! From the first game!'),
  ],
  victory: [
    L('kusut', 'You won the Great Forest Match... you are the champion, Anet!'),
    L('kusut', 'Sniff... I only made a mess because I was lonely. Nobody ever played with me.'),
    L('anett', 'Oh, Grumble! You can just ask us to play! We can be friends!'),
    L('lumi', 'Of course! Everyone in the forest loves to play. Welcome, Grumble!'),
    L('kusut', 'Really?! Friends?! Yaaay! I promise to be a good friend! Let us have a party!'),
  ],
  lumiHint: {
    arrive: [L('lumi', 'Grumble ran off! First let us clear the thorny bushes.')],
    brambles: [L('lumi', 'Touch a thorny bush with the wand to make it shrink away. Look at your little map!')],
    chase: [L('lumi', 'Grumble is hiding somewhere in the forest. Follow the marker on your map and catch him!')],
    arena: [L('lumi', 'Grumble is waiting in the flower meadow in the north-west. Good luck in the match!')],
    match: [L('lumi', 'You can do it, Anet! Everyone is cheering for you!')],
    done: [L('lumi', 'What a lovely party! Grumble is our friend now.')],
  } as Record<string, DialogueLine[]>,
};

const ID: typeof EN = {
  arrive: [
    L('lumi', 'Anet! Ada yang aneh di hutan! Semak berduri menutupi jalan, dan lonceng-lonceng kecilku hilang!'),
    L('kusut', 'Hehehe! Itu aku! Aku Si Kusut, monster paling berantakan di seluruh hutan!'),
    L('kusut', 'Aku menaruh semak berduri di jalan dan mengambil semua lonceng. Tangkap aku kalau bisa! Hehehe!'),
    L('anett', 'Hei! Itu tidak baik! Lumi, apa yang bisa aku lakukan?'),
    L('lumi', 'Pakai tongkat ajaibku! Cahayanya membuat semak berduri menyusut. Lalu kejar Si Kusut!'),
  ],
  bramble: [L('anett', 'Bersinarlah, tongkat kecil! Semak berdurinya menyusut!')],
  bramblesDone: [L('anett', 'Semua jalan sudah bebas lagi! Sekarang, di mana Si Kusut bersembunyi?')],
  caught: [
    L('kusut', 'Ups, ketahuan! Nih, ambil satu lonceng. Tapi kamu tidak akan menangkapku lagi! Hehe!'),
    L('kusut', 'Grrr, kamu cepat sekali! Baiklah, ini lonceng lagi. Dadah!'),
    L('kusut', 'Lagi?! Oke, oke, satu lonceng untukmu. Tangkap aku sekali lagi kalau bisa!'),
  ],
  challenge: [
    L('kusut', 'Hmph! Kamu menangkapku empat kali dan mendapatkan semua lonceng kembali!'),
    L('kusut', 'Tapi aku yakin kamu tidak bisa mengalahkanku dalam pertandingan sungguhan! Tiga permainan: balapan daun, menangkap kunang-kunang, dan tarik tambang!'),
    L('kusut', 'Datanglah ke padang bunga. Kalau kamu menang, aku tidak akan membuat kekacauan lagi. Janji!'),
    L('anett', 'Setuju! Ayo bertanding!'),
  ],
  matchStart: [
    L('kusut', 'Selamat datang di Pertandingan Besar Hutan! Siapa yang menang dua permainan, dialah juaranya!'),
    L('kusut', 'Permainan pertama: balapan daun di sungai! Naiklah ke daunmu, aku naik daun yang satu lagi!'),
  ],
  round2: [L('kusut', 'Permainan kedua: menangkap kunang-kunang di padang bunga! Siapa yang menangkap paling banyak dalam 30 detik, dia menang!')],
  round3: [L('kusut', 'Permainan ketiga: tarik tambang! Tekan secepat mungkin untuk menarik talinya! Siap?')],
  roundWin: [L('kusut', 'Grrr, kamu menang permainan ini!'), L('kusut', 'Apa? Kamu menang lagi?!'), L('kusut', 'Oh tidak, kamu terlalu kuat!')],
  roundLose: [L('kusut', 'Hehe, yang ini aku menang!'), L('kusut', 'Ha! Permainan ini milikku!'), L('kusut', 'Hehe, tarikanku lebih kuat!')],
  rematch: [
    L('kusut', 'Hehehe! Aku memenangkan pertandingan! Tapi kamu main bagus sekali...'),
    L('anett', 'Ayo main lagi! Aku akan berusaha lebih keras!'),
    L('kusut', 'Oke! Tanding ulang! Mulai dari permainan pertama!'),
  ],
  victory: [
    L('kusut', 'Kamu memenangkan Pertandingan Besar Hutan... kamu juaranya, Anet!'),
    L('kusut', 'Hiks... Aku cuma membuat kekacauan karena aku kesepian. Tidak ada yang pernah mengajakku bermain.'),
    L('anett', 'Oh, Kusut! Kamu tinggal mengajak kami bermain! Kita bisa berteman!'),
    L('lumi', 'Tentu saja! Semua di hutan suka bermain. Selamat datang, Kusut!'),
    L('kusut', 'Sungguh?! Berteman?! Horeee! Aku janji jadi teman yang baik! Ayo kita berpesta!'),
  ],
  lumiHint: {
    arrive: [L('lumi', 'Si Kusut kabur! Pertama, ayo hilangkan semak berdurinya.')],
    brambles: [L('lumi', 'Sentuh semak berduri dengan tongkat supaya menyusut. Lihat peta kecilmu!')],
    chase: [L('lumi', 'Si Kusut bersembunyi di suatu tempat di hutan. Ikuti tanda di peta dan tangkap dia!')],
    arena: [L('lumi', 'Si Kusut menunggu di padang bunga di barat laut. Semoga berhasil dalam pertandingan!')],
    match: [L('lumi', 'Kamu pasti bisa, Anet! Semua mendukungmu!')],
    done: [L('lumi', 'Pestanya meriah sekali! Si Kusut sekarang teman kita.')],
  },
};

export function kusutDialogue(): typeof EN {
  return currentLang() === 'en' ? EN : ID;
}
