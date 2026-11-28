import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createProjection,decodeHarborWater} from '../../public/assets/city-hd2d/scene.mjs';
const base='public/assets/city-hd2d/';
const mesh=JSON.parse(readFileSync(base+'city-repair-projection.json'));
const landmarks=JSON.parse(readFileSync(base+'repair-landmarks.json'));
const project=createProjection(mesh),s=readFileSync('game/index.html','utf8');
const part=(a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const {mapStand}=vm.runInNewContext([s.match(/const GRID="[^"]+";/)[0],part('const GW=','const MAP_IMAGE='),s.match(/const MW=\d+,MH=\d+;/)[0],part('function walkable(','function onWood('),'({mapStand})'].join('\n'),{atob});
const near=(a,b)=>assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-4,`${a} != ${b}`);
function area(points,ids){const [a,b,c]=ids.map(i=>points[i]);return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])}
for(const ids of mesh.triangles){
 assert.ok(area(mesh.canonicalWorld,ids)*area(mesh.renderWorld,ids)>0,'Projection must never fold');
 for(const weights of [[.3,.3,.4],[.8,.1,.1],[.1,.8,.1],[.1,.1,.8]]){
  const q=[0,1].map(axis=>ids.reduce((sum,id,i)=>sum+mesh.canonicalWorld[id][axis]*weights[i],0));near(project(...project(...q),true),q);
 }
}
for(const {id,canonical,render} of landmarks.entries){near(project(...canonical),render);near(project(...render,true),canonical);assert.ok(mapStand(...canonical),id+' doorstep must remain standable')}
let stairSteps=0;
for(const [name,x,top,bottom] of [['City Hall',714,300,354],['Hotel lower',1113,351,409],['Hotel upper',1178,252,339],['West',132,451,586],['Seafood east',611,454,584],['Market',1270,457,605],['Central',752,623,704],['Dock west',536,626,704],['Dock east',1155,709,783]]){
 for(let y=top;y<=bottom;y+=3){const q=project(x*1536/1672,y*864/940,true);assert.ok(mapStand(...q),name+' visible step '+y+' is blocked');stairSteps++}
}
const water=decodeHarborWater(readFileSync(base+'repair-water.bin'),{rect(){}});
const wet=(x,y)=>water.contains(x*1536/1672,y*864/940);
for(const [name,l,t,r,b] of [['Trawler',420,800,740,850],['Pier',195,750,240,870],['Central jetty',716,620,786,728],['Ferry',1400,780,1600,830],['Canoe',1520,870,1610,899],['East dock',840,820,1310,860]]){
 for(let y=t;y<=b;y+=4)for(let x=l;x<=r;x+=4)assert.equal(wet(x,y),false,name+' must never ripple');
}
for(const q of [[600,927],[700,920],[1000,924],[1300,925],[1600,920]])assert.ok(wet(...q),'Ocean remains animated '+q);
const floor=readFileSync(base+'repair-floor.bin');assert.equal(floor.length,384*216);
assert.ok(floor.some(v=>v===255));assert.ok(floor.some(v=>v===0));
const masks=JSON.parse(readFileSync(base+'repair-foreground.json'));
assert.equal(masks.length,24);assert.ok(masks.every(o=>o.poly.length>=4&&o.w>0&&o.h>0&&o.base>o.y));
const runtime=readFileSync(base+'scene.mjs','utf8');for(const file of ['city-geometry-repair.png','city-repair-projection.json','repair-foreground.json','repair-water.bin','repair-floor.bin'])assert.ok(runtime.includes(file),'Runtime must use '+file);
console.log(`PASS: ${mesh.triangles.length} unfolded triangles, ${landmarks.entries.length} entrances, ${stairSteps} stair samples, 24 foreground layers, water exclusions and projected lighting grid`);
