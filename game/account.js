(()=>{
let revision=null,cloud=null,busy=false;
const panel=document.createElement('div');panel.id='accountPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','accountTitle');panel.innerHTML='<section><h2 id="accountTitle">ChatGPT Account</h2><p id="accountStatus" role="status">Loading…</p><p id="cloudSummary"></p><button id="cloudRefresh">Refresh account</button><button id="cloudSave">Save current progress to cloud</button><button id="cloudLoad">Load cloud save</button><button id="cloudRestore">Restore device backup</button><p>One cloud save per account. Device saves stay available. Cloud sync is manual.</p><a href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in with ChatGPT</a> · <a href="/signout-with-chatgpt?return_to=%2F" target="_top">Sign out</a><button id="cloudClose">Close</button></section>';document.body.append(panel);
const status=panel.querySelector('#accountStatus'),summary=panel.querySelector('#cloudSummary'),save=panel.querySelector('#cloudSave'),load=panel.querySelector('#cloudLoad');let focus;
function controls(){save.disabled=busy||revision===null||!P.hero||!document.body.classList.contains('playing');load.disabled=busy||!cloud;panel.querySelector('#cloudRefresh').disabled=busy;panel.querySelector('#cloudRestore').disabled=busy}
async function refresh(){busy=true;controls();try{const r=await fetch('/api/account',{cache:'no-store'}),d=await r.json();if(!r.ok)throw Error(d.error||'Could not read account');revision=d.revision;cloud=d.save;status.textContent='Signed in: '+d.name;summary.textContent=cloud?'Cloud: '+savedNameRecord(cloud).playerName+' · Lv.'+(cloud.lvl||1)+' · '+calendarLabel(cloud.flags)+' · '+new Date(d.updatedAt).toLocaleString():'No cloud save yet. Continue your local game, then save it here.'}catch(e){revision=null;cloud=null;status.textContent=e.message;summary.textContent='Your local progress is still on this device.'}finally{busy=false;controls()}}
async function open(){if(busy||loadingSave)return;focus=document.activeElement;panel.hidden=false;panel.querySelector('#cloudClose').focus();await refresh()}
function close(){if(busy)return;panel.hidden=true;if(focus&&focus.isConnected)focus.focus()}
save.onclick=async()=>{if(busy||revision===null)return;if(cloud&&!confirm('Replace the cloud save with the current progress on this device?'))return;busy=true;controls();try{const data=snapshotGame();delete data.meta;data.gallery=galUnlocked();const r=await fetch('/api/account',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,save:data})});const d=await r.json();if(!r.ok)throw Error(d.error||'Cloud save failed');revision=d.revision;cloud=data;status.textContent='Saved to cloud · '+new Date(d.updatedAt).toLocaleTimeString();summary.textContent=savedNameRecord(data).playerName+' · Lv.'+data.lvl+' · '+calendarLabel(data.flags)}catch(e){status.textContent=e.message;if(/another device/.test(e.message))revision=null}finally{busy=false;controls()}};
load.onclick=async()=>{
  if(busy||!cloud||!confirm('Load cloud progress? Your current local progress will be backed up on this device first.'))return;
  busy=true;controls();
  try{
    await loadFromData(cloud,true);
    if(cloud.gallery&&typeof cloud.gallery==='object'){
      const gallery=galUnlocked();
      for(const [id,unlock] of Object.entries(cloud.gallery))if(unlock&&!gallery[id])gallery[id]=unlock;
      if(!writeJSON('marinie.gallery',gallery)){
        panel.hidden=true;toast('Cloud progress loaded. Device storage could not save the gallery unlocks.');
        return;
      }
    }
    panel.hidden=true;toast('Cloud save loaded');
  }catch(error){status.textContent='Could not load cloud save: '+error.message}
  finally{busy=false;controls()}
};
panel.querySelector('#cloudRestore').onclick=async()=>{
  if(busy)return;
  const old=readJSON('marinie.beforeCloudLoad',null);
  if(!old){status.textContent='No device backup yet.';return}
  if(!confirm('Restore the device save from before your last cloud load?'))return;
  busy=true;controls();
  try{await loadFromData(old);panel.hidden=true;toast('Device backup restored')}
  catch(error){status.textContent='Could not restore device backup: '+error.message}
  finally{busy=false;controls()}
};
panel.querySelector('#cloudRefresh').onclick=refresh;panel.querySelector('#cloudClose').onclick=close;document.addEventListener('keydown',e=>{if(panel.hidden)return;if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'){const items=[...panel.querySelectorAll('button:not(:disabled),a')];if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0].focus()}}});
document.addEventListener('click',e=>{if(e.target.closest('[data-account]'))open()});
const launcher=document.createElement('button');launcher.type='button';launcher.id='accountLauncher';launcher.dataset.account='';launcher.textContent='Account / Cloud Save';document.body.append(launcher);if(new URLSearchParams(location.search).get('account')==='1')open();
})();
