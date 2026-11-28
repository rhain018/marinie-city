import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync('game/index.html','utf8');
const elements=new Map();
const windowEvents={},documentEvents={};
function surface(){return {style:{},classList:{add(){},remove(){}},offsetWidth:156,
  events:{},capture:null,addEventListener(name,fn){this.events[name]=fn},
  setPointerCapture(id){this.capture=id},hasPointerCapture(id){return this.capture===id},
  releasePointerCapture(id){assert.equal(this.capture,id);this.capture=null;this.events.lostpointercapture?.({pointerId:id,type:'lostpointercapture'})}}}
for(const id of ['pad','joy','knob'])elements.set(id,surface());
const context={document:{hidden:false,getElementById:id=>elements.get(id),addEventListener:(name,fn)=>documentEvents[name]=fn},
  addEventListener:(name,fn)=>windowEvents[name]=fn,clearTimeout,setTimeout,performance,
  SAFE:{l:0,b:0},VH:430,mode:'play',talking:false,P:{route:{}},marker:{},SET:{sens:100},keys:{w:true},advance(){},onTap(){throw Error('Reset must not tap')},longPress(){}};
vm.runInNewContext(html.slice(html.indexOf('const pad=document'),html.indexOf('let SHOWP=null;'))+
  '\nglobalThis.api={J,TP,padDown,padMove,clearTouchInput};',context);
const {api}=context,joy=elements.get('joy');
const event=(id,button=0)=>({pointerId:id,button,clientX:110,clientY:340,preventDefault(){}});
api.padDown(event(1),true);api.padMove({...event(1),clientX:150});
assert.equal(api.TP.id,1);assert.ok(api.J.x>0);assert.equal(joy.capture,1);
api.clearTouchInput();
assert.equal(api.TP.id,null);assert.equal(api.J.id,null);assert.equal(api.J.x,0);assert.equal(joy.capture,null);
// An overlay can consume pointerup; closing it must allow the next gesture.
api.padDown(event(2),true);assert.equal(api.J.id,2);
context.document.hidden=true;documentEvents.visibilitychange();
assert.equal(api.TP.id,null);assert.equal(context.keys.w,false);assert.equal(joy.capture,null);
api.padDown(event(3,2),true);assert.equal(api.TP.id,null);
api.padDown(event(4),true);windowEvents.blur();assert.equal(api.TP.id,null);
for(const signature of ['function openSettings(','function openPanel(','function gmOpen(','function sayEnt(']){
  const start=html.indexOf(signature);assert.ok(html.slice(start,start+480).includes('clearTouchInput()'),signature+' must release held input');
}
console.log('PASS: joystick capture release, overlay recovery, hidden-tab keys, blur and secondary pointer rejection');
