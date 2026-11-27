import { paintCharacter } from './character.mjs';
import { PROPS, NPCS, LIGHTS, WORLD } from './layout.mjs?v=1.147';
import { stationEffects } from './effects.mjs?v=1.148';
import { CAT_ART, buildTrain, trainAt, paintTrain, paintChimneys, paintBirds, stationCat, paintCat } from './ambience.mjs?v=1.148';

const WINDOWS = [[9, 78, 132, 15], [42, 151, 59, 19], [306, 145, 61, 20]];
const SCENERY = [...PROPS, ...NPCS];
const ACTORS = new Map(NPCS.map((npc, index) => [npc, index]));

const PRESETS = {
  day: { grade: '#fff1d1', tint: 0.12, lamps: 0.15, bloom: 0.42, haze: 0.09, edge: 0.15 },
  dusk: { grade: '#dfb1ba', tint: 0.29, lamps: 0.47, bloom: 0.72, haze: 0.16, edge: 0.26 },
  night: { grade: '#536492', tint: 0.74, lamps: 0.77, bloom: 0.96, haze: 0.11, edge: 0.42 },
};

function image(name, directory = './art/') {
  const art = new Image();
  art.decoding = 'async';
  art.src = new URL(directory + name, import.meta.url).href;
  return art.decode().then(() => art);
}

export async function loadStation() {
  const names = ['terrace/station.webp', 'terrace/amihan.png', ...new Set(SCENERY.map((piece) => piece.art))];
  return Object.fromEntries(await Promise.all([
    ...names.map(async (name) => [name, await image(name)]),
    image(CAT_ART, '../').then((cat) => [CAT_ART, cat]),
  ]));
}

function gradient(ctx, x, y, radius, color, strength) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, 'rgba(' + color + ',' + strength + ')');
  glow.addColorStop(0.46, 'rgba(' + color + ',' + strength * 0.36 + ')');
  glow.addColorStop(1, 'rgba(' + color + ',0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function shadow(ctx, x, y, width, depth) {
  ctx.fillStyle = 'rgba(16,25,34,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y, width, depth, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(15,25,34,0.15)';
  ctx.beginPath();
  ctx.ellipse(x - 0.5, y - 0.2, width * 0.70, depth * 0.60, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function stationRenderer(ctx, art) {
  const emitters = WINDOWS.map((source) => ({
    image: art['terrace/station.webp'], source, x: source[0], y: source[1],
  }));
  for (const prop of PROPS) {
    if (!prop.emission) continue;
    emitters.push({ image: art[prop.art], source: prop.emission,
      x: prop.x - prop.anchorX + prop.emission[0], y: prop.y - prop.anchorY + prop.emission[1] });
  }
  const effects = stationEffects(ctx, WORLD, emitters);
  const train = buildTrain();
  return (view, player, time, elapsed, talking) => renderStation(ctx, art, effects, train, view, player, time, elapsed, talking);
}

function paintFixture(ctx, art, piece, elapsed, talking) {
  const sprite = art[piece.art];
  const x = Math.round(piece.x - piece.anchorX);
  const y = Math.round(piece.y - piece.anchorY);
  const index = ACTORS.get(piece);
  const phase = (elapsed + (index ?? 0) * 0.67) % 3.4;
  if (index === undefined || talking || !elapsed || phase >= 0.40) {
    ctx.drawImage(sprite, x, y);
    return;
  }

  // Compress the upper body by one pixel for a short breath, keeping the feet planted.
  const { width, height } = sprite;
  const body = height - 8;
  ctx.drawImage(sprite, 0, 0, width, body, x, y + 1, width, body - 1);
  ctx.drawImage(sprite, 0, body, width, 8, x, y + body, width, 8);
}

function renderStation(ctx, art, effects, train, view, player, time, elapsed, talking) {
  const { width, height, x, y } = view;
  const preset = PRESETS[time];
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.translate(-x, -y);
  ctx.drawImage(art['terrace/station.webp'], 0, 0);
  ctx.restore();
  effects.blurScenery(view);

  ctx.save();
  ctx.translate(-x, -y);
  paintChimneys(ctx, elapsed);
  const cat = stationCat(elapsed);
  const trainX = trainAt(elapsed, WORLD.width);
  if (trainX !== null) paintTrain(ctx, train, trainX);
  for (const piece of SCENERY) shadow(ctx, piece.x, piece.y + 1, piece.radius + 2, piece.shadow);
  shadow(ctx, player.x, player.y + 0.8, 7.5, 2.6);
  shadow(ctx, cat.x, cat.y, 6, 2);

  // The floor contact determines when a sprite moves behind a foreground silhouette.
  for (const piece of [...SCENERY, player, cat].sort((a, b) => a.y - b.y)) {
    if (piece === player) paintCharacter(ctx, art['terrace/amihan.png'], player, player.x, player.y);
    else if (piece === cat) paintCat(ctx, art[CAT_ART], cat, elapsed);
    else paintFixture(ctx, art, piece, elapsed, talking);
  }
  paintBirds(ctx, elapsed, WORLD.width);

  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = preset.grade;
  ctx.globalAlpha = preset.tint;
  ctx.fillRect(x, y, width, height);
  ctx.globalAlpha = 1;

  ctx.globalCompositeOperation = 'screen';
  for (const [index, { x: lx, y: ly, radius, color }] of LIGHTS.entries()) {
    if (lx + radius < x || lx - radius > x + width || ly + radius < y || ly - radius > y + height) continue;
    gradient(ctx, lx, ly, radius, color, preset.lamps * (0.89 + Math.sin(elapsed * 1.2 + index) * 0.10));
  }
  if (trainX !== null && Math.floor(elapsed * 4) % 2 === 0) {
    gradient(ctx, 484, 339, 16, '255,99,75', 0.64);
  }
  // Light motes drift at slightly different speeds across the lit platform.
  for (let i = 0; i < 28; i++) {
    const sx = (95 + i * 87.33 + elapsed * (2 + i % 3)) % WORLD.width;
    const sy = WORLD.height * 0.26 + i * 19.49 % (WORLD.height * 0.65) + Math.sin(elapsed * 0.7 + i * 2.1) * 6;
    const opacity = 0.07 + (0.5 + Math.sin(elapsed * 1.25 + i * 3.65) * 0.5) * preset.haze;
    ctx.fillStyle = 'rgba(244,207,139,' + opacity + ')';
    ctx.fillRect(Math.round(sx), Math.round(sy), i % 6 ? 1 : 2, 1);
  }
  ctx.restore();

  effects.lightScenery(view, preset.bloom);

  const vignette = ctx.createRadialGradient(width / 2, height * 0.52, height * 0.32,
    width / 2, height * 0.52, Math.hypot(width, height) * 0.54);
  vignette.addColorStop(0, 'rgba(14,23,38,0)');
  vignette.addColorStop(1, 'rgba(14,23,38,' + preset.edge + ')');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}
