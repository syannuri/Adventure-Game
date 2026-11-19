/**
 * Where the five world islands float on the home screen, as screen positions so the painted
 * backdrop, the 2D fallback islands and the 3D islands all line up: [left %, top %, width vw].
 */
export const ISLAND_SPOTS = {
  land: [
    [44, 46, 7.5],
    [52, 24, 8.5],
    [61, 50, 6.2],
    [40, 20, 6],
    [63, 13, 6.6],
  ],
  port: [
    [5, 31, 15],
    [74, 29, 16],
    [7, 47, 12],
    [78, 46, 12],
    [44, 23, 11],
  ],
} as const;

