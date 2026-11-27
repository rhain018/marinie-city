import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const s=readFileSync('game/index.html','utf8');
const part=(a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const code=[s.match(/const GRID="[^"]+";/)[0],part('const GW=','const MAP_IMAGE='),s.match(/const MW=\d+,MH=\d+;/)[0],
 'let ROOM=null,todI=0;const P={x:0,y:0,pushT:0};let marker=null;',part('function walkable(','function onWood('),part('const PLACES=','function walkable('),part('const NPC_DEF=','const DIRS4='),
 'const NPCS=NPC_DEF.map(n=>({id:n.id,x:n.x,y:n.y}));',part('const NIGHT_DUTY=','function npcAt('),part('function npcBlocks(','function faceToward('),s.match(/function canStandD\(x,y\)\{[^\n]+/)[0],
 part('function tryMove(','function unstick('),part('function unstick(','function updatePlayer('),part('const ST=new Uint8Array(GW*GH);','let marker=null;'),
 part('function placeAt(','function onTap('),s.match(/const BUILDINGS=\{[^;]+;/)[0],"let mode='play',talking=false;const opened=[];function enterBuilding(kind){opened.push(kind)}",part('function objPose(','/* ---------- seagulls'), 'globalThis.api={mapStand,MW,MH,GW,GH,P,NPCS,PLACES,placeAt,usePlace,opened,canStand,tryMove,findPathFrom,unstick};'].join('\n');
const ctx={NPC_DATA:{},atob:v=>Buffer.from(v,'base64').toString('binary')};vm.runInNewContext(code,ctx);const {P,NPCS,canStand,tryMove,findPathFrom,unstick}=ctx.api;

const {MW,MH,GW,GH,mapStand,PLACES}=ctx.api;
const valid=new Uint8Array(GW*GH);let count=0;
for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(mapStand(x*4+2,y*4+2)){valid[y*GW+x]=1;count++}
const seen=new Uint8Array(GW*GH),queue=[];const start=PLACES.find(p=>p.id==='hotel');const si=((start.y/4)|0)*GW+((start.x/4)|0);queue.push(si);seen[si]=1;
for(let k=0;k<queue.length;k++){const i=queue[k];for(const ni of [i%GW?i-1:-1,i%GW<GW-1?i+1:-1,i-GW,i+GW])if(ni>=0&&ni<valid.length&&valid[ni]&&!seen[ni]){seen[ni]=1;queue.push(ni)}}
console.log('Connected',queue.length,'of',count);
assert.equal(queue.length,count,'all standable cells must connect to the city');
for(const p of PLACES.filter(p=>p.x!=null)){assert.ok(mapStand(p.x,p.y),p.id+' landing blocked');assert.ok(findPathFrom(start.x,start.y,p.x,p.y)?.length,p.id+' disconnected');}
for(const n of NPCS){assert.ok(mapStand(n.x,n.y),n.id+' invalid');assert.ok(findPathFrom(start.x,start.y,n.x,n.y)?.length,'NPC disconnected');}
for(const point of [[970,490],[900,670],[1150,330],[370,180],[662,170],[1360,500],[1007,808],[770,700],[60,760]])assert.equal(mapStand(...point),false,'roof/water '+point);
for(const point of [[690,320],[690,342],[728,350],[970,590],[1090,584],[1100,784]])assert.ok(mapStand(...point),'passage '+point);
console.log('PASS: all map cells, 20 place landings, 25 NPC locations, roof/water exclusions and reopened statue passage');

for(const p of [[580,300],[750,300],[835,382],[700,430],[697,370]])assert.equal(mapStand(...p),false,"solid stone/pedestal "+p);
for(const p of [[674,340],[726,342],[696,342],[696,391]])assert.ok(mapStand(...p),"statue clearance "+p);
// Walk both sides and the rear/front of the statue using the production movement function.
// Park NPCs only for this geometry test; the separate NPC simulation tests crowd behavior.
const npcPositions=NPCS.map(n=>[n.x,n.y]);for(const n of NPCS){n.x=0;n.y=0}
for(const [from,to] of [[[662,340],[734,340]],[[734,340],[734,390]],[[734,390],[662,390]],[[662,390],[662,340]]]){
 P.x=from[0];P.y=from[1];const route=findPathFrom(...from,...to);assert.ok(route?.length,'statue perimeter route');
 for(const next of route){let steps=0;while(Math.hypot(next[0]-P.x,next[1]-P.y)>.3){const dx=next[0]-P.x,dy=next[1]-P.y,d=Math.hypot(dx,dy),step=Math.min(.5,d);assert.ok(tryMove(dx/d*step,dy/d*step));assert.ok(mapStand(P.x,P.y));assert.ok(++steps<10000)}}
}
NPCS.forEach((n,i)=>{[n.x,n.y]=npcPositions[i]});
console.log('PASS: production movement around all four statue sides and solid wall/planter exclusions');

const {segments: rails} = JSON.parse(readFileSync('public/map-lab/railing-audit.json','utf8'));
let samples = 0;
let approaches = 0;
for (const rail of rails) {
  if (!rail.rect) continue;
  const [left, top, right, bottom] = rail.rect;
  for (let y = top + 3; y <= bottom - 3; y += 3) {
    for (let x = left + 3; x <= right - 3; x += 3) {
      assert.equal(mapStand(x, y), false, rail.name + ' allows standing');
      samples++;
    }
  }
  const horizontal = right - left > bottom - top;
  for (const direction of [-1, 1]) {
    const x = horizontal ? (left + right) / 2 : direction > 0 ? left - 12 : right + 12;
    const y = horizontal ? direction > 0 ? top - 12 : bottom + 12 : (top + bottom) / 2;
    if (!mapStand(x, y)) continue;
    for (const speed of [.8, 3.2]) {
      for (const jumping of [false, true]) {
        Object.assign(P, {x, y, pose: jumping ? {act:'jump', age:.3, dur:.62} : null});
        for (let i = 0; i < 90; i++) {
          tryMove(horizontal ? 0 : direction * speed, horizontal ? direction * speed : 0);
          assert.ok(mapStand(P.x, P.y), rail.name + ' entered solid terrain');
        }
        const crossed = horizontal
          ? direction > 0 ? P.y >= top : P.y <= bottom
          : direction > 0 ? P.x >= left : P.x <= right;
        assert.equal(crossed, false, rail.name + ' allowed crossing');
        approaches++;
      }
    }
  }
}
assert.ok(approaches >= 20);
console.log('PASS: ' + samples + ' blocked railing points and ' + approaches + ' walk/run/jump approaches');

// The reported standing position was on the stone lip just east of the Market stair.
for (const [x, y] of [[1226, 422], [1234, 430], [1250, 434], [1302, 426]]) {
  assert.equal(mapStand(x, y), false, 'Market rail and lip must be solid');
}
const marketLanding = [1182, 406];
assert.ok(mapStand(...marketLanding));
assert.ok(findPathFrom(...marketLanding, 1262, 402)?.length, 'East walkway must remain reachable');
assert.ok(findPathFrom(...marketLanding, 1182, 546)?.length, 'Market stair must remain open');
Object.assign(P, {x:1234, y:430, pose:null});
unstick();
assert.ok(mapStand(P.x, P.y), 'Old save on Market lip must recover');
console.log('PASS: Market stair lip, east walkway, stair opening and save recovery');

// The latest three reports show feet on the west rail, wall face and upper stair side.
for (const [from, obstruction, axis, direction] of [
  [[1094,400], [1094,434], 'y', 1],
  [[1035,388], [995,388], 'x', -1],
  [[1005,315], [978,315], 'x', -1]
]) {
  assert.ok(mapStand(...from), 'Approach must start on pavement or treads');
  assert.equal(mapStand(...obstruction), false, 'Reported obstruction still allows standing');
  Object.assign(P,{x:from[0],y:from[1],pose:{act:'jump'}});
  for(let i=0;i<50;i++)tryMove(axis==='x'?direction*3:0,axis==='y'?direction*3:0);
  assert.ok(mapStand(P.x,P.y));
  assert.ok(direction*(P[axis]-obstruction[axis==='x'?0:1])<0, 'Hero crossed the obstruction');
  [P.x,P.y]=obstruction;
  unstick();
  assert.ok(mapStand(P.x,P.y), 'Old save on the obstruction must recover');
}
for (const [from,to] of [
  [[1007,267],[1031,382]],
  [[1100,263],[1100,219]],
  [[1031,382],[1158,410]],
  [[1182,406],[1182,546]],
]) {
  assert.ok(mapStand(...from)&&mapStand(...to), 'Stair landing or Market entrance blocked');
  assert.ok(findPathFrom(...from,...to)?.length, 'Stair or Market entrance unreachable');
}
console.log('PASS: three screenshot positions, old saves, upper and lower stairs and Market entrance');
