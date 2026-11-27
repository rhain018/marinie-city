import {readFileSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const s=readFileSync('game/index.html','utf8'),part=(a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const data=JSON.parse(readFileSync('public/map-lab/bird-layer.json','utf8'));
const code='const MW=1536,MH=864,MAP_GULL_PATCHES='+JSON.stringify(data.staticMapBirds)+';let mode="play",todI=0;const P={x:0,y:0},cam={x:700,y:700,z:2};const S0=1,VW=844,VH=320;function gullCall(){};'+part('const SEATS=','function drawSitters(')+'globalThis.a={SEATS,GULLS,updateGulls,scareGull,newTarget};';
const c={};vm.runInNewContext(code,c);const a=c.a;
assert.equal(data.staticMapBirds.length,6);assert.equal(a.GULLS.length,11);for(const [x,y]of a.SEATS)assert.ok(x>=0&&x<1536&&y>=0&&y<864);
for(const p of data.staticMapBirds){const [x,y,w,h]=p.box,[sx,sy]=p.donor;assert.ok(x>=0&&y>=0&&x+w<=1536&&y+h<=864);assert.ok(sx>=0&&sy>=0&&sx+w<=1536&&sy+h<=864);assert.ok(p.path&&p.size.length===2)}
const flyers=a.GULLS.filter(g=>g.st==='fly'),start=flyers.map(g=>[g.x,g.y]);for(let i=0;i<600;i++)a.updateGulls(1/60);flyers.forEach((g,i)=>assert.ok(Math.hypot(g.x-start[i][0],g.y-start[i][1])>5));
const sitter=a.GULLS.find(g=>g.st==='sit');assert.ok(sitter);a.scareGull(sitter,true);assert.equal(sitter.st,'takeoff');assert.equal(sitter.seat,null);for(let i=0;i<3600;i++){a.updateGulls(1/60);for(const g of a.GULLS){assert.ok([g.x,g.y,g.h,g.ph].every(Number.isFinite));if(g.st!=='sit')assert.ok(Number.isFinite(g.tx)&&g.tx>=0&&g.tx<1536&&Number.isFinite(g.ty)&&g.ty>=0&&g.ty<864)}}
assert.ok(!s.includes('function drawSitters(){return;'));
console.log('PASS: six baked-bird replacements, valid donor regions/perches, moving flyers, tap takeoff and 70 seconds of finite bird simulation');
