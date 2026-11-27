import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { BOSS_HP, DECK, PROPS, SPELLS, canStand, newBattle, stepBattle, useSpell, hazardContains } from '../../public/assets/bakunawa/combat.mjs';

import { PORT_LAYOUT } from '../../public/assets/bakunawa/port/layout.mjs';

const neutral = {x:0,y:0}, dt=1/120;
const step = (s, seconds, input=neutral, emit) => {
  for(let i=0;i<Math.ceil(seconds/dt);i++) stepBattle(s,dt,input,emit);
};
const events=[];
const emit=(...args)=>events.push(args);
const battle=newBattle();
assert.ok(canStand(battle.x,battle.y));
assert.ok(!useSpell(battle,'bolt',neutral,emit),'Intro must lock attacks');
step(battle,1.6,neutral,emit);
assert.equal(battle.state,'idle');
for(const [x,y] of DECK)assert.equal(canStand(x,y),false,'deck edge');
for(const [x,y] of PROPS)assert.equal(canStand(x,y),false,'obstacle');
for(const [x,y] of [[1000,200],[1150,632],[1200,810],[-10,620],[740,844]])assert.equal(canStand(x,y),false,'outside the dock');
for(const input of [{x:1,y:0},{x:-1,y:0},{x:0,y:-1},{x:0,y:1},{x:1,y:-1},{x:-1,y:-1},{x:1,y:1},{x:-1,y:1}]){
  const test=newBattle();
  test.state='idle';test.timer=999;
  for(let i=0;i<750;i++){
    if(i%103===0)useSpell(test,'dodge',input,emit);
    stepBattle(test,dt,input,emit);
    assert.ok(canStand(test.x,test.y),'movement or dodge entered a solid or water cell');
  }
}
assert.ok(hazardContains({type:'stripe',origin:437,y:640,half:54},700,724));
assert.ok(!hazardContains({type:'stripe',origin:437,y:640,half:54},700,640));
const vortexPull=newBattle();vortexPull.state='tell';vortexPull.timer=.5;
vortexPull.hazard={kind:'vortex',type:'circle',x:vortexPull.x+100,y:vortexPull.y,r:111,damage:23,length:1};
const pullStart=vortexPull.x;stepBattle(vortexPull,dt,neutral,emit);
assert.ok(vortexPull.x>pullStart,'maelstrom should pull toward its center while active');
const lightningHit=newBattle();lightningHit.state='tell';lightningHit.timer=dt;
lightningHit.hazard={kind:'lightning',type:'lightning',x:lightningHit.x,y:lightningHit.y,r:76,damage:22,length:1};
stepBattle(lightningHit,dt,neutral,emit);
assert.equal(lightningHit.hp,78,'Stormfang target impact damage');
assert.equal(lightningHit.hurt,.52,'Stormfang stun reaction');

function firstAttack(){
  const b=newBattle();
  step(b,2.15,neutral,emit);
  assert.equal(b.state,'tell');
  return b;
}
const unguarded=firstAttack();
step(unguarded,1.1,neutral,emit);
assert.equal(unguarded.hp,85);
const guarded=firstAttack();
step(guarded,.32,neutral,emit);
assert.ok(useSpell(guarded,'shield',neutral,emit));
step(guarded,.76,neutral,emit);
assert.equal(guarded.hp,96);
const evasive=firstAttack();
step(evasive,.7,neutral,emit);
assert.ok(useSpell(evasive,'dodge',{x:1,y:0},emit));
step(evasive,.46,neutral,emit);
assert.equal(evasive.hp,100);
const insufficient=firstAttack();
insufficient.mp=1;
assert.equal(useSpell(insufficient,'charge',neutral,emit),false);
assert.equal(insufficient.mp,1);
const casts=firstAttack();
assert.ok(useSpell(casts,'charge',neutral,emit));
assert.equal(casts.mp,100-SPELLS.charge.cost);
assert.equal(useSpell(casts,'charge',neutral,emit),false);
casts.evade=99;
step(casts,1.05,neutral,emit);
assert.equal(casts.bossHp,BOSS_HP-SPELLS.charge.damage);

const phases=new Set(), fight=newBattle(), attacks=new Set();
step(fight,2.45);
for(let i=0;i<14500&&fight.state!=='won';i++){
  if(i%18===0)for(const kind of ['ultimate','charge','bolt'])if(useSpell(fight,kind,neutral,emit))break;
  if(fight.state==='tell' && fight.timer<.18)useSpell(fight,'dodge',{x:fight.x>540?-1:1,y:0},emit);
  if(fight.state==='tell')attacks.add(fight.hazard.kind);
  // Shield failure, damage and defeat have separate tests. This run isolates phase and win progression.
  fight.evade=99;
  phases.add(fight.phase);
  stepBattle(fight,dt,neutral,emit);
}
assert.deepEqual([...phases],[0,1,2]);
assert.equal(fight.state,'won');
assert.equal(fight.bossHp,0);
assert.ok(attacks.size>=3);
const phaseThree=newBattle();phaseThree.state='idle';phaseThree.timer=.01;phaseThree.phase=2;phaseThree.bossHp=BOSS_HP*.29;
const phaseThreeAttacks=new Set();
for(let i=0;i<3000;i++){
  if(phaseThree.state==='tell')phaseThreeAttacks.add(phaseThree.hazard.kind);
  phaseThree.evade=99;
  stepBattle(phaseThree,dt,neutral,emit);
}
for(const kind of ['vortex','tail','abyss','wave','lightning'])assert.ok(phaseThreeAttacks.has(kind),'phase three never selected '+kind);
const loss=firstAttack();
loss.hp=1;
step(loss,1.1,neutral,emit);
assert.equal(loss.state,'lost');
assert.equal(newBattle().bossHp,BOSS_HP,'restart state leaked');

const html=readFileSync('game/index.html','utf8');
assert.match(html,/id="playTideborn">Bakunawa: Tideborn/);
assert.match(html,/import\('\/assets\/bakunawa\/battle\.mjs(?:\?[^']*)?'\)/);
const prepared = JSON.parse(readFileSync('game/html.ts','utf8').trim().slice('export default '.length,-1));
const battleCss = readFileSync('public/assets/bakunawa/battle.css','utf8');
assert.ok(statSync('public/assets/bakunawa/reference-hud.jpeg').size>100_000,'missing supplied HUD artwork');
assert.doesNotMatch(battleCss,/reference-hud\.jpeg/);
assert.match(battleCss,/loki-orbs\.webp/);
assert.match(battleCss,/yhannie-orbs\.webp/);
assert.match(html,/aria-label="Ultimate readiness"/);
for (const [x,y] of [...PORT_LAYOUT.deck, ...PORT_LAYOUT.props, [740,500],[1000,856]]) {
  assert.ok(!canStand(x,y,PORT_LAYOUT), 'stone pier boundary must match the artwork');
}
for (const [x,y] of [[437,658],[1150,632],[806,590]]) {
  assert.ok(canStand(x,y,PORT_LAYOUT), 'stone pier spawn and attack positions must be traversable');
}
for(const kind of ['charge','wave','crescent','shield','dodge','ultimate','bolt'])
  assert.match(html,new RegExp('data-spell="'+kind+'"'),'reference control missing: '+kind);
assert.ok(prepared.includes('<style id="tideborn-css">\n'+battleCss+'</style>'),
  'Hosted HTML must bundle the matching battle HUD styles');
assert.doesNotMatch(prepared,/<link[^>]+href="\/assets\/bakunawa\/battle\.css"/);
const manifest=JSON.parse(readFileSync('public/assets/bakunawa/OBJECT_MANIFEST.json'));
for(const row of manifest.objects)if(row.asset)assert.ok(statSync('public/assets/bakunawa/'+row.asset).size>0);
for(const module of ['battle','combat','render']){
  const source=readFileSync('public/assets/bakunawa/'+module+'.mjs','utf8');
  assert.doesNotMatch(source,/localStorage|sessionStorage|saveGame|FLAGS|\/api\/account/);
}
const skillManifest=JSON.parse(readFileSync('public/assets/bakunawa/skill-reference/ANIMATION_MANIFEST.json','utf8'));
assert.deepEqual(skillManifest.animations.map(a=>a.id),['abyssal_roar','tidal_cataclysm','maelstrom_prison','stormfang_lightning']);
for(const anim of skillManifest.animations){
  assert.equal(anim.frames.length,8,anim.id+' must expose all eight reference stages');
  assert.equal(anim.frameSize[0],anim.frameSize[1],anim.id+' frames must stay square');
  assert.ok(statSync('public/assets/bakunawa/skill-reference/'+anim.file).size>100_000,'missing extracted animation: '+anim.file);
  anim.frames.forEach((f,i)=>assert.deepEqual(f.atlasRect,[i*anim.frameSize[0],0,...anim.frameSize]));
}
const battleModule=readFileSync('public/assets/bakunawa/battle.mjs','utf8');
const renderModule=readFileSync('public/assets/bakunawa/render.mjs','utf8');
for(const file of ['abyssal_roar.webp','tidal_cataclysm.webp','maelstrom_prison.webp','stormfang_lightning.webp'])assert.ok(battleModule.includes(file),'battle art loader missing '+file);
for(const id of ['roar','tidal','maelstrom','stormfang'])assert.ok(renderModule.includes(id),'render attack mapping missing '+id);
assert.match(renderModule,/globalCompositeOperation='screen'/,'extracted skill artwork must be composited over the scene');
assert.match(readFileSync('public/assets/bakunawa/skill-reference/REFERENCE_SKILL_ANALYSIS.md','utf8'),/soft navy matte/i);
console.log('PASS: deck and prop collision, dodge, shield, spell costs and damage, phase thresholds, win/loss, reset, art inventory, and isolated game integration');
