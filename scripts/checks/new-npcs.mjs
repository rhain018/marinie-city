import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src=readFileSync('game/index.html','utf8');
const part=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b,src.indexOf(a)));
const meta=JSON.parse(readFileSync('public/map-lab/new-npcs.json','utf8'));
const code=[src.match(/const GRID="[^"]+";/)[0],part('const GW=','const MAP_IMAGE='),src.match(/const MW=\d+,MH=\d+;/)[0],
 'let ROOM=null,mode="play",todI=0,AC=null,marker=null,talking=false;const P={x:1022,y:290,hero:"loki"};const PARTS=[];function sfx(){};function hint(){};function heroName(){return "Loki"}function questTalk(){return false}function heroPose(){}function heroFx(){}function speakerOf(n,w){return {name:w==="h"?"Loki":n.name}}function sayEnt(ent,opts,done){globalThis.dialogue={ent,opts,done}}',
 part('function walkable(','function onWood('),part('const NPC_DEF=','const DIRS4='),
 'const NPCS=NPC_DEF.map(d=>({...d,im:[{naturalWidth:20,naturalHeight:37}],t:1,moving:false,ri:0,path:null,pi:0,wait:1,talking:false,ci:0,fxT:0,bite:0,lookT:3,home:{x:d.x,y:d.y,dir:d.dir}}));',
 part('const ST=new Uint8Array(GW*GH);','let marker=null;'),part('const NIGHT_DUTY=','function npcAt('),part('function npcAt(','function faceToward('),part('function faceToward(','function cleanHeroName('),part('function talkTo(','function heroFx('),part('function repairNPCPosition(','function drawNPC('),
 'globalThis.api={P,npcAt,npcBlocks,npcAwake,NPCS,NPC_DEF,mapStand,findPathFrom,repairNPCPosition,startNPCAction,talkTo,updateNPCs,day:()=>todI=0,night:()=>todI=2};'].join('\n');
const ctx={DIRS4:['down'],NPC_H:{},NPC_SLIM:.84,NPC_DATA:{},atob:v=>Buffer.from(v,'base64').toString('binary')};vm.runInNewContext(code,ctx);
const a=ctx.api,newbies=a.NPCS.filter(n=>meta.some(m=>m.id===n.id));assert.equal(newbies.length,15);assert.equal(new Set(a.NPCS.map(n=>n.id)).size,a.NPCS.length);
for(const m of meta){const n=newbies.find(n=>n.id===m.id);assert.ok(n);assert.ok(a.mapStand(n.x,n.y));for(const dest of n.route||[])assert.ok(a.findPathFrom(n.x,n.y,...dest)?.length);for(const file of m.directionSprites)assert.ok(existsSync('public/'+file));assert.ok(existsSync('public/assets/npc-new/'+n.id+'-portrait.webp'));
 a.day();a.talkTo(n);assert.equal(ctx.dialogue.opts.length,2);ctx.dialogue.opts[0].f();ctx.dialogue.done();assert.ok(n.roleT>0);assert.equal(n.talking,false);assert.equal(n.roleAction,m.action);
 a.night();if(a.npcAwake(n)){a.talkTo(n);assert.equal(ctx.dialogue.opts.length,2,'night staff retain actions');ctx.dialogue.done()}
}
a.day();const bell=newbies.find(n=>n.id==='bell'),start=[bell.x,bell.y];for(const n of a.NPCS){n.talking=false;n.roleT=0}
let bellTravel=0;for(let i=0;i<7200;i++){a.updateNPCs(1/60);bellTravel=Math.max(bellTravel,Math.hypot(bell.x-start[0],bell.y-start[1]));for(const n of a.NPCS)assert.ok(a.mapStand(n.x,n.y),n.id+' crossed solid geometry')}
assert.ok(bellTravel>20,'delivery patrol must move');
const salt=a.NPCS.find(n=>n.id==='oldsalt');salt.x=970;salt.y=490;assert.ok(a.repairNPCPosition(salt));assert.ok(a.mapStand(salt.x,salt.y));
console.log('PASS: 15 unique NPCs, 75 assets, valid spawns/routes, repeated day/night actions and 120 seconds of collision-safe behavior for all 25 NPCs, plus invalid-position rescue');

a.night();a.updateNPCs(1/60);assert.equal(a.NPCS.filter(n=>a.npcAwake(n)).length,5);assert.equal(a.NPCS.filter(n=>n.sleeping).length,a.NPCS.length-5);a.day();a.updateNPCs(1/60);assert.ok(a.NPCS.every(n=>!n.sleeping&&a.mapStand(n.x,n.y)));console.log('PASS: 20 NPCs sleep, 5 night workers remain, all return safely by day');

a.night();const sleeping=a.NPCS.find(n=>n.id==='rusty');a.P.x=sleeping.x+15;a.P.y=sleeping.y;assert.equal(a.npcBlocks(sleeping.x+5,sleeping.y),false);assert.equal(a.npcAt(sleeping.x,sleeping.y-20),null);a.day();assert.equal(a.npcBlocks(sleeping.x+5,sleeping.y),true);console.log('PASS: sleeping NPCs neither collide nor accept pointer selection');
