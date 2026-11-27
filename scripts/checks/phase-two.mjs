import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newBattle, useSpell, stepBattle, cuePracticeAttack, canStand } from '../../public/assets/bakunawa/combat.mjs';
import { createCinematic } from '../../public/assets/bakunawa/cinematic.mjs';
import { PORT_LAYOUT } from '../../public/assets/bakunawa/port/layout.mjs';
import { createFieldEffects, cueFieldEffects, fieldPose, validateFieldAtlas } from '../../public/assets/bakunawa/animation/field-effects.mjs';

const meta = JSON.parse(readFileSync(new URL('../../public/assets/bakunawa/animation/field-skills.json', import.meta.url)));
const dt = 1 / 120;
const neutral = { x: 0, y: 0 };
assert.ok(validateFieldAtlas({ naturalWidth: 960, naturalHeight: 640 }, meta));
assert.ok(!validateFieldAtlas({ naturalWidth: 960, naturalHeight: 560 }, meta));

function fixture(hero) {
  const state = Object.assign(newBattle(true), {
    hero, layout: PORT_LAYOUT, state: 'idle', timer: 100, visual: createCinematic(),
    fieldEffects: createFieldEffects({ meta }, hero),
  });
  const events = [];
  const emit = (event, kind) => {
    events.push({ event, kind, age: state.age });
    cueFieldEffects(state, event, kind);
  };
  const advance = (seconds, input = neutral) => {
    for (let i = 0; i < Math.round(seconds / dt); i++) stepBattle(state, dt, input, emit);
    assert.ok(canStand(state.x, state.y, PORT_LAYOUT));
  };
  return { state, events, emit, advance };
}

for (const hero of ['loki', 'yhannie']) {
  const { state, events, emit, advance } = fixture(hero);
  assert.ok(useSpell(state, 'charge', neutral, emit));
  assert.equal(state.mp, 84);
  assert.ok(state.fieldEffects.liveCast);
  assert.equal(fieldPose(state, -1), state.fieldEffects.hero.poseCells.anticipation);
  advance(.5);
  assert.equal(state.bossHp, 480);
  advance(.59);
  assert.equal(state.bossHp, 437);
  const hit = events.filter(e => e.event === 'hit' && e.kind === 'charge');
  const launch = events.find(e => e.event === 'launch' && e.kind === 'charge');
  assert.equal(hit.length, 1);
  assert.equal(state.fieldEffects.hitAt, hit[0].age);
  assert.equal(state.fieldEffects.launchAt, launch.age);
  assert.ok(hero === 'loki' ? launch.age === hit[0].age : hit[0].age - launch.age > .31);
  advance(1);
  assert.equal(state.bossHp, 437);

  const cancel = fixture(hero);
  assert.ok(useSpell(cancel.state, 'charge', neutral, cancel.emit));
  cancel.advance(.15);
  assert.ok(useSpell(cancel.state, 'dodge', neutral, cancel.emit));
  cancel.advance(1.2);
  assert.equal(cancel.state.bossHp, 480);
  assert.equal(cancel.state.fieldEffects.liveCast, false);
  assert.ok(!cancel.events.some(e => e.event === 'launch' && e.kind === 'charge'));

  const motion = fixture(hero);
  for (const [x, y] of [[0,-1],[1,0],[0,1],[-1,0]]) {
    motion.advance(2, {x,y});
    assert.ok(canStand(motion.state.x, motion.state.y, PORT_LAYOUT));
  }
  console.log(hero + ': 43 damage exactly once, launch/impact markers matched, dodge cancel and pier collision passed');
}

const boss = fixture('yhannie');
assert.ok(cuePracticeAttack(boss.state, 'lightning', boss.emit));
const mark = { x: boss.state.hazard.x, y: boss.state.hazard.y };
boss.advance(boss.state.timer - .05);
assert.equal(boss.state.hp, 100);
assert.equal(boss.state.fieldEffects.bossAt, -Infinity);
boss.advance(.10);
assert.equal(boss.state.hp, 78);
const impact = boss.events.filter(e => e.event === 'impact' && e.kind === 'lightning');
assert.equal(impact.length, 1);
assert.equal(boss.state.fieldEffects.bossAt, impact[0].age);
assert.deepEqual({x: boss.state.fieldEffects.targetX, y: boss.state.fieldEffects.targetY}, mark);
console.log('Bakunawa: Stormfang VFX started at the existing damage event and telegraph coordinates');
