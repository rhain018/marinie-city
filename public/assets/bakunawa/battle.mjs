import { SKILL_NAMES, cuePracticeAttack, clamp, BOSS_HP, PLAYER, PHASES, SPELLS, newBattle, stepBattle, useSpell } from './combat.mjs?v=fishing-port';
import { render } from './render.mjs?v=phase-two';
import { cinematicRate, createCinematic, feedCinematic, ultimateBeat } from './cinematic.mjs?v=abyssbreaker';
import { createBattleScore } from './score.mjs';
import { createCombatSounds } from './effects/sound.mjs';
import { frameAtlases } from './effects/frames.mjs';
import { DETAIL_CELL } from './effects/ultimate-layers.mjs';
import { TIDEBREAKER_ART } from './effects/tidebreaker.mjs?v=abyssbreaker';
import { ABYSSBREAKER_ART } from './effects/abyssbreaker.mjs';

import { PORT_LAYOUT } from './port/layout.mjs';
import { validateFieldAtlas, createFieldEffects, cueFieldEffects } from './animation/field-effects.mjs';

async function loadFieldArt() {
  const response = await fetch(new URL('animation/field-skills.json', import.meta.url));
  if (!response.ok) return null;
  const meta = await response.json();
  const image = await loadImage('animation/' + meta.atlas.file);
  return validateFieldAtlas(image, meta) ? { image, meta } : null;
}

let cachedArt, portArt;
async function loadPortArt() {
  const [skyline, pier, dragon, loki, yhannie, lantern, effects] = await Promise.all([
    ...['skyline', 'stone-pier', 'tideborn', 'loki', 'yhannie', 'lantern'].map(name => loadImage('port/' + name + '.webp')),
    loadFieldArt().catch(() => null),
  ]);
  if (skyline.naturalWidth !== 1536 || skyline.naturalHeight !== 510 ||
      pier.naturalWidth !== 1536 || pier.naturalHeight !== 354 ||
      ![loki, yhannie].every(sheet => sheet.naturalWidth === 1376 && sheet.naturalHeight === 536)) {
    throw new Error('Invalid Fishing Port layers');
  }
  return { skyline, pier, dragon, lantern, effects, heroes: { loki, yhannie } };
}
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('Could not load ' + file));
    im.src = new URL(file, import.meta.url).href;
  });
}

async function loadSkillArt(hero) {
  const { width, height, clips } = frameAtlases[hero];
  const frames = await loadImage('effects/' + hero + '-vfx-16.webp').catch(() => null);
  if (frames?.naturalWidth === width && frames.naturalHeight === height) {
    return { sheet: frames, clips, animated: true };
  }
  const sheet = await loadImage('effects/' + hero + '-vfx.webp').catch(() => null);
  return { sheet, clips, animated: false };
}

async function loadUltimateArt(name, effect, { cell, columns, frames }) {
  const [sequence, details] = await Promise.all([name + '-' + effect + '-' + frames, name + '-details']
    .map(file => loadImage('effects/' + file + '.webp').catch(() => null)));
  if (sequence?.naturalWidth !== cell * columns || sequence.naturalHeight !== cell * frames / columns ||
      details?.naturalWidth !== DETAIL_CELL * 3 || details.naturalHeight !== DETAIL_CELL) return null;
  return { sequence, details };
}

// The presentation strips have a dark navy matte around much of the artwork.
// Remove only edge-connected matte pixels, independently inside each frame,
// so a frame never bleeds into its neighbor and the battle scene shows through.
function cleanSkillStrip(image) {
  const frameWidth = image.naturalWidth / 8, height = image.naturalHeight;
  if (!Number.isInteger(frameWidth) || !frameWidth || !height) return image;
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return image;
  context.drawImage(image, 0, 0);
  let frame;
  try { frame = context.getImageData(0, 0, canvas.width, height); }
  catch { return image; }
  const { data } = frame;
  const framePixels = frameWidth * height;
  const queue = new Int32Array(framePixels);
  const removed = new Uint8Array(framePixels);
  const isMatte = offset => {
    const a = data[offset + 3];
    if (!a) return false;
    const r = data[offset], g = data[offset + 1], b = data[offset + 2];
    const luma = r * .2126 + g * .7152 + b * .0722;
    // Remove the edge-connected midnight-blue matte from each source panel.
    // Keeping this edge-connected avoids keying dark scale details inside art.
    return luma < 82 && b > r * 1.18 && b > g * 1.02;
  };
  for (let cell = 0; cell < 8; cell++) {
    removed.fill(0);
    let head = 0, tail = 0;
    const add = local => {
      if (removed[local]) return;
      const x = local % frameWidth, y = (local / frameWidth) | 0;
      const offset = 4 * (y * canvas.width + cell * frameWidth + x);
      if (!isMatte(offset)) return;
      removed[local] = 1;
      queue[tail++] = local;
    };
    for (let x = 0; x < frameWidth; x++) { add(x); add((height - 1) * frameWidth + x); }
    for (let y = 0; y < height; y++) { add(y * frameWidth); add(y * frameWidth + frameWidth - 1); }
    while (head < tail) {
      const local = queue[head++], x = local % frameWidth, y = (local / frameWidth) | 0;
      const offset = 4 * (y * canvas.width + cell * frameWidth + x);
      data[offset + 3] = 0;
      data[offset] = data[offset + 1] = data[offset + 2] = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < frameWidth && ny >= 0 && ny < height) add(ny * frameWidth + nx);
      }
    }
    // Soften the one-pixel navy fringe left by antialiasing against the matte.
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < frameWidth - 1; x++) {
      const local = y * frameWidth + x;
      if (removed[local]) continue;
      if (!removed[local - 1] && !removed[local + 1] && !removed[local - frameWidth] && !removed[local + frameWidth]) continue;
      const offset = 4 * (y * canvas.width + cell * frameWidth + x);
      const r = data[offset], g = data[offset + 1], b = data[offset + 2];
      const luma = r * .2126 + g * .7152 + b * .0722;
      if (luma < 118 && b > r * 1.08 && b > g * .95) data[offset + 3] = Math.min(data[offset + 3], Math.round(255 * Math.max(0, Math.min(1, (luma - 28) / 90))));
    }
    // Keep the painted silhouette intact. Broadly feathering every cell edge
    // erased horns, foam and lightning that intentionally reach the frame edge.
  }
  context.putImageData(frame, 0, 0);
  return canvas;
}

export async function loadBattleArt({ fishingPort = false } = {}) {
  if (fishingPort) portArt ??= loadPortArt().catch(() => { portArt = null; return null; });
  const layers = fishingPort ? portArt : null;
  if (!cachedArt) {
    const [dock, dragon, poses, crest, roar, tidal, maelstrom, stormfang, contact, loki, yhannie, bakunawa,
      lokiEffects, yhannieEffects, lokiCutIn, yhannieCutIn, tidebreaker, abyssbreaker] = await Promise.all([
      loadImage('dock.webp'), loadImage('tideborn.webp'), loadImage('yhannie-combat.webp'), loadImage('crest.webp'),
      loadImage('skill-reference/abyssal_roar.webp'), loadImage('skill-reference/tidal_cataclysm.webp'),
      loadImage('skill-reference/maelstrom_prison.webp'), loadImage('skill-reference/stormfang_lightning.webp'),loadImage('contact-atlas.webp'),
      ...['loki', 'yhannie', 'bakunawa'].map(name => loadImage('cinematic/' + name + '.webp').catch(() => null)),
      loadSkillArt('loki'), loadSkillArt('yhannie'),
      ...['loki-cut-in', 'yhannie-cut-in'].map(name => loadImage('effects/' + name + '.webp').catch(() => null)),
      loadUltimateArt('tidebreaker', 'bloom', TIDEBREAKER_ART),
      loadUltimateArt('abyssbreaker', 'slash', ABYSSBREAKER_ART),
    ]);
    cachedArt = { dock, dragon, poses, crest, contact, cinematic:{loki, yhannie, bakunawa},
      effects: { loki: lokiEffects, yhannie: yhannieEffects }, tidebreaker, abyssbreaker,
      cutIns: { loki: lokiCutIn, yhannie: yhannieCutIn }, skills:{
      roar:cleanSkillStrip(roar), tidal:cleanSkillStrip(tidal),
      maelstrom:cleanSkillStrip(maelstrom), stormfang:cleanSkillStrip(stormfang),
    } };
  }
  return fishingPort ? { ...cachedArt, port: await layers } : cachedArt;
}

const controls = {
  ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
  ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down',
};
const shortcuts = { j: 'bolt', k: 'charge', e: 'wave', r: 'crescent', f:'aerial', l: 'shield', ' ': 'dodge', u: 'ultimate' };

export function openBattle(root, art, bridge) {
  const find = s => root.querySelector(s);
  const canvas = find('canvas'), g = canvas.getContext('2d', { alpha: false });
  if (!g) throw new Error('Canvas 2D unavailable');
  const stage = find('.tide-stage'), stick = find('.tide-stick'), knob = stick.firstElementChild;
  const overlay = find('.tide-overlay'), message = find('.tide-notice');
  const cinematic = find('.tide-cinematic'), cinematicSpeaker = find('.tide-speaker'), cinematicLine = find('.tide-line');
  const spellButtons = [...root.querySelectorAll('[data-spell]')].map(button => ({
    button, cooldown: button.querySelector('.tide-cooldown'), kind: button.dataset.spell,
  }));
  const hp = find('[data-bar="hp"]'), mp = find('[data-bar="mp"]'), bossHp = find('[data-bar="boss"]');
  const ultimateGauge = find('.tide-ult');
  const phase = find('.tide-phase'), play = find('[data-battle="resume"]');
  const level = find('.tide-level'), phasePips = [...root.querySelectorAll('.tide-phase-pips i')];
  const panelTitle = find('#tide-menu-title'), restart = find('[data-battle="restart"]');
  const quality = find('[aria-label="Battle effects"]');
  quality.value = bridge.quality();
  const hero = bridge.hero || 'yhannie';
  const name = bridge.name || 'Yhannie';
  root.dataset.hero = hero;
  const skillNames=SKILL_NAMES[hero]||SKILL_NAMES.yhannie;
  const reduced=find('[data-battle="reduced"]');
  reduced.checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.toggle('reduce-battle-motion',reduced.checked);
  const practiceTools=find('[data-battle="practice-tools"]');
  practiceTools.hidden=!bridge.practice;
  const swordIcons={
    bolt:'M9 53 45 17 53 9 51 22 17 55 M11 42 23 54',
    charge:'M13 18h25 M7 30h34 M15 43h18 M31 51 54 27 59 14 45 21 23 44',
    wave:'M11 11 53 53 M53 11 11 53 M9 42 22 55 M42 55 55 42',
    aerial:'M14 50Q47 47 52 11 M17 51 42 27',
    crescent:'M10 46Q31 63 50 38Q58 26 53 12Q41 44 10 46 M28 48 48 26',
    shield:'M10 30 31 12 54 30 32 55Z M19 43 46 20 M15 35 29 49',
    ultimate:'M8 47Q45 50 54 8Q64 40 35 54Z M15 54 49 15'
  };
  for(const {button,kind} of spellButtons){
    button.hidden=!skillNames[kind];
    if(button.hidden)continue;
    button.title=skillNames[kind];
    button.setAttribute('aria-label',skillNames[kind]+(SPELLS[kind].cost?', '+SPELLS[kind].cost+' MP':''));
    const caption=button.querySelector('.tide-skill-name');
    if(caption)caption.textContent=skillNames[kind];
    const icon=button.querySelector('svg');
    if(icon){
      if(!icon.dataset.originalMarkup){
        icon.dataset.originalMarkup=icon.innerHTML;
        icon.dataset.originalViewBox=icon.getAttribute('viewBox');
      }
      if(hero==='loki'&&swordIcons[kind]){
        icon.setAttribute('viewBox','0 0 64 64');
        icon.innerHTML='<path d="'+swordIcons[kind]+'" fill="none" stroke="#c4f5ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
      }else{
        icon.setAttribute('viewBox',icon.dataset.originalViewBox);
        icon.innerHTML=icon.dataset.originalMarkup;
      }
    }
  }
  const exit = find('[data-battle="exit"]');
  find('.tide-hero-title strong').textContent = name;
  find('.tide-portrait img').src = new URL('port/' + hero + '-portrait.webp', import.meta.url).href;
  hp.setAttribute('aria-label', name + ' HP');
  mp.setAttribute('aria-label', name + ' MP');
  exit.textContent = bridge.story ? 'Return to Port' : 'Exit to Developer Test';
  restart.textContent = bridge.story ? 'Retry' : 'Restart Battle';
  const skip = document.createElement('button');
  skip.type = 'button';
  skip.className = 'tide-skip';
  skip.textContent = 'Skip reveal';
  stage.append(skip);
  const flash = document.createElement('div');
  flash.className = 'tide-reveal-glow';
  if ((bridge.story && !bridge.skipReveal) || bridge.revealOnly) stage.append(flash);
  function fresh(skipReveal) {
    const next = newBattle(bridge.practice);
    next.hero = hero;
    if (art.port) next.layout = PORT_LAYOUT;
    if (art.port?.effects) next.fieldEffects = createFieldEffects(art.port.effects, hero);
    next.reduceMotion = reduced.checked;
    next.story = !!bridge.story;
    next.visual = createCinematic();
    if (skipReveal) {next.state = 'idle'; next.timer = .65;}
    return next;
  }
  let state = fresh(bridge.skipReveal), pause = false, raf = 0, last = 0, debt = 0, lastDraw = 0;
  let frameAverage = 16.7, adaptive = false, pointer = null, touchId = null, lastResult = '', lastNotice = '', dialogueUntil = 0, cinematicTimer = 0;
  const keys = new Set(), direction = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const controller = new AbortController(), { signal } = controller;
  const fixed = 1 / 120;

  skip.addEventListener('click', () => {
    if (state.state === 'emerge') state.timer = 0;
  }, { signal });

  function resetInput() {
    keys.clear();
    pointer = null; touchId = null;
    direction.x = direction.y = 0;
    direction.targetX = direction.targetY = 0;
    knob.style.transform = '';
    stick.classList.remove('is-active');
  }

  function resize() {
    const max = quality.value === 'low' ? 1 : 2;
    const pixelRatio = Math.min(max, devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(stage.clientWidth * pixelRatio));
    canvas.height = Math.max(1, Math.round(stage.clientHeight * pixelRatio));
  }

  function movement() {
    return { x: direction.x, y: direction.y };
  }

  function smoothMovement(dt) {
    let x=direction.targetX+Number(keys.has('right'))-Number(keys.has('left'));
    let y=direction.targetY+Number(keys.has('down'))-Number(keys.has('up'));
    const magnitude=Math.hypot(x,y);
    if(magnitude>1){x/=magnitude;y/=magnitude;}
    const easing=1-Math.exp(-dt*26);
    direction.x+=(x-direction.x)*easing;
    direction.y+=(y-direction.y)*easing;
  }

  const battleMusic = bridge.revealOnly ? null : createBattleScore(root, bridge.musicOutput);
  const score = battleMusic?.audio;
  const combatSounds = createCombatSounds(bridge.sfxOutput, bridge.sound);
  function playScore(){
    if(!score)return;
    score.playbackRate=1+state.phase*.075;
    battleMusic.play(bridge.scoreVolume?.() ?? .45);
  }

  function spell(kind) {
    if (!pause && useSpell(state, kind, movement(), combatEvent) && score?.paused) playScore();
  }

  const bossLines = {
    burst: 'Hear the deep answer your name!',
    wave: 'The tide will take the pier!',
    vortex: 'Sink into the turning deep!',
    lightning: 'The storm obeys me!',
    tail: 'Broken wood, broken will!',
    abyss: 'The moon is swallowed. Drown!',
  };
  function showDialogue(speaker, text, duration = 1850) {
    cinematic.classList.toggle('boss', speaker === 'BAKUNAWA');
    cinematicSpeaker.textContent = speaker;
    cinematicLine.textContent = text;
    cinematic.hidden = false;
    dialogueUntil = performance.now() + duration;
  }
  function combatEvent(event, kind, ...details) {
    const level = { low: 0, medium: 1, high: 2 }[quality.value] ?? 1;
    feedCinematic(state, event, kind, details[0], adaptive ? Math.min(1, level) : level);
    cueFieldEffects(state, event, kind);
    if(event==='launch'||event==='victoryStrike'){
      state.visualRelease={age:state.age};
      if(kind==='ultimate'||event==='victoryStrike')state.cinematicRelease=state.age;
    }
    if(event==='dodge'||event==='hurt')state.visualRelease=null;
    combatSounds.play(event, kind, hero);
    if(score&&event==='ultimate')score.playbackRate=1.18+state.phase*.05;
    if(score&&(event==='hit'||event==='whiff'||event==='hurt'||event==='dodge'))score.playbackRate=1+state.phase*.075;
    if(event==='enrage'&&score)score.playbackRate=1+state.phase*.075;
    if(event==='hit')state.skillImpact={kind,combo:details[1],age:state.age};
    if(event==='victoryStrike')state.skillImpact={kind:'ultimate',combo:4,age:state.age};
    if(event==='victoryStart')score?.pause();
    if(event==='whiff')showDialogue(name.toUpperCase(),'Out of sword range',800);
    if (event === 'tell') showDialogue('BAKUNAWA', bossLines[kind] || 'The deep rises!', 2200);
    else if (skillNames[event]) {
      showDialogue(name.toUpperCase(), (hero==='loki'&&event==='bolt'?['Crimson Slash','Rising Blade','Scarlet Cyclone'][state.combo-1]:skillNames[event])+'!', event === 'ultimate' ? 2600 : 1450);
      if (event === 'ultimate') {
        root.classList.add('ultimate-beat');
        clearTimeout(cinematicTimer);
        cinematicTimer = setTimeout(() => root.classList.remove('ultimate-beat'), 2100);
      }
    } else if (event === 'enrage') showDialogue('BAKUNAWA', state.phase === 2 ? 'ABYSSAL FURY—BEGINS!' : 'Raging tides, rise!', 2400);
    else if (event === 'victoryStart') {
      bridge.victory?.();
      showDialogue(name.toUpperCase(), 'Bakunawa! Protektahan mo ang dagat—hindi angkinin!', 2100);
      root.classList.add('victory-cinematic');
      root.classList.add('ultimate-beat');
      clearTimeout(cinematicTimer);
      cinematicTimer = setTimeout(() => root.classList.remove('ultimate-beat'), 2300);
    } else if (event === 'victoryStrike') {
      showDialogue(name.toUpperCase(), skillNames.ultimate+'!', 1900);
      root.classList.add('ultimate-beat');
      clearTimeout(cinematicTimer);
      cinematicTimer = setTimeout(() => root.classList.remove('ultimate-beat'), 900);
    } else if (event === 'bossFallen') {
      showDialogue('BAKUNAWA', 'The tide... remembers.', 2200);
    } else if (event === 'won') {
      root.classList.remove('victory-cinematic');
      showDialogue(name.toUpperCase(), 'Marinie City is safe. The sea can rest now.', 2800);
    }
    else if (event === 'lost') showDialogue('BAKUNAWA', 'The deep claims another!', 2400);
  }

  function setPause(next) {
    pause = next;
    if (next) {
      score?.pause();
      combatSounds.stop();
    } else if (!lastResult) playScore();
    resetInput();
    overlay.hidden = !next;
    find('.tide-pause').hidden = next;
    if (next) play.focus({ preventScroll: true });
    else root.focus({ preventScroll: true });
  }

  let revealed = false;
  function updateHud() {
    skip.hidden = state.state !== 'emerge' || (!bridge.story && !bridge.revealOnly);
    if (bridge.revealOnly && state.state !== 'emerge') {root.close();return;}
    if (!revealed && state.state !== 'emerge') {revealed = true; bridge.revealDone?.();}
    if (!cinematic.hidden && performance.now() >= dialogueUntil) cinematic.hidden = true;
    for (const [bar, value, max] of [[hp,state.hp,PLAYER.hp],[mp,state.mp,PLAYER.mp],[bossHp,state.bossHp,BOSS_HP]]) {
      const amount = Math.floor(value);
      if (bar.getAttribute('aria-valuenow') === String(amount)) continue;
      bar.setAttribute('aria-valuenow', amount);
      bar.firstElementChild.style.width = 100 * value / max + '%';
      const readout = bar.querySelector('.tide-value');
      if (readout) readout.textContent = Math.ceil(value).toLocaleString()+' / '+max.toLocaleString();
    }
    if (level.textContent !== 'Lv. '+PLAYER.level) level.textContent = 'Lv. '+PLAYER.level;
    if (phase.textContent !== PHASES[state.phase]) phase.textContent = PHASES[state.phase];
    phasePips.forEach((pip,i) => pip.classList.toggle('on', i < 4+state.phase));
    const ultimate = SPELLS.ultimate;
    const ready = Math.round(100 * clamp(Math.min(state.mp / ultimate.cost, 1 - (state.cooldown.ultimate ?? 0) / ultimate.cooldown), 0, 1));
    if (ultimateGauge.getAttribute('aria-valuenow') !== String(ready)) {
      ultimateGauge.style.setProperty('--ready', ready + '%');
      ultimateGauge.setAttribute('aria-valuenow', ready);
    }
    const notice = state.state === 'emerge' ? 'Something stirs beneath the waves…'
      : state.state === 'enrage' ? PHASES[state.phase]
      : state.state === 'tell' ? '⚠  ' + state.hazard.name + '  ·  DODGE!'
      : state.state === 'sinking' ? 'Bakunawa sinks beneath the tide' : '';
    if (lastNotice !== notice) {
      lastNotice = notice;
      message.textContent = notice;
      message.hidden = !notice;
    }
    for (const { button, cooldown, kind } of spellButtons) {
      if(button.hidden)continue;
      const remaining = state.cooldown[kind] || 0;
      button.disabled = ['emerge','victory','won','lost'].includes(state.state) || state.mp < SPELLS[kind].cost || remaining > 0;
      cooldown.hidden = remaining < .12;
      const label = remaining >= 1 ? String(Math.ceil(remaining)) : '–';
      if (cooldown.textContent !== label) cooldown.textContent = label;
    }
    const result = state.state === 'won' || state.state === 'lost' ? state.state : '';
    if (result !== lastResult) {
      lastResult = result;
      if (result) {
        setPause(true);
        restart.focus({ preventScroll: true });
      }
      panelTitle.textContent = result === 'won' ? 'Tideborn Defeated' : result === 'lost' ? 'Swept Away' : 'Battle Paused';
      play.hidden = !!result;
      restart.hidden = !!bridge.story && result === 'won';
    }
  }

  function frame(now) {
    if (!root.open) return;
    const elapsed = last ? now - last : 16.7;
    last = now;
    frameAverage += (Math.min(60, elapsed) - frameAverage) * .04;
    if (frameAverage > 23) adaptive = true;
    if (frameAverage < 18) adaptive = false;
    if (!pause) {
      debt = Math.min(.083, debt + elapsed / 1000 * cinematicRate(state));
      smoothMovement(Math.min(.05,elapsed/1000));
      const input = movement();
      while (debt >= fixed) {
        stepBattle(state, fixed, input, combatEvent);
        debt -= fixed;
      }
    }
    const level = { low: 0, medium: 1, high: 2 }[quality.value] ?? 1;
    if (now - lastDraw >= (adaptive ? 29 : 12)) {
      updateHud();
      root.classList.toggle('ultimate-sequence', !state.reduceMotion && Boolean(ultimateBeat(state)));
      render(g, canvas, art, state, adaptive ? Math.min(1, level) : level, bridge.drawHero);
      lastDraw = now;
    }
    raf = requestAnimationFrame(frame);
  }

  function moveStick(e) {
    const b = stick.getBoundingClientRect(), r = b.width * .39;
    let x = (e.clientX - b.left - b.width / 2) / r, y = (e.clientY - b.top - b.height / 2) / r;
    const magnitude=Math.hypot(x,y),n=Math.max(1,magnitude);
    x/=n;y/=n;
    const amount=clamp((Math.min(1,magnitude)-.06)/.94,0,1),shaped=amount*(.78+.22*amount);
    direction.targetX=Math.abs(x)>.025?x*shaped:0;
    direction.targetY=Math.abs(y)>.025?y*shaped:0;
    knob.style.transform = `translate(${x * r * .68}px,${y * r * .68}px)`;
  }

  function joystickHit(e) {
    const b=stick.getBoundingClientRect();
    // The reference art has transparent padding and the visible circle is not
    // the same aspect ratio as its CSS box. Use a forgiving touch rectangle.
    return e.clientX>=b.left-b.width*.16&&e.clientX<=b.right+b.width*.16&&
      e.clientY>=b.top-b.height*.12&&e.clientY<=b.bottom+b.height*.12;
  }
  // Listen at document capture level so the active battle receives drags even
  // when iOS retargets events across the modal dialog or transparent HUD art.
  function startStick(e){
    if(pointer!==null||touchId!==null||pause||!joystickHit(e))return;
    pointer=e.pointerId;
    stick.classList.add('is-active');
    e.preventDefault();moveStick(e);
  }
  document.addEventListener('pointerdown',startStick,{capture:true,signal});
  document.addEventListener('pointermove',e=>{if(e.pointerId===pointer)moveStick(e)},{capture:true,signal});
  function endStick(e){
    if(e.pointerId!==pointer)return;
    pointer=null;direction.targetX=direction.targetY=0;knob.style.transform='';
    stick.classList.remove('is-active');
  }
  for(const name of ['pointerup','pointercancel']){
    document.addEventListener(name,endStick,{capture:true,signal});
  }
  // Keep a native touch fallback for Safari versions that suppress pointer
  // streams on modal dialogs. Ignore its compatibility events when Pointer
  // Events already claimed the same touch.
  document.addEventListener('touchstart',e=>{
    if(pointer!==null||touchId!==null||pause)return;
    const t=e.changedTouches[0]; if(!t||!joystickHit(t))return;
    touchId=t.identifier; stick.classList.add('is-active'); e.preventDefault(); moveStick(t);
  },{capture:true,passive:false,signal});
  document.addEventListener('touchmove',e=>{
    if(pointer!==null||touchId===null)return;
    const t=[...e.changedTouches].find(q=>q.identifier===touchId); if(!t)return;
    e.preventDefault(); moveStick(t);
  },{capture:true,passive:false,signal});
  const endTouch=e=>{
    if(touchId===null)return;
    if(![...e.changedTouches].some(t=>t.identifier===touchId))return;
    touchId=null; direction.targetX=direction.targetY=0; knob.style.transform=''; stick.classList.remove('is-active');
  };
  for(const name of ['touchend','touchcancel'])document.addEventListener(name,endTouch,{capture:true,passive:false,signal});
  for (const { button, kind } of spellButtons) button.addEventListener('click', () => spell(kind), { signal });
  find('.tide-pause').addEventListener('click', () => setPause(true), { signal });
  play.addEventListener('click', () => setPause(false), { signal });
  restart.addEventListener('click', () => {
    if(score)score.currentTime=0;
    clearTimeout(cinematicTimer);
    root.classList.remove('ultimate-beat','victory-cinematic','ultimate-sequence');
    combatSounds.stop();
    cinematic.hidden=true;
    state = fresh(bridge.story);
    debt = 0;
    lastResult = '';
    panelTitle.textContent = 'Battle Paused';
    play.hidden = false;
    setPause(false);
    if (!bridge.story) bridge.sound('emerge');
  }, { signal });
  find('[data-battle="exit"]').addEventListener('click', () => root.close(), { signal });
  quality.addEventListener('change', resize, { signal });
  reduced.addEventListener('change',()=>{
    state.reduceMotion=reduced.checked;
    root.classList.toggle('reduce-battle-motion',reduced.checked);
  },{signal});
  const attackSelect=practiceTools.querySelector('select');
  attackSelect.value='';
  attackSelect.addEventListener('change',()=>{
    if(cuePracticeAttack(state,attackSelect.value,combatEvent))setPause(false);
    attackSelect.value='';
  },{signal});
  root.addEventListener('cancel', e => {
    e.preventDefault();
    if (lastResult) root.close();
    else setPause(!pause);
  }, { signal });
  root.addEventListener('keydown', e => {
    if (pause || e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === 'SELECT') return;
    if (e.key === ' ' && e.target.tagName === 'BUTTON') return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (controls[key]) {
      keys.add(controls[key]);
      e.preventDefault();
    } else if (shortcuts[key] && !e.repeat) {
      spell(shortcuts[key]);
      e.preventDefault();
    }
  }, { signal });
  root.addEventListener('keyup', e => keys.delete(controls[e.key.length === 1 ? e.key.toLowerCase() : e.key]), { signal });
  window.addEventListener('blur', resetInput, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !pause) setPause(true);
  }, { signal });
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  root.addEventListener('close', () => {
    battleMusic?.dispose();
    combatSounds.stop();
    controller.abort();
    observer.disconnect();
    cancelAnimationFrame(raf);
    clearTimeout(cinematicTimer);
    root.classList.remove('ultimate-beat','victory-cinematic','ultimate-sequence');
    skip.remove();flash.remove();
    resetInput();
    canvas.width = canvas.height = 1;
    bridge.close();
  }, { once: true, signal });
  restart.hidden = false;
  play.hidden = false;
  panelTitle.textContent = 'Battle Paused';
  overlay.hidden = true;
  find('.tide-pause').hidden = false;
  root.showModal();
  playScore();
  root.focus({ preventScroll: true });
  resize();
  // Paint the complete battle scene before the first animation-frame callback.
  // Otherwise some mobile browsers briefly expose the canvas's opaque black
  // clear color while the HUD and touch controls have already appeared.
  updateHud();
  render(g, canvas, art, state, { low: 0, medium: 1, high: 2 }[quality.value] ?? 1, bridge.drawHero);
  lastDraw = performance.now();
    bridge.sound('emerge');
  raf = requestAnimationFrame(frame);
}
