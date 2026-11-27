import { TARGET, MELEE_TARGET, clamp } from '../combat.mjs?v=dual-hd';
import { ease, halo, detail } from './ultimate-layers.mjs';

export const ABYSSBREAKER_ART = { cell: 240, columns: 8, frames: 32 };
const SLASH_TIME = .68;
const AFTERBURN_TIME = 1.54;
const embers = ['#fff4be', '#ffb356', '#ff6842', '#f55976'];
const pinned = new WeakMap();

function sweep(g, s, sheet, x, y, width, side, angle, t, opacity) {
  const { cell, columns, frames } = ABYSSBREAKER_ART;
  const index = s.reduceMotion ? 13 : Math.min(frames - 1, Math.floor(clamp(t, 0, 1) * frames));
  g.save();
  g.globalAlpha *= opacity;
  g.translate(x, y);
  g.scale(side, 1);
  g.rotate(angle);
  const height = width * .89;
  g.drawImage(sheet, index % columns * cell, Math.floor(index / columns) * cell, cell, cell,
    -width * .50, -height * .57, width, height);
  g.restore();
}

function forge(g, s, sheet, tx, quality) {
  const charge = ease(.10, .95, 1 - s.cast.time / s.cast.total);
  if (charge <= 0) return;
  const side = tx < s.x ? -1 : 1;
  const x = s.x + side * 48, y = s.y - 70;
  halo(g, x, y, 58 + charge * 36, '#ff783e', charge * .59);
  detail(g, sheet, 2, x, y, 48 + charge * 65, side * -.22, charge * .72);
  if (s.reduceMotion) return;
  const count = [4, 8, 12][quality];
  for (let i = 0; i < count; i++) {
    const phase = (s.age * 1.6 + i / count) % 1;
    const angle = i * 2.40 + phase * .62;
    const r = (88 + i % 4 * 16) * (1 - phase);
    g.save();
    g.globalAlpha *= charge * (1 - phase) * .78;
    g.fillStyle = embers[i % embers.length];
    g.fillRect(x + Math.cos(angle) * r, y + Math.sin(angle) * r * .63, 3 + i % 3, 2);
    g.restore();
  }
}

function flight(g, s, art, targetX, targetY, quality) {
  const { x: originX, y: originY, t } = s.shot;
  const q = clamp(t, 0, 1);
  const dx = targetX - originX, dy = targetY - originY;
  const side = dx < 0 ? -1 : 1;
  const x = originX + dx * q;
  const y = originY + dy * q - 24 * Math.sin(q * Math.PI);
  const theta = Math.atan2(dy, Math.abs(dx)) - .24;
  halo(g, x + side * 32, y, 115, '#ef6434', s.reduceMotion ? .24 : .44);
  if (quality > 0 && !s.reduceMotion) {
    sweep(g, s, art.sequence, x - side * 65, y + 20, 268, side, theta + .36, q, .29);
  }
  sweep(g, s, art.sequence, x, y, (s.reduceMotion ? 264 : 325) + 72 * q, side, theta, .16 + .61 * q, .94);
}

function afterburn(g, s, sheet, x, y, side, age, quality) {
  const reduce = s.reduceMotion;
  const fade = 1 - ease(.33, AFTERBURN_TIME, age);
  halo(g, x, y - 6, 188, '#ee623d', fade * (reduce ? .25 : .61));
  const plumes = reduce ? 1 : [2, 3, 4][quality];
  for (let i = 0; i < plumes; i++) {
    const localAge = age - i * .12;
    if (localAge < 0 || localAge > .72) continue;
    const rise = reduce ? .72 : .26 + .74 * ease(0, .22, localAge);
    const size = (reduce ? 166 : 244 - i * 15) * rise;
    const along = (i - .7) * 74 * side;
    detail(g, sheet, 0, x + along, y + 27 - size * .38 - i * 8, size, side * (.10 + i * .14),
      (1 - ease(.26, .72, localAge)) * (reduce ? .61 : .94));
  }
  if (reduce) return;
  const flash = 1 - ease(0, .21, age);
  detail(g, sheet, 2, x, y, 148 + 96 * ease(0, .22, age), -.17, flash);
  const wave = ease(0, .53, age);
  if (wave < 1) {
    g.save();
    g.globalAlpha *= (1 - wave) * .72;
    g.strokeStyle = '#ffbc61';
    g.lineWidth = 4 - 2.7 * wave;
    g.beginPath();
    g.ellipse(x, y + 43, 29 + 179 * wave, 11 + 49 * wave, -.18 * side, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }
  const fragments = [2, 4, 7][quality];
  for (let i = 0; i < fragments; i++) {
    const lift = ease(.045, .27, age);
    const angle = i * 2.399 - .7;
    const speed = 74 + i * 27;
    detail(g, sheet, 1, x + Math.cos(angle) * age * speed + side * age * 29,
      y + Math.sin(angle) * age * speed * .41 - 124 * age + 59 * age * age,
      38 + i % 4 * 13, angle + age * (i % 2 ? 3 : -3), lift * fade * .84);
  }
  const count = [7, 15, 26][quality];
  g.save();
  g.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const life = .43 + (i * 49 % 90) / 100;
    if (age >= life) continue;
    const angle = i * 2.399;
    const distance = (68 + i * 69 % 299) * (1 - Math.exp(-age * 3.6));
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const px = x + dx * distance + side * age * 37;
    const py = y + dy * distance * .57 - age * (82 + i % 4 * 22);
    const tail = 6 + i % 5 * 4;
    g.globalAlpha = (1 - age / life) * .92;
    g.strokeStyle = embers[i % embers.length];
    g.lineWidth = 1.25 + i % 3 * .76;
    g.beginPath();
    g.moveTo(px, py);
    g.lineTo(px - dx * tail, py - dy * tail * .58 + 3);
    g.stroke();
  }
  g.restore();
}

export function paintAbyssbreaker(g, s, art, pose, quality) {
  const flying = (s.shot?.cardKind ?? s.shot?.kind) === 'ultimate';
  const charging = s.cast?.kind === 'ultimate';
  const hit = s.skillImpact?.kind === 'ultimate' ? s.skillImpact : null;
  const swing = s.bladeRelease?.kind === 'ultimate' ? s.bladeRelease : null;
  const hitAge = hit ? s.age - hit.age : Infinity;
  const swingAge = swing ? s.age - swing.age : Infinity;
  const activeHit = hitAge >= 0 && hitAge < AFTERBURN_TIME;
  const activeSwing = swingAge >= 0 && swingAge < SLASH_TIME;
  if (!flying && !charging && !activeHit && !activeSwing) return;

  const targetX = s.cardMode ? TARGET[0] + pose.dx : MELEE_TARGET[0];
  const targetY = s.cardMode ? TARGET[1] + pose.dy : MELEE_TARGET[1] - 72;
  g.save();
  g.imageSmoothingEnabled = true;
  if (flying) flight(g, s, art, targetX, targetY, quality);
  else if (charging) forge(g, s, art.details, targetX, quality);

  if (activeHit || activeSwing) {
    const mark = activeHit ? hit : swing;
    const elapsed = activeHit ? hitAge : swingAge;
    if (!pinned.has(mark)) {
      const side = targetX < s.x ? -1 : 1;
      const reach = Math.min(Math.abs(targetX - s.x) * .68, 143);
      const x = s.cardMode ? targetX - side * 64 : s.x + side * Math.max(reach, 58);
      const y = s.cardMode ? targetY + 22 : s.y - 82;
      pinned.set(mark, { x, y, targetX, targetY, side });
    }
    const origin = pinned.get(mark);
    if (elapsed < SLASH_TIME) {
      const t = elapsed / SLASH_TIME;
      const width = (s.reduceMotion ? 362 : s.cardMode ? 460 : 540) * (.85 + .18 * ease(0, .42, t));
      const opacity = s.reduceMotion ? .76 * (1 - t) : .97;
      sweep(g, s, art.sequence, origin.x + origin.side * t * 31, origin.y - t * 16, width,
        origin.side, s.reduceMotion ? -.22 : -.24 + t * .72, t, opacity);
    }
    if (activeHit) afterburn(g, s, art.details, origin.targetX, origin.targetY, origin.side, hitAge, quality);
  }
  g.restore();
}
