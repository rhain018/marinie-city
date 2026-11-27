import { PORT_LAYOUT } from './layout.mjs';
import { drawPose } from '../cinematic/poses.mjs?v=cinematic';

export const PORT_HERO_CELLS = { columns: 4, width: 344, height: 268, pivot: [165, 250] };
export const pier = new Path2D();
for (const [index, [x, y]] of PORT_LAYOUT.deck.entries()) {
  if (index === 0) pier.moveTo(x, y);
  else pier.lineTo(x, y);
}
pier.closePath();

const tide = new Path2D('M300 511 L424 493 L608 431 L696 210 H1536 V539 L1250 529 L826 530 L570 520 L341 548 Z');
const shore = new Path2D('M301 489 L480 425 L610 363 L730 345 H1536 V540 L1190 529 L731 534 L450 525 L326 552 Z');
const lamps = [
  [87, 531, 86], [158, 421, 61], [305, 422, 57], [438, 93, 75],
];
const nearRail = [[1184, 832, 86], [1309, 757, 84], [1458, 666, 101]];
const leftRail = [[0, 756, 62], [47, 832, 78], [234, 867, 74]];

function light(g, x, y, radius, color) {
  const halo = g.createRadialGradient(x, y, 0, x, y, radius);
  halo.addColorStop(0, color);
  halo.addColorStop(1, 'transparent');
  g.fillStyle = halo;
  g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function wash(g, crest, phase, front, reduced) {
  const sway = reduced ? 0 : Math.sin(phase * 1.28);
  const lift = reduced ? 0 : Math.sin(phase * 1.8 + 1);
  g.save();
  g.clip(front ? shore : tide);
  g.globalAlpha = front ? .81 : .72;
  if (front) {
    // Foam occludes where the two coils meet the surface.
    g.drawImage(crest, Math.round(390 + sway * 21), Math.round(330 + lift * 10), 872, 217);
    g.translate(1536, 0);
    g.scale(-1, 1);
    g.drawImage(crest, Math.round(-27 - sway * 17), Math.round(345 - lift * 9), 662, 201);
  } else {
    g.drawImage(crest, Math.round(473 + sway * 27), Math.round(254 - lift * 12), 1026, 271);
  }
  g.restore();
}

export function paintPortBackground(g, art, crest, s, quality) {
  g.drawImage(art.skyline, 0, 0);
  g.drawImage(art.pier, 0, 510);
  if (crest?.naturalWidth) wash(g, crest, s.age, false, s.reduceMotion);
  const time = s.reduceMotion ? 0 : s.age;
  for (const [x, y, radius] of lamps) {
    const flicker = Math.sin(time * 3.6 + x) * .12 + .23;
    light(g, x, y, radius, 'rgba(255,179,71,' + flicker + ')');
  }
  g.save();
  g.clip(pier);
  const lanes = [[118, 1], [297, 1], [589, 0], [1096, 0], [1377, 1]];
  const count = [10, 22, 33][quality];
  for (const [x, warm] of lanes) {
    for (let i = 0; i < count; i++) {
      const depth = ((i * .157 + time * .042) % 1);
      const y = 538 + depth * 308;
      const d = Math.sin(i * 4.37 + time * .98);
      const px = Math.round(x + d * (9 + depth * 53));
      g.globalAlpha = (1 - depth * .47) * (.12 + (d + 1) * .15);
      g.fillStyle = warm ? '#ffc269' : '#70e5ff';
      g.fillRect(px, Math.round(y), Math.round(4 + depth * 28 + i % 5), 1 + Math.round(depth * 2));
    }
  }
  g.restore();
}

export function paintPortSurf(g, crest, s, quality, pose) {
  if (crest?.naturalWidth) wash(g, crest, s.age, true, s.reduceMotion);
  if (pose.visible < .1) return;
  const time = s.reduceMotion ? 0 : s.age;
  light(g, 1029 + pose.dx - 130, 389 + (pose.dy - 15) * .6, 121, '#16aaff32');
  const count = [12, 28, 43][quality];
  for (let i = 0; i < count; i++) {
    const phase = (time * (.46 + i % 5 * .035) + i * .219) % 1;
    const x = 571 + (i * 313 % 971) + phase * (i % 2 ? 31 : -26);
    const y = 518 - phase * (22 + i * 43 % 125);
    g.fillStyle = i % 3 ? '#9befff9c' : '#d8f7ffbe';
    g.globalAlpha = (1 - phase) * .88;
    g.fillRect(Math.round(x), Math.round(y), 2 + i % 3, i % 4 ? 2 : 4);
  }
  g.globalAlpha = 1;
}

export function paintPortReflection(g, atlas, frame, x, y, ground, scale, facing, hero) {
  g.save();
  g.clip(pier);
  g.translate(0, ground + 4);
  g.scale(1, -.32);
  g.translate(0, -ground);
  g.globalAlpha = .27;
  drawPose(g, atlas, PORT_HERO_CELLS, frame, x, y, scale, facing);
  g.restore();
  light(g, x, ground + 8, 38, hero === 'loki' ? '#ff503e40' : '#39dfff38');
}

function line(g, ax, ay, bx, by, thickness, color) {
  g.strokeStyle = color;
  g.lineWidth = thickness;
  g.beginPath();
  g.moveTo(ax, ay);
  g.lineTo(bx, by);
  g.stroke();
}

function rail(g, posts) {
  for (let i = 0; i < posts.length - 1; i++) {
    const [ax, ay, ah] = posts[i], [bx, by, bh] = posts[i + 1];
    const start = ay - ah * .76, end = by - bh * .76;
    const strands = Math.ceil(Math.hypot(bx - ax, end - start) / 8);
    g.lineCap = 'round';
    for (let k = 0; k < strands; k++) {
      const t = k / strands, u = (k + 1) / strands;
      const y = f => start + f * (end - start) + f * (1 - f) * 103;
      const px = ax + (bx - ax) * t, nx = ax + (bx - ax) * u;
      line(g, px, y(t) + 1, nx, y(u) + 1, 13, '#130d1c');
      line(g, px, y(t) - 2, nx, y(u) - 2, 8, k % 2 ? '#956652' : '#67443f');
      line(g, px, y(t) - 4, nx, y(u) - 3, 3, k % 3 ? '#d3955a' : '#ffca78');
    }
  }
  for (const [x, y, h] of posts) {
    const width = 29, top = y - h;
    g.fillStyle = '#271824'; g.fillRect(x - 17, top + 5, width + 5, h);
    g.fillStyle = '#9c674a'; g.fillRect(x - 15, top + 5, 17, h - 6);
    g.fillStyle = '#4c3442'; g.fillRect(x + 2, top + 4, 13, h - 5);
    g.fillStyle = '#c58d62'; g.fillRect(x - 16, top, width, 8);
    g.fillStyle = '#6b474a'; g.fillRect(x + 3, top + 3, 14, 5);
    for (let n = 0; n < 9; n++) {
      g.fillStyle = n % 3 ? '#492c38a0' : '#ffd18671';
      g.fillRect(x - 14 + n * 7 % 27, top + 9 + n * 13 % (h - 29), 2, 9 + n % 5 * 3);
    }
    const tie = Math.round(y - h * .76);
    for (let i = 0; i < 3; i++) {
      g.fillStyle = '#33212b'; g.fillRect(x - 18, tie + i * 5, 37, 5);
      g.fillStyle = '#bc8653'; g.fillRect(x - 18, tie + i * 5 + 1, 30, 2);
    }
  }
}

export function paintPortForeground(g, art, s) {
  g.save();
  rail(g, leftRail);
  rail(g, nearRail);
  g.drawImage(art.lantern, 274, 750, 101, 121);
  const pulse = s.reduceMotion ? 0 : Math.sin(s.age * 3.8);
  light(g, 326, 820, 76 + pulse * 3, '#ff9e3c32');
  g.restore();
}
