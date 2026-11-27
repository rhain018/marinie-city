import {existsSync,readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src=readFileSync('game/index.html','utf8');
const slice=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b,src.indexOf(a)));
const mem=new Map(),els=new Map();
const ctx={localStorage:{getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)},document:{body:{classList:{contains:()=>false}},getElementById:id=>{if(!els.has(id))els.set(id,{style:{},setAttribute(){}});return els.get(id)}}};
ctx.gameStorage=()=>ctx.localStorage;
vm.runInNewContext(`${slice('const HEROES=[','const DIRS=')}const P={hero:'yhannie'};let SET={name:'Loki',nameAuto:true};let sel=0;function storeSettings(){};function sayEnt(entries){globalThis.lines=entries};${slice('function cleanHeroName(','function talkTo(')}${slice('function heroSays(','function roomSay(')}${slice('function loadSave(){','function saveGame(')}${slice('function setupHud(){','function showCard(')}globalThis.api={P,speakerOf,heroSays,getSET:()=>SET,setSET:v=>SET=v,heroName,savedNameRecord,setPlayerName,restorePlayerName,currentNameRecord,persistPlayerName,commitSettingsName,loadSave,setupHud};`,ctx);
const a=ctx.api;
mem.set('marinie.save',JSON.stringify({hero:'yhannie',coins:740,flags:{qs:{nets:{step:1}}}}));
const old=a.loadSave();assert.equal(old.playerName,'Yhannie');assert.equal(a.getSET().name,'Loki','read-only load cannot mutate active name');a.restorePlayerName(old);a.setupHud();assert.equal(a.heroName(),'Yhannie');assert.equal(els.get('hName').textContent,'Yhannie');
a.setPlayerName('  Captain   L ',false);a.persistPlayerName();const saved=JSON.parse(mem.get('marinie.save'));assert.equal(saved.playerName,'Captain L');assert.equal(saved.nameAuto,false);assert.equal(saved.coins,740);assert.equal(saved.flags.qs.nets.step,1);
a.P.hero='loki';a.restorePlayerName({hero:'loki',playerName:'Loki',nameAuto:true,nameVersion:1});assert.equal(a.heroName(),'Loki');
a.P.hero='yhannie';a.restorePlayerName(saved);assert.equal(a.heroName(),'Captain L');
// Gallery temporarily changes character; returning restores the running custom name.
a.P.hero='loki';assert.equal(a.heroName(),'Loki');a.P.hero='yhannie';assert.equal(a.heroName(),'Captain L');
assert.equal(a.savedNameRecord({hero:'yhannie',meta:{hero:'Loki'}}).playerName,'Yhannie');
assert.equal(a.savedNameRecord({hero:'loki',meta:{hero:'Captain'}}).playerName,'Captain');
// An intentional rename to the other character's default remains supported in new saves.
assert.equal(a.savedNameRecord({hero:'yhannie',playerName:'Loki',nameAuto:false,nameVersion:1}).playerName,'Loki');
a.setSET({name:'Old Nick',nameAuto:false,nameHero:'loki'});assert.equal(a.savedNameRecord({hero:'yhannie'},true).playerName,'Yhannie');
assert.equal(a.savedNameRecord({hero:'loki'},false).playerName,'Loki','external bare saves cannot inherit device-global nickname');
a.P.hero='yhannie';a.setPlayerName('Yhannie',true);assert.equal(JSON.parse(JSON.stringify(a.currentNameRecord())).playerName,'Yhannie');
assert.ok(src.includes('const d={hero:P.hero,...currentNameRecord()'),'local saves and snapshots store identity');
assert.ok(src.includes('const data={...sv,...savedNameRecord(sv)};delete data.meta;'),'slot metadata migrates before it is removed');
a.P.hero='loki';a.commitSettingsName({name:'Harbor',nameAuto:false});const menuSave=JSON.parse(mem.get('marinie.save'));assert.equal(menuSave.hero,'yhannie');assert.equal(menuSave.playerName,'Harbor');assert.equal(menuSave.coins,740);
ctx.document.body.classList.contains=()=>true;a.P.hero='yhannie';a.restorePlayerName(menuSave);a.commitSettingsName({name:'Captain',nameAuto:false});assert.equal(a.heroName(),'Captain');assert.equal(JSON.parse(mem.get('marinie.save')).playerName,'Captain');
console.log('PASS: automatic names, per-save custom names, legacy slot migration, gallery character switch, HUD consistency and progress preservation');

for (const [id, nickname] of [['loki', 'Yhannie'], ['yhannie', 'Loki']]) {
  a.P.hero = id;
  a.setPlayerName(nickname, false);
  const portrait = '/assets/characters/selection/' + id + '-body.webp';
  assert.ok(existsSync('public' + portrait));
  a.setupHud();
  assert.equal(els.get('face').style.backgroundImage, 'url(' + portrait + ')');
  a.heroSays(['Mmm... five more minutes...']);
  assert.equal(ctx.lines[0].name, nickname);
  assert.equal(ctx.lines[0].face, portrait, 'the wake-up portrait follows the active hero');
  assert.equal(a.speakerOf(null, 'h').face, portrait, 'the same hero answers NPCs');
  const npc = {name:'Old Bert',face:'bert',col:'#fff',role:'Fisherman'};
  assert.deepEqual({...a.speakerOf(npc, 'n')}, npc);
}
console.log('PASS: wake-up dialogue, NPC replies and HUD use the selected character art even with the other hero’s name');
