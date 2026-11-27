import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const dir=new URL('../../public/assets/bakunawa/',import.meta.url);
const {newBattle,stepBattle,useSpell,canStand,cuePracticeAttack,MELEE_TARGET}=await import(new URL('combat.mjs',dir));
const zero={x:0,y:0}, dt=1/120;
function setup(hero){const s=newBattle(true);Object.assign(s,{hero,state:'idle',timer:999});return s}
function tick(s,n,emit=()=>{}){for(let i=0;i<Math.round(n/dt);i++){stepBattle(s,dt,zero,emit);assert.ok(canStand(s.x,s.y));}}
for(const hero of ['loki','yhannie']){
 const s=setup(hero);if(hero==='loki')Object.assign(s,{x:MELEE_TARGET[0]-90,y:MELEE_TARGET[1]});
 const hits=[],record=(event,kind,d,combo)=>{if(event==='hit')hits.push([kind,d,combo]);};
 for(let i=0;i<360&&hits.length<3;i++){
   useSpell(s,'bolt',zero,record);tick(s,dt,record);
 }
 assert.deepEqual(hits.map(h=>h[2]),[1,2,3]);
 for(const kind of ['charge','wave','crescent','ultimate',...(hero==='loki'?['aerial']:[])]){
   const state=setup(hero);
   if(hero==='loki'&&kind!=='charge')Object.assign(state,{x:MELEE_TARGET[0]-165,y:MELEE_TARGET[1]});
   const start=state.x,events=[];assert.ok(useSpell(state,kind,zero,()=>{}));
   const beforeHit=kind==='ultimate'?.8:.05;
   tick(state,beforeHit,(...event)=>events.push(event));
   assert.equal(events.filter(e=>e[0]==='hit').length,0);
   tick(state,kind==='ultimate'?2:1.3,(...event)=>events.push(event));
   assert.equal(events.filter(e=>e[0]==='hit'&&e[1]===kind).length,1,hero+' '+kind+' hits');
   assert.equal(state.cast,null);assert.equal(state.shot,null);
   if(hero==='loki'&&kind==='charge')assert.ok(state.x>start+150);
 }
 const cancel=setup(hero);assert.ok(useSpell(cancel,'ultimate',zero,()=>{}));assert.ok(useSpell(cancel,'dodge',zero,()=>{}));tick(cancel,.5);assert.equal(cancel.cast,null);assert.equal(cancel.bossHp,480);
 const win=setup(hero);win.bossHp=1;
 if(hero==='loki')Object.assign(win,{x:MELEE_TARGET[0]-90,y:MELEE_TARGET[1]});
 assert.ok(useSpell(win,'bolt',zero,()=>{}));tick(win,7);assert.equal(win.state,'won');
 for(const kind of ['burst','wave','vortex','lightning']){
  const state=setup(hero);let parry=0,impact=0;
  const emit=e=>{if(e==='parry')parry++;if(e==='impact')impact++;};
  assert.ok(cuePracticeAttack(state,kind,emit));tick(state,state.timer-.075,emit);
  useSpell(state,'shield',zero,emit);tick(state,.12,emit);assert.equal(impact,1);
  if(hero==='loki'){assert.equal(parry,1);assert.equal(state.hp,100);}
  else assert.ok(state.hp<100&&state.hp>90);
 }
 console.log(hero+' combo, skills, boundaries, cancellation, boss cues, defense and victory passed');
}
const miss=setup('loki');useSpell(miss,'bolt',zero,()=>{});tick(miss,1);assert.equal(miss.bossHp,480);
globalThis.Path2D=class{moveTo(){} lineTo(){} closePath(){} rect(){} addPath(){} bezierCurveTo(){}};
const {render}=await import(new URL('render.mjs',dir));
const {cinematicRate,createCinematic,ultimateBeat}=await import(new URL('cinematic.mjs',dir));
const ctx=new Proxy({}, {get(obj,k){return obj[k]??(()=>({addColorStop(){}}));}});
const art={dock:{naturalWidth:0},dragon:{naturalWidth:0},poses:{naturalWidth:0},crest:{naturalWidth:0},contact:{naturalWidth:512},skills:{}};
for(const hero of ['loki','yhannie']){
 const s=setup(hero);let frames=0;
 for(const skill of ['bolt','charge','wave','crescent','ultimate','shield','dodge',...(hero==='loki'?['aerial']:[])]){
  const a=setup(hero);a.x=730;a.y=590;useSpell(a,skill,zero,()=>{});
  for(let i=0;i<430;i++){stepBattle(a,dt,zero,(e,k,d,c)=>{if(e==='hit')a.skillImpact={kind:k,combo:c,age:a.age};});
   if(i%11===0){render(ctx,{width:844,height:475},art,a,i%3,()=>{});frames++;}
  }
 }
 console.log(hero,frames,'renderer smoke frames');
}

for (const hero of ['loki', 'yhannie']) {
  const state = setup(hero);
  state.visual = createCinematic();
  state.x = MELEE_TARGET[0] - 120;
  state.y = MELEE_TARGET[1];
  const visualBeats = new Set();
  let slowedFrames = 0;
  let hits = 0;
  let releaseTime = null, hitTime = null;
  useSpell(state, 'ultimate', zero, () => {});
  for (let frame = 0; frame < 700; frame++) {
    const beat = ultimateBeat(state);
    if (beat) visualBeats.add(beat.phase);
    const rate = cinematicRate(state);
    if (rate < 1) slowedFrames++;
    stepBattle(state, dt * rate, zero, (event, kind) => {
      if (event === 'launch' && kind === 'ultimate') releaseTime = (frame + 1) * dt;
      if (event === 'hit' && kind === 'ultimate') {
        hits++;
        hitTime = (frame + 1) * dt;
        state.skillImpact = {kind, age: state.age};
      }
    });
  }
  assert.deepEqual([...visualBeats], ['charge', ...(hero === 'yhannie' ? ['release'] : []), 'impact']);
  assert.ok(slowedFrames > 10);
  assert.equal(hits, 1, hero + ' Ultimate deals damage once during the cinematic');
  if (hero === 'yhannie') {
    assert.ok(releaseTime >= .84 && releaseTime < .90, 'Tidebreaker releases within .90 seconds');
    assert.ok(hitTime > releaseTime && hitTime < 1.55, 'Tidebreaker reaches the boss within 1.55 seconds');
  } else {
    assert.ok(releaseTime >= .94 && releaseTime < 1, 'Abyssbreaker releases within one second');
    assert.equal(hitTime, releaseTime, 'Abyssbreaker hits on the release event');
  }
  state.reduceMotion = true;
  state.cast = { kind: 'ultimate', time: .15, total: 1 };
  assert.equal(cinematicRate(state), 1);
}

const { createCombatSounds } = await import(new URL('effects/sound.mjs', dir));
const bankPath = new URL('effects/combat-sfx.wav', dir);
const bank = readFileSync(bankPath);
assert.equal(bank.toString('ascii', 0, 4), 'RIFF');
assert.equal(bank.length, 44 + 26 * 32000 * 2);
const audibleSlots = [];
const fallbacks = [];
globalThis.fetch = async url => {
  assert.equal(url.href, bankPath.href);
  return {ok: true, arrayBuffer: async () => bank.buffer};
};
const soundOutput = {
  gain: {value: 1},
  context: {
    currentTime: 6,
    decodeAudioData: async () => ({}),
    createBufferSource: () => ({
      connect: () => {}, disconnect: () => {}, stop: () => {},
      start: (time, slot, duration) => audibleSlots.push([time, slot, duration]),
    }),
  },
};
const sounds = createCombatSounds(soundOutput, (...args) => fallbacks.push(args));
sounds.play('cardSelect', 'Attack', 'yhannie');
assert.deepEqual(fallbacks[0], ['cardSelect', 'Attack']);
await new Promise(resolve => setImmediate(resolve));
for (const hero of ['yhannie', 'loki']) {
  sounds.play('cardSelect', 'Attack', hero);
  sounds.play('ultimate', undefined, hero);
  sounds.play('launch', 'ultimate', hero);
  sounds.play('hit', 'ultimate', hero);
}
assert.deepEqual(audibleSlots.map(([, slot]) => slot), [0, 14, 16, 18, 0, 15, 17, 19]);
assert.ok(audibleSlots.every(([time,,duration]) => time > 6 && duration === .96));
soundOutput.gain.value = 0;
sounds.play('cardSelect', 'Attack', 'loki');
assert.equal(audibleSlots.length, 8);
sounds.stop();
console.log('PASS: Ultimate timing, single hit, reduced motion, first-tap SFX, hero cue timing, and SFX mute');
