export const CAT_ART = 'a69dc047ff01d7.webp';

const VENTS = [
  { x: 238, y: 92, phase: 0.7, brick: '#82645d', light: '#bd8a71' },
  { x: 510, y: 83, phase: 2.2, brick: '#655963', light: '#a58383' },
];

function rectangle(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
}

function trainCar(engine) {
  const canvas = document.createElement('canvas');
  canvas.width = 108;
  canvas.height = 40;
  const ctx = canvas.getContext('2d');
  const length = engine ? 105 : 101;

  rectangle(ctx, '#211f35', 2, 8, length - 1, 26);
  rectangle(ctx, '#242535', 6, 4, length - 11, 8);
  rectangle(ctx, '#42605c', 8, 2, length - 15, 9);
  rectangle(ctx, '#668178', 11, 3, length - 21, 2);
  rectangle(ctx, '#344e4c', 8, 8, length - 13, 4);
  rectangle(ctx, '#24544e', 4, 12, length - 5, 19);
  rectangle(ctx, '#44766a', 4, 13, length - 5, 4);
  rectangle(ctx, '#c38a4f', 4, 25, length - 5, 5);
  rectangle(ctx, '#e1b872', 4, 25, length - 5, 1);
  rectangle(ctx, '#3c3041', 5, 31, length - 7, 4);

  for (const x of engine ? [18, 37, 56, 76] : [13, 32, 51, 70, 89]) {
    const width = x === 76 ? 16 : 12;
    rectangle(ctx, '#1e2e3a', x - 1, 13, width + 2, 10);
    rectangle(ctx, '#c3985e', x, 14, width, 8);
    rectangle(ctx, '#393d47', x + 1, 15, width - 2, 6);
    rectangle(ctx, '#edbd77', x + 2, 16, width - 4, 4);
    rectangle(ctx, '#fff1ba', x + 2, 16, width - 4, 1);
    rectangle(ctx, '#80634f', x + Math.floor(width / 2), 15, 1, 6);
  }

  for (const x of [16, 27, 76, 87]) {
    rectangle(ctx, '#232536', x, 33, 8, 5);
    rectangle(ctx, '#586071', x + 2, 34, 4, 2);
  }
  rectangle(ctx, '#6d7771', 0, 30, 5, 2);
  if (engine) {
    rectangle(ctx, '#614852', 31, 0, 19, 5);
    rectangle(ctx, '#ac8376', 33, 0, 15, 2);
    rectangle(ctx, '#243e40', 98, 17, 8, 15);
    rectangle(ctx, '#d39c5d', 102, 22, 5, 5);
    rectangle(ctx, '#fff1af', 103, 23, 4, 3);
    rectangle(ctx, '#7c4949', 101, 30, 7, 3);
  }
  return canvas;
}

export function buildTrain() {
  return { engine: trainCar(true), coach: trainCar(false) };
}

export function trainAt(elapsed, width) {
  const progress = (elapsed % 28 - 3) / 10;
  return progress < 0 || progress >= 1 ? null : Math.round(-108 + (width + 345) * progress);
}

export function paintTrain(ctx, train, x) {
  const y = 384;
  rectangle(ctx, '#23253090', x - 205, y + 34, 311, 6);
  ctx.drawImage(train.coach, x - 206, y);
  ctx.drawImage(train.coach, x - 103, y);
  ctx.drawImage(train.engine, x, y);
}

export function paintChimneys(ctx, elapsed) {
  for (const { x, y, phase, brick, light } of VENTS) {
    for (let i = 0; i < 5; i++) {
      const age = ((elapsed + phase + i * 0.62) % 3.1) / 3.1;
      const width = 4 + Math.floor(age * 9);
      const drift = age * 20 + Math.sin(age * 5 + phase) * age * 4;
      const px = x + drift - width / 2;
      const py = y - age * 42 - 3;
      ctx.globalAlpha = Math.min(1, age * 12) * (1 - age) * 0.64;
      rectangle(ctx, '#c5bab2', px, py, width, Math.ceil(width * 0.55));
      rectangle(ctx, '#ebd7be', px + 1, py - 1, width - 2, 2);
    }
    ctx.globalAlpha = 1;
    rectangle(ctx, '#342b3d', x - 6, y + 4, 13, 13);
    rectangle(ctx, brick, x - 4, y + 3, 9, 12);
    rectangle(ctx, light, x - 4, y + 5, 2, 9);
    rectangle(ctx, '#372e40', x - 7, y, 14, 5);
    rectangle(ctx, light, x - 6, y, 12, 2);
    rectangle(ctx, '#211f2d', x - 4, y - 1, 8, 2);
  }
}

const WING = [
  [[-8,-5,4,2],[-5,-4,3,2],[-3,-2,4,2],[2,-3,3,2],[4,-4,4,2]],
  [[-10,-1,6,2],[-5,0,5,2],[2,0,8,2]],
  [[-8,3,4,2],[-5,2,3,2],[-3,1,4,2],[2,1,3,2],[4,2,4,2]],
  [[-9,0,6,2],[-4,0,4,2],[2,-1,8,2]],
];

export function paintBirds(ctx, elapsed, width) {
  for (let i = 0; i < 3; i++) {
    const x = (elapsed * 39 + 96 - i * 33 + width + 96) % (width + 96) - 48;
    const y = 186 + i * 9 + Math.sin(elapsed * 0.8 + i * 0.41) * 13;
    const frame = Math.floor(elapsed * 9 + i) % WING.length;
    for (const [dx, dy, w, h] of WING[frame]) {
      rectangle(ctx, '#59606d', x + dx, y + dy, w, h);
      rectangle(ctx, '#d6ddd6', x + dx, y + dy - 1, w - 1, 1);
    }
    rectangle(ctx, '#343c54', x - 5, y + 1, 10, 3);
    rectangle(ctx, '#eee0ba', x - 3, y, 8, 2);
    rectangle(ctx, '#f3bb70', x + 5, y + 1, 2, 1);
  }
}

const CAT_CELL_WIDTH = 77;
const CAT_CELL_HEIGHT = 114;
const CAT_LEFT = 126;
const CAT_RIGHT = 552;
const CAT_RUN = 8;
const CAT_REST = 2.5;

export function stationCat(elapsed) {
  const legDuration = CAT_RUN + CAT_REST;
  const cycle = (elapsed + 1.8) % (legDuration * 2);
  const eastbound = cycle < legDuration;
  const leg = cycle % legDuration;
  const distance = (CAT_RIGHT - CAT_LEFT) * Math.min(1, leg / CAT_RUN);
  return {
    x: eastbound ? CAT_LEFT + distance : CAT_RIGHT - distance,
    y: 377 + Math.sin(distance * 0.021) * 2,
    eastbound,
    running: leg < CAT_RUN,
  };
}

export function paintCat(ctx, art, cat, elapsed) {
  const direction = cat.eastbound ? 2 : 1;
  const row = (cat.running ? 8 : 0) + direction;
  const frame = Math.floor(elapsed / (cat.running ? 0.09 : 0.28)) % 4;
  ctx.drawImage(art, frame * CAT_CELL_WIDTH, row * CAT_CELL_HEIGHT, CAT_CELL_WIDTH, CAT_CELL_HEIGHT,
    Math.round(cat.x - 8), Math.round(cat.y - 23), 16, 24);
}
