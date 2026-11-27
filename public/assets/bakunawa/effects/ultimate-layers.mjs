import { clamp } from '../combat.mjs?v=dual-hd';

export const DETAIL_CELL = 168;

export function ease(from, to, time) {
  const t = clamp((time - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
}

export function halo(g, x, y, radius, color, opacity) {
  const light = g.createRadialGradient(x, y, 0, x, y, radius);
  light.addColorStop(0, color);
  light.addColorStop(1, 'transparent');
  g.save();
  g.globalAlpha *= opacity;
  g.fillStyle = light;
  g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  g.restore();
}

export function detail(g, sheet, index, x, y, size, angle, opacity) {
  if (opacity <= 0) return;
  g.save();
  g.globalAlpha *= opacity;
  g.translate(x, y);
  g.rotate(angle);
  g.drawImage(sheet, index * DETAIL_CELL, 0, DETAIL_CELL, DETAIL_CELL, -size / 2, -size / 2, size, size);
  g.restore();
}
