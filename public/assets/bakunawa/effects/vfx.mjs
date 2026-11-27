import { TARGET, MELEE_TARGET, clamp } from '../combat.mjs?v=dual-hd';
import { FRAME_COUNT, FRAMES_PER_ROW } from './frames.mjs';

const CELL = 512;

function stamp(g, s, art, name, progress, { x, y, width, height = width, angle = 0, alpha = 1 }) {
  if (alpha <= 0) return;
  const clip = art.clips[name];
  let left = clip.cell % 3 * CELL;
  let top = Math.floor(clip.cell / 3) * CELL;
  let size = CELL;
  if (art.animated) {
    const frame = s.reduceMotion ? 6 : clamp(Math.floor(progress * FRAME_COUNT), 0, FRAME_COUNT - 1);
    size = clip.size;
    left = clip.x + frame % FRAMES_PER_ROW * size;
    top = clip.y + Math.floor(frame / FRAMES_PER_ROW) * size;
  }
  g.save();
  g.globalAlpha = Math.min(1, alpha);
  g.imageSmoothingEnabled = true;
  g.translate(x, y);
  g.rotate(angle);
  g.drawImage(art.sheet, left, top, size, size, -width / 2, -height / 2, width, height);
  g.restore();
}

function shardOrbit(g, s, art, progress, quality) {
  const count = [2, 4, 6][quality];
  for (let i = 0; i < count; i++) {
    const orbit = i * Math.PI * 2 / count + (s.reduceMotion ? 0 : s.age * 2.25);
    const size = 25 + i % 3 * 7 + 26 * progress;
    stamp(g, s, art, 'crystal', progress, {
      x: s.x + Math.cos(orbit) * (65 + progress * 75),
      y: s.y - 66 + Math.sin(orbit) * (27 + progress * 34),
      width: size, height: size, angle: Math.sin(orbit) * .28, alpha: .64 + .24 * progress,
    });
  }
}

function drawCast(g, s, art, quality, sword) {
  const { time, total, kind } = s.cast;
  const progress = clamp(1 - time / total, 0, 1);
  const big = kind === 'ultimate';
  const facing = s.x > TARGET[0] ? -1 : 1;
  if (!sword) {
    const radius = big ? 175 + 88 * progress : 66 + 65 * progress;
    stamp(g, s, art, 'seal', progress, {
      x: s.x + facing * (big ? 63 : 42), y: s.y - 65, width: radius,
      angle: s.reduceMotion ? 0 : s.age * .65, alpha: .32 + .55 * progress,
    });
    if (big || kind === 'charge') shardOrbit(g, s, art, progress, quality);
    if (big) stamp(g, s, art, 'seal', progress, {
      x: s.x, y: s.y, width: 282, height: 104, angle: .02, alpha: .85 * progress,
    });
  } else if (big || kind === 'charge' || kind === 'aerial') {
    stamp(g, s, art, 'trail', progress, {
      x: s.x - 57, y: s.y - 60, width: 182 + 128 * progress, height: 100 + progress * 66,
      alpha: (.18 + .6 * progress), angle: -.16,
    });
  }
}

function drawTravel(g, s, effects, art, pose, sword) {
  const shot = s.shot;
  const tx = TARGET[0] + pose.dx, ty = TARGET[1] + pose.dy;
  const origin = !sword && art.cinematic?.yhannie?.naturalWidth
    ? shot.x - 24 + 66 * Math.sign(tx - shot.x + 24) : shot.x;
  const progress = clamp(shot.t, 0, 1);
  const x = origin + (tx - origin) * progress;
  const y = shot.y + (ty - shot.y) * progress - (sword ? 0 : Math.sin(Math.PI * progress) * 45);
  const angle = Math.atan2(ty - shot.y, tx - origin);
  const big = (shot.cardKind ?? shot.kind) === 'ultimate';
  const width = big ? 290 : shot.kind === 'charge' ? 164 : 114;
  stamp(g, s, effects, sword ? 'slash' : 'trail', progress, {
    x: x - Math.cos(angle) * width * .27, y: y - Math.sin(angle) * width * .27,
    width, height: sword ? width * .81 : width * .55, angle, alpha: .9,
  });
}

function drawContact(g, s, art, pose, sword) {
  const hit = s.skillImpact;
  const big = hit.kind === 'ultimate';
  const heavy = big || hit.kind === 'charge' || hit.kind === 'crescent' || hit.combo === 3;
  const progress = (s.age - hit.age) / (big ? .74 : heavy ? .54 : .34);
  if (progress < 0 || progress >= 1) return;

  const melee = sword && !s.cardMode && hit.kind !== 'wave';
  const x = melee ? MELEE_TARGET[0] : TARGET[0] + pose.dx;
  const y = melee ? MELEE_TARGET[1] - 72 : TARGET[1] + pose.dy;
  const size = (big ? 555 : heavy ? 278 : 158) * (.56 + .44 * Math.sin(progress * Math.PI / 2));
  const bakedFade = art.animated && !s.reduceMotion;
  const opacity = bakedFade ? 1 : (1 - progress) ** .65;
  if (heavy) {
    stamp(g, s, art, 'burst', progress, {
      x, y: y - size * .12, width: size, height: size * .76,
      angle: sword ? -.24 : .14, alpha: opacity * .88,
    });
  }
  stamp(g, s, art, 'contact', progress, {
    x, y, width: size * .68, angle: sword ? -.29 : progress * .35,
    alpha: (bakedFade ? 1 : Math.max(0, 1 - progress * 1.8)) * .94,
  });
}

export function paintSkillEffects(g, s, art, pose, quality, enhancedUltimate, enhancedKind = null) {
  const effects = art.effects?.[s.hero];
  if (!effects?.sheet?.naturalWidth) return;
  const sword = s.hero === 'loki';

  if (s.cast && s.cast.kind !== enhancedKind && !(enhancedUltimate && sword && s.cast.kind === 'ultimate')) drawCast(g, s, effects, quality, sword);
  if (s.shot && s.shot.kind !== enhancedKind && !(enhancedUltimate && (s.shot.cardKind ?? s.shot.kind) === 'ultimate')) drawTravel(g, s, effects, art, pose, sword);
  if (s.dodge) {
    const angle = Math.atan2(s.dodge.y, s.dodge.x);
    const fade = Math.min(1, s.dodge.time * 5);
    const progress = 1 - s.dodge.time / (s.cardMode ? .27 : .29);
    stamp(g, s, effects, 'trail', progress, {
      x: s.x - 66 * Math.cos(angle), y: s.y - 52 - 66 * Math.sin(angle),
      width: 226, height: 128, angle, alpha: fade * .72,
    });
  }
  const parryAge = s.age - (s.guardImpact ?? -Infinity);
  const parryDuration = s.cardMode ? .42 : .32;
  const parried = sword && effects.animated && parryAge >= 0 && parryAge < parryDuration;
  if (s.guard > 0 || parried) {
    const progress = parried ? parryAge / parryDuration : 1 - s.guard / (s.cardMode ? .7 : .85);
    stamp(g, s, effects, sword ? 'parry' : 'ward', progress, {
      x: s.x + 18, y: s.y - 54, width: sword ? 121 : 146, height: 142,
      alpha: (parried ? (s.reduceMotion ? 1 - progress : 1) : Math.min(1, s.guard * 2.8)) * .8,
    });
  }
  if (sword && s.bladeRelease && s.bladeRelease.kind !== enhancedKind && !(enhancedUltimate && s.bladeRelease.kind === 'ultimate')) {
    const elapsed = s.age - s.bladeRelease.age;
    const big = s.bladeRelease.kind === 'ultimate';
    const progress = elapsed / (big ? .59 : .30);
    if (progress >= 0 && progress < 1) {
      const size = (big ? 495 : 204 + (s.bladeRelease.combo || 0) * 27) * (.73 + .27 * progress);
      stamp(g, s, effects, big ? 'finish' : 'slash', progress, {
        x: s.x + 97 + progress * 44, y: s.y - 70, width: size, height: size * .86,
        angle: big ? -.23 : .5 - progress * 1.25,
        alpha: effects.animated && !s.reduceMotion ? 1 : (1 - progress) ** .75,
      });
    }
  }
  if (s.skillImpact && s.skillImpact.kind !== enhancedKind && !(enhancedUltimate && s.skillImpact.kind === 'ultimate')) drawContact(g, s, effects, pose, sword);
}
