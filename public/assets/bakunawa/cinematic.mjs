import { W, H, TARGET, MELEE_TARGET, clamp } from './combat.mjs?v=dual-hd';

const PALETTES = {
  sword: ['#ff445c', '#ff896c', '#fff2cf'],
  arcane: ['#a479ff', '#65dfff', '#fff0ff'],
  tide: ['#347ed5', '#69e5ff', '#e5fbff'],
  heal: ['#7cdb8f', '#b9ff92', '#fff5bf'],
};
const LIMIT = 56;
const fract = n => n - Math.floor(n);

export function ultimateBeat(s) {
  if (s.state === 'lost' || s.state === 'won') return null;
  if (s.skillImpact?.kind === 'ultimate') {
    const elapsed = s.age - s.skillImpact.age;
    if (elapsed >= 0 && elapsed < .74) return { phase: 'impact', progress: elapsed / .74 };
  }
  if (s.shot && (s.shot.cardKind ?? s.shot.kind) === 'ultimate') {
    return { phase: 'release', progress: s.shot.t };
  }
  if (s.cast?.kind === 'ultimate') {
    return { phase: 'charge', progress: clamp(1 - s.cast.time / s.cast.total, 0, 1) };
  }
  if (s.bladeRelease?.kind === 'ultimate') {
    const elapsed = s.age - s.bladeRelease.age;
    if (elapsed >= 0 && elapsed < .37) return { phase: 'release', progress: elapsed / .37 };
  }
  return null;
}

export function cinematicRate(s) {
  if (s.reduceMotion) return 1;
  const beat = ultimateBeat(s);
  if (!beat) return 1;
  if (beat.phase === 'release') return .90;
  if (beat.phase === 'impact' && beat.progress < .27) return .52;
  return 1;
}

export function createCinematic() {
  return {
    age: 0, zoom: 1, x: W/2, y: H/2, impulse: 0,
    sparks: Array.from({length: LIMIT}, () => ({end: -1})), cursor: 0,
    notices: Array.from({length: 4}, () => ({end: -1})), noticeCursor: 0,
  };
}

function addSparks(fx, age, x, y, palette, amount, strength) {
  for (let i=0; i<amount; i++) {
    const spark = fx.sparks[fx.cursor++ % LIMIT];
    const angle = i*2.399+age;
    const speed = (70+fract(i*.637)*170)*strength;
    const life = .25+fract(i*.41)*.43;
    spark.x=x; spark.y=y; spark.start=age; spark.end=age+life;
    spark.vx=Math.cos(angle)*speed; spark.vy=Math.sin(angle)*speed*.82-38;
    spark.size=2+i%4; spark.color=palette[i%palette.length];
  }
}

export function feedCinematic(s, event, kind, detail, quality) {
  const fx=s.visual;
  const age=s.age;
  const physical=s.hero==='loki';
  const heroColor=physical?PALETTES.sword:PALETTES.arcane;
  const count=[5,12,19][quality];
  if(event==='hit') {
    const ranged=!physical||kind==='wave';
    const [x,y]=s.bossOffset?[TARGET[0]+s.bossOffset[0],TARGET[1]+s.bossOffset[1]]
      :ranged?TARGET:[MELEE_TARGET[0],MELEE_TARGET[1]-72];
    const heavy=kind==='ultimate'||kind==='aerial';
    addSparks(fx,age,x,y,heroColor,count,heavy?1.9:1.12);
    if(!s.reduceMotion)fx.impulse=Math.max(fx.impulse,heavy?.71:.30);
    const label=fx.notices[fx.noticeCursor++ % fx.notices.length];
    Object.assign(label,{start:age,end:age+.75,x,y:y-22,text:String(detail),color:heroColor[2]});
  } else if(event==='impact') {
    const h=s.hazard;
    addSparks(fx,age,h?.x??h?.origin??s.x,h?.y??s.y,PALETTES.tide,count,1.45);
  } else if(event==='launch') {
    addSparks(fx,age,s.x+24,s.y-62,heroColor,Math.ceil(count*.6),.86);
  } else if(event==='parry'||event==='heal') {
    addSparks(fx,age,s.x,s.y-36,event==='heal'?PALETTES.heal:heroColor,count,.8);
    if(event==='parry'){
      const label=fx.notices[fx.noticeCursor++ % fx.notices.length];
      Object.assign(label,{start:age,end:age+.65,x:s.x,y:s.y-107,text:'PARRY',color:'#ffe6af'});
    }
  } else if(event==='victoryStrike') {
    addSparks(fx,age,TARGET[0],TARGET[1],heroColor,count*2,2);
    if(!s.reduceMotion)fx.impulse=.8;
  }
}

export function cameraFor(s, quality, beat = ultimateBeat(s)) {
  const fx=s.visual;
  if(!fx||s.reduceMotion)return {zoom:1,x:W/2,y:H/2};
  const dt=clamp(s.age-fx.age,0,.12);
  fx.age=s.age;
  fx.impulse*=Math.exp(-dt*9);
  const reveal=s.state==='emerge';
  const warning=s.state==='tell';
  const release=s.cinematicRelease!=null?Math.max(0,1-(s.age-s.cinematicRelease)/.65):0;
  let zoom = 1 + (warning ? .01 : reveal ? .065 : s.cardMode ? .016 : .037);
  let x = warning ? W / 2 : W / 2 + clamp((s.x - 437) * .20, -42, 55);
  let y = H / 2;
  if (beat) {
    const charged = beat.phase === 'charge';
    const hit = beat.phase === 'impact';
    const targetX = TARGET[0] + (s.bossOffset?.[0] ?? 0);
    zoom = charged ? 1.17 + beat.progress * .16 : hit ? 1.22 - beat.progress * .13 : 1.23;
    x = s.x * (charged ? .72 : .40) + targetX * (charged ? .28 : .60);
    y = charged ? s.y - 145 : (s.y + TARGET[1]) / 2 - 65;
    // Keep enemy telegraphs visible during real-time ultimates.
    if (warning) zoom = Math.min(zoom, 1.14);
  }
  zoom += fx.impulse * .035 + release * .044;
  const ease=1-Math.exp(-dt*8);
  fx.zoom+=(zoom-fx.zoom)*ease;
  fx.x+=(x-fx.x)*ease;
  fx.y+=(y-fx.y)*ease;
  const kick = quality === 0 ? 0 : fx.impulse * (beat ? 26 : 15) + s.shake * (beat ? 14 : 6);
  const xMargin=W/(2*fx.zoom), yMargin=H/(2*fx.zoom);
  return {
    zoom:fx.zoom,
    x:clamp(fx.x-Math.sin(s.age*82)*kick,xMargin,W-xMargin),
    y:clamp(fx.y-Math.cos(s.age*69)*kick*.45,yMargin,H-yMargin),
  };
}

export function paintUltimateFrame(g, canvas, s, cutIn, beat) {
  if (!beat || s.reduceMotion) return;
  const { phase, progress } = beat;
  const sword = s.hero === 'loki';
  g.save();

  if (phase === 'charge' && cutIn?.naturalWidth && progress > .055 && progress < .43) {
    const fade = Math.min(1, (progress - .055) * 24, (.43 - progress) * 16);
    const battleWarning = !s.cardMode && ['tell', 'impact'].includes(s.state);
    const zoom = 1.02 + progress * .23;
    const scale = Math.max(canvas.width / W, canvas.height / H);
    g.setTransform(scale, 0, 0, scale, (canvas.width - W * scale) / 2, (canvas.height - H * scale) / 2);
    g.globalAlpha = fade * (battleWarning ? .32 : 1);
    g.imageSmoothingEnabled = true;
    g.drawImage(cutIn, -(zoom - 1) * W * .51, -(zoom - 1) * H * .43, W * zoom, H * zoom);
  }

  g.setTransform(1, 0, 0, 1, 0, 0);
  if (phase === 'impact' && progress < .38) {
    const x = canvas.width * .65, y = canvas.height * .42;
    const glow = g.createRadialGradient(x, y, 12, x, y, canvas.width * .64);
    glow.addColorStop(0, sword ? '#f95b4965' : '#a889ff68');
    glow.addColorStop(1, 'transparent');
    g.globalAlpha = (1 - progress / .38) * .64;
    g.fillStyle = glow;
    g.fillRect(0, 0, canvas.width, canvas.height);
  }

  g.globalAlpha = phase === 'impact' ? (1 - progress) * .87 : Math.min(.94, .24 + progress * 3);
  g.fillStyle = '#030511';
  const bar = canvas.height * .047;
  g.fillRect(0, 0, canvas.width, bar);
  g.fillRect(0, canvas.height - bar, canvas.width, bar);
  g.restore();
}

export function paintAtmosphere(g, s, quality, foreground) {
  const t=s.age;
  const layers=quality===0?1:quality===1?2:3;
  const count=s.reduceMotion?5:foreground?layers*5:layers*7;
  const near=foreground?1:0;
  g.save();
  for(let i=0;i<count;i++){
    const seed=fract(i*.618+near*.23);
    const x=fract(seed+(s.reduceMotion?0:t)*(near?.036:.009))*W;
    const y=(near?670:94)+fract(i*.414+(s.reduceMotion?0:t)*(near?.016:.006))*(near?211:324);
    const length=(near?225:175)*(1+seed);
    const fog=g.createLinearGradient(x-length/2,y,x+length/2,y);
    const opacity=near?.055:.064;
    fog.addColorStop(0,'transparent');
    fog.addColorStop(.52,`rgba(110,182,234,${opacity*(.45+.55*Math.sin(i*5+t*.65)**2)})`);
    fog.addColorStop(1,'transparent');
    g.fillStyle=fog;
    g.fillRect(x-length/2,y,length,near?1+i%3:3+i%3);
    if(quality&&i%2===0){
      g.fillStyle=near?'#a7e5ff57':'#7ebbef69';
      g.fillRect(Math.round(x+i*3),Math.round(y+13),1+i%2,2);
    }
  }
  g.restore();
}

export function paintCinematic(g,s,quality) {
  const fx=s.visual;
  if(!fx)return;
  g.save();
  if(quality)g.globalCompositeOperation='screen';
  for(const spark of fx.sparks){
    const age=s.age-spark.start;
    if(age<0||spark.end<=s.age)continue;
    const fade=(spark.end-s.age)/(spark.end-spark.start);
    const x=spark.x+spark.vx*age,y=spark.y+spark.vy*age+210*age*age;
    g.globalAlpha=fade*fade*.85;
    g.strokeStyle=spark.color;
    g.lineWidth=1+spark.size*fade*.6;
    g.beginPath();g.moveTo(x,y);g.lineTo(x-spark.vx*.03*fade,y-spark.vy*.03*fade);g.stroke();
  }
  g.globalCompositeOperation='source-over';
  g.font='800 27px Georgia, serif';
  g.textAlign='center';
  g.strokeStyle='#10172b';
  g.lineWidth=4;
  for(const label of fx.notices){
    if(label.end<=s.age)continue;
    const progress=(s.age-label.start)/(label.end-label.start);
    g.globalAlpha=clamp((1-progress)*2,0,1);
    g.fillStyle=label.color;
    const y=label.y-48*progress;
    g.strokeText(label.text,label.x,y);
    g.fillText(label.text,label.x,y);
  }
  g.restore();
}
