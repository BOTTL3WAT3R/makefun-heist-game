// Aurum After Hours — the Meridian Reserve Bank floor: one full floor in
// one frame. West service door (entry), teller hall in the middle, service
// corridor + security room in the north, the vault in the east, and the
// getaway dock in the south. Three real routes cross it:
//   A) straight through the marble hall — fast, watched by two cameras
//   B) behind the teller desks — slow, covered, patrolled
//   C) the north service corridor — needs the glass-foam cutter at a vent
//      grille to slip into the vault's back wall

import { COLS, ROWS } from "./config.js";

export const T = { WALL: 0, FLOOR: 1, COVER: 2, GRILLE: 3 };

function buildGrid() {
  const grid = new Uint8Array(COLS * ROWS); // all WALL
  const zone = new Array(COLS * ROWS).fill("wall");
  const carve = (x, y, w, h, z) => {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) {
        grid[j * COLS + i] = T.FLOOR;
        zone[j * COLS + i] = z;
      }
  };
  carve(1, 8, 4, 4, "service");      // entry vestibule (west)
  carve(5, 9, 2, 2, "service");      // west passage into the hall
  carve(7, 5, 17, 11, "marble");     // teller hall
  carve(7, 2, 17, 2, "service");     // north service corridor
  carve(10, 4, 1, 1, "service");     // north door west
  carve(20, 4, 1, 1, "service");     // north door east
  carve(24, 2, 1, 2, "service");     // passage to the security room
  carve(25, 1, 6, 4, "service");     // security room
  carve(24, 5, 2, 10, "service");    // vault approach corridor
  carve(26, 6, 5, 8, "vault");       // the vault
  carve(11, 17, 10, 2, "dock");      // getaway dock (south)
  carve(14, 16, 4, 1, "marble");     // dock doors from the hall
  return { grid, zone };
}

const { grid, zone } = buildGrid();

const COVER_RECTS = [
  // teller desks — the cover of route B
  [9, 7, 3, 1], [9, 10, 3, 1], [14, 7, 3, 1],
  [14, 12, 3, 1], [19, 8, 3, 1], [19, 12, 3, 1],
  [27, 2, 2, 1],   // security desk
  [29, 7, 1, 1],   // vault safes
  [27, 12, 1, 1],
  [12, 17, 1, 1],  // dock crates
  [19, 18, 1, 1],
];
for (const [x, y, w, h] of COVER_RECTS)
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) grid[j * COLS + i] = T.COVER;

export const FLOOR = {
  grid,
  zone,
  entry: { x: 1, y: 9 },
  ledger: { x: 28, y: 9 },
  dock: { x: 11, y: 17, w: 10, h: 2 },
  grilles: [
    { x: 15, y: 4, open: false },   // vent: north corridor <-> hall
    { x: 26, y: 7, open: false },   // vent: approach corridor -> vault back wall
  ],
  bags: [
    { x: 8, y: 6 },    // hall, north-west desk
    { x: 15, y: 13 },  // hall, south desks
    { x: 29, y: 3 },   // security room
  ],
  patrols: [
    // hall perimeter loop
    [{ x: 8, y: 6 }, { x: 22, y: 6 }, { x: 22, y: 14 }, { x: 8, y: 14 }],
    // north corridor + security room
    [{ x: 8, y: 2 }, { x: 22, y: 2 }, { x: 28, y: 2 }, { x: 22, y: 2 }],
    // south hall loop
    [{ x: 9, y: 13 }, { x: 21, y: 13 }, { x: 21, y: 15 }, { x: 9, y: 15 }],
  ],
  cameras: [
    { x: 7, y: 5, base: 0.65, sweep: 0.75, speed: 0.45, phase: 0.0 },   // hall NW
    { x: 25, y: 5, base: Math.PI / 2, sweep: 0.55, speed: 0.6, phase: 1.7 }, // vault approach
  ],
  routes: [
    { name: "A · MARBLE DASH", color: "routeA", pts: [[1, 9], [7, 9], [16, 9], [24, 9], [28, 9]] },
    { name: "B · BEHIND THE DESKS", color: "routeB", pts: [[1, 9], [8, 11], [13, 11], [18, 13], [23, 10], [28, 9]] },
    { name: "C · SERVICE + VENT (CUTTER)", color: "routeC", pts: [[1, 9], [10, 7], [10, 4], [16, 2], [24, 2], [25, 5], [25, 7], [28, 9]] },
  ],
  escapeRoute: [[28, 9], [24, 11], [18, 14], [16, 16], [16, 18]],
};

for (const g of FLOOR.grilles) grid[g.y * COLS + g.x] = T.GRILLE;

export function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return T.WALL;
  return grid[y * COLS + x];
}
export function zoneAt(x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return "wall";
  return zone[y * COLS + x];
}
export function blocksMove(x, y, grilles) {
  const t = tileAt(x, y);
  if (t === T.WALL || t === T.COVER) return true;
  if (t === T.GRILLE) {
    const g = grilles.find((g) => g.x === x && g.y === y);
    return !(g && g.open);
  }
  return false;
}
export function blocksSight(x, y) {
  const t = tileAt(x, y);
  return t === T.WALL || t === T.COVER;
}
