import {cp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root=new URL('../',import.meta.url);
const output=new URL('../dist-vercel/',import.meta.url);
const source=await readFile(new URL('game/index.html',root),'utf8');
const accountStart="async function refresh(){busy=true;controls();try{";
if(!source.includes(accountStart))throw new Error('Account preview adapter no longer matches the game');
// The game is browser-native. Vercel serves the same HTML and assets, without
// pretending that the Sites-managed ChatGPT identity or D1 database exists here.
const html=source.replace(accountStart,accountStart+"throw Error('This testing site uses device saves. Cloud saves are available on the main Marinie City site.');")
  .replace('<h2 id="accountTitle">ChatGPT Account</h2>','<h2 id="accountTitle">Device Saves · Vercel Preview</h2>')
  .replace('</head>','<style>#accountPanel a[href*="with-chatgpt"],#cloudRefresh,#cloudSave,#cloudLoad{display:none}</style></head>');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(new URL('public/',root),output,{recursive:true});
await writeFile(new URL('index.html',output),html);
await writeFile(new URL('preview-info.json',output),JSON.stringify({platform:'vercel',saveMode:'device',map:'geometry-repair',sourceCommit:process.env.VERCEL_GIT_COMMIT_SHA||null})+'\n');
console.log('Built Vercel testing site: '+fileURLToPath(output));
