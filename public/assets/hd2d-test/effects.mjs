const KERNEL = [1, 6, 15, 20, 15, 6, 1];
const clamp01 = (value) => Math.max(0, Math.min(1, value));

function buffer(width = 1, height = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext('2d');
}

function resize(ctx, width, height) {
  if (ctx.canvas.width !== width || ctx.canvas.height !== height) {
    ctx.canvas.width = width;
    ctx.canvas.height = height;
  }
}

function blurAxis(target, source, horizontal) {
  target.clearRect(0, 0, target.canvas.width, target.canvas.height);
  target.globalCompositeOperation = 'lighter';
  for (const [index, weight] of KERNEL.entries()) {
    const offset = (index - 3) * 3;
    target.globalAlpha = weight / 64;
    target.drawImage(source.canvas, horizontal ? offset : 0, horizontal ? 0 : offset);
  }
  target.globalAlpha = 1;
  target.globalCompositeOperation = 'source-over';
}

function bakeBloom(width, height, emitters) {
  const mask = buffer(width, height);
  for (const { image, source, x, y } of emitters) {
    mask.drawImage(image, ...source, x, y, source[2], source[3]);
  }

  // Only tagged, bright warm pixels contribute. The mask and its blur are baked once.
  const pixels = mask.getImageData(0, 0, width, height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const red = pixels.data[i], blue = pixels.data[i + 2];
    pixels.data[i + 3] *= clamp01((red - 150) / 75) * clamp01((red - blue - 22) / 66);
  }
  mask.putImageData(pixels, 0, 0);

  const halfWidth = Math.ceil(width / 2), halfHeight = Math.ceil(height / 2);
  const glow = buffer(halfWidth, halfHeight);
  const horizontal = buffer(halfWidth, halfHeight);
  glow.drawImage(mask.canvas, 0, 0, halfWidth, halfHeight);
  blurAxis(horizontal, glow, true);
  blurAxis(glow, horizontal, false);
  return glow.canvas;
}

function roofMask(ctx, height, cameraY) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  // The effect fades out before the walkable terrace in world space.
  for (const y of [0, ...[72, 120, 176].map((point) => point - cameraY).filter((point) => point > 0 && point < height), height]) {
    const amount = 1 - clamp01((cameraY + y - 72) / 104);
    gradient.addColorStop(y / height, 'rgba(0,0,0,' + (amount * amount * 0.36) + ')');
  }
  return gradient;
}

export function stationEffects(ctx, world, emitters) {
  const bloom = bakeBloom(world.width, world.height, emitters);
  const half = buffer();
  const soft = buffer();
  const masked = buffer();

  function blurScenery(view) {
    if (view.y >= 176) return;
    const { y, width, height } = view;
    const roofHeight = Math.min(height, 176 - y);
    resize(half, Math.ceil(width / 2), Math.ceil(roofHeight / 2));
    resize(soft, Math.ceil(width / 4), Math.ceil(roofHeight / 4));
    resize(masked, width, roofHeight);

    // Canvas resampling works without the Canvas filter API on mobile browsers.
    half.drawImage(ctx.canvas, 0, 0, width, roofHeight, 0, 0, half.canvas.width, half.canvas.height);
    soft.drawImage(half.canvas, 0, 0, soft.canvas.width, soft.canvas.height);
    masked.clearRect(0, 0, width, roofHeight);
    masked.drawImage(soft.canvas, 0, 0, width, roofHeight);
    masked.globalCompositeOperation = 'destination-in';
    masked.fillStyle = roofMask(masked, roofHeight, y);
    masked.fillRect(0, 0, width, roofHeight);
    masked.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.drawImage(masked.canvas, 0, 0);
    ctx.restore();
  }

  function lightScenery({ x, y }, bloomStrength) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = bloomStrength;
    ctx.drawImage(bloom, -x, -y, world.width, world.height);
    ctx.restore();
  }
  return { blurScenery, lightScenery };
}
