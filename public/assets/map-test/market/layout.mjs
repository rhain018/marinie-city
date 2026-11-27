export const MARKET_SPAWN = { x: 410, y: 482 };
export const PLAZA = [132, 224, 764, 560];
export const UPPER_GARDEN = [156, 154, 741, 224];
export const GARDEN_SIDES = [[112, 244, 132, 537], [764, 244, 790, 522]];
export const STAIR = [364, 560, 451, 613];
export const DOCK = [226, 613, 645, 679];
export const PIER = [365, 679, 454, 741];
export const PLAZA_Y = 1.72;
export const DOCK_Y = 0.74;
export const GARDEN_Y = 3.05;
export const STEPS = 5;
export const MARKET_RAILS = [[151,551,351,551], [464,551,746,551], [141,476,141,551], [756,477,756,551]];
export const DOCK_RAILS = [
  [232,619,355,619], [461,619,636,619], [232,619,232,673], [639,619,639,673],
  [232,673,356,673], [464,673,639,673], [371,686,371,736], [448,686,448,736], [371,736,448,736],
];


export const SHOPS = [
  { art: 'bakery', name: 'Pandesal Bakery', x: 222, y: 342, width: 6.85, tone: '#864638', footprint: [169, 260, 275, 343] },
  { art: 'fish-shop', name: 'Sariwang Isda', x: 371, y: 349, width: 6.85, tone: '#315862', footprint: [318, 266, 424, 351] },
  { art: 'lantern-shop', name: 'Tala’s Lanterns', x: 523, y: 332, width: 6.85, tone: '#624050', footprint: [469, 257, 577, 334] },
  { art: 'repair-shop', name: 'Harbor Repairs', x: 673, y: 346, width: 6.85, tone: '#4b5c47', footprint: [619, 262, 726, 348] },
];

export const NPCS = [
  { id: 'mara', name: 'Mara', role: 'Baker', shop: 'Pandesal Bakery', x: 213, y: 389,
    line: 'Bagong hango ang pandesal! Pahiran mo ng coco jam habang mainit pa.' },
  { id: 'iko', name: 'Iko', role: 'Fishmonger', shop: 'Sariwang Isda', x: 354, y: 397,
    line: 'Maaga kaming pumalaot. Tingnan mo ang kintab ng isda, sariwa pa ’yan.' },
  { id: 'tala', name: 'Tala', role: 'Lantern maker', shop: 'Tala’s Lanterns', x: 535, y: 378,
    line: 'Tuwing dapit-hapon, sinisindihan ko ang mga parol. Gabay ’yan ng mga bangkang pauwi.' },
  { id: 'berto', name: 'Berto', role: 'Mechanic', shop: 'Harbor Repairs', x: 689, y: 392,
    line: 'Makinig ka sa makina. Pag pantay ang ugong, handa na ulit sa laot.' },
  { id: 'sani', name: 'Sani', role: 'Dockhand', shop: 'Market Pier', x: 477, y: 638,
    line: 'Dito pinakamahusay panoorin ang mga bangkang dumarating. Ingat lang sa dulo ng pantalan.' },
];

export const PROPS = [
  { art: 'crate', x: 393, y: 373, width: 1.65, radius: 12 },
  { art: 'crate', x: 631, y: 367, width: 1.75, radius: 13 },
  { art: 'crate', x: 571, y: 658, width: 1.6, radius: 11 },
  { art: 'lamp', x: 171, y: 464, height: 3.75, radius: 6, light: true },
  { art: 'lamp', x: 479, y: 448, height: 3.6, radius: 6, light: true },
  { art: 'lamp', x: 730, y: 505, height: 3.55, radius: 6, light: true },
  { art: 'lamp', x: 626, y: 623, height: 2.9, radius: 6, light: true },
  { art: 'planter', x: 282, y: 345, width: 1.6, radius: 7 },
  { art: 'planter', x: 601, y: 359, width: 1.4, radius: 7 },
  { art: 'planter', x: 193, y: 532, width: 1.55, radius: 8 },
  { art: 'planter', x: 696, y: 501, width: 1.6, radius: 8 },
  { art: 'bollard', x: 249, y: 664, width: 1.22, radius: 8 },
  { art: 'bollard', x: 624, y: 666, width: 1.22, radius: 8 },
  { art: 'bollard', x: 429, y: 725, width: 1.16, radius: 8 },
  { art: 'stall', x: 277, y: 491, width: 3.75, radius: 19 },
  { art: 'stall', x: 615, y: 472, width: 3.45, radius: 17 },
  { art: 'bench', x: 211, y: 496, width: 2.3, radius: 13 },
  { art: 'bench', x: 659, y: 525, width: 2.3, radius: 13 },
  { art: 'bench', x: 528, y: 649, width: 2.0, radius: 12 },
  { art: 'palm', x: 148, y: 383, height: 6.25, radius: 7 },
  { art: 'palm', x: 747, y: 397, height: 6.7, radius: 7 },
];

export const contains = ([left, back, right, front], x, y) =>
  x >= left && x <= right && y >= back && y <= front;

export const stepHeight = (step) => PLAZA_Y - (PLAZA_Y - DOCK_Y) * (step + 1) / STEPS;

export function marketGround(x, y) {
  if (contains(PLAZA, x, y)) return PLAZA_Y;
  if (contains(STAIR, x, y)) {
    const progress = (y - STAIR[1]) / (STAIR[3] - STAIR[1]);
    return stepHeight(Math.min(STEPS - 1, Math.floor(progress * STEPS)));
  }
  return contains(DOCK, x, y) || contains(PIER, x, y) ? DOCK_Y : null;
}

const FOOT_RADIUS = 7;
const FOOT_SAMPLES = [[-7,0], [7,0], [0,-7], [0,7], [-5,-5], [-5,5], [5,5], [5,-5]];
const BLOCKERS = PROPS.concat(NPCS.map((npc) => ({ ...npc, radius: 6 })));
const footprints = SHOPS.map(({ footprint: [left, top, right, bottom] }) =>
  [left - FOOT_RADIUS, top - FOOT_RADIUS, right + FOOT_RADIUS, bottom + FOOT_RADIUS]);
const railBounds = [...MARKET_RAILS, ...DOCK_RAILS].map(([left, top, right, bottom]) =>
  [left - FOOT_RADIUS, top - FOOT_RADIUS, right + FOOT_RADIUS, bottom + FOOT_RADIUS]);


export function canStandInMarket(x, y) {
  return marketGround(x, y) != null
    && FOOT_SAMPLES.every(([dx, dy]) => marketGround(x + dx, y + dy) != null)
    && !footprints.some((bounds) => contains(bounds, x, y))
    && !railBounds.some((bounds) => contains(bounds, x, y))
    && !BLOCKERS.some((item) => Math.hypot(x - item.x, y - item.y) < item.radius + FOOT_RADIUS);
}

export function moveInMarket(position, dx, dy) {
  const x = position.x + dx;
  const y = position.y + dy;
  const floor = marketGround(x, y);
  if (floor == null || Math.abs(floor - position.floor) > 0.34 || !canStandInMarket(x, y)) return false;
  Object.assign(position, { x, y, floor });
  return true;
}
