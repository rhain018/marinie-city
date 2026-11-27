import { TARGET, MELEE_TARGET, clamp } from '../combat.mjs?v=fishing-port';

const definitions = ['crimsonDash', 'burstNova', 'stormfangLightning'];
const STEPS = 96;

export function validateFieldAtlas(atlas, metadata) {
  const spec = metadata?.atlas;
  if (!spec || !definitions.every(clip => metadata.clips?.[clip]?.markers) ||
      !['gather', 'slash', 'bloom', 'lightning'].every(key => metadata.curves?.[key]?.length >= 2)) return false;
  return atlas.naturalWidth === spec.cell * spec.columns &&
    atlas.naturalHeight === spec.cell * spec.rows;
}

function tracks(points) {
  const values = new Float32Array((STEPS + 1) * 2);
  let segment = 0;
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    if (points[segment + 1][0] < t) segment++;
    const [at, alpha, size] = points[segment];
    const [until, nextAlpha, nextSize] = points[segment + 1];
    const d = (t - at) / (until - at);
    const eased = d * d * (3 - 2 * d);
    values[i * 2] = alpha + (nextAlpha - alpha) * eased;
    values[i * 2 + 1] = size + (nextSize - size) * eased;
  }
  return values;
}

const prepared = new WeakMap();

function clipsFor(art) {
  let tracksByName = prepared.get(art);
  if (!tracksByName) {
    tracksByName = Object.fromEntries(Object.entries(art.meta.curves).map(([name, points]) => [name, tracks(points)]));
    prepared.set(art, tracksByName);
  }
  return tracksByName;
}

export function createFieldEffects(art, hero) {
  return {
    hero: art.meta.clips[hero === 'loki' ? 'crimsonDash' : 'burstNova'],
    boss: art.meta.clips.stormfangLightning,
    launchAt: -Infinity, hitAt: -Infinity, bossAt: -Infinity,
    x: 0, y: 0, releaseX: 0, releaseY: 0, targetX: 0, targetY: 0, side: 1,
    liveCast: false, landed: false,
  };
}

// The simulation's existing events own all timing and damage. Track only the
// presentation of those events, including a missed sword swing and a dodge cancel.
export function cueFieldEffects(s, event, kind) {
  const fx = s.fieldEffects;
  if (!fx) return;
  const { hero, boss } = fx;
  const marks = hero.markers;
  if (event === marks.anticipation && s.cast?.kind === hero.kind) {
    fx.launchAt = fx.hitAt = -Infinity;
    fx.x = s.x;
    fx.y = s.y;
    fx.liveCast = true;
    fx.landed = false;
  } else if (kind === hero.kind && event === marks.active && fx.liveCast) {
    fx.launchAt = s.age;
    fx.releaseX = s.x;
    fx.releaseY = s.y;
    fx.side = (s.hero === 'loki' ? MELEE_TARGET[0] : TARGET[0] + 126) < s.x ? -1 : 1;
    fx.liveCast = false;
  } else if (kind === hero.kind && (event === marks.impact || event === marks.miss) && fx.launchAt > -Infinity) {
    fx.hitAt = s.age;
    fx.landed = event === marks.impact;
    if (fx.landed && !s.reduceMotion) s.visual.impulse = Math.max(s.visual.impulse, .41);
  } else if (marks.cancel.includes(event) && fx.liveCast) {
    fx.liveCast = false;
  }
  if (event === boss.markers.active && kind === boss.kind && s.hazard) {
    fx.bossAt = s.age;
    fx.targetX = s.hazard.x;
    fx.targetY = s.hazard.y;
    if (!s.reduceMotion) s.visual.impulse = Math.max(s.visual.impulse, .37);
  }
}

export function fieldPose(s, frame) {
  const fx = s.fieldEffects;
  if (!fx || s.hurt || s.dodge || s.state === 'victory' || s.state === 'lost' || s.state === 'won') return frame;
  const { poseCells } = fx.hero;
  if (s.cast?.kind === fx.hero.kind && fx.liveCast) {
    return s.cast.time / s.cast.total > .81 ? poseCells.anticipation : poseCells.active;
  }
  if (s.moving || s.cast || s.guard) return frame;
  const after = s.age - fx.launchAt;
  if (after < .11) return poseCells.release;
  if (after < .22) return poseCells.recovery;
  return frame;
}

function stamp(g, art, tile, x, y, w, h, alpha, angle = 0, facing = 1) {
  if (alpha <= .025) return;
  const { cell, columns, tiles } = art.meta.atlas;
  const index = tiles[tile];
  g.save();
  g.translate(Math.round(x), Math.round(y));
  g.rotate(angle);
  g.scale(facing, 1);
  g.globalAlpha *= alpha;
  g.drawImage(art.image, (index % columns) * cell, Math.floor(index / columns) * cell, cell, cell,
    -w * .5, -h * .5, Math.round(w), Math.round(h));
  g.restore();
}

function glow(g, x, y, radius, color) {
  const gradient = g.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'transparent');
  g.fillStyle = gradient;
  g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

const sampled = new Float32Array(2);

function sample(art, curve, progress) {
  const index = 2 * Math.round(STEPS * clamp(progress, 0, 1));
  const track = clipsFor(art)[curve];
  sampled[0] = track[index];
  sampled[1] = track[index + 1];
  return sampled;
}

function ring(g, x, y, rx, ry, color) {
  g.strokeStyle = color;
  g.lineWidth = 2.8;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.stroke();
}

function dash(g, s, art, fx, quality) {
  const wind = s.cast?.kind === fx.hero.kind && fx.liveCast;
  if (wind) {
    const progress = 1 - s.cast.time / s.cast.total;
    const [alpha, size] = sample(art, 'gather', progress);
    const dx = s.x - fx.x, dy = s.y - fx.y;
    const side = dx < 0 ? -1 : 1;
    const trailX = s.x - side * Math.min(87 + Math.abs(dx) * .18, 146);
    glow(g, s.x + side * 44, s.y - 66, 76, '#ff623b59');
    if (!s.reduceMotion && progress > .21) {
      stamp(g, art, 'dashRibbon', trailX, s.y - 55 - dy * .13,
        Math.min(338, 154 + Math.abs(dx)) * size, 142, .81 * alpha, 0, side);
    }
  }
  const p = (s.age - fx.launchAt) / fx.hero.recovery;
  if (p >= 0 && p < 1) {
    const [alpha, size] = sample(art, 'slash', p);
    const x = fx.releaseX + fx.side * (66 + p * 31), y = fx.releaseY - 80 - p * 24;
    stamp(g, art, 'crimsonCrescent', x, y, 365 * size, 280 * size, alpha, s.reduceMotion ? -.18 : -.46 + p * .56, fx.side);
    if (fx.landed && p < .26) glow(g, MELEE_TARGET[0], MELEE_TARGET[1] - 68, 105, '#ffc17763');
    if (quality === 2 && !s.reduceMotion) {
      stamp(g, art, 'crimsonCrescent', x - fx.side * 23, y + 30, 326 * size, 187 * size, alpha * .32, .18, fx.side);
    }
  }
}

function nova(g, s, art, fx, pose) {
  const targetX = TARGET[0] + pose.dx, targetY = TARGET[1] + pose.dy;
  const side = targetX < s.x ? -1 : 1;
  if (s.cast?.kind === fx.hero.kind && fx.liveCast) {
    const p = 1 - s.cast.time / s.cast.total;
    const [alpha, size] = sample(art, 'gather', p);
    const x = s.x + side * 99, y = s.y - 122;
    stamp(g, art, 'cyanSeal', x, y, 179 * size, 230 * size, alpha, s.reduceMotion ? 0 : p * .29 * side, side);
    ring(g, s.x, s.y + 3, 53 + p * 37, 14 + p * 9, '#63ebffb2');
    glow(g, x, y, 91, '#34daff68');
  }
  if (s.shot?.kind === fx.hero.kind) {
    const q = s.shot.t;
    const originX = fx.releaseX + fx.side * 109, originY = fx.releaseY - 113;
    const deltaX = targetX - originX, deltaY = targetY - originY;
    const x = originX + deltaX * q, y = originY + deltaY * q - 34 * Math.sin(q * Math.PI);
    const angle = Math.atan2(deltaY, Math.abs(deltaX));
    stamp(g, art, 'cyanSeal', originX, originY, 198, 224, (1 - q) * .92, q * .21, fx.side);
    stamp(g, art, 'nova', x - fx.side * 25, y, 174, 136, .97, angle - 1.36, fx.side);
    glow(g, x, y, 75, '#69edff90');
  }
  const p = (s.age - fx.hitAt) / fx.hero.recovery;
  if (fx.landed && p >= 0 && p < 1) {
    const [alpha, size] = sample(art, 'bloom', p);
    stamp(g, art, 'nova', targetX, targetY, 315 * size, 302 * size, alpha);
    stamp(g, art, 'cyanSeal', targetX, targetY, 213 * size, 149 * size, alpha * .58, .28);
  }
}

export function paintHeroFieldEffects(g, art, s, pose, quality) {
  if (!s.fieldEffects) return;
  g.save();
  g.globalCompositeOperation = 'screen';
  if (s.hero === 'loki') dash(g, s, art, s.fieldEffects, quality);
  else nova(g, s, art, s.fieldEffects, pose);
  g.restore();
}

export function paintStormfang(g, art, s, pose) {
  const fx = s.fieldEffects;
  if (!fx) return;
  g.save();
  g.globalCompositeOperation = 'screen';
  if (s.hazard?.kind === fx.boss.kind && s.state === 'tell') {
    const h = s.hazard;
    const progress = 1 - s.timer / h.length;
    const [alpha, size] = sample(art, 'gather', progress);
    glow(g, TARGET[0] + pose.dx + 38, TARGET[1] + pose.dy - 50, 59 + progress * 35, '#3fc9ff70');
    ring(g, h.x, h.y, h.r * (.18 + progress * .79), h.r / 1.3 * (.18 + progress * .79), '#b8f7ffdf');
    stamp(g, art, 'cyanSeal', h.x, h.y, h.r * 1.8 * size, h.r * .82 * size, alpha * .62);
  }
  const p = (s.age - fx.bossAt) / fx.boss.recovery;
  if (p >= 0 && p < 1) {
    const { targetX: x, targetY: y } = fx;
    const [alpha, size] = sample(art, 'lightning', p);
    const [splashAlpha, splashSize] = sample(art, 'bloom', p);
    stamp(g, art, 'forkedBolt', x, y - 217, 238 * size, 499, alpha * (s.reduceMotion ? .61 : 1));
    stamp(g, art, 'oceanSplash', x, y - 27, 254 * splashSize, 169 * splashSize, splashAlpha);
    if (!s.reduceMotion && p < .31) glow(g, x, y - 45, 143, '#7cefff98');
  }
  g.restore();
}
