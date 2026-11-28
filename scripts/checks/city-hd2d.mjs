import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {districts,createProjection,decodeHarborWater} from '../../public/assets/city-hd2d/scene.mjs';

const game = readFileSync('game/index.html','utf8');
function between(from,to) {
  const start = game.indexOf(from);
  const end = game.indexOf(to,start);
  assert.ok(start>=0 && end>start,from);
  return game.slice(start,end);
}

const boot = between('const cityQuery =','let cityEdition =');
const persisted = new Map([['marinie.save','original story progress']]);
const storage = {
  getItem:key=>persisted.get(key)??null,
  setItem:(key,value)=>persisted.set(key,String(value)),
  removeItem:key=>persisted.delete(key)
};
function session(search) {
  return vm.runInNewContext(boot+'gameStorage()',{URLSearchParams,location:{search},window:{localStorage:storage}});
}
const test = session('?test=city-hd2d');
assert.equal(test.getItem('marinie.save'),null);
for (const name of ['marinie.save','marinie.gallery','marinie.settings','marinie.gfx2','marinie.slot1']) {
  test.setItem(name,29);
  assert.equal(test.getItem(name),'29');
  test.removeItem(name);
  assert.equal(test.getItem(name),null);
}
assert.deepEqual([...persisted],[['marinie.save','original story progress']]);
assert.equal(session('').getItem('marinie.save'),'original story progress');
assert.equal(session('?menu=developer').getItem('marinie.save'),'original story progress');
assert.equal(session('?test=city-hd2d').getItem('marinie.save'),null);
assert.match(game,/<\/script><script>\(\(\)=>\{\s*if\(cityMapTest\)return;/);
assert.match(game,/if\(cityMapTest\)queueMicrotask\(startCityMapTest\);/);

const geometry = [
  game.match(/const GRID="[^"]+";/)[0],
  between('const GW=','const MAP_IMAGE='),
  game.match(/const MW=\d+,MH=\d+;/)[0],
  between('function walkable(','function onWood('),
  between('const NPC_DEF=','const DIRS4='),
  '({mapStand,NPC_DEF})'
].join('\n');
const {mapStand,NPC_DEF} = vm.runInNewContext(geometry,{atob,NPC_DATA:{}});
for (const {name,x,y} of Object.values(districts)) {
  assert.ok(mapStand(x,y),name+' must be on the live floor grid');
  assert.ok(NPC_DEF.every(n=>Math.hypot(n.x-x,n.y-y)>8),name+' must clear all NPC home positions');
}

// A cropped foreground silhouette and the full scene must sample the very same
// test artwork. Reading even the first original HD tile would break occlusion.
const calls = [];
const image = {width:3072,height:1728};
const paint = {save(){},restore(){},drawImage:(...args)=>calls.push(args)};
const region = vm.runInNewContext(between('function drawMapRegion(','const PTS=')+'\ndrawMapRegion',
  {cityEdition:{active:true,image},DPR:1,cam:{z:1.8},S0:1,MW:1536,MH:864});
region(paint);
region(paint,566,251,31,83);
assert.deepEqual(calls,[[image,0,0,3072,1728,0,0,1536,864],[image,1132,502,62,166,566,251,31,83]]);
console.log('PASS: private test storage, story and cloud isolation, eight district spawns, matching scene and occlusion artwork');

const mesh=JSON.parse(readFileSync('public/assets/city-hd2d/city-projection.json','utf8'));
const project=createProjection(mesh);
function near(actual,expected){
  assert.ok(Math.hypot(actual[0]-expected[0],actual[1]-expected[1])<1e-5);
}
function area(points,[i,j,k]){
  const [a,b,c]=[points[i],points[j],points[k]];
  return (b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);
}
for(const tri of mesh.triangles){
  assert.ok(area(mesh.canonicalWorld,tri)*area(mesh.renderWorld,tri)>0,'City projection folded');
  const center=[0,1].map(axis=>tri.reduce((sum,i)=>sum+mesh.canonicalWorld[i][axis],0)/3);
  near(project(...project(...center),true),center);
}
for(const [i,point] of mesh.canonicalWorld.entries())near(project(...point),mesh.renderWorld[i]);
near(project(1094,400),[1089,407.5]);
near(project(1262,402),[1262,413]);
console.log('PASS: city projection and inverse tap placement across every triangle, including both market approaches');


const packedWater=readFileSync('public/assets/city-hd2d/harbor-water-v2.bin');
const canvasCoverage=new Uint8Array(768*432);
const water=decodeHarborWater(packedWater,{rect(x,y,w,h){
  assert.ok(x%2===0 && y%2===0 && w%2===0 && h===2);
  const i=y/2*768+x/2;
  canvasCoverage.fill(255,i,i+w/2);
}});
assert.deepEqual(canvasCoverage,water.pixels,'Canvas clip must exactly match the WebGL texture');
assert.throws(()=>decodeHarborWater(packedWater.subarray(1),{}),/Invalid harbor/);
assert.ok(water.glints.length>20 && water.glints.every(p=>water.contains(p.x,p.y)));
for(const [name,l,t,r,b] of [
  ['western outrigger',45,740,85,804],['western outrigger sail',65,709,82,736],
  ['trawler wheelhouse',569,694,618,764],['trawler teal hull',405,762,708,792],
  ['trawler mast',611,633,621,698],['floating buoy line',349,826,437,833],
  ['main ferry cabin',1293,696,1469,730],['main ferry outriggers',1273,753,1478,763],
  ['small canoe',1409,798,1506,825],['old pier planks',170,690,220,798],
  ['eastern finger pier',273,690,312,801],['central jetty',663,607,716,661],
  ['main dock and piling',799,774,830,835],['eastern jetty',1050,800,1082,859],
  ['arcade',900,463,1010,556],['Market',1110,330,1210,378]
]){
  for(let y=t;y<=b;y+=2)for(let x=l;x<=r;x+=2)assert.equal(water.contains(x,y),false,name);
}
for(const point of [[29,676],[557,625],[780,638],[518,850],[1270,798],[1336,827],[1484,851]])
  assert.ok(water.contains(...point),'Open harbor water '+point);
for(const point of [[-1,800],[1536,850],[220,864],[72,150]])assert.equal(water.contains(...point),false);
const mapMetadata=JSON.parse(game.match(/const MAPA=(\{[^\n]+\});/)[1]);
const selectContext={cityEdition:null,MW:1536,MH:864,WM:mapMetadata.wmask,WW:mapMetadata.ww};
const waterAPI=vm.runInNewContext(between('function remakeHarborWater()','const WATER_CLIP=')+
  '\n({remakeHarborWater,isWater})',selectContext);
function legacy(x,y){return mapMetadata.wmask[Math.floor(y/8)*mapMetadata.ww+Math.floor(x/8)]==='1'}
const probes=[[600,752],[29,676],[518,850],[1300,805],[1100,601]];
for(const active of [null,{remade:false,water},{remade:true,water},{remade:false,water}]){
  selectContext.cityEdition=active;
  for(const [x,y] of probes)assert.equal(waterAPI.isWater(x,y),active?.remade?water.contains(x,y):legacy(x,y));
}
const gpu={T:{water:'original'},gl:{NEAREST:9728},indoor:false,remakeHarborWater:()=>waterAPI.remakeHarborWater()};
let uploads=0;
gpu.r8=(px,w,h,filter)=>{assert.equal(px,water.pixels);assert.equal(w,768);assert.equal(h,432);assert.equal(filter,9728);uploads++;return 'remake'};
const chooseTexture=vm.runInNewContext('(function(){'+between('      const harbor=indoor ? null : remakeHarborWater();','      /* 3+4 light map */')+'return waterTexture})',gpu);
selectContext.cityEdition={remade:true,water};assert.equal(chooseTexture(),'remake');
gpu.indoor=true;assert.equal(chooseTexture(),'original');
selectContext.cityEdition={remade:false,water};gpu.indoor=false;assert.equal(chooseTexture(),'original');
selectContext.cityEdition={remade:true,water};assert.equal(chooseTexture(),'remake');assert.equal(uploads,1);
assert.equal((game.match(/uWater:waterTexture/g)||[]).length,2,'Both WebGL passes must select the same water');
assert.match(game,/ctx\.clip\(waterClip\)/);
console.log('PASS: remake material mask, boat and pier exclusions, visible ocean, Canvas/WebGL agreement and artwork switching');
