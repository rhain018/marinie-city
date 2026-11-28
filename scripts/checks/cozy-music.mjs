import {readFileSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const s=readFileSync('game/index.html','utf8'),part=(a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const code="let ROOM=null,todI=0,talking=false,LIGHTS_OUT=0;const P={x:1000,y:600},LH={x:100,y:200};const log=[];const AC={currentTime:0,createBufferSource:audioNode,createGain:audioNode,createBiquadFilter:audioNode};function audioNode(){return {connect(){return this},start(){},stop(){},frequency:{},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}}}const WHITE={},musBus={};function communityAmbience(){}function updateCityMapMusic(){return false;}const musFilt={frequency:{setTargetAtTime(){}}},musDuck={gain:{setTargetAtTime(v){globalThis.duck=v}}};function out(){};"+['bassN','strings','harp','flute','glock','horn'].map(k=>`function ${k}(...v){log.push(['${k}',...v])}`).join(';')+';'+part('const EIGHTH=','function strings(')+"function softPiano(...v){log.push(['piano',...v])}"+part('const harborTheme=','const communitySources=')+part('function sched(){','/* --- seagull calls --- */')+"globalThis.api={COZY_MELODIES,COZY_SCORES,COZY_EVENTS,log,P,AC,sched,setPhase:v=>todI=v,talk:v=>talking=v,mood:()=>cozyMood,pulse:()=>step,time:()=>nextTime,reset:()=>{step=0;nextTime=AC.currentTime+.01}}";
const c={cardBattle:{open:false},tideborn:{open:false}};vm.runInNewContext(code,c);const a=c.api;
for(const k of Object.keys(a.COZY_SCORES)){assert.equal(a.COZY_EVENTS[k].length,96);assert.equal(a.COZY_MELODIES[k].length,16);for(const bar of a.COZY_MELODIES[k])assert.equal(bar.reduce((n,v)=>n+v[1],0),6);assert.ok(a.COZY_EVENTS[k].filter(e=>e.mel).length>=24)}
for(const [phase,mood]of [[0,'day'],[1,'dusk'],[2,'night']]){a.setPhase(phase);a.reset();const begin=a.log.length;for(let i=0;i<2600;i++){a.sched();a.AC.currentTime+=.025}assert.ok(a.log.slice(begin).some(v=>v[0]==='flute'));assert.ok(a.pulse()>96,'loop has no scheduled gap')}
a.talk(true);a.sched();assert.equal(c.duck,.3);a.talk(false);a.sched();assert.equal(c.duck,1);
a.AC.currentTime+=3600;const prior=a.log.length;a.sched();assert.ok(a.log.length-prior<25,'delayed timer must not burst');

for(const dialog of [c.cardBattle,c.tideborn]){
  a.reset();
  a.sched();
  const beforeBattle=a.log.length, nextPulse=a.pulse();
  dialog.open=true;
  for(let i=0;i<80;i++){a.AC.currentTime+=.025;a.sched()}
  assert.equal(c.duck,0,'already playing music fades out during combat');
  assert.equal(a.log.length,beforeBattle,'combat does not schedule new harbor notes');
  assert.equal(a.pulse(),nextPulse);
  dialog.open=false;
  a.sched();
  assert.equal(c.duck,1,'harbor music fades back in when combat closes');
  a.AC.currentTime+=.1;
  a.sched();
  assert.ok(a.pulse()>nextPulse,'harbor music resumes without waiting for missed notes');
  assert.ok(a.log.length-beforeBattle<25,'returning from combat must not burst');
}

console.log('PASS: harbor loops, dialogue ducking, combat music isolation, and clean resume after combat');
