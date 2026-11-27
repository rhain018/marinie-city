import {readFileSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const s=readFileSync('game/index.html','utf8'),part=(a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const c={};vm.runInNewContext("let FLAGS={},GFX={weather:'auto'},todI=0;"+part('function elapsedDays(','function calendarLabel(')+part('function ensureWeatherSeed(','function drawClassicWeather(')+"globalThis.a={weatherForPeriod,effectiveWeather,flags:FLAGS,gfx:GFX,phase:p=>todI=p};",c);const a=c.a;
assert.equal(a.effectiveWeather(),'clear');a.flags.frag=true;a.flags.weatherSeed=123456;
const seen=new Set();for(let d=0;d<30;d++)for(let phase=0;phase<3;phase++){const w=a.weatherForPeriod(123456,d,phase);seen.add(w);assert.equal(w,a.weatherForPeriod(123456,d,phase));}
assert.equal(seen.size,3);a.flags.days=9;a.phase(2);const before=a.effectiveWeather();assert.equal(a.effectiveWeather(),before);assert.equal(a.flags.weatherSeed,123456);
a.gfx.weather='rain';assert.equal(a.effectiveWeather(),'rain');a.gfx.weather='fog';assert.equal(a.effectiveWeather(),'fog');a.gfx.weather='auto';delete a.flags.weatherSeed;a.effectiveWeather();const seed=a.flags.weatherSeed;assert.ok(Number.isSafeInteger(seed));a.effectiveWeather();assert.equal(a.flags.weatherSeed,seed);
console.log('PASS: Scene 3 gating, three weather types, stable per-save/per-period weather, legacy seed initialization and manual override');

const umbrellas={};
vm.runInNewContext([
  "let todI=0; const ink=[]; function px(...args){ink.push(args)}",
  part('const NIGHT_DUTY=','function npcAt('),
  part('const RAIN_UMBRELLAS=','function drawNPC('),
  'globalThis.a={npcUmbrella,drawUmbrella,ink,phase:p=>todI=p};'
].join('\n'),umbrellas);
const u=umbrellas.a;
for(const phase of [0,1,2]){
  a.phase(phase);
  u.phase(phase);
  for(const weather of ['clear','fog','rain']){
    a.gfx.weather=weather;
    const raining=a.effectiveWeather()==='rain';
    assert.equal(Boolean(u.npcUmbrella({id:'oldsalt'},raining)),raining);
    assert.equal(Boolean(u.npcUmbrella({id:'kyle'},raining)),raining&&phase!==2);
    assert.ok(!u.npcUmbrella({id:'bert'},raining));
  }
}
u.drawUmbrella({x:50,y:90,dir:'left'},50,u.npcUmbrella({id:'oldsalt'},true));
assert.ok(u.ink.some(([, ,w])=>w===36),'Canopy missing');
assert.ok(u.ink.every(([x,y,w,h])=>[x,y,w,h].every(Number.isFinite)&&w>0&&h>0));
assert.ok(s.includes('else drawNPC(e.n,npcUmbrella(e.n,raining))'),'Umbrellas must render in the outdoor depth pass');
console.log('PASS: outdoor umbrellas on rainy day, sunset and night, with normal NPC schedules');
