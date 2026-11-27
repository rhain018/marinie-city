// Coordinates use the battle's 1536 × 864 reference space.
export const W = 1536, H = 864;
export const DECK = [[38, 510], [340, 368], [1015, 621], [581, 835], [38, 835]];
export const PROPS = [[95, 520, 44], [142, 476, 29], [192, 444, 23], [154, 804, 28], [60, 762, 71]];
export const TARGET = [850, 322];
export const PLAYER = { hp: 100, mp: 100, level: 7 };
export const BOSS_HP = 480;
export const PHASES = ['Awakening', 'Raging Tides', 'Abyssal Fury'];

const sequence = [
  ['burst', 'wave', 'tail', 'lightning'],
  ['wave', 'vortex', 'burst', 'tail', 'lightning'],
  ['vortex', 'tail', 'abyss', 'wave', 'lightning'],
];
const tells = {
  burst: { name: 'Abyssal Roar', time: .95, damage: 15 },
  wave: { name: 'Tidal Cataclysm', time: 1.2, damage: 20 },
  vortex: { name: 'Maelstrom Prison', time: 1.25, damage: 23 },
  lightning: { name: 'Stormfang Lightning', time: 1.35, damage: 22 },
  tail: { name: 'Leviathan Tailbreaker', time: 1.0, damage: 21 },
  abyss: { name: 'Eclipse of the Abyss', time: 1.55, damage: 34 },
};
export const SPELLS = {
  bolt: { name: 'Magic', cost: 4, damage: 14, cast: .18, cooldown: .28 },
  charge: { name: 'Charged', cost: 16, damage: 43, cast: .66, cooldown: .85 },
  wave: { name: 'Tidal Arc', cost: 19, damage: 48, cast: .62, cooldown: 2.2 },
  crescent: { name: 'Moon Cut', cost: 25, damage: 62, cast: .72, cooldown: 3.4 },
  shield: { name: 'Shield', cost: 12, cooldown: 1.6 },
  dodge: { name: 'Dodge', cost: 0, cooldown: .72 },
  aerial: { name:'Aerial Slash', cost:25, damage:62, cast:.72, cooldown:3.4 },
  ultimate: { name: 'Ultimate', cost: 42, damage: 106, cast: .95, cooldown: 7 },
};
export const MELEE_TARGET = [806, 590];
export const SKILL_NAMES = {
  yhannie: {bolt:'Arcane Bolt',charge:'Burst Nova',wave:'Mystic Wave',crescent:'Aerial Magic Slash',shield:'Healing Light',dodge:'Arcane Dash',ultimate:'Celestial Tidebreaker'},
  loki: {bolt:'Crimson Slash',charge:'Crimson Dash',wave:'Arc Slash',crescent:'Ground Strike',aerial:'Aerial Slash',shield:'Perfect Parry',dodge:'Shadow Dash',ultimate:'Abyssbreaker: Final Horizon'}
};
const meleeReach = {bolt:150,charge:145,wave:180,crescent:160,aerial:160,ultimate:220};
export const HEALING_LIGHT_HP=15;
const meleeDash = {bolt:0,charge:850,wave:0,crescent:520,aerial:520,ultimate:650};
export function meleeDistance(s) {
  return Math.hypot(s.x-MELEE_TARGET[0],s.y-MELEE_TARGET[1]);
}
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const originalLayout = { deck: DECK, props: PROPS };

export function canStand(x, y, layout = originalLayout) {
  const { deck, props } = layout;
  // Convex, clockwise-in-screen-space deck. Inset from all rail and water edges.
  return deck.every(([ax, ay], i) => {
    const [bx, by] = deck[(i + 1) % deck.length];
    return (bx - ax) * (y - ay) - (by - ay) * (x - ax) >= 11 * Math.hypot(bx - ax, by - ay);
  }) && !props.some(([px, py, r]) => Math.hypot(x - px, (y - py) * 1.25) < r + 10);
}

export function newBattle(practice = false) {
  return {
    x: 437, y: 658, vx: 0, vy: 0, direction: 'right', moving: false,
    practice, hp: PLAYER.hp, mp: PLAYER.mp, bossHp: BOSS_HP, phase: 0, age: 0, state: 'emerge',
    timer: 1.45, clock: 0, pattern: 0, hazard: null, cast: null, cooldown: {},
    evade: 0, guard: 0, hurt: 0, stagger: 0, shake: 0, hitStop: 0, dodge: null, shot: null, combo: 0, comboWindow: 0,
    victoryTime: 0, victoryBeat: 0,
  };
}

export function useSpell(s, kind, input, emit) {
  const spell = SPELLS[kind];
  if (!spell || (kind==='aerial'&&s.hero!=='loki') || !['idle', 'tell', 'impact', 'recover'].includes(s.state) ||
      s.cooldown[kind] > 0 || s.mp < spell.cost || s.dodge ||
      (s.cast && kind !== 'dodge' && kind !== 'shield') || (spell.damage && s.shot) || (s.hurt > .18 && kind !== 'dodge')) return false;
  s.mp -= spell.cost;
  s.cooldown[kind] = spell.cooldown;
  if (kind === 'dodge') {
    const dx = input.x || 0, dy = input.y || 0, n = Math.hypot(dx, dy);
    s.cast = null;
    s.dodge = { x: n ? dx / n : s.direction === 'left' ? -1 : 1, y: n ? dy / n : 0, time: .29 };
    s.hurt = 0;
    s.evade = .4;
  } else if (kind === 'shield') {
    s.guard = .85;
    s.guardStarted = s.age;
    if(s.hero==='yhannie'){
      s.hp=Math.min(PLAYER.hp,s.hp+HEALING_LIGHT_HP);
      s.healStarted=s.age;
      emit('heal');
    }
  } else {
    if(kind==='bolt') {
      const count=3;
      s.combo=s.comboWindow>0?(s.combo%count)+1:1;
      s.comboWindow=s.hero==='loki'?1.05:.68;
    }
    const duration=kind==='ultimate'&&s.hero==='yhannie' ? .85 : spell.cast;
    s.cast = { kind, time: duration, total: duration, combo:kind==='bolt'?s.combo:0 };
  }
  emit(kind);
  return true;
}

export function cuePracticeAttack(s, kind, emit) {
  if(!s.practice||!Object.hasOwn(tells,kind)||['won','lost','victory','sinking'].includes(s.state))return false;
  beginAttack(s,emit,kind);
  return true;
}

function beginAttack(s, emit, practiceKind) {
  const pattern = sequence[s.phase];
  const kind = practiceKind||pattern[s.pattern++ % pattern.length], tell = tells[kind];
  const length = tell.time * (1 - .1 * s.phase) + (s.story && s.pattern === 1 && s.phase === 0 ? .65 : 0);
  const shape = kind === 'wave' ? { type: 'stripe', origin: s.x, y: s.y, half: 54 + s.phase * 9 }
    : kind === 'tail' ? { type: 'sweep', x: s.x, half: 78 }
    : kind === 'lightning' ? {type:'lightning',x:s.x,y:s.y,r:76}
    : { type: 'circle', x: s.x, y: s.y, r: kind === 'abyss' ? 155 : kind === 'vortex' ? 111 : 77 };
  s.hazard = { ...tell, ...shape, kind, length };
  s.state = 'tell';
  s.timer = length;
  emit('tell', kind);
}

export function hazardContains(h, x, y) {
  if (h.type === 'stripe') return Math.abs(y - h.y - .32 * (x - h.origin)) <= h.half;
  if (h.type === 'sweep') return Math.abs(x - h.x) <= h.half;
  return Math.hypot(x - h.x, (y - h.y) * 1.3) <= h.r;
}

function hitPlayer(s, emit) {
  if (s.evade > 0 || !hazardContains(s.hazard, s.x, s.y)) return;
  if(s.hero==='loki'&&s.guard>0&&s.age-s.guardStarted<=.18){
    s.guard=0;
    s.guardImpact=s.age;
    s.stagger=Math.max(s.stagger,.18);
    s.hitStop=.045;
    emit('parry',s.hazard.kind);
    return;
  }
  if(s.guard>0){s.guardImpact=s.age;emit('barrierHit',s.hazard.kind);}
  s.hp = Math.max(s.practice ? 1 : 0, s.hp - Math.ceil(s.hazard.damage * (s.guard > 0 ? .22 : 1)));
  s.shake = .35;
  s.hitStop = .045;
  s.hurt = s.hazard.kind==='lightning'?.52:.36;
  s.cast = null;
  const away = s.x < (s.hazard.x ?? 540) ? -1 : 1;
  s.vx = away * 265;
  s.vy = 100;
  emit('hurt');
  if (!s.hp) {
    s.state = 'lost';
    emit('lost');
  }
}

function damageBoss(s, kind, emit, combo=s.shot?.combo||0) {
  const multiplier=combo===4?1.8:combo===3?1.65:combo===2?1.18:1;
  const damage=Math.round(SPELLS[kind].damage*multiplier);
  s.bossHp = Math.max(0, s.bossHp - damage);
  s.stagger = kind === 'ultimate' ? .42 : .23;
  s.shake = kind === 'ultimate' ? .55 : .12;
  s.hitStop = kind==='ultimate'?.105:.055;
  emit('hit', kind, damage, combo);
  if (!s.bossHp) {
    // Hold the boss on screen for Yhannie's final cinematic before the result
    // panel freezes the fight. Keep this in the existing battle state machine.
    s.state = 'victory';
    s.timer = 5.65;
    s.victoryTime = 0;
    s.victoryBeat = 0;
    s.stagger = .62;
    s.hazard = null;
    s.cast = null;
    s.dodge = null;
    emit('victoryStart');
    return;
  }
  const phase = s.bossHp <= BOSS_HP * .3 ? 2 : s.bossHp <= BOSS_HP * .65 ? 1 : 0;
  if (phase > s.phase) {
    s.phase = phase;
    s.state = 'enrage';
    s.hazard = null;
    s.pattern = 0;
    s.timer = 1.35;
    emit('enrage');
  }
}

export function stepBattle(s, dt, input, emit = () => {}) {
  s.age += dt;
  for (const field of ['evade', 'guard', 'hurt', 'stagger', 'shake']) s[field] = Math.max(0, s[field] - dt);
  for (const kind of Object.keys(s.cooldown)) s.cooldown[kind] = Math.max(0, s.cooldown[kind] - dt);
  if (s.state === 'won' || s.state === 'lost') return;
  if(s.hitStop>0){s.hitStop=Math.max(0,s.hitStop-dt);return}
  s.comboWindow=Math.max(0,s.comboWindow-dt);
  if (s.state === 'victory') {
    s.victoryTime += dt;
    s.timer -= dt;
    // Play Yhannie's charged-spell poses, then let the new cinematic VFX carry
    // the release. This avoids spending a second MP cost or dealing more damage.
    if (s.victoryTime < 1.58) s.cast = { kind: 'ultimate', time: Math.max(.001, 1.58 - s.victoryTime), total: 1.58 };
    else s.cast = null;
    if (s.victoryBeat < 1 && s.victoryTime >= 1.58) {
      s.victoryBeat = 1;
      s.stagger = .85; s.shake = .62; s.hitStop = .09;
      emit('victoryStrike');
    }
    if (s.victoryBeat < 2 && s.victoryTime >= 3.2) {
      s.victoryBeat = 2;
      emit('bossFallen');
    }
    if (s.timer <= 0) { s.state = 'won'; s.cast = null; emit('won'); }
    return;
  }
  s.timer -= dt;
  if (s.state === 'sinking') {
    if (s.timer <= 0) {
      s.state = 'won';
      emit('won');
    }
    return;
  }
  if (s.timer <= 0) {
    switch (s.state) {
      case 'emerge':
      case 'enrage':
        s.state = 'idle';
        s.timer = .65;
        emit('roar');
        break;
      case 'idle':
      case 'recover':
        beginAttack(s, emit);
        s.hazard.origin = s.x;
        break;
      case 'tell':
        s.state = 'impact';
        s.timer = .43;
        s.shake = s.hazard.kind === 'abyss' ? .52 : s.hazard.kind==='wave'?.38 : s.hazard.kind==='lightning'?.34 : .22;
        emit('impact', s.hazard.kind);
        hitPlayer(s, emit);
        break;
      case 'impact':
        s.state = 'recover';
        s.hazard = null;
        s.timer = .91 - .16 * s.phase;
        break;
    }
  }
  if (s.state === 'emerge' || s.state === 'lost') return;
  s.mp = Math.min(PLAYER.mp, s.mp + dt * 10);
  const d = Math.hypot(input.x, input.y);
  const speed = d > .9 ? 260 : 180;
  const slow = s.cast ? .33 : 1;
  const vx = d ? input.x / Math.max(1, d) * speed * slow : 0;
  const vy = d ? input.y / Math.max(1, d) * speed * slow : 0;
  if (s.dodge) {
    s.vx = s.dodge.x * 540;
    s.vy = s.dodge.y * 440;
    s.dodge.time -= dt;
    if (s.dodge.time <= 0) s.dodge = null;
  } else {
    const ease = Math.min(1, dt * (s.hurt > .18 ? 4 : 17));
    s.vx += (vx - s.vx) * ease;
    s.vy += (vy - s.vy) * ease;
  }
  if(s.hero==='loki'&&s.cast){
    const {kind,time,total}=s.cast;
    const progress=1-time/total,distance=meleeDistance(s);
    if(progress>.17&&distance>meleeReach[kind]*.63&&meleeDash[kind]){
      const speed=Math.min(meleeDash[kind],distance/dt);
      s.vx=(MELEE_TARGET[0]-s.x)/distance*speed;
      s.vy=(MELEE_TARGET[1]-s.y)/distance*speed;
    }
  }
  if(s.hazard?.kind==='vortex'&&['tell','impact'].includes(s.state)&&s.evade<=0){
    const dx=s.hazard.x-s.x,dy=s.hazard.y-s.y,dist=Math.hypot(dx,dy);
    if(dist>24&&dist<s.hazard.r*1.8){const force=150*(1-s.phase*.08);s.vx+=dx/dist*force;s.vy+=dy/dist*force;}
  }
  const nx = s.x + dt * s.vx, ny = s.y + dt * s.vy;
  if (canStand(nx, s.y, s.layout)) s.x = nx;
  if (canStand(s.x, ny, s.layout)) s.y = ny;
  s.moving = Math.hypot(s.vx, s.vy) > 30;
  if (d > .1 && !s.cast) s.direction = Math.abs(input.x) >= Math.abs(input.y)
    ? input.x < 0 ? 'left' : 'right' : input.y < 0 ? 'up' : 'down';
  if (s.cast && (s.cast.time -= dt) <= 0) {
    const {kind,combo}=s.cast;
    s.cast=null;
    emit('launch',kind,combo);
    if(s.hero==='loki'&&kind!=='wave'){
      s.bladeRelease={kind,combo,age:s.age};
      if(meleeDistance(s)<=meleeReach[kind])damageBoss(s,kind,emit,combo);
      else{if(kind==='bolt')s.comboWindow=0;emit('whiff',kind);}
    }else {
      if(s.hero==='loki')s.bladeRelease={kind,combo,age:s.age};
      s.shot={kind,combo,x:s.x+24,y:s.y-62,t:0};
    }
  }
  if (s.shot && (s.shot.t += dt / (s.shot.kind==='ultimate'&&s.hero? .57 : s.shot.combo===2?.29:.34)) >= 1) {
    damageBoss(s, s.shot.kind, emit);
    s.shot = null;
  }
}
