import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const s=readFileSync('game/index.html','utf8');
const part=(a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const code=[s.match(/const GRID="[^"]+";/)[0],part('const GW=','const MAP_IMAGE='),s.match(/const MW=\d+,MH=\d+;/)[0],
 'let ROOM=null,todI=0;const P={x:0,y:0,pushT:0};let marker=null;',part('function walkable(','function onWood('),part('const PLACES=','function walkable('),part('const NPC_DEF=','const DIRS4='),
 'const NPCS=NPC_DEF.map(n=>({x:n.x,y:n.y}));',part('const NIGHT_DUTY=','function npcAt('),part('function npcBlocks(','function faceToward('),s.match(/function canStandD\(x,y\)\{[^\n]+/)[0],
 part('function tryMove(','function unstick('),part('function unstick(','function updatePlayer('),part('const ST=new Uint8Array(GW*GH);','let marker=null;'),
 part('function placeAt(','function onTap('),s.match(/const BUILDINGS=\{[^;]+;/)[0],"let mode='play',talking=false;const opened=[];function enterBuilding(kind){opened.push(kind)}",part('function objPose(','/* ---------- seagulls'), 'globalThis.api={P,NPCS,PLACES,placeAt,usePlace,opened,canStand,tryMove,findPathFrom,unstick};'].join('\n');
const ctx={NPC_DATA:{},atob:v=>Buffer.from(v,'base64').toString('binary')};vm.runInNewContext(code,ctx);const {P,NPCS,canStand,tryMove,findPathFrom,unstick}=ctx.api;
for(const p of [[970,558],[1090,550],[1007,808],[202,818]])assert.equal(canStand(...p),false,`solid ${p}`);
for(const p of [[970,590],[970,596],[1090,584],[1090,590],[1100,784],[1070,784],[1206,788],[202,798]])assert.equal(canStand(...p),true,`landing ${p}`);
for(const [start,target] of [[[970,620],[970,590]],[[1090,620],[1090,584]],[[834,550],[970,590]]]){
 P.x=start[0];P.y=start[1];const path=findPathFrom(...start,...target);assert.ok(path?.length,`path ${start} -> ${target}`);
 for(const dest of path){let n=0;while(Math.hypot(dest[0]-P.x,dest[1]-P.y)>.2){const dx=dest[0]-P.x,dy=dest[1]-P.y,d=Math.hypot(dx,dy),step=Math.min(.2,d);assert.ok(tryMove(dx/d*step,dy/d*step),'entry path blocked by NPC or geometry');assert.ok(++n<10000)}}
 assert.ok(Math.hypot(P.x-target[0],P.y-target[1])<4);
}
P.x=1007;P.y=790;for(let n=0;n<120;n++)tryMove(0,.2);assert.ok(P.y<794&&canStand(P.x,P.y),'dock foot must stop before edge');
for(const old of [[970,490],[970,560],[1007,808]]){P.x=old[0];P.y=old[1];P.vx=90;P.route={};unstick();assert.ok(canStand(P.x,P.y));assert.equal(P.route,null);assert.equal(P.vx,0);assert.equal(P.simX,P.x)}
assert.ok(Math.hypot(NPCS.find(n=>n.x===1142).x-1090,NPCS.find(n=>n.x===1142).y-584)>40);
assert.equal(ctx.api.placeAt(1090,500).id,'anchor','forge art must be a clickable entry');
assert.equal(ctx.api.placeAt(970,520).id,'arcade');
assert.equal(ctx.api.PLACES.find(p=>p.id==='anchor').y,584);
ctx.api.usePlace(ctx.api.placeAt(1090,500));ctx.api.usePlace(ctx.api.placeAt(970,520));assert.equal(ctx.api.opened.join(','),'forge,arcade','entry actions must dispatch the right interior');
console.log('PASS: real movement/pathfinding, forge and arcade entry/exit landings, NPC clearance, dock stops and old-save rescue');
