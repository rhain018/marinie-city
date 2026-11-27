import * as THREE from 'three';
import { Water } from './vendor/luminati/src/engine/world/Water.js';
import { DECKS, DECK_HEIGHT, PROMENADE, STAIRS, STAIR_COUNT, TERRACE_HEIGHT, sceneX, sceneZ, stairHeight } from './layout.mjs';

import { BACKSTREET, OUTCROP, FACADES, BOATS, RAILS, LAMPS } from './wharf-data.mjs';

function crop(image, [x, y, width, height], outline) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  if (outline) {
    ctx.beginPath();
    for (const [px, py] of outline) ctx.lineTo(px - x, py - y);
    ctx.closePath();
    ctx.clip();
  }
  const sx = image.naturalWidth / 1536;
  const sy = image.naturalHeight / 864;
  ctx.drawImage(image, x * sx, y * sy, width * sx, height * sy, 0, 0, width, height);
  return canvas;
}

function canvasTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

function pixelTexture(image, bounds, outline) {
  return canvasTexture(crop(image, bounds, outline));
}

function agedPlanks() {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  const colors = ['#b97a46', '#bc814c', '#d0985d', '#a96939', '#c49056', '#ba7a45'];
  for (let row = 0; row < colors.length; row++) {
    const y = row * 8;
    ctx.fillStyle = colors[row];
    ctx.fillRect(0, y, 96, 8);
    ctx.fillStyle = '#765034';
    ctx.fillRect(0, y + 7, 96, 1);
    ctx.fillRect((row * 37 + 13) % 96, y, 1, 7);
    for (let i = 0; i < 14; i++) {
      const x = (i * 43 + row * 17) % 96;
      ctx.fillStyle = i % 3 === 0 ? '#643f292c' : '#ffe0a743';
      ctx.fillRect(x, y + 1 + (i * 3) % 6, 2 + i % 7, 1);
    }
  }
  return canvasTexture(canvas);
}

function paintedFacade(group, art, spec, size = 1) {
  const [, , w, h] = spec.bounds;
  const width = w / 20 * size;
  const height = h / 17 * size;
  const image = pixelTexture(art, spec.bounds, spec.outline);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
    new THREE.MeshLambertMaterial({ map: image, side: THREE.DoubleSide, alphaTest: 0.48 }));
  face.position.set(sceneX(spec.foot[0]), spec.floor + height / 2, sceneZ(spec.foot[1]));
  face.receiveShadow = true;
  face.castShadow = true;
  group.add(face);
  return face;
}

function box(group, material, width, height, depth, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function platform(group, materials, [left, back, right, front], top, bottom) {
  return box(group, materials, (right - left) / 20, top - bottom, (front - back) / 18,
    sceneX((left + right) / 2), (top + bottom) / 2, sceneZ((back + front) / 2));
}

function surfaceMaterials(top, side, width, depth, tileWidth, tileDepth) {
  const map = top.clone();
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(width / tileWidth, depth / tileDepth);
  return [side, side, new THREE.MeshLambertMaterial({ map }), side, side, side];
}

function createSea(group, colliders) {
  const width = 77;
  const depth = 91;
  const left = sceneX(OUTCROP[0]);
  const right = sceneX(BACKSTREET[2]);
  const back = sceneZ(OUTCROP[1]);
  const quay = sceneZ(PROMENADE[3]);
  const tiles = Array.from({ length: width * depth }, (_, index) => {
    const i = index % width;
    const j = Math.floor(index / width);
    const land = i + 0.5 >= left && i + 0.5 < right && j + 0.5 >= back && j + 0.5 <= quay
      && (i >= sceneX(BACKSTREET[0]) - 0.5 || j < sceneZ(OUTCROP[3]));
    return { i, j, h: land ? 2 : -1.6, water: !land, waterSurface: 0, type: {} };
  });
  const tilesAtSea = {
    width, depth, waterLevel: 0, colliders,
    forEachTile(callback) { tiles.forEach((tile) => callback(tile.i, tile.j, tile)); },
    tileAt(i, j) { return i >= 0 && j >= 0 && i < width && j < depth ? tiles[j * width + i] : null; },
  };
  const water = new Water(tilesAtSea, {
    resolution: 3, flow: [0.08, 0.23], maxDistance: 1.7, brightness: 1.29,
    glint: 0.8, foam: 0.82, saturation: 1.23, reflect: 0.16,
  });
  group.add(water.object);
  // An opaque seabed supplies the depth color under the engine's translucent water.
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(width, depth),
    new THREE.MeshLambertMaterial({ color: 0x116b80 }));
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(width / 2, -1.65, depth / 2);
  group.add(bed);
  return water;
}

export function buildWharf(scene, lighting, art) {
  const group = new THREE.Group();
  scene.add(group);
  const pavers = pixelTexture(art, [385, 552, 28, 20]);
  const planks = agedPlanks();
  const rock = pixelTexture(art, [12, 431, 37, 90]);
  rock.wrapS = rock.wrapT = THREE.RepeatWrapping;
  rock.repeat.set(2, 1);
  const stoneSide = new THREE.MeshLambertMaterial({ map: rock, color: 0xaaa193 });
  const edge = new THREE.MeshLambertMaterial({ color: 0x5a352b });
  const oiledPost = new THREE.MeshLambertMaterial({ color: 0x7d4934 });
  const metal = new THREE.MeshLambertMaterial({ color: 0x273e48 });
  const warmGlass = new THREE.MeshLambertMaterial({ color: 0xffd585, emissive: 0xff9b50, emissiveIntensity: 1.3 });
  const colliders = [];
  const columns = [];
  function tiledPlatform(bounds, top, bottom, deck) {
    const width = (bounds[2] - bounds[0]) / 20;
    const depth = (bounds[3] - bounds[1]) / 18;
    const materials = surfaceMaterials(deck ? planks : pavers, deck ? edge : stoneSide, width, depth, 1.7, 0.96);
    return platform(group, materials, bounds, top, bottom);
  }
  tiledPlatform(BACKSTREET, TERRACE_HEIGHT, -0.45, false);
  tiledPlatform(PROMENADE, TERRACE_HEIGHT, -0.45, false);
  tiledPlatform(OUTCROP, 4.45, -0.55, false);

  const slateRoof = new THREE.MeshLambertMaterial({ map: pixelTexture(art, [287, 333, 118, 16]) });
  const facadeSide = new THREE.MeshLambertMaterial({ color: 0x554b5b });
  const roofedWall = [facadeSide, facadeSide, slateRoof, facadeSide, facadeSide, facadeSide];
  for (const [x, y, width, height, depth] of [
    [187, 535, 3.05, 7.8, 2.5], [352, 540, 6.2, 11.4, 3.5], [478, 539, 4.0, 5.7, 2.4],
  ]) {
    const volume = box(group, roofedWall, width, height, depth,
      sceneX(x), TERRACE_HEIGHT + height / 2, sceneZ(y) - depth / 2 - 0.18);
    volume.renderOrder = -1;
  }

  function piling(x, y, top, diameter = 0.38) {
    const sx = sceneX(x), sz = sceneZ(y);
    columns.push([sx, (top - 0.48) / 2, sz, diameter, top + 0.48]);
    colliders.push({ type: 'circle', x: sx, z: sz, r: diameter * 0.59 });
  }
  for (const [left, back, right, front] of DECKS) {
    tiledPlatform([left, back, right, front], DECK_HEIGHT, 0.64, true);
    for (let x = left + 9; x < right; x += 37) piling(x, front - 4, DECK_HEIGHT + 0.43);
    piling(left + 4, back + 9, DECK_HEIGHT + 0.13);
    piling(right - 4, back + 9, DECK_HEIGHT + 0.13);
    if (front > 700) {
      for (let y = back + 30; y < front - 10; y += 36) {
        piling(left + 4, y, DECK_HEIGHT + 0.32);
        piling(right - 4, y, DECK_HEIGHT + 0.32);
      }
    }
  }
  if (lighting) {
    const pileMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.52, 1, 7), oiledPost, columns.length);
    const transform = new THREE.Object3D();
    for (const [index, [x, y, z, diameter, height]] of columns.entries()) {
      transform.position.set(x, y, z);
      transform.scale.set(diameter, height, diameter);
      transform.updateMatrix();
      pileMesh.setMatrixAt(index, transform.matrix);
    }
    pileMesh.castShadow = pileMesh.receiveShadow = true;
    group.add(pileMesh);
  } else {
    for (const [x, y, z, diameter, height] of columns) box(group, oiledPost, diameter, height, diameter, x, y, z);
  }

  for (const [left, back, right, front] of STAIRS) {
    const tread = (front - back) / STAIR_COUNT;
    for (let i = 0; i < STAIR_COUNT; i++) {
      tiledPlatform([left, back + i * tread, right, back + (i + 1) * tread], stairHeight(i), 0.1, true);
    }
  }

  for (const [x0, z0, x1, z1, floor] of RAILS) {
    const x = sceneX((x0 + x1) / 2), z = sceneZ((z0 + z1) / 2);
    box(group, edge, Math.max((x1 - x0) / 20, 0.10), 0.12, Math.max((z1 - z0) / 18, 0.10), x, floor + 0.64, z);
    for (const [tx, tz] of [[x0, z0], [(x0 + x1) / 2, (z0 + z1) / 2], [x1, z1]]) {
      box(group, metal, 0.14, 0.79, 0.14, sceneX(tx), floor + 0.38, sceneZ(tz));
    }
  }

  for (const spec of FACADES) paintedFacade(group, art, spec);
  const boats = BOATS.map((spec, index) => {
    const mesh = paintedFacade(group, art, spec, index ? 0.79 : 0.73);
    mesh.rotation.y = index ? 0.18 : -0.23;
    return { mesh, baseY: mesh.position.y, baseRoll: index ? -0.035 : 0.06 };
  });

  for (const [x, y, floor, poleHeight] of LAMPS) {
    const sx = sceneX(x), sz = sceneZ(y);
    box(group, metal, 0.11, poleHeight, 0.11, sx, floor + poleHeight / 2, sz);
    box(group, metal, 0.38, 0.07, 0.38, sx, floor + poleHeight + 0.14, sz);
    box(group, warmGlass, 0.25, 0.22, 0.25, sx, floor + poleHeight, sz);
    lighting?.addPointLight({
      position: { x: sx, y: floor + poleHeight, z: sz + 0.17 },
      intensity: 9.5, distance: 6, dayIntensity: 0.30, flicker: 0.1,
    });
  }
  const water = lighting ? createSea(group, colliders) : null;
  // Platform material clones own the GPU textures.
  pavers.dispose();
  planks.dispose();
  return { water, boats };
}
