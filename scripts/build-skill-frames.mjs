import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { FRAME_COUNT, FRAMES_PER_ROW, frameAtlases } from '../public/assets/bakunawa/effects/frames.mjs';

const directory = new URL('../public/assets/bakunawa/effects/', import.meta.url);
const originalCell = 512;
const channels = 4;
const tau = Math.PI * 2;
const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));

function ease(start, end, value) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function falloff(t, start) {
  return 1 - .90 * ease(start, 1, t);
}

// Inverse transforms let each frame sample the source once, preserving soft alpha.
function transform({ sx, sy = sx, x = 0, y = 0, angle = 0 }, style) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return (u, v, sample) => {
    const du = u - x;
    const dv = v - y;
    style(x + (du * cos + dv * sin) / sx, y + (dv * cos - du * sin) / sy, sample);
  };
}

function seal(t) {
  const size = .81 + .12 * ease(0, .55, t);
  const sweep = .55 + 5.95 * ease(0, .83, t);
  return transform({ sx: size }, (x, y, sample) => {
    const radius = Math.hypot(x, y);
    const angle = Math.atan2(y, x);
    const phase = (angle + tau * 1.25) % tau;
    const outer = ease(.32, .62, radius);
    const twist = angle + (.14 + .22 * t) * (2 * outer - 1);
    const trace = ease(-.38, .20, sweep - phase);
    const opacity = 1 - outer * (1 - trace) * .78;
    const light = .91 + .39 * Math.max(0, 1 - Math.abs(sweep - phase) * 2.7);
    sample(radius * Math.cos(twist), radius * Math.sin(twist), opacity, light);
  });
}

function burst(t, red) {
  const grow = ease(0, .53, t);
  const opacity = falloff(t, .48);
  const x = red ? -.15 : 0;
  const y = red ? .67 : .47;
  return transform({ x, y, sx: .38 + .57 * grow, sy: .18 + .79 * grow, angle: (red ? -.04 : .06) * t },
    (u, v, sample) => {
      const radius = Math.hypot(u - x, v - y);
      const light = .90 + .72 * Math.max(0, 1 - Math.abs(radius - t * 1.58) * 2.6);
      sample(u, v, opacity, light);
    });
}

function trail(t) {
  const length = .40 + .53 * ease(0, .62, t);
  const pulse = .88 - 1.76 * t;
  return transform({ x: .89, sx: length, sy: .72 + .25 * Math.sin(t * Math.PI) }, (x, y, sample) => {
    const tail = ease(-.94, .60, x);
    const shimmer = Math.max(0, 1 - Math.abs(x - pulse) * 4.5);
    sample(x, y + (1 - tail) * .055 * Math.sin(x * 7 - t * 9), .49 + .51 * tail, .91 + .44 * shimmer);
  });
}

function crystal(t) {
  const form = ease(0, .69, t);
  const band = -1.15 + 2.3 * t;
  return transform({ sx: .61 + .33 * form, sy: .74 + .23 * form, angle: .19 * (t - .5) }, (x, y, sample) => {
    const shine = Math.max(0, 1 - Math.abs(y + x * .51 - band) * 5.5);
    sample(x, y, .70 + .30 * form, .92 + .70 * shine);
  });
}

function contact(t) {
  const expansion = ease(0, .45, t);
  const collapse = ease(.51, 1, t);
  const opacity = falloff(t, .22);
  const bright = .91 + .64 * (1 - ease(0, .35, t));
  return transform({ y: -.07, sx: .39 + .57 * expansion - .20 * collapse, sy: .47 + .49 * expansion - .34 * collapse,
    angle: .07 * t }, (x, y, sample) => {
    sample(x, y, opacity, bright + .21 * Math.max(0, 1 - Math.hypot(x, y + .07) * 3));
  });
}

function ward(t) {
  const rise = ease(0, .37, t);
  const pulse = .68 + 6.28 * t;
  const opacity = (.53 + .47 * rise) * falloff(t, .66);
  return transform({ sx: .65 + .30 * rise, sy: .71 + .22 * rise }, (x, y, sample) => {
    const theta = Math.atan2(y * 1.5, x);
    const glow = Math.max(0, Math.cos(theta - pulse)) ** 8;
    sample(x, y, opacity, .88 + .64 * glow);
  });
}

function arc(t, { x, y, start, extent }) {
  const swing = ease(0, .80, t);
  const head = .64 + (extent - .33) * swing;
  const opacity = falloff(t, .55);
  return transform({ sx: .88 + .08 * swing, angle: .09 * (t - .5) }, (u, v, sample) => {
    const theta = (Math.atan2(v - y, u - x) - start + tau) % tau;
    const trailLight = .90 + .73 * Math.max(0, 1 - Math.abs(head - theta) * 2.5);
    const reveal = .08 + .92 * ease(-.24, .13, head - theta);
    sample(u, v, opacity * reveal, trailLight);
  });
}

const motions = {
  yhannie: { seal, burst, trail, crystal, contact, ward },
  loki: {
    slash: t => arc(t, { x: -.20, y: -.15, start: -1.67, extent: 4.18 }),
    trail,
    contact,
    finish: t => arc(t, { x: .02, y: .33, start: -3.65, extent: 4.64 }),
    burst: t => burst(t, true),
    parry: t => arc(t, { x: -.09, y: -.10, start: -2.88, extent: 5.02 }),
  },
};

function drawFrame(atlas, width, originX, originY, size, source, draw) {
  let at = 0;
  const sample = (x, y, opacity, brightness) => {
    if (Math.abs(x) >= 1 || Math.abs(y) >= 1) return;
    const u = (x + 1) * (size - 1) / 2;
    const v = (y + 1) * (size - 1) / 2;
    const a = Math.floor(u);
    const b = Math.floor(v);
    const dx = u - a;
    const dy = v - b;
    const base = (b * size + a) * channels;
    const row = size * channels;
    const w00 = source[base + 3] * (1 - dx) * (1 - dy);
    const w10 = source[base + 7] * dx * (1 - dy);
    const w01 = source[base + row + 3] * (1 - dx) * dy;
    const w11 = source[base + row + 7] * dx * dy;
    const alpha = w00 + w10 + w01 + w11;
    if (alpha * opacity < 1) return;
    for (let c = 0; c < 3; c++) {
      const color = source[base + c] * w00 + source[base + c + 4] * w10
        + source[base + row + c] * w01 + source[base + row + c + 4] * w11;
      atlas[at + c] = Math.min(255, Math.round(color * brightness / alpha));
    }
    atlas[at + 3] = Math.round(alpha * opacity);
  };

  // Keep a transparent gutter on every side so adjacent clips cannot bleed.
  for (let y = 3; y < size - 3; y++) {
    for (let x = 3; x < size - 3; x++) {
      at = ((originY + y) * width + originX + x) * channels;
      draw((x + .5) * 2 / size - 1, (y + .5) * 2 / size - 1, sample);
    }
  }
}

for (const [hero, { width, height, clips }] of Object.entries(frameAtlases)) {
  const master = fileURLToPath(new URL(hero + '-vfx.webp', directory));
  const atlas = Buffer.alloc(width * height * channels);
  for (const [name, { x, y, size, cell }] of Object.entries(clips)) {
    const source = await sharp(master).extract({
      left: cell % 3 * originalCell, top: Math.floor(cell / 3) * originalCell,
      width: originalCell, height: originalCell,
    }).resize(size, size).ensureAlpha().raw().toBuffer();
    for (let frame = 0; frame < FRAME_COUNT; frame++) {
      drawFrame(atlas, width, x + frame % FRAMES_PER_ROW * size,
        y + Math.floor(frame / FRAMES_PER_ROW) * size, size, source,
        motions[hero][name](frame / (FRAME_COUNT - 1)));
    }
  }
  const output = fileURLToPath(new URL(hero + '-vfx-16.webp', directory));
  await sharp(atlas, { raw: { width, height, channels } })
    .webp({ quality: 88, alphaQuality: 96, smartSubsample: true }).toFile(output);
  console.log(hero, Object.keys(clips).length, 'clips ×', FRAME_COUNT, 'frames', width + '×' + height);
}
