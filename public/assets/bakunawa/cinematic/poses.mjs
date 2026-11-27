export const HERO_CELLS = {
  columns: 4,
  rows: 2,
  width: 272,
  height: 244,
  pivot: [132, 229],
  names: ['idle', 'breathe', 'anticipation', 'release', 'followThrough', 'dash', 'aerial', 'recoil'],
};
export const BOSS_CELLS = {
  columns: 3,
  rows: 2,
  width: 500,
  height: 435,
  pivot: [339, 420],
  names: ['idle', 'raisedIdle', 'anticipation', 'roar', 'recoil', 'sinking'],
};

export function drawPose(g, image, cells, frame, x, y, scale, facing = 1) {
  const { columns, width, height, pivot: [px, py] } = cells;
  g.save();
  g.translate(Math.round(x), Math.round(y));
  if (facing < 0) g.scale(-1, 1);
  g.drawImage(image, frame % columns * width, Math.floor(frame / columns) * height,
    width, height, -Math.round(px * scale), -Math.round(py * scale),
    Math.round(width * scale), Math.round(height * scale));
  g.restore();
}

export function heroFrame(s) {
  if (s.state === 'lost' || s.hurt) return 7;
  if (s.dodge) return s.dodge.time > .075 ? 5 : 4;
  if (s.cast) {
    const { kind, time, total, combo } = s.cast;
    const p = 1 - time / total;
    if (p < .16) return 2;
    if (kind === 'aerial') return p < .79 ? 6 : 3;
    if (kind === 'ultimate' && s.hero === 'loki') {
      if (p < .35) return 5;
      if (p < .68) return [3, 4, 2][Math.floor(p * 21) % 3];
      return p < .89 ? 6 : 3;
    }
    if (s.hero === 'loki' && kind === 'charge') return p < .8 ? 5 : 3;
    if (s.hero === 'loki' && kind === 'bolt' && combo === 2 && p > .42 && p < .74) return 6;
    if (s.hero === 'loki' && kind === 'bolt' && combo === 3 && p > .3 && p < .7) return 4;
    return p < .78 ? 2 : 3;
  }
  if (s.visualRelease) {
    const age = s.age - s.visualRelease.age;
    if (age < .085) return 3;
    if (age < .265) return 4;
  }
  if (s.guard) return 2;
  if (s.moving && s.state !== 'won' && s.state !== 'victory') return -1;
  return s.reduceMotion || (s.age * .85) % 1 < .58 ? 0 : 1;
}

export function bossFrame(s) {
  if (s.state === 'sinking' || s.state === 'won' || (s.state === 'victory' && s.victoryTime >= 3.2)) return 5;
  if (s.stagger > .10) return 4;
  if (s.state === 'impact') return s.hazard?.kind === 'vortex' ? 4 : 3;
  if (s.state === 'enrage') return 3;
  if (s.state === 'tell') {
    if (s.hazard?.kind === 'wave') return 1;
    if (s.hazard?.kind === 'vortex') return 5;
    return 2;
  }
  return !s.reduceMotion && (s.age * .63) % 1 > .62 ? 1 : 0;
}
