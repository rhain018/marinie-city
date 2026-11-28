import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const read=file=>readFile(new URL('../../'+file,import.meta.url));
const config=JSON.parse(await read('vercel.json'));
assert.equal(config.framework,null);
assert.equal(config.installCommand,'');
assert.equal(config.outputDirectory,'dist-vercel');
const source=(await read('game/index.html')).toString();
const html=(await read('dist-vercel/index.html')).toString();
assert.ok(source.includes('<h2 id="accountTitle">ChatGPT Account</h2>'),'Sites source account remains intact');
assert.ok(html.includes('Device Saves · Vercel Preview'));
assert.ok(html.includes("throw Error('This testing site uses device saves."));
assert.ok(html.includes('geometry-repair1'));
assert.equal((html.match(/<script\b/g)||[]).length,(source.match(/<script\b/g)||[]).length);
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
 if(!/\bsrc=|type=["'](?:module|importmap|application\/json)/.test(match[1]))new vm.Script(match[2]);
}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
let files=0;
async function compare(directory){
 for(const entry of await readdir(new URL('../../public/'+directory,import.meta.url),{withFileTypes:true})){
  const path=directory+entry.name;
  if(entry.isDirectory()){await compare(path+'/');continue}
  if(path==='index.html')continue;
  assert.equal(hash(await read('public/'+path)),hash(await read('dist-vercel/'+path)),path+' must ship unchanged');files++;
 }
}
await compare('');
assert.ok(files>100);
console.log(`PASS: dependency-free Vercel build, inline script syntax, device-save adapter and ${files} identical assets`);
