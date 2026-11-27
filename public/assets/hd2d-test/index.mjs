import { CHARACTER, CLIPS, frameIndex, paintCharacter } from './character.mjs';
import { SPAWN, WORLD, canStand } from './layout.mjs?v=1.147';
import { loadStation, stationRenderer } from './station.mjs?v=1.148';
import { stationDialogue } from './dialogue.mjs?v=1.147';

const HORIZONTAL = ['a', 'd', 'arrowleft', 'arrowright'];
const VERTICAL = ['w', 's', 'arrowup', 'arrowdown'];
const KEYS = new Set([...HORIZONTAL, ...VERTICAL, 'shift']);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function movement(dialog, signal, isExploring) {
  const stick = dialog.querySelector('[data-hd-stick]');
  const run = dialog.querySelector('[data-hd-run]');
  const held = new Set();
  let pointer = null;
  let stickX = 0, stickY = 0, toggledRun = false;

  function release() {
    const id = pointer;
    pointer = null;
    if (id !== null && stick.hasPointerCapture(id)) stick.releasePointerCapture(id);
    stickX = stickY = 0;
    stick.style.setProperty('--hd-x', '0px');
    stick.style.setProperty('--hd-y', '0px');
  }
  function clear() {
    held.clear();
    release();
  }
  function steer(event) {
    const bounds = stick.getBoundingClientRect();
    const radius = bounds.width * 0.32;
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    const length = Math.max(radius, Math.hypot(x, y));
    stickX = x / length;
    stickY = y / length;
    stick.style.setProperty('--hd-x', stickX * radius + 'px');
    stick.style.setProperty('--hd-y', stickY * radius + 'px');
  }
  stick.addEventListener('pointerdown', (event) => {
    if (!isExploring() || pointer !== null || event.button !== 0) return;
    event.preventDefault();
    pointer = event.pointerId;
    stick.setPointerCapture(pointer);
    steer(event);
  }, { signal });
  stick.addEventListener('pointermove', (event) => {
    if (event.pointerId === pointer) steer(event);
  }, { signal });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    stick.addEventListener(name, (event) => {
      if (event.pointerId === pointer) release();
    }, { signal });
  }

  dialog.addEventListener('keydown', (event) => {
    if (!isExploring() || event.target instanceof HTMLSelectElement || event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (!KEYS.has(key)) return;
    event.preventDefault();
    held.add(key);
  }, { signal });
  window.addEventListener('keyup', (event) => held.delete(event.key.toLowerCase()), { signal });
  window.addEventListener('blur', clear, { signal });
  document.addEventListener('visibilitychange', clear, { signal });
  signal.addEventListener('abort', clear, { once: true });

  run.setAttribute('aria-pressed', 'false');
  run.addEventListener('click', () => {
    toggledRun = !toggledRun;
    run.setAttribute('aria-pressed', String(toggledRun));
  }, { signal });

  function pressed(primary, alternate) { return Number(held.has(primary) || held.has(alternate)); }

  return {
    clear,
    read() {
      return {
        x: stickX + pressed('d', 'arrowright') - pressed('a', 'arrowleft'),
        y: stickY + pressed('s', 'arrowdown') - pressed('w', 'arrowup'),
        run: toggledRun || held.has('shift'),
      };
    },
  };
}

function updatePlayer(player, controls, dt) {
  const { x, y, run } = controls;
  const magnitude = Math.hypot(x, y);
  const speed = (run ? 106 : 64) / Math.max(1, magnitude);
  const steps = Math.max(1, Math.ceil(magnitude * speed * dt / 1.25));
  const dx = x * speed * dt / steps;
  const dy = y * speed * dt / steps;
  const beforeX = player.x, beforeY = player.y;
  if (magnitude > 0.12) {
    for (let step = 0; step < steps; step++) {
      if (canStand(player.x + dx, player.y)) player.x += dx;
      if (canStand(player.x, player.y + dy)) player.y += dy;
    }
    player.direction = Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
  }
  const moving = Math.hypot(player.x - beforeX, player.y - beforeY) > 0.007;
  const clip = moving ? (run ? 'run' : 'walk') : 'idle';
  player.clock = clip === player.clip ? player.clock + dt : 0;
  player.clip = clip;
  player.frame = frameIndex(CLIPS[clip], player.clock);
}

function prototype(dialog, art, signal) {
  const canvas = dialog.querySelector('[data-hd-sample]');
  const ctx = canvas.getContext('2d');
  const directions = [...dialog.querySelectorAll('[data-hd-direction]')];
  const pose = dialog.querySelector('[data-hd-pose]');
  const scale = dialog.querySelector('[data-hd-scale]');
  const play = dialog.querySelector('[data-hd-play]');
  const output = dialog.querySelector('[data-hd-frame]');
  const steps = [...dialog.querySelectorAll('[data-hd-step]')];
  const state = { direction: 'down', clip: 'walk', frame: 0 };
  let elapsed = 0;
  let playing = true;
  let drawn = '';

  function resetFrames() {
    elapsed = 0;
    state.frame = 0;
  }
  function setPlaying(value) {
    playing = value;
    play.textContent = playing ? 'Pause' : 'Play';
  }
  function selectDirection(direction) {
    state.direction = direction;
    for (const button of directions) button.setAttribute('aria-pressed', String(button.dataset.hdDirection === direction));
    resetFrames();
  }
  function selectClip(clip) {
    state.clip = clip;
    const idle = CLIPS[clip].frames.length <= 1;
    for (const button of steps) button.disabled = idle;
    play.disabled = idle;
    resetFrames();
  }

  pose.value = 'walk';
  scale.value = '4';
  selectDirection('down');
  selectClip(pose.value);
  setPlaying(true);

  for (const button of directions) {
    button.addEventListener('click', () => selectDirection(button.dataset.hdDirection), { signal });
  }
  pose.addEventListener('change', () => selectClip(pose.value), { signal });
  play.addEventListener('click', () => setPlaying(!playing), { signal });
  for (const button of steps) {
    button.addEventListener('click', () => {
      setPlaying(false);
      const clip = CLIPS[state.clip];
      state.frame = (state.frame + clip.frames.length + Number(button.dataset.hdStep)) % clip.frames.length;
      // Resume from the selected frame if Play is pressed again.
      elapsed = (state.frame + 0.01) * clip.frameTime;
    }, { signal });
  }

  return function render(dt) {
    const clip = CLIPS[state.clip];
    if (playing) {
      elapsed = (elapsed + dt) % (clip.frameTime * clip.frames.length);
      state.frame = frameIndex(clip, elapsed);
    }
    const zoom = Number(scale.value);
    const key = [state.direction, state.clip, state.frame, zoom].join(':');
    if (key === drawn) return;
    drawn = key;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    paintCharacter(ctx, art, state, canvas.width / 2, canvas.height / 2 + 17 * zoom, zoom);
    output.textContent = (state.frame + 1) + ' / ' + clip.frames.length;
    canvas.setAttribute('aria-label', CHARACTER.name + ' · ' + state.direction + ' · ' + state.clip);
  };
}

function cameraFor(canvas, player) {
  const view = { width: 1, height: 1, x: 0, y: 0, screenWidth: 1, screenHeight: 1 };
  let x = 0, y = 0, ready = false;
  return function update(dt, snap = false) {
    view.screenWidth = Math.max(1, canvas.clientWidth);
    view.screenHeight = Math.max(1, canvas.clientHeight);
    const aspect = view.screenWidth / view.screenHeight;
    const height = Math.min(WORLD.height, 400, Math.max(1, Math.round(WORLD.width / aspect)));
    const width = Math.min(WORLD.width, Math.max(1, Math.round(height * aspect)));
    if (view.width !== width || view.height !== height) {
      view.width = canvas.width = width;
      view.height = canvas.height = height;
    }
    const goalX = clamp(player.x - width / 2, 0, WORLD.width - width);
    const verticalTravel = WORLD.height - height;
    const trackFraming = verticalTravel * clamp((player.y - 252) / 76, 0, 1);
    const goalY = clamp(Math.max(player.y - height * 0.86, trackFraming), 0, verticalTravel);
    const approach = snap || !ready ? 1 : 1 - Math.exp(-dt * 8.2);
    ready = true;
    x += (goalX - x) * approach;
    y += (goalY - y) * approach;
    view.x = Math.round(x);
    view.y = Math.round(y);
    return view;
  };
}

export async function openHD2DTest(dialog, startingMode, signal) {
  const art = await loadStation();
  if (signal.aborted) return;

  const world = dialog.querySelector('[data-hd-world]');
  const ctx = world.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D is not available');
  const renderStation = stationRenderer(ctx, art);
  const time = dialog.querySelector('[data-hd-time]');
  const status = dialog.querySelector('[data-hd-status]');
  const heading = dialog.querySelector('#hd2dHeading');
  const buttons = [...dialog.querySelectorAll('[data-hd-mode-button]')];
  const inspector = dialog.querySelector('[data-hd-inspector]');
  const fieldControls = dialog.querySelector('[data-hd-field]');
  const reset = dialog.querySelector('[data-hd-reset]');
  const renderPrototype = prototype(dialog, art['terrace/amihan.png'], signal);
  const player = { ...SPAWN, direction: 'down', clip: 'idle', frame: 0, clock: 0 };
  const updateCamera = cameraFor(world, player);
  const prefersStill = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const controls = movement(dialog, signal, () => dialog.dataset.hdMode === 'map' && !dialogue.active);
  const dialogue = stationDialogue(dialog, world, player, signal, (speaker) => {
    controls.clear();
    const dx = speaker.x - player.x, dy = speaker.y - player.y;
    player.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    Object.assign(player, { clip: 'idle', frame: 0, clock: 0 });
  });
  let id;
  const started = performance.now();
  let last = started;

  function setMode(mode) {
    dialog.dataset.hdMode = mode;
    heading.textContent = mode === 'map' ? 'Habagat Station' : 'Character Prototype';
    inspector.hidden = mode !== 'character';
    fieldControls.hidden = mode !== 'map';
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.hdModeButton === mode));
    controls.clear();
    dialogue.clear();
  }

  for (const button of buttons) {
    button.addEventListener('click', () => setMode(button.dataset.hdModeButton), { signal });
  }
  reset.addEventListener('click', () => {
    Object.assign(player, SPAWN, { direction: 'down', clip: 'idle', frame: 0, clock: 0 });
    updateCamera(0, true);
    controls.clear();
    dialogue.clear();
  }, { signal });

  time.value = 'day';
  setMode(startingMode);
  updateCamera(0, true);
  function frame(now) {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    const exploring = dialog.dataset.hdMode === 'map';
    if (exploring && !dialogue.active) updatePlayer(player, controls.read(), dt);
    if (!exploring) renderPrototype(dt);
    const view = updateCamera(dt, prefersStill);
    if (exploring) dialogue.update(view);
    const elapsed = prefersStill ? 0 : Math.max(0, (now - started) / 1000);
    renderStation(view, player, time.value, elapsed, dialogue.active);
    id = requestAnimationFrame(frame);
  }
  id = requestAnimationFrame(frame);
  signal.addEventListener('abort', () => cancelAnimationFrame(id), { once: true });
  status.hidden = true;
}
