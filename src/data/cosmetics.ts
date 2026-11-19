/** Things Anet can buy with golden acorns at Kiki the squirrel's shop. */
export type CosmeticSlot = 'head' | 'face' | 'charm' | 'bag';

export interface Cosmetic {
  id: string;
  slot: CosmeticSlot;
  price: number;
  /** main colour (also the backpack colour for 'bag' items) */
  color: string;
}

export const COSMETICS: Cosmetic[] = [
  { id: 'clip-star', slot: 'head', price: 5, color: '#ffd23f' },
  { id: 'bow-pink', slot: 'head', price: 8, color: '#ff6fae' },
  { id: 'crown-flower', slot: 'head', price: 12, color: '#ff8fbf' },
  { id: 'hat-acorn', slot: 'head', price: 15, color: '#9a6232' },
  { id: 'glasses-heart', slot: 'face', price: 10, color: '#ff4f7b' },
  { id: 'charm-star', slot: 'charm', price: 6, color: '#ffd23f' },
  { id: 'bag-pink', slot: 'bag', price: 8, color: '#f29bbd' },
  { id: 'bag-blue', slot: 'bag', price: 8, color: '#8fc3f0' },
  { id: 'bag-mint', slot: 'bag', price: 8, color: '#93d9b8' },
];

export const cosmetic = (id: string | undefined) => COSMETICS.find((c) => c.id === id);
