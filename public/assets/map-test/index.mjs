import * as THREE from 'three';
import { Engine, disposeObjectTree } from './vendor/luminati/src/engine/core/Engine.js';
import { CameraRig } from './vendor/luminati/src/engine/core/CameraRig.js';
import { LightingSystem } from './vendor/luminati/src/engine/lighting/LightingSystem.js';
import { PostFX } from './vendor/luminati/src/engine/render/PostFX.js';
import { Sprite3D } from './vendor/luminati/src/engine/sprite/Sprite3D.js';
import { SPAWN, groundLevel, moveOnWharf, sceneX, sceneZ } from './layout.mjs';
import { buildWharf } from './wharf.mjs';
import { canvasView } from './canvas-view.mjs';
import { MARKET_SPAWN, marketGround, moveInMarket } from './market/layout.mjs';
import { buildMarket, loadMarketArt } from './market/scene.mjs';
import { marketInteractions } from './market/interactions.mjs';

const MOVE_KEYS = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'shift']);
const TIMES = { day: 12, dusk: 17.05, night: 21.4 };
const TURN = Math.PI / 12;
const LOCATIONS = {
  'parola-market': {
    name: 'Parola Market', spawn: MARKET_SPAWN, floorAt: marketGround, move: moveInMarket,
    yaw: -6, pitch: 45, distance: 49, target: [0, 1.45, -1.45], shadowExtent: 29,
  },
  'seafood-wharf': {
    name: 'Seafood Wharf', spawn: SPAWN, floorAt: groundLevel, move: moveOnWharf,
    yaw: -9, pitch: 39, distance: 43, target: [-0.5, 1.85, -3.8], shadowExtent: 21,
  },
};

function loadImage(path) {
  const image = new Image();
  image.decoding = 'async';
  image.src = path;
  return image.decode().then(() => image);
}

function makeHero(image, spec) {
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  const animations = {};
  for (const [row, direction] of spec.directions.entries()) {
    for (const [name, clip] of Object.entries(spec.clips)) {
      animations[name + '_' + direction] = {
        frames: clip.cells.map((col) => ({ col, row })), fps: clip.fps, loop: clip.loop,
      };
    }
  }
  const sprite = new Sprite3D({
    texture, animations,
    frameWidth: spec.width, frameHeight: spec.height,
    columns: image.naturalWidth / spec.width, rows: spec.directions.length,
    pixelsPerUnit: spec.referenceBodyHeight / 2.45,
    anchor: [spec.pivot[0] / spec.width, 1 - spec.pivot[1] / spec.height],
  }, { animation: 'idle', tilt: 0.34, alphaTest: 0.42, blobOpacity: 0.34 });
  return { sprite, texture };
}

function movementInput(dialog, stick, controls, signal) {
  const keys = new Set();
  const axis = { x: 0, y: 0 };
  let pointerId = null;
  let running = false;
  const run = dialog.querySelector('[data-map-action="run"]');

  function resetStick() {
    if (pointerId !== null && stick.hasPointerCapture(pointerId)) stick.releasePointerCapture(pointerId);
    pointerId = null;
    axis.x = axis.y = 0;
    stick.style.setProperty('--stick-x', '0px');
    stick.style.setProperty('--stick-y', '0px');
  }
  function positionStick(event) {
    const box = stick.getBoundingClientRect();
    const radius = box.width * 0.31;
    const x = event.clientX - box.left - box.width / 2;
    const y = event.clientY - box.top - box.height / 2;
    const scale = Math.max(radius, Math.hypot(x, y));
    axis.x = x / scale;
    axis.y = y / scale;
    stick.style.setProperty('--stick-x', axis.x * radius + 'px');
    stick.style.setProperty('--stick-y', axis.y * radius + 'px');
  }
  stick.addEventListener('pointerdown', (event) => {
    if (pointerId !== null || event.button !== 0) return;
    event.preventDefault();
    pointerId = event.pointerId;
    stick.setPointerCapture(pointerId);
    positionStick(event);
  }, { signal });
  stick.addEventListener('pointermove', (event) => {
    if (event.pointerId === pointerId) positionStick(event);
  }, { signal });
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    stick.addEventListener(eventName, (event) => {
      if (event.pointerId === pointerId) resetStick();
    }, { signal });
  }
  run.addEventListener('click', () => {
    running = !running;
    run.setAttribute('aria-pressed', String(running));
  }, { signal });
  dialog.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLSelectElement || event.metaKey || event.altKey || event.ctrlKey) return;
    const key = event.key.toLowerCase();
    if (MOVE_KEYS.has(key)) {
      event.preventDefault();
      keys.add(key);
    } else if (controls[key] && !event.repeat) {
      event.preventDefault();
      controls[key]();
    }
  }, { signal });
  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()), { signal });
  const clear = () => { keys.clear(); resetStick(); };
  window.addEventListener('blur', clear, { signal });
  document.addEventListener('visibilitychange', clear, { signal });
  signal.addEventListener('abort', () => {
    clear();
    run.setAttribute('aria-pressed', 'false');
  }, { once: true });

  function pressed(...group) { return group.some((key) => keys.has(key)) ? 1 : 0; }
  return {
    direction() {
      return {
        x: axis.x + pressed('d', 'arrowright') - pressed('a', 'arrowleft'),
        y: axis.y + pressed('s', 'arrowdown') - pressed('w', 'arrowup'),
        run: running || keys.has('shift'),
      };
    },
  };
}

export async function openMapTest(dialog, { location, mapImage, canStand, quality, signal }) {
  const profile = LOCATIONS[location] ?? LOCATIONS['seafood-wharf'];
  const isMarket = location === 'parola-market';
  const [spec, loki, yhannie, environment] = await Promise.all([
    fetch('/assets/characters/movement.json', { signal }).then((response) => {
      if (!response.ok) throw new Error('Movement data could not load');
      return response.json();
    }),
    loadImage('/assets/characters/loki/movement-map.webp'),
    loadImage('/assets/characters/yhannie/movement-map.webp'),
    isMarket ? loadMarketArt(loadImage) : mapImage.decode().then(() => mapImage),
  ]);
  if (signal.aborted) return;

  const surface = dialog.querySelector('[data-map-world]');
  const heroSelect = dialog.querySelector('[data-map-hero]');
  const timeSelect = dialog.querySelector('[data-map-time]');
  const status = dialog.querySelector('[data-map-status]');
  const readout = dialog.querySelector('[data-map-readout]');
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const useDof = quality !== 'low';
  let engine, rig, lighting, post, world, scene, software, frameId;
  const heroes = new Map();
  function dispose() {
    cancelAnimationFrame(frameId);
    for (const { sprite, texture } of heroes.values()) {
      sprite.dispose();
      texture.dispose();
    }
    heroes.clear();
    world?.water?.dispose();
    world?.dispose?.();
    post?.dispose();
    rig?.dispose();
    lighting?.dispose();
    engine?.dispose();
    software?.dispose();
    if (!engine && scene) disposeObjectTree(scene);
    delete surface.dataset.mapRenderer;
  }

  try {
    try {
      engine = new Engine({ container: surface, maxPixelRatio: coarsePointer ? 1 : 1.25, renderScale: 0.87,
        inputTarget: surface, exposeGlobal: false, manualStep: false });
    } catch (error) {
      if (!String(error?.message).includes('WebGL context')) throw error;
    }
    scene = engine?.scene ?? new THREE.Scene();
    const camera = engine?.camera ?? new THREE.PerspectiveCamera(37, 1, 0.3, 200);
    const renderer = engine?.renderer;
    if (engine) {
      lighting = new LightingSystem(engine, { timeOfDay: TIMES[timeSelect.value], shadowMapSize: coarsePointer ? 768 : 1024,
        shadowExtent: profile.shadowExtent, minElevation: 24, sunPath: { refAzimuth: -52 } });
      lighting.settings.fogMul = isMarket ? 0.30 : 0.44;
      lighting.settings.ambientMul = isMarket ? 1.25 : 1.15;
      lighting.settings.flicker = !reduced;
    }
    world = isMarket ? buildMarket(scene, lighting, environment) : buildWharf(scene, lighting, environment);
    if (!engine) software = canvasView(surface, scene, camera, world.software);
    surface.dataset.mapRenderer = engine ? 'luminati' : 'canvas';
    const market = isMarket ? marketInteractions(dialog, surface, world.npcs, signal) : null;
    rig = new CameraRig(camera, { yaw: profile.yaw, pitch: profile.pitch, distance: profile.distance,
      minDistance: 24, maxDistance: 56, fov: 37, yawLimit: 24, followLambda: 4.7, targetOffsetY: 0.8, lookAhead: 0.23 });
    rig.inputEnabled = false;
    const target = new THREE.Vector3();
    rig.setTarget(target);

    heroes.set('loki', makeHero(loki, spec));
    heroes.set('yhannie', makeHero(yhannie, spec));
    const position = { ...profile.spawn, floor: profile.floorAt(profile.spawn.x, profile.spawn.y) };
    let hero = heroes.get(heroSelect.value).sprite;
    let facing = 'down', drawnHeight = position.floor, walkX = 0, walkY = 0;
    scene.add(hero);
    lighting?.followTarget(hero);

    if (useDof && renderer?.extensions.has('EXT_color_buffer_float')) {
      post = new PostFX(renderer, scene, camera, { maxTaps: 48, samples: 0, dofScale: 0.4 });
      Object.assign(post.settings.dof, {
        autoFocus: false, focusRange: isMarket ? 14 : 10, maxBlur: coarsePointer ? 3 : 4.5,
        tiltShift: isMarket ? 0.045 : 0.03, bokehSprites: false, farScale: 0.7, nearScale: 0.55,
      });
      Object.assign(post.settings.bloom, { strength: isMarket ? 0.34 : 0.26, threshold: 1.15 });
      Object.assign(post.settings.grade, { exposure: 1, contrast: 1.02, saturation: isMarket ? 1.14 : 1.08,
        vignette: 0.24, grain: 0, chromaticAberration: 0, sharpen: 0.05, dither: 0 });
      engine.setRenderFn((dt) => post.render(dt));
    }

    function syncPosition(snap) {
      hero.position.set(sceneX(position.x), drawnHeight + 0.018, sceneZ(position.y));
      const [x, y, z] = profile.target;
      target.set(hero.position.x + x, hero.position.y + y, hero.position.z + z);
      if (snap) rig.snap();
    }
    function returnToSpawn() {
      market?.dismiss();
      Object.assign(position, profile.spawn);
      position.floor = profile.floorAt(position.x, position.y);
      drawnHeight = position.floor;
      walkX = walkY = 0;
      rig.yawTarget = rig.yawCenter;
      rig.distanceTarget = profile.distance;
      syncPosition(false);
    }
    const buttons = {
      left: () => rig.rotate(-TURN), right: () => rig.rotate(TURN),
      near: () => rig.zoomIn(4), far: () => rig.zoomOut(4), reset: returnToSpawn,
    };
    const input = movementInput(dialog, dialog.querySelector('[data-map-stick]'), {
      q: buttons.left, e: buttons.right, z: buttons.near, x: buttons.far, f: market?.speak,
    }, signal);
    for (const [action, handler] of Object.entries(buttons)) {
      dialog.querySelector('[data-map-action="' + action + '"]').addEventListener('click', handler, { signal });
    }
    heroSelect.addEventListener('change', () => {
      hero.removeFromParent();
      hero = heroes.get(heroSelect.value).sprite;
      scene.add(hero);
      lighting?.followTarget(hero);
    }, { signal });
    timeSelect.addEventListener('change', () => lighting?.setTime(TIMES[timeSelect.value]), { signal });
    surface.addEventListener('wheel', (event) => {
      event.preventDefault();
      rig.zoom(Math.sign(event.deltaY) * 1.8);
    }, { passive: false, signal });
    renderer?.domElement.addEventListener('webglcontextlost', () => {
      status.hidden = false;
      status.textContent = 'Graphics paused. Reopen the map to reconnect.';
    }, { signal });
    renderer?.domElement.addEventListener('webglcontextrestored', () => { status.hidden = true; }, { signal });

    let readoutTime = 0;
    const viewDepth = new THREE.Vector3();
    const simulation = {
      name: profile.name,
      update(dt, elapsed) {
        const move = input.direction();
        const length = Math.max(1, Math.hypot(move.x, move.y));
        const cos = Math.cos(rig.yaw), sin = Math.sin(rig.yaw);
        const speed = (move.run ? 144 : 86) / length;
        const approach = 1 - Math.exp(-dt * 18);
        if (market?.speaking) { move.x = move.y = walkX = walkY = 0; }
        walkX += ((move.x * cos + move.y * sin) * speed - walkX) * approach;
        walkY += ((move.y * cos - move.x * sin) * speed - walkY) * approach;
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(walkX), Math.abs(walkY)) * dt / 1.6));
        const dx = walkX * dt / steps, dy = walkY * dt / steps;
        const fromX = position.x, fromY = position.y;
        for (let step = 0; step < steps; step++) {
          if (!profile.move(position, dx, dy, canStand)) {
            profile.move(position, dx, 0, canStand);
            profile.move(position, 0, dy, canStand);
          }
        }
        const mx = position.x - fromX, my = position.y - fromY;
        const moving = Math.hypot(mx, my) > 0.08;
        if (moving) facing = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'right' : 'left') : (my > 0 ? 'down' : 'up');
        hero.play(moving ? (move.run ? 'run' : 'walk') : 'idle', { direction: facing });
        drawnHeight += (position.floor - drawnHeight) * approach;
        syncPosition(false);
        rig.update(dt, null);
        hero.update(dt, camera);
        if (post) {
          viewDepth.copy(hero.position);
          viewDepth.y += 1;
          viewDepth.applyMatrix4(camera.matrixWorldInverse);
          post.setFocus(-viewDepth.z);
        }
        market?.update(position, camera);
        world.update?.(dt, elapsed, camera, reduced);
        lighting?.update(dt);
        for (const [index, boat] of world.boats.entries()) {
          const wave = reduced ? 0 : Math.sin(elapsed * 1.25 + index * 2);
          boat.mesh.position.y = boat.baseY + wave * 0.11;
          boat.mesh.rotation.z = boat.baseRoll + wave * 0.026;
        }
        if (elapsed - readoutTime > 0.17) {
          readoutTime = elapsed;
          readout.textContent = Math.round(position.x) + ', ' + Math.round(position.y) + '  ·  Elevation ' + position.floor.toFixed(2);
        }
      },
    };
    syncPosition(true);
    hero.update(0, camera);
    world.update?.(0, 0, camera, reduced);
    signal.addEventListener('abort', dispose, { once: true });
    if (engine) {
      engine.addSystem(simulation);
      engine.start();
    } else {
      let last = performance.now(), elapsed = 0;
      function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        elapsed += dt;
        software.resize();
        simulation.update(dt, elapsed);
        software.render(elapsed, timeSelect.value);
        frameId = requestAnimationFrame(frame);
      }
      frameId = requestAnimationFrame(frame);
    }
    status.hidden = true;
  } catch (error) {
    dispose();
    throw error;
  }
}
