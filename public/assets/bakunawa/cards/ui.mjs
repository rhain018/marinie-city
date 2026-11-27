import { loadBattleArt } from '../battle.mjs?v=abyssbreaker';
import { render } from '../render.mjs?v=abyssbreaker';
import { newBattle, cuePracticeAttack, PHASES } from '../combat.mjs?v=dual-hd';
import { cinematicRate, createCinematic, feedCinematic } from '../cinematic.mjs?v=abyssbreaker';
import { createBattleScore } from '../score.mjs';
import { createCombatSounds } from '../effects/sound.mjs';
import { BOSS_HP, MAX_HP, MAX_ENERGY, MAX_CHARGE, cards, ultimates, start, play, endTurn, intent, phase } from './rules.mjs';

const names = { yhannie: 'Yhannie', loki: 'Loki' };
const portraits = { yhannie: file('art/yhannie-portrait'), loki: file('art/loki-portrait') };
const illustrations = { slash: 'art/slash', counter: 'art/riposte', guard: 'art/guard', parry: 'art/guard' };
const summaries = {
  pulse: '12 damage. Moon Mark.',
  spear: '22 damage. +14 with Moon Mark.',
  shield: 'Block 24 this turn.',
  dodge: 'Evade dodgeable hits. Draw 1.',
  slash: 'Deal 16 damage.',
  counter: '22 damage. +16 after Parry.',
  parry: 'Block 10. Parry for 12.',
  guard: 'Block 24 this turn.',
};
const heroStart = { x: 366, y: 422 };
const bossOffset = [105, -50];
let artPromise;

function file(name) {
  return new URL(name + '.webp', import.meta.url).href;
}

function loadCardArt() {
  const harbor = new Image();
  harbor.src = file('art/storm-dock');
  return Promise.all([loadBattleArt(), harbor.decode()]).then(([battleArt]) => ({ ...battleArt, dock: harbor }));
}

function makeCardFace(button) {
  const artwork = document.createElement('img');
  artwork.alt = '';
  artwork.draggable = false;
  const cost = document.createElement('span');
  cost.className = 'card-cost';
  const number = document.createElement('b');
  cost.append(number);
  const copy = document.createElement('span');
  copy.className = 'card-copy';
  const name = document.createElement('strong');
  const kind = document.createElement('span');
  kind.className = 'card-kind';
  const detail = document.createElement('small');
  copy.append(name, kind, detail);
  button.replaceChildren(artwork, cost, copy);
  return { artwork, number, name, kind, detail };
}

function setMeter(meter, value, max, label) {
  meter.value = value;
  meter.parentElement.style.setProperty('--fill', value / max * 100 + '%');
  label.textContent = value + ' / ' + max;
}

function lightPips(row, count) {
  for (const [i, pip] of [...row.children].entries()) pip.classList.toggle('is-lit', i < count);
}

export function openCardBattle(dialog, { drawHero, sound: fallbackSound, quality, musicVolume, musicOutput, sfxOutput, onClose }) {
  const get = name => dialog.querySelector('[data-card="' + name + '"]');
  const canvas = dialog.querySelector('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas 2D unavailable');

  const selection = get('selection'), hand = get('hand'), next = get('next'), ultimate = get('ultimate');
  const hud = get('hud'), pause = get('pause'), resultPanel = get('result'), control = get('close');
  const notice = get('notice'), message = get('message'), speaker = get('speaker');
  const heroBar = get('hero-hp'), bossBar = get('boss-hp'), chargeBar = get('charge');
  const ultimateFace = makeCardFace(ultimate);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const controller = new AbortController();
  const listen = { signal: controller.signal };
  const battleMusic = createBattleScore(dialog, musicOutput);
  const score = battleMusic.audio;

  let battle, scene, art, action = null, selected = null, shownHand = '', ultimateHero;
  let frame = 0, lastFrame = null, closed = false, paused = false, resumeFocus;
  const combatSounds = createCombatSounds(sfxOutput, fallbackSound);
  const sound = (event, kind) => combatSounds.play(event, kind, battle?.hero);

  function announce(line, who = '') {
    speaker.textContent = who;
    speaker.hidden = !who;
    message.textContent = line;
  }

  function startScore() {
    battleMusic.play(musicVolume);
  }

  const heroButtons = [...selection.querySelectorAll('button')];
  heroButtons.forEach(button => { button.disabled = true; });
  selection.hidden = false;
  hud.hidden = resultPanel.hidden = pause.hidden = true;
  notice.hidden = false;
  control.dataset.mode = 'back';
  control.setAttribute('aria-label', 'Back to Developer Test');
  dialog.dataset.beat = '';
  dialog.dataset.paused = 'false';
  announce('Loading the harbor…');
  dialog.showModal();

  artPromise ??= loadCardArt().catch(error => { artPromise = null; throw error; });
  artPromise.then(loaded => {
    if (closed || !dialog.open) return;
    art = loaded;
    heroButtons.forEach(button => { button.disabled = false; });
    reset('yhannie', true);
    heroButtons[0].focus({ preventScroll: true });
  }).catch(error => {
    if (closed || !dialog.open) return;
    console.error(error);
    announce('Battle artwork failed to load. Close and reopen the battle to retry.');
  });

  for (const button of heroButtons) {
    button.addEventListener('click', () => { if (art) { reset(button.value); startScore(); } }, listen);
  }

  function reset(hero, preview = false) {
    cancelAnimationFrame(frame);
    combatSounds.stop();
    battle = start(hero);
    scene = Object.assign(newBattle(true), heroStart, {
      hero, bossOffset, cardMode: true, state: 'idle', visual: createCinematic(), reduceMotion: reduce,
    });
    lastFrame = null;
    action = null;
    selected = null;
    shownHand = '';
    selection.hidden = !preview;
    hud.hidden = preview;
    hud.inert = false;
    pause.hidden = resultPanel.hidden = true;
    notice.hidden = preview;
    dialog.dataset.hero = hero;
    dialog.dataset.beat = '';
    control.dataset.mode = preview ? 'back' : 'pause';
    control.setAttribute('aria-label', preview ? 'Back to Developer Test' : 'Pause battle');
    if (!preview) {
      announce('Hear the deep answer your name.', 'Bakunawa');
      update(true);
      next.focus({ preventScroll: true });
    }
    frame = requestAnimationFrame(draw);
  }

  function setPaused(value) {
    paused = value;
    pause.hidden = !value;
    hud.inert = value;
    dialog.dataset.paused = String(value);
    control.setAttribute('aria-label', value ? 'Resume battle' : 'Pause battle');
    lastFrame = null;
    if (value) {
      resumeFocus = document.activeElement;
      cancelAnimationFrame(frame);
      score.pause();
      combatSounds.stop();
      get('resume').focus({ preventScroll: true });
    } else {
      frame = requestAnimationFrame(draw);
      startScore();
      const target = resumeFocus?.isConnected && !resumeFocus.disabled ? resumeFocus : control;
      target.focus({ preventScroll: true });
    }
  }

  function backOrPause() {
    if (!selection.hidden || !resultPanel.hidden) dialog.close();
    else setPaused(!paused);
  }

  control.addEventListener('click', backOrPause, listen);
  get('resume').addEventListener('click', () => setPaused(false), listen);
  get('exit').addEventListener('click', () => dialog.close(), listen);
  dialog.addEventListener('cancel', event => { event.preventDefault(); backOrPause(); }, listen);
  dialog.addEventListener('close', () => {
    closed = true;
    controller.abort();
    battleMusic.dispose();
    combatSounds.stop();
    cancelAnimationFrame(frame);
    onClose?.();
  }, { once: true });

  function update(deal = false) {
    const bossPhase = phase(battle);
    setMeter(heroBar, battle.hp, MAX_HP, get('hero-hp-text'));
    setMeter(bossBar, battle.bossHp, BOSS_HP, get('boss-hp-text'));
    setMeter(chargeBar, battle.charge, MAX_CHARGE, get('charge-text'));
    get('hero-title').textContent = names[battle.hero];
    get('hero-portrait').src = portraits[battle.hero];
    get('phase').textContent = PHASES[bossPhase];
    lightPips(get('phase-pips'), [4, 6, 7][bossPhase]);

    const attack = action?.attack ?? intent(battle);
    get('intent-name').textContent = attack.name;
    get('intent-info').textContent = attack.damage + ' damage · Block' +
      (attack.evadable ? ' / Dodge' : '') + (battle.hero === 'loki' && attack.parryable ? ' / Parry' : '');
    get('energy').textContent = battle.energy + ' / ' + MAX_ENERGY;
    lightPips(get('energy-pips'), battle.energy);
    get('turn').textContent = 'Turn ' + battle.turn;
    get('deck').textContent = battle.deck.length;
    get('discard').textContent = battle.discard.length;

    const effects = [
      battle.block && 'Block ' + battle.block, battle.evade && 'Evade', battle.parry && 'Parry',
      battle.mark && 'Moon Mark', battle.counter && 'Riposte ready',
    ].filter(Boolean).join(' · ');
    const effectsNode = get('effects');
    effectsNode.textContent = effects;
    effectsNode.hidden = !effects;

    const locked = Boolean(action || battle.result);
    const charged = battle.charge === MAX_CHARGE;
    if (ultimateHero !== battle.hero) {
      ultimateHero = battle.hero;
      ultimateFace.artwork.src = file(ultimateHero === 'loki' ? 'art/loki-ultimate' : 'ultimate');
      ultimateFace.number.textContent = MAX_CHARGE;
      ultimateFace.name.textContent = 'Ultimate';
      ultimateFace.detail.textContent = ultimates[ultimateHero].name;
    }
    ultimateFace.kind.textContent = charged ? 'Ready' : 'Charge ' + battle.charge + ' / ' + MAX_CHARGE;
    ultimate.dataset.ready = String(charged);
    ultimate.setAttribute('aria-label', ultimates[ultimateHero].name + ', ' + (charged
      ? 'Deal ' + ultimates[ultimateHero].damage + ' damage.' : ultimateFace.kind.textContent));
    ultimate.setAttribute('aria-pressed', String(selected === 'ultimate'));
    ultimate.classList.toggle('is-playing', action?.index === 'ultimate');
    ultimate.disabled = !charged || locked;
    next.disabled = locked;

    const handKey = battle.hand.join(',');
    if (shownHand !== handKey || deal) {
      shownHand = handKey;
      hand.replaceChildren(...battle.hand.map((id, index) => {
        const card = cards[id];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'skill-card';
        button.dataset.index = index;
        button.setAttribute('aria-label', card.name + ', ' + card.cost + ' Energy. ' + card.text);
        const face = makeCardFace(button);
        face.artwork.src = file(illustrations[id] ?? card.art);
        face.number.textContent = card.cost;
        face.name.textContent = card.name;
        face.kind.textContent = card.type;
        face.detail.textContent = summaries[id] ?? card.text;
        if (deal && !reduce) {
          button.style.setProperty('--deal-delay', index * 42 + 'ms');
          button.classList.add('is-dealt');
          button.addEventListener('animationend', () => button.classList.remove('is-dealt'), { once: true });
        }
        return button;
      }));
    }
    for (const [index, button] of [...hand.children].entries()) {
      button.setAttribute('aria-pressed', String(index === selected));
      button.classList.toggle('unaffordable', cards[battle.hand[index]].cost > battle.energy);
      button.classList.toggle('is-playing', !action?.resolved && action?.index === index);
      button.disabled = locked;
    }

    const finished = Boolean(battle.result && !action && scene.state !== 'victory');
    resultPanel.hidden = !finished;
    if (finished) {
      control.dataset.mode = 'back';
      control.setAttribute('aria-label', 'Back to Developer Test');
      get('result-title').textContent = battle.result === 'won' ? 'Bakunawa is defeated' : 'The tide overwhelms you';
      get('result-detail').textContent = names[battle.hero] + ' · Turn ' + battle.turn;
      get('retry').focus({ preventScroll: true });
    }
  }

  hand.addEventListener('click', event => {
    const button = event.target.closest('button[data-index]');
    if (button) choose(Number(button.dataset.index));
  }, listen);
  ultimate.addEventListener('click', () => choose('ultimate'), listen);
  next.addEventListener('click', () => {
    if (paused || action || battle.result) return;
    const attack = intent(battle);
    action = { attack, start: scene.age, duration: 1.18, impact: .72 };
    cuePracticeAttack(scene, attack.kind, () => {});
    scene.hazard.length = action.impact;
    scene.timer = action.impact;
    selected = null;
    dialog.dataset.beat = 'warning';
    sound('tell', attack.kind);
    announce('Bakunawa prepares ' + attack.name + '…', 'Enemy turn');
    update();
  }, listen);
  get('retry').addEventListener('click', () => reset(battle.hero), listen);
  get('switch').addEventListener('click', () => {
    score.pause();
    reset(battle.hero, true);
    heroButtons.find(button => button.value === battle.hero).focus({ preventScroll: true });
  }, listen);

  function choose(index) {
    if (paused || action || battle.result || (index === 'ultimate' && battle.charge < MAX_CHARGE)) return;
    const id = battle.hand[index];
    const card = index === 'ultimate' ? ultimates[battle.hero] : cards[id];
    if (!card) return;
    if (selected !== index) {
      selected = index;
      sound('cardSelect', index === 'ultimate' ? 'ultimate' : card.type);
      announce(card.text ?? 'Deal ' + card.damage + ' damage. Uses full Ultimate Charge.', card.name);
      update();
      return;
    }
    if (index !== 'ultimate' && card.cost > battle.energy) {
      announce('Need ' + card.cost + ' Energy to play this card.', card.name);
      return;
    }
    selected = null;
    const big = index === 'ultimate', combo = id === 'counter' ? 2 : 1;
    const launch = big ? .38 : .16;
    const impact = launch + (big ? .57 : .27);
    action = {
      index, id, card, combo, start: scene.age, duration: impact + (big ? .76 : .39),
      impact, launch,
    };
    if (card.damage) {
      const windup = big ? launch : impact;
      scene.cast = { kind: card.fx, time: windup, total: windup, combo };
    }
    dialog.dataset.beat = big ? 'ultimate' : 'playing';
    announce(card.name + '…', names[battle.hero]);
    if (card.fx !== 'dodge') sound(card.fx);
    update();
  }

  function resolveCard(current) {
    const marked = current.id === 'spear' && battle.mark;
    const countered = current.id === 'counter' && battle.counter;
    const oldPhase = phase(battle);
    const { card, damage } = play(battle, current.index);
    const fx = card.fx;
    scene.cast = null;
    if (fx === 'shield') scene.guard = .7;
    if (fx === 'dodge') {
      scene.dodge = { x: -1, y: 0, time: .27 };
      sound('dodge');
    }
    if (damage) {
      scene.visualRelease = { age: scene.age };
      scene.bladeRelease = { kind: fx, combo: current.combo, age: scene.age };
      scene.stagger = .42;
      scene.shake = fx === 'ultimate' ? .6 : .22;
      if (fx === 'ultimate') scene.cinematicRelease = scene.age;
      scene.skillImpact = { kind: fx, combo: current.combo, age: scene.age };
      feedCinematic(scene, 'hit', fx, damage, quality);
      sound('hit', fx);
    }
    if (!battle.result && phase(battle) > oldPhase) {
      scene.phaseShift = scene.age;
      sound('enrage');
    }
    const combo = marked ? ' · Moon Mark combo' : countered ? ' · Parry combo' : '';
    announce(damage ? damage + ' damage' + combo : card.text, card.name);
  }

  function resolveBoss(current) {
    const attack = current.attack;
    scene.state = 'impact';
    scene.timer = .44;
    dialog.dataset.beat = 'impact';
    feedCinematic(scene, 'impact', attack.kind, null, quality);
    sound('impact', attack.kind);
    const resolved = endTurn(battle, attack);
    if (resolved.damage) {
      scene.hurt = .35;
      scene.shake = .35;
      sound('hurt');
    }
    if (resolved.parried) {
      scene.guard = .42;
      scene.guardImpact = scene.age;
      scene.stagger = .28;
      feedCinematic(scene, 'parry', attack.kind, null, quality);
      sound('parry', attack.kind);
    }
    if (resolved.evaded) scene.dodge = { x: -1, y: 0, time: .27 };
    const line = resolved.parried ? 'Perfect Parry · ' + resolved.counterDamage + ' counter damage'
      : resolved.evaded ? 'Dodged ' + attack.name
      : resolved.damage ? resolved.damage + ' damage taken' : 'Fully blocked';
    announce(line, attack.name);
  }

  function advanceAction() {
    const current = action, elapsed = scene.age - current.start;
    if (current.attack) scene.timer = Math.max(0, (current.resolved ? current.duration : current.impact) - elapsed);

    if (current.card?.damage) {
      const sword = battle.hero === 'loki';
      if (sword && !reduce) {
        const range = current.index === 'ultimate' ? 185 : current.combo > 1 ? 124 : 73;
        scene.x = heroStart.x + range * Math.sin(Math.PI * Math.min(1, elapsed / current.duration));
      }
      if (!current.resolved && elapsed >= current.launch) {
        if (!current.origin) {
          current.origin = { x: scene.x + 34, y: scene.y - 62 };
          if (current.index === 'ultimate') {
            scene.cinematicRelease = scene.age;
            scene.visualRelease = { age: scene.age };
            scene.cast = null;
          }
          feedCinematic(scene, 'launch', current.card.fx, null, quality);
          sound('launch', current.card.fx);
        }
        const progress = Math.min(1, (elapsed - current.launch) / (current.impact - current.launch));
        scene.shot = {
          ...current.origin, t: progress, kind: sword ? 'wave' : current.card.fx,
          cardKind: current.card.fx, combo: current.combo,
        };
      }
    }
    if (!current.resolved && elapsed >= current.impact) {
      scene.shot = null;
      current.resolved = true;
      if (current.attack) resolveBoss(current);
      else resolveCard(current);
      update();
    }
    if (elapsed < current.duration) return;

    scene.x = heroStart.x;
    scene.hazard = scene.cast = null;
    scene.state = battle.result === 'lost' ? 'lost' : 'idle';
    if (battle.result === 'won') {
      scene.state = reduce ? 'won' : 'victory';
      scene.victoryTime = 3.2;
      sound('bossFallen');
    }
    action = null;
    dialog.dataset.beat = '';
    update(Boolean(current.attack && !battle.result));
    if (!battle.result && (document.activeElement === dialog || !dialog.contains(document.activeElement))) {
      const focusTarget = current.attack ? next : hand.querySelector('[data-index="' + current.index + '"]') ?? next;
      focusTarget.focus({ preventScroll: true });
    }
  }

  function draw(now) {
    if (closed || paused || !dialog.open) return;
    const dt = lastFrame === null ? 0 : Math.min(.05, (now - lastFrame) / 1000) * cinematicRate(scene);
    lastFrame = now;
    scene.age += dt;
    for (const field of ['stagger', 'hurt', 'shake', 'guard']) scene[field] = Math.max(0, scene[field] - dt);
    if (scene.dodge && (scene.dodge.time -= dt) <= 0) scene.dodge = null;
    if (scene.cast) scene.cast.time = Math.max(.001, scene.cast.time - dt);
    if (action) advanceAction();
    else if (scene.state === 'victory') {
      scene.victoryTime += dt;
      if (scene.victoryTime > 5.33) {
        scene.state = 'won';
        update();
      }
    }
    scene.phase = phase(battle);
    const ratio = Math.min(quality === 0 ? 1 : 1.5, devicePixelRatio || 1);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    render(context, canvas, art, scene, quality,
      (g, act, dir, time, x, y, size) => drawHero(g, battle.hero, act, dir, time, x, y, size));
    frame = requestAnimationFrame(draw);
  }
}
