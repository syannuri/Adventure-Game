/** Animal stickers for Anet's sticker book (collected by walking up close to an animal). */
export interface StickerDef {
  id: string;
  world: 'enchanted-forest' | 'candy-village' | 'crystal-cave';
  /** how close Anet must get (metres) */
  near: number;
}

export const STICKERS: StickerDef[] = [
  { id: 'fairy', world: 'enchanted-forest', near: 3.2 },
  { id: 'rabbit', world: 'enchanted-forest', near: 3.0 },
  { id: 'owl', world: 'enchanted-forest', near: 3.2 },
  { id: 'squirrel', world: 'enchanted-forest', near: 3.0 },
  { id: 'duck', world: 'enchanted-forest', near: 3.6 },
  { id: 'duckling', world: 'enchanted-forest', near: 2.4 },
  { id: 'butterfly', world: 'enchanted-forest', near: 2.2 },
  { id: 'bunny', world: 'enchanted-forest', near: 2.4 },
  { id: 'bee', world: 'enchanted-forest', near: 2.4 },
  { id: 'gingerbread', world: 'candy-village', near: 3.0 },
  { id: 'dragon', world: 'crystal-cave', near: 3.0 },
  { id: 'bat', world: 'crystal-cave', near: 2.6 },
];
