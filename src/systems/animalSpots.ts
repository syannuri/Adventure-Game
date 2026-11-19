/**
 * Where the animals are right now (for the sticker book). Static characters are added once by the
 * world; moving ones (butterflies, ducks, ducklings, bunnies) update their entries every frame.
 */
export const animalSpots: Record<string, { x: number; z: number }[]> = {};
// automated tests read the animal positions from here
if (typeof window !== 'undefined') (window as unknown as { __anettAnimals: typeof animalSpots }).__anettAnimals = animalSpots;

export function setAnimalSpot(id: string, index: number, x: number, z: number) {
  const list = (animalSpots[id] ??= []);
  const p = list[index];
  if (p) {
    p.x = x;
    p.z = z;
  } else list[index] = { x, z };
}

export function clearAnimalSpots() {
  for (const k of Object.keys(animalSpots)) delete animalSpots[k];
}
