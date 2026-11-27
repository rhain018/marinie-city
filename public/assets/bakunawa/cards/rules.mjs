const cards = {
  pulse: { name:'Arcane Pulse', cost:1, type:'Attack', text:'12 damage. Apply Moon Mark.', damage:12, fx:'bolt', art:'pulse' },
  spear: { name:'Moon Spear', cost:2, type:'Attack', text:'22 damage. +14 against a marked boss.', damage:22, fx:'crescent', art:'spear' },
  shield: { name:'Tidal Shield', cost:2, type:'Defense', text:'Block 24 damage this turn.', block:24, fx:'shield', art:'shield' },
  dodge: { name:'Dodge Step', cost:1, type:'Utility', text:'Evade a dodgeable strike. Draw 1.', evade:true, draw:true, fx:'dodge', art:'dodge' },
  slash: { name:'Crimson Slash', cost:1, type:'Attack', text:'16 damage.', damage:16, fx:'bolt', art:'spear' },
  counter: { name:'Riposte', cost:2, type:'Attack', text:'22 damage. +16 after a successful parry.', damage:22, fx:'wave', art:'spear' },
  parry: { name:'Perfect Parry', cost:1, type:'Defense', text:'Block 10. Counter a parryable strike for 12.', block:10, fx:'shield', art:'shield' },
  guard: { name:'Harbor Guard', cost:2, type:'Defense', text:'Block 24 damage this turn.', block:24, fx:'shield', art:'shield' },
};
const ultimates = {
  yhannie:{ name:'Celestial Tidebreaker', art:'ultimate', damage:64, fx:'ultimate' },
  loki:{ name:'Abyssbreaker', art:'ultimate', damage:64, fx:'ultimate' },
};
const decks = {
  yhannie:['pulse','spear','shield','dodge','pulse','spear','shield','pulse','dodge','spear','shield','pulse'],
  loki:['slash','counter','parry','guard','dodge','slash','parry','counter','guard','slash','dodge','counter'],
};
const intents = [
  {name:'Abyssal Roar',kind:'burst',damage:15,parryable:true,evadable:true},
  {name:'Tidal Cataclysm',kind:'wave',damage:19},
  {name:'Stormfang Lightning',kind:'lightning',damage:22,evadable:true},
  {name:'Maelstrom Prison',kind:'vortex',damage:18,parryable:true},
];
export const MAX_HP=100, BOSS_HP=480, MAX_ENERGY=3, MAX_CHARGE=4;
export { cards, ultimates };

export function phase(s) { return s.bossHp<=144?2:s.bossHp<=312?1:0; }
export function intent(s) {
  const attack=intents[(s.turn-1)%intents.length];
  return {...attack,damage:attack.damage+3*s.attackPhase};
}
function shuffle(list, random) {
  for(let i=list.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [list[i],list[j]]=[list[j],list[i]];
  }
  return list;
}
function draw(s, n) {
  while(n-- && s.hand.length<5){
    if(!s.deck.length)s.deck=shuffle(s.discard.splice(0),s.random);
    if(!s.deck.length)break;
    s.hand.push(s.deck.pop());
  }
}
export function start(hero, random=Math.random) {
  const [hand,deck]=[decks[hero].slice(0,5),decks[hero].slice(5)];
  return {hero,random,hand,deck:shuffle(deck,random),discard:[],turn:1,hp:MAX_HP,bossHp:BOSS_HP,
    energy:MAX_ENERGY,attackPhase:0,charge:0,block:0,evade:false,parry:false,mark:false,counter:false,result:null};
}
function hit(s, damage) {
  const actual=Math.min(damage,s.bossHp);
  s.bossHp-=actual;
  if(!s.bossHp)s.result='won';
  return actual;
}
function charge(s) {s.charge=Math.min(MAX_CHARGE,s.charge+1);}

export function play(s, index) {
  if(s.result)return null;
  if(index==='ultimate'){
    if(s.charge<MAX_CHARGE)return null;
    s.charge=0;
    const card=ultimates[s.hero];
    return {card,damage:hit(s,card.damage)};
  }
  const id=s.hand[index], card=cards[id];
  if(!card||card.cost>s.energy)return null;
  s.energy-=card.cost;
  s.discard.push(...s.hand.splice(index,1));
  s.block+=card.block??0;
  s.evade ||= card.evade??false;
  s.parry ||= id==='parry';
  let damage=card.damage??0;
  if(id==='pulse')s.mark=true;
  if(id==='spear'&&s.mark){s.mark=false;damage+=14;charge(s);}
  if(id==='counter'&&s.counter){s.counter=false;damage+=16;}
  if(card.draw)draw(s,1);
  return {card,damage:hit(s,damage)};
}

export function endTurn(s, attack=intent(s)) {
  if(s.result)return null;
  const evaded=Boolean(s.evade&&attack.evadable);
  const parried=Boolean(!evaded&&s.parry&&attack.parryable);
  const incoming=evaded||parried?0:Math.max(0,attack.damage-s.block);
  const damage=Math.min(s.hp,incoming);
  const counterDamage=parried?hit(s,12):0;
  if(parried)charge(s);
  s.hp-=damage;
  if(!s.hp)s.result='lost';
  if(!s.result){
    s.turn++;
    s.attackPhase=phase(s);
    s.counter=parried;
    s.block=0;
    s.evade=s.parry=false;
    s.energy=MAX_ENERGY;
    s.discard.push(...s.hand.splice(0));
    draw(s,5);
  }
  return {damage,evaded,parried,counterDamage};
}
