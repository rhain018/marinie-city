import * as THREE from 'three';

const PAVERS = ['#96887b', '#a79783', '#a79588', '#b5a48f', '#ad9d8c', '#a9978c', '#8f827d', '#b7a994'];
const SLATE = ['#59686d', '#59656b', '#5d6c72', '#627478', '#6d7674'];
const GRASS = ['#243b42', '#324c4c', '#3e5951', '#4b6354', '#536859', '#6d7659'];
const LUMBER = ['#987454', '#b48f63', '#ae855f', '#9e7b60', '#c09a6f', '#ae8d6e', '#88694d'];
const SHADOW = '#162633';

function randomizer(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function select(values, random) {
  return values[Math.floor(random() * values.length)];
}

export function pixelTexture(image, smooth = false) {
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = smooth ? THREE.LinearFilter : THREE.NearestFilter;
  texture.magFilter = texture.minFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function paint(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  return pixelTexture(canvas);
}

function fill(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

export function squareSurface(kind, worldWidth, worldDepth, seed) {
  const width = Math.round(worldWidth * 18);
  const height = Math.round(worldDepth * 18);
  const random = randomizer(seed);
  return paint(width, height, (ctx) => {
    if (kind === 'garden') {
      fill(ctx, GRASS[1], 0, 0, width, height);
      for (let i = 0; i < width * height / 15; i++) {
        const x = Math.floor(random() * width), y = Math.floor(random() * height);
        fill(ctx, select(GRASS, random), x, y, 1 + Math.floor(random() * 6), 1 + Math.floor(random() * 3));
      }
      fill(ctx, '#a3a393', 0, height - 4, width, 2);
      fill(ctx, '#526356', 0, height - 2, width, 2);
      return;
    }

    if (kind === 'deck') {
      fill(ctx, '#483b3e', 0, 0, width, height);
      for (let y = 2; y < height - 1; y += 7) {
        for (let x = -30 * ((y + 2) % 3); x < width; x += 64) {
          const color = select(LUMBER, random);
          fill(ctx, color, x, y, 63, 6);
          fill(ctx, '#ffdcaa55', x + 1, y, 62, 1);
          fill(ctx, '#654c41b3', x + 1, y + 5, 62, 1);
          for (let i = 0; i < 5; i++) {
            fill(ctx, i % 2 ? '#edd0a34a' : '#473a355e', x + 4 + Math.floor(random() * 48),
              y + 1 + Math.floor(random() * 4), 3 + Math.floor(random() * 8), 1);
          }
          fill(ctx, '#3d3c436c', x + 3, y + 2, 1, 2);
          fill(ctx, '#3d3c436c', x + 60, y + 2, 1, 2);
        }
      }
      fill(ctx, '#d5a16b', 0, 0, width, 2);
      fill(ctx, '#57423c', 0, height - 2, width, 2);
      return;
    }

    fill(ctx, '#635e64', 0, 0, width, height);
    for (let row = -1; row < Math.ceil(height / 10); row++) {
      const y = 10 * row;
      for (let x = (row % 2) * 9 - 18; x < width; x += 18) {
        const border = y < 35 || y > height - 21 || x < 16 || x > width - 35;
        const slateStrip = y > height * 0.41 && y < height * 0.53;
        fill(ctx, select(border ? SLATE : slateStrip ? [...SLATE, ...PAVERS] : PAVERS, random),
          x, y, 17, 9);
        fill(ctx, '#edd8b843', x + 1, y + 1, 15, 1);
        fill(ctx, '#4f4a5b44', x + 1, y + 8, 16, 1);
        for (let chip = 0; chip < 4; chip++) {
          fill(ctx, chip % 2 ? '#f2d7c23d' : '#57535c3f', x + 1 + Math.floor(random() * 13),
            y + 2 + Math.floor(random() * 6), 1 + Math.floor(random() * 3), 1);
        }
        if (border && random() < 0.17) fill(ctx, '#4e6554', x + 2, y + 8, 6, 2);
      }
    }

    const cx = Math.round(width * 0.502), cy = Math.round(height * 0.758);
    for (let y = -34; y <= 34; y++) {
      for (let x = -34; x <= 34; x++) {
        const edge = Math.max(Math.abs(x), Math.abs(y)) + 0.42 * Math.min(Math.abs(x), Math.abs(y));
        const star = Math.abs(x) + Math.abs(y) < 26 && Math.min(Math.abs(x), Math.abs(y)) < 4.2;
        const diamond = Math.abs(x) + Math.abs(y) < 10;
        if (edge >= 32 && edge < 34) fill(ctx, '#dec3a1', cx + x, cy + y, 1, 1);
        else if (edge >= 28 && edge < 32) fill(ctx, '#5c7377', cx + x, cy + y, 1, 1);
        else if (edge < 28) fill(ctx, star || diamond ? '#decab0' : select(SLATE, random), cx + x, cy + y, 1, 1);
      }
    }
  });
}

export function quayWall() {
  const random = randomizer(23);
  return paint(96, 32, (ctx) => {
    fill(ctx, '#344650', 0, 0, 96, 32);
    for (let y = 0; y < 32; y += 8) {
      for (let x = (y % 16 === 0 ? 0 : -8); x < 96; x += 16) {
        fill(ctx, select(SLATE, random), x, y, 15, 7);
        fill(ctx, '#96a9a766', x + 1, y, 14, 1);
        fill(ctx, '#233b4380', x + 2, y + 6, 9, 1);
        if (random() < 0.34) fill(ctx, '#41796f', x + 3, y + 6, 4, 2);
      }
    }
    fill(ctx, '#a99c8a', 0, 0, 96, 2);
    fill(ctx, '#3b6b69', 0, 28, 96, 2);
  });
}

export function shopSign(name, tone) {
  return paint(126, 29, (ctx) => {
    fill(ctx, SHADOW, 0, 2, 126, 25);
    fill(ctx, tone, 2, 4, 122, 21);
    fill(ctx, '#d9ad74', 4, 6, 118, 1);
    fill(ctx, '#936657', 4, 23, 118, 1);
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff0c8';
    ctx.fillText(name, 63, 15, 114);
  });
}

export function contactShadow() {
  return paint(32, 32, (ctx) => {
    const shade = ctx.createRadialGradient(16, 16, 3, 16, 16, 15);
    shade.addColorStop(0, '#1621309c');
    shade.addColorStop(0.5, '#17273466');
    shade.addColorStop(1, '#16213000');
    fill(ctx, shade, 0, 0, 32, 32);
  });
}
