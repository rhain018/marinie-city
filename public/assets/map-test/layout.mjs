export const SPAWN = { x: 354, y: 660 };
export const TERRACE_HEIGHT = 2.65;
export const DECK_HEIGHT = 0.95;

// Bounds use the same coordinates as the Marinie City walkability grid.
export const PROMENADE = [104, 527, 538, 578];
export const DECKS = [
  [164, 578, 539, 682],
  [114, 616, 164, 683],
  [164, 682, 238, 808],
  [266, 682, 322, 808],
];
export const STAIRS = [
  [160, 573, 211, 645],
  [447, 576, 535, 644],
];
export const STAIR_COUNT = 9;

const contains = ([left, back, right, front], x, y) =>
  x >= left && x <= right && y >= back && y <= front;

export const sceneX = (x) => (x + 360) / 20;
export const sceneZ = (y) => (y + 120) / 18;
export const stairHeight = (step) =>
  TERRACE_HEIGHT - (TERRACE_HEIGHT - DECK_HEIGHT) * (step + 1) / STAIR_COUNT;

export function groundLevel(x, y) {
  for (const bounds of STAIRS) {
    if (contains(bounds, x, y)) {
      const progress = (y - bounds[1]) / (bounds[3] - bounds[1]);
      return stairHeight(Math.min(STAIR_COUNT - 1, Math.floor(STAIR_COUNT * progress)));
    }
  }
  if (contains(PROMENADE, x, y)) return TERRACE_HEIGHT;
  if (DECKS.some((bounds) => contains(bounds, x, y))) return DECK_HEIGHT;
  return null;
}

export function moveOnWharf(position, dx, dy, canStand) {
  const nextX = position.x + dx;
  const nextY = position.y + dy;
  const floor = groundLevel(nextX, nextY);
  if (floor == null || Math.abs(floor - position.floor) > 0.39 || !canStand(nextX, nextY)) return false;
  position.x = nextX;
  position.y = nextY;
  position.floor = floor;
  return true;
}
