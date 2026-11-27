import { TARGET, clamp } from '../combat.mjs?v=dual-hd';
import { ease, halo, detail } from './ultimate-layers.mjs';

export const TIDEBREAKER_ART = { cell: 224, columns: 8, frames: 32 };
const BLOOM_TIME = 1.04;
const FADE_TIME = 1.68;
const ANCHOR_X = 100;
const ANCHOR_Y = 177;
const impactOrigins = new WeakMap();
const sparkColors = ['#ffb0fa', '#a5f2ff', '#9c83ff', '#fff3fa'];

function paintConvergence(g, s, sheet, quality) {
  const strength = ease(.35, 1, 1 - s.cast.time / s.cast.total);
  if (strength <= 0) return;
  const side = s.x < TARGET[0] ? 1 : -1;
  const x = s.x + side * 66, y = s.y - 75;
  halo(g, x, y, 40 + 39 * strength, '#aa72ff', .36 * strength);
  detail(g, sheet, 2, x, y, 42 + 46 * strength, 0, .69 * strength);
  if (s.reduceMotion) return;
  g.lineCap = 'round';
  g.lineWidth = 2;
  const count = [3, 6, 9][quality];
  for (let i = 0; i < count; i++) {
    const cycle = (s.age * 2.25 + i / count) % 1;
    const angle = i * 2.399;
    const reach = 86 * (1 - cycle) + 10;
    const dx = Math.cos(angle), dy = Math.sin(angle) * .66;
    g.globalAlpha = strength * (1 - cycle) * .76;
    g.strokeStyle = sparkColors[i % sparkColors.length];
    g.beginPath();
    g.moveTo(x + dx * (reach + 18), y + dy * (reach + 18));
    g.lineTo(x + dx * reach, y + dy * reach);
    g.stroke();
  }
  g.globalAlpha = 1;
}

function paintLance(g, s, sheet, tx, ty, cinematicHero, quality) {
  const shot = s.shot;
  const p = clamp(shot.t, 0, 1) ** 1.17;
  const originX = cinematicHero ? shot.x - 24 + 66 * Math.sign(tx - shot.x + 24) : shot.x;
  const lift = Math.sin(p * Math.PI) * 37;
  const x = originX + (tx - originX) * p;
  const y = shot.y + (ty - shot.y) * p - lift;
  const angle = Math.atan2(ty - shot.y - Math.cos(p * Math.PI) * Math.PI * 37, tx - originX);
  const tail = Math.max(8, Math.min(Math.hypot(x - originX, y - shot.y), 146 + 180 * p));
  const width = 8 + 18 * Math.sin(p * Math.PI * .58);
  halo(g, x, y, 64 + 14 * p, '#b070ff', s.reduceMotion ? .27 : .50);
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  const ribbon = g.createLinearGradient(-tail, 0, 16, 0);
  ribbon.addColorStop(0, '#83dcff00');
  ribbon.addColorStop(.42, '#b275ff68');
  ribbon.addColorStop(.78, '#ff8eeddd');
  ribbon.addColorStop(1, '#f5faff');
  g.fillStyle = ribbon;
  g.beginPath();
  g.moveTo(-tail, 0);
  g.bezierCurveTo(-tail * .67, -width * .14, -tail * .23, -width * 1.21, 17, 0);
  g.bezierCurveTo(-tail * .20, width * .74, -tail * .58, width * .24, -tail, 0);
  g.fill();
  g.strokeStyle = '#ecfbff';
  g.lineWidth = 2.8;
  g.beginPath();
  g.moveTo(-tail * .63, 1);
  g.quadraticCurveTo(-tail * .18, -width * .47, 15, 0);
  g.stroke();
  if (!s.reduceMotion) {
    const count = [3, 7, 11][quality];
    for (let i = 0; i < count; i++) {
      const drift = (i / count + s.age * 3.4) % 1;
      g.globalAlpha = (1 - drift) * .81;
      g.fillStyle = sparkColors[i % sparkColors.length];
      g.fillRect(-tail * drift, Math.sin(i * 2.399 + p * 5) * width * (.4 + drift), 3 + i % 3, 1 + i % 2);
    }
  }
  g.restore();
  detail(g, sheet, 2, x + Math.cos(angle) * 9, y + Math.sin(angle) * 9, 56 + 25 * p, angle, .78);
}

function paintBloom(g, s, art, x, y, age, quality) {
  const reduce = s.reduceMotion;
  const t = clamp(age / BLOOM_TIME, 0, 1);
  const { cell, columns, frames } = TIDEBREAKER_ART;
  const frame = reduce ? 11 : Math.min(frames - 1, Math.floor(t * frames));
  const partWidth = reduce ? 371 : 520;
  const partHeight = clamp((y - 24) / .69, 268, reduce ? 340 : 451);
  const echo = 1 - ease(.42, FADE_TIME, age);
  halo(g, x + 16, y - 14, 218 + t * 52, '#dc75f4', (reduce ? .23 : .53) * echo);
  if (!reduce) {
    detail(g, art.details, 0, x + 92 * t, y - 75 - 66 * t, 286 + 96 * t, .24 + t * .26, .56 * echo);
    const wave = ease(0, .55, age);
    g.save();
    g.globalAlpha *= (1 - wave) * .78;
    g.strokeStyle = '#d8b4ff';
    g.lineWidth = 3.6 - wave * 2.3;
    g.beginPath();
    g.ellipse(x, y + 9, 27 + wave * 148, 13 + wave * 71, -.20, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }
  if (age < BLOOM_TIME) {
    g.save();
    if (reduce) g.globalAlpha *= .73 * (1 - ease(.37, 1, t));
    g.drawImage(art.sequence, frame % columns * cell, Math.floor(frame / columns) * cell, cell, cell,
      x - partWidth * ANCHOR_X / cell, y - partHeight * ANCHOR_Y / cell, partWidth, partHeight);
    g.restore();
  }
  if (reduce) return;
  const emerge = ease(.17, .65, age);
  const remains = 1 - ease(.78, FADE_TIME, age);
  if (emerge * remains > 0) {
    const n = [2, 4, 6][quality];
    for (let i = 0; i < n; i++) {
      const angle = -2.8 + i * 3.2 / (n - 1);
      const reach = (38 + i % 3 * 12) + emerge * (62 + i * 9);
      detail(g, art.details, 1, x + Math.cos(angle) * reach, y + Math.sin(angle) * reach * .68 - 21,
        82 + i % 3 * 28, angle + .77 + t * .36, emerge * remains * .90);
    }
  }
  const remnant = ease(.48, .93, age) * remains;
  if (remnant > 0) {
    const r = 23 + 11 * t;
    halo(g, x, y, r * 2.25, '#b791ff', remnant * .46);
    g.save();
    g.globalAlpha *= remnant;
    g.lineWidth = 2.4;
    g.strokeStyle = '#dddbff';
    g.beginPath();
    g.ellipse(x, y, r, r * .86, -.17, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }
  const flash = 1 - ease(0, .21, age);
  detail(g, art.details, 2, x, y, 122 + 70 * t, .15, flash);
  const sparkFade = (1 - ease(.37, 1.3, age)) * .94;
  if (sparkFade <= 0) return;
  g.lineCap = 'round';
  const count = [6, 13, 23][quality];
  for (let i = 0; i < count; i++) {
    const angle = 2.399 * i + .8;
    const distance = (82 + (i * 43 % 235)) * (1 - Math.exp(-age * 3.15));
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const px = x + dx * distance, py = y + dy * distance * .66 - age * (52 + i % 3 * 17);
    const spark = 5 + i % 4 * 4;
    g.globalAlpha = sparkFade * (.54 + i % 3 * .16);
    g.strokeStyle = sparkColors[i % sparkColors.length];
    g.lineWidth = 1.5 + i % 3 * .62;
    g.beginPath();
    g.moveTo(px, py);
    g.lineTo(px - dx * spark, py - dy * spark * .63 + 3);
    g.stroke();
  }
}

export function paintTidebreaker(g, s, art, pose, quality, cinematicHero) {
  const hit = s.skillImpact?.kind === 'ultimate' ? s.skillImpact : null;
  const age = hit ? s.age - hit.age : Infinity;
  const flying = s.shot?.kind === 'ultimate';
  const charging = s.cast?.kind === 'ultimate';
  if (!flying && !charging && (age < 0 || age >= FADE_TIME)) return;
  const x = TARGET[0] + pose.dx, y = TARGET[1] + pose.dy;
  g.save();
  g.imageSmoothingEnabled = true;
  if (flying) paintLance(g, s, art.details, x, y, cinematicHero, quality);
  else if (charging) paintConvergence(g, s, art.details, quality);
  if (age >= 0 && age < FADE_TIME) {
    if (!impactOrigins.has(hit)) impactOrigins.set(hit, [x, y]);
    const [impactX, impactY] = impactOrigins.get(hit);
    paintBloom(g, s, art, impactX, impactY, age, quality);
  }
  g.restore();
}
