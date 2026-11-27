import * as THREE from 'three';
import { Water } from '../vendor/luminati/src/engine/world/Water.js';
import { Sprite3D } from '../vendor/luminati/src/engine/sprite/Sprite3D.js';
import { sceneX, sceneZ } from '../layout.mjs';
import {
  PLAZA, UPPER_GARDEN, GARDEN_SIDES, STAIR, DOCK, PIER, STEPS, PLAZA_Y, DOCK_Y, GARDEN_Y,
  SHOPS, NPCS, PROPS, MARKET_RAILS, DOCK_RAILS, contains, marketGround, stepHeight,
} from './layout.mjs';
import { PIVOTS } from './pivots.mjs';
import { pixelTexture, squareSurface, quayWall, shopSign, contactShadow } from './textures.mjs';

const LAND = [PLAZA, UPPER_GARDEN, ...GARDEN_SIDES];
const LIGHT_COLORS = { day: ['#5d978f', '#268e91', '#1a566d', 'none'],
  dusk: ['#6f9aa3', '#256b80', '#163851', 'saturate(1.06)'],
  night: ['#305270', '#193f63', '#101b39', 'brightness(.8) saturate(.88)'] };

const BACKDROP = [
  { art: 'palm', x: 178, y: 199, height: 8.4 },
  { art: 'palm', x: 312, y: 183, height: 6.8 },
  { art: 'palm', x: 557, y: 176, height: 7.1 },
  { art: 'palm', x: 704, y: 202, height: 8.0 },
  { art: 'lighthouse', x: 437, y: 192, height: 8.55, tilt: 0.2 },
  ...[[201,191,3.6], [244,204,4.1], [276,180,4], [339,200,3.55], [374,191,3.3],
    [490,202,4.25], [520,172,3.8], [581,199,3.95], [624,184,4.7],
    [664,212,4.3], [716,191,2.8]].map(([x, y, width], index) => ({
    art: 'leaves', x, y, width, flip: index % 2 === 0,
  })),
];

const DETAIL_LIGHTS = [
  [199, 344, 2.0], [389, 352, 2.15], [508, 335, 1.9], [664, 349, 2],
  [245, 619, 1.47, true], [601, 619, 1.47, true], [371, 732, 1.28, true], [448, 732, 1.28, true],
];

export async function loadMarketArt(loadImage) {
  const names = new Set([...SHOPS.map(({ art }) => art), ...PROPS.map(({ art }) => art),
    ...BACKDROP.map(({ art }) => art), ...NPCS.map(({ id }) => id), 'bangka']);
  return Object.fromEntries(await Promise.all([...names].map(async (name) => [
    name, await loadImage(new URL('./art/' + name + '.png', import.meta.url).href),
  ])));
}

function box(parent, material, width, height, depth, x, y, z, order = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.renderOrder = order;
  mesh.receiveShadow = true;
  mesh.castShadow = order >= 0;
  parent.add(mesh);
  return mesh;
}

function plane(parent, map, width, height, { cutout = 0.48, emission = 0.08, back = THREE.DoubleSide } = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
    new THREE.MeshLambertMaterial({ map, side: back, alphaTest: cutout, emissive: 0xffffff,
      emissiveMap: map, emissiveIntensity: emission }));
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createWater(group, posts) {
  const width = 88, depth = 89;
  const tiles = Array.from({ length: width * depth }, (_, index) => {
    const i = index % width, j = Math.floor(index / width);
    const x = (i + 0.5) * 20 - 360, y = (j + 0.5) * 18 - 120;
    const land = LAND.some((bounds) => contains(bounds, x, y));
    return { i, j, h: land ? 1.8 : -1.5, water: !land, waterSurface: 0, type: {} };
  });
  const map = {
    width, depth, waterLevel: 0, colliders: posts,
    tileAt(i, j) { return i >= 0 && j >= 0 && i < width && j < depth ? tiles[j * width + i] : null; },
    forEachTile(callback) { tiles.forEach((tile) => callback(tile.i, tile.j, tile)); },
  };
  const water = new Water(map, {
    resolution: 2, flow: [0.14, 0.26], maxDistance: 2.35, brightness: 1.35, glint: 0.98,
    foam: 1, saturation: 1.23, reflect: 0.21,
  });
  group.add(water.object);
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(width, depth),
    new THREE.MeshLambertMaterial({ color: 0x15596c, emissive: 0x103b4a, emissiveIntensity: 0.24 }));
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(width / 2, -1.55, depth / 2);
  group.add(bed);
  return water;
}

export function buildMarket(scene, lighting, images) {
  const group = new THREE.Group();
  group.name = 'Parola Market';
  scene.add(group);
  const art = Object.fromEntries(Object.entries(images).map(([name, image]) => [name, pixelTexture(image)]));
  const quay = quayWall();
  const dockEdge = new THREE.MeshLambertMaterial({ color: 0x624934 });
  const cedar = new THREE.MeshLambertMaterial({ color: 0x785943 });
  const rail = new THREE.MeshLambertMaterial({ color: 0x446466 });
  const bronze = new THREE.MeshLambertMaterial({ color: 0x3f414b });
  const cap = new THREE.MeshLambertMaterial({ color: 0xa38b72 });
  const glass = new THREE.MeshLambertMaterial({ color: 0xffcd84, emissive: 0xff974a, emissiveIntensity: 1.85 });
  const shadowTexture = contactShadow();
  const glows = [];
  const posts = [];

  function platform(bounds, floor, bottom, kind, seed, order) {
    const [left, top, right, front] = bounds;
    const width = (right - left) / 20, depth = (front - top) / 18;
    const surface = new THREE.MeshLambertMaterial({ map: squareSurface(kind, width, depth, seed),
      emissive: 0x2f3c52, emissiveIntensity: 0.11 });
    function masonry(span) {
      const map = quay.clone();
      map.wrapS = THREE.RepeatWrapping;
      map.repeat.x = Math.max(0.8, span / 4.4);
      map.needsUpdate = true;
      return new THREE.MeshLambertMaterial({ map, color: 0xbac7ca });
    }
    const xSide = kind === 'deck' ? dockEdge : masonry(depth);
    const zSide = kind === 'deck' ? dockEdge : masonry(width);
    const materials = [xSide, xSide, surface, zSide, zSide, zSide];
    return box(group, materials, width, floor - bottom, depth,
      sceneX((left + right) / 2), (floor + bottom) / 2, sceneZ((top + front) / 2), order);
  }

  platform(PLAZA, PLAZA_Y, -0.38, 'plaza', 21, -9);
  platform(UPPER_GARDEN, GARDEN_Y, -0.32, 'garden', 31, -8);
  for (const [index, bounds] of GARDEN_SIDES.entries()) platform(bounds, 1.47, -0.31, 'garden', 45 + index, -8);
  platform(DOCK, DOCK_Y, 0.49, 'deck', 45, -7);
  platform(PIER, DOCK_Y, 0.49, 'deck', 53, -7);
  const tread = (STAIR[3] - STAIR[1]) / STEPS;
  for (let i = 0; i < STEPS; i++) {
    platform([STAIR[0], STAIR[1] + i * tread, STAIR[2], STAIR[1] + (i + 1) * tread],
      stepHeight(i), 0.4, 'deck', 62 + i, -6);
  }

  // Feet, draw planes and collision footprints are authored independently.
  function place(spec, floor, settings) {
    const map = art[spec.art];
    const aspect = map.image.naturalWidth / map.image.naturalHeight;
    const width = spec.width ?? spec.height * aspect, height = spec.height ?? spec.width / aspect;
    const mesh = plane(group, map, width, height, settings);
    const [u, v] = PIVOTS[spec.art];
    mesh.geometry.translate(width * (0.5 - u), height * (v - 0.5), 0);
    mesh.rotation.x = -(spec.tilt ?? 0.49);
    mesh.position.set(sceneX(spec.x), floor, sceneZ(spec.y));
    if (spec.flip) mesh.scale.x = -1;
    mesh.castShadow = true;
    return mesh;
  }

  function shadow(x, z, floor, width, depth) {
    const mesh = plane(group, shadowTexture, width, depth, { cutout: 0, emission: 0 });
    mesh.material.transparent = true;
    mesh.material.depthWrite = false;
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(sceneX(x), floor + 0.018, sceneZ(z));
    mesh.renderOrder = -4;
  }

  function addLight(x, y, z, lit = true) {
    const position = new THREE.Vector3(sceneX(x), y, sceneZ(z));
    glows.push(position);
    if (lit) lighting?.addPointLight({ position, intensity: 14, dayIntensity: 0.46,
      distance: 7.1, flicker: 0.12, color: 0xffb470 });
  }

  for (const store of SHOPS) {
    const [left, back, right, front] = store.footprint;
    box(group, cap, (right - left) / 20 + 0.12, 0.23, (front - back) / 18 + 0.12,
      sceneX((right + left) / 2), PLAZA_Y + 0.105, sceneZ((back + front) / 2), -3);
    shadow(store.x, store.y - 23, PLAZA_Y, store.width + 1.3, 5.7);
    const shop = place(store, PLAZA_Y + 0.16, { emission: 0.15 });
    shop.name = store.name;
    const sign = plane(group, shopSign(store.name, store.tone), 2.92, 0.68, { emission: 0.36 });
    sign.position.set(sceneX(store.x), PLAZA_Y + 0.73, sceneZ(store.y + 15));
    sign.rotation.x = -0.32;
    box(group, cedar, 0.13, 0.8, 0.13, sign.position.x - 1.04, PLAZA_Y + 0.38, sign.position.z - 0.05);
    box(group, cedar, 0.13, 0.8, 0.13, sign.position.x + 1.04, PLAZA_Y + 0.38, sign.position.z - 0.05);
  }
  for (const spec of BACKDROP) place(spec, GARDEN_Y, { emission: 0.09 });
  for (const [i, [x, y]] of [[125,449], [121,290], [775,304], [779,470]].entries()) {
    place({ art: 'leaves', x, y, width: 2.85 + (i % 2) * 0.5, flip: i % 2 === 1 }, 1.5);
  }

  for (const prop of PROPS) {
    const floor = marketGround(prop.x, prop.y);
    shadow(prop.x, prop.y, floor, Math.max(0.85, (prop.radius / 20) * 3.8), (prop.radius / 18) * 2.9);
    place(prop, floor + 0.014, { emission: prop.light ? 0.27 : 0.11 });
    if (prop.light) addLight(prop.x + 7, floor + prop.height * 0.68, prop.y - 7);
  }

  function railing([left, front, right, back], floor, material, support = false) {
    const a = new THREE.Vector3(sceneX(left), floor + 0.56, sceneZ(front));
    const b = new THREE.Vector3(sceneX(right), floor + 0.56, sceneZ(back));
    const span = a.distanceTo(b);
    const beam = box(group, material, span, 0.13, 0.13, (a.x + b.x) / 2, a.y, (a.z + b.z) / 2);
    beam.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    const segments = Math.max(1, Math.ceil(span / 2.65));
    for (let i = 0; i <= segments; i++) {
      const x = THREE.MathUtils.lerp(a.x, b.x, i / segments);
      const z = THREE.MathUtils.lerp(a.z, b.z, i / segments);
      box(group, material, 0.18, 0.78, 0.18, x, floor + 0.39, z);
      box(group, bronze, 0.23, 0.068, 0.23, x, floor + 0.78, z);
      if (support) {
        box(group, cedar, 0.25, floor + 0.6, 0.25, x, (floor - 0.6) / 2, z);
        posts.push({ type: 'circle', x, z, r: 0.20 });
      }
    }
  }
  for (const bounds of MARKET_RAILS) railing(bounds, PLAZA_Y, rail);
  for (const bounds of DOCK_RAILS) railing(bounds, DOCK_Y, cedar, true);

  for (const [x, z, height, onDock] of DETAIL_LIGHTS) {
    if (onDock) {
      box(group, bronze, 0.135, height, 0.135, sceneX(x), DOCK_Y + height / 2, sceneZ(z));
      box(group, glass, 0.26, 0.29, 0.26, sceneX(x), DOCK_Y + height, sceneZ(z));
      box(group, bronze, 0.32, 0.09, 0.32, sceneX(x), DOCK_Y + height + 0.18, sceneZ(z));
    }
    addLight(x, (onDock ? DOCK_Y : PLAZA_Y) + height, z + 2, !onDock);
  }

  const boats = [
    { art: 'bangka', x: 205, y: 705, width: 8.0, tilt: 0.66, roll: 0.095 },
    { art: 'bangka', x: 658, y: 717, width: 7.3, tilt: 0.66, roll: -0.11, flip: true },
    { art: 'bangka', x: 848, y: 546, width: 5.7, tilt: 0.55, roll: -0.09 },
  ].map((spec) => {
    const mesh = place(spec, 0.04, { emission: 0.14 });
    mesh.rotation.y = spec.roll;
    mesh.castShadow = false;
    return { mesh, baseY: mesh.position.y, baseRoll: spec.roll * 0.23 };
  });

  const npcs = NPCS.map((npc, i) => {
    const texture = art[npc.id];
    const image = texture.image;
    const [u, v] = PIVOTS[npc.id];
    const sprite = new Sprite3D({
      texture, frameWidth: image.naturalWidth, frameHeight: image.naturalHeight,
      columns: 1, rows: 1, pixelsPerUnit: image.naturalHeight / (2.05 + (i % 3) * 0.09),
      anchor: [u, 1 - v], animations: { idle: { frames: [{ col: 0, row: 0 }], fps: 1, loop: true } },
    }, { animation: 'idle', tilt: 0.34, alphaTest: 0.42, blobOpacity: 0.23 });
    sprite.position.set(sceneX(npc.x), marketGround(npc.x, npc.y) + 0.019, sceneZ(npc.y));
    sprite.name = npc.name;
    shadow(npc.x, npc.y, marketGround(npc.x, npc.y), 1.44, 0.76);
    group.add(sprite);
    return { ...npc, sprite };
  });

  const water = lighting ? createWater(group, posts) : null;
  quay.dispose();

  return {
    water, boats, npcs,
    software: {
      palettes: LIGHT_COLORS, glows, waterArea: [9, 12, 85, 82],
      shoreline: [[132, 563, 764, 563], [107, 247, 107, 535], [795, 249, 795, 517]].map(([x, z, x1, z1]) =>
        [sceneX(x), sceneZ(z), sceneX(x1), sceneZ(z1)]),
    },
    update(dt, elapsed, camera, reduced) {
      for (const [i, { sprite }] of npcs.entries()) {
        sprite.scale.y = reduced ? 1 : 1 + 0.012 * Math.sin(elapsed * 2.5 + i * 1.6);
        sprite.update(dt, camera);
      }
    },
    dispose() {
      for (const { sprite } of npcs) sprite.dispose();
      for (const texture of Object.values(art)) texture.dispose();
    },
  };
}
