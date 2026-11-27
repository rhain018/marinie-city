import { W, H, DECK, TARGET, clamp, MELEE_TARGET } from './combat.mjs?v=fishing-port';

import { cameraFor, paintAtmosphere, paintCinematic, paintUltimateFrame, ultimateBeat } from './cinematic.mjs?v=abyssbreaker';
import { HERO_CELLS, BOSS_CELLS, drawPose, heroFrame, bossFrame } from './cinematic/poses.mjs?v=cinematic';
import { paintSkillEffects } from './effects/vfx.mjs?v=phase-two';
import { paintTidebreaker } from './effects/tidebreaker.mjs?v=abyssbreaker';
import { paintAbyssbreaker } from './effects/abyssbreaker.mjs';
import { PORT_HERO_CELLS, pier, paintPortBackground, paintPortSurf, paintPortReflection, paintPortForeground } from './port/scene.mjs?v=phase-two';
import { fieldPose, paintHeroFieldEffects, paintStormfang } from './animation/field-effects.mjs';

const land = new Path2D();
land.moveTo(0, 450);
for (const p of [[68,368],[190,294],[193,216],[273,219],[282,288],[214,322],[348,300],[449,352],[606,401],[752,457],[900,500],[1043,564],[1167,507],[1230,522],[1193,635],[1065,695],[920,819],[757,864],[0,864]]) land.lineTo(...p);
land.closePath();
const sea = new Path2D();
sea.rect(0, 0, W, H);
sea.addPath(land);
const cardSea = new Path2D();
cardSea.rect(0, 0, W, H);
cardSea.addPath(new Path2D('M0 325 L166 255 L331 225 L369 244 L449 269 L510 294 L602 320 L657 325 L724 359 L729 349 L779 352 L840 383 L897 390 L930 384 L1008 416 L1098 435 L1182 461 L1258 485 L1392 531 L1488 550 L1536 572 V864 H0 Z'));
const floor = new Path2D();
DECK.forEach(([x,y],i) => i ? floor.lineTo(x,y) : floor.moveTo(x,y));
floor.closePath();

const foreground = new Path2D();
for (const [x,y,w,h] of [[134,628,40,171],[180,650,62,108],[603,795,54,69],[751,722,53,142],[894,656,64,161],[1032,571,57,143]]) {
  foreground.rect(x,y,w,h);
}

function line(g, points, color, width) {
  g.beginPath();
  for (let i = 0; i < points.length; i++) i ? g.lineTo(...points[i]) : g.moveTo(...points[i]);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}

function glow(g, x, y, r, color) {
  const grad = g.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'transparent');
  g.fillStyle = grad;
  g.fillRect(x-r, y-r, r*2, r*2);
}

function ellipse(g,x,y,rx,ry,fill,stroke,width=2,rotation=0) {
  g.beginPath();
  g.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);
  if(fill){g.fillStyle=fill;g.fill();}
  if(stroke){g.lineWidth=width;g.strokeStyle=stroke;g.stroke();}
}

function arcane(g,x,y,r,age,strong,cyan=false) {
  glow(g,x,y,r*2,cyan?'#35dfff58':strong?'#a442ffac':'#a93cff75');
  g.save();
  g.translate(x,y);
  g.rotate(age*.8);
  ellipse(g,0,0,r,r,null,cyan?'#7ceaff':'#dfa0ff',2);
  ellipse(g,0,0,r*.81,r*.81,null,cyan?'#d2faff':'#f1d2ff',1);
  for(let i=0;i<8;i++){
    g.rotate(Math.PI/4);
    line(g,[[0,-r-8],[4,-r],[0,-r+5],[-4,-r],[0,-r-8]],cyan?'#aadfff':'#f0ccff',1.5);
    if(i%2===0)line(g,[[0,-r*.76],[r*.51,0],[0,r*.76],[-r*.51,0],[0,-r*.76]],cyan?'#6bdbffaa':'#bd71f96d',1);
  }
  ellipse(g,0,0,r*.22,r*.22,cyan?'#cbf9ff':'#fff0ff',cyan?'#6ceaff':'#e07aff',3);
  g.restore();
}

function water(g,s,quality,front,crest) {
  const count = [3, 6, 9][quality], t=s.age, energy=1+s.phase*.4;
  g.save();
  g.clip(s.cardMode ? cardSea : sea,'evenodd');
  if(crest.naturalWidth){
    const pulse=Math.sin(t*1.8), swell=s.state==='impact'?s.timer/.43:0;
    g.save();
    g.globalAlpha=front?.92:.76;
    if(front){
      g.translate(W+50,0);
      g.scale(-1,1);
      g.drawImage(crest,-50+pulse*15,322+pulse*13-swell*31,1004,213+swell*40);
    }else{
      g.drawImage(crest,314+pulse*20,40+pulse*14,1050,354);
    }
    g.restore();
  }
  for (let row=0;row<count;row++) {
    const points=[];
    const y0=front?440+row*11:115+row*74;
    const x0=front?630:0;
    for(let x=x0;x<=W+20;x+=front?12:25){
      const envelope=front?Math.sin((x-x0)/(W-x0)*Math.PI):1;
      const lift=front?(s.state==='impact'?54:26)*energy:12;
      const y=y0+Math.sin(x*.014-t*(2.2+row*.12)+row)*lift*envelope+Math.sin(x*.046+t*2+row*3)*5;
      points.push([x,y]);
    }
    if(!front)line(g,points,row%3===2?'#892ccd42':'#327bd333',1.3);
    if(front){
      for(let i=1;i<points.length;i++){
        const [x,y]=points[i];
        if(Math.sin(i*9.1+row*2+t*5)>.62){
          line(g,[[x-7,y+2],[x-3,y-2],[x,y]],i%3?'#98eaff9e':'#effcff',2);
          if(quality>0) {
            const drift=(i*7+t*(12+row))%25;
            g.fillStyle='#c1efffb7';
            g.fillRect(x+drift*.38,y-drift*.8,2+(i%3),2);
          }
        }
      }
    }
  }
  g.restore();
}

function cardSurf(g, s, crest, pose) {
  if (!crest.naturalWidth || pose.visible <= 0) return;
  const drift = s.reduceMotion ? 0 : Math.sin(s.age * 2.4) * 10;
  const sw = crest.naturalWidth * .46, sh = crest.naturalHeight * .46;
  g.save();
  g.clip(cardSea, 'evenodd');
  g.globalAlpha = .75;
  g.drawImage(crest, crest.naturalWidth - sw, crest.naturalHeight - sh, sw, sh,
    1020 + drift, 318 + pose.dy * .27, 540, 152);
  g.restore();
}

function bossPose(s) {
  const emergence=s.state==='emerge'?clamp(1-s.timer/1.45,0,1):1;
  const sinking=s.state==='sinking'?clamp(s.timer/2.25,0,1)
    :s.state==='victory'?1-clamp((s.victoryTime-3.15)/2.1,0,1):s.state==='won'?0:1;
  const visible=emergence*sinking;
  const active=s.hazard&&['tell','impact'].includes(s.state);
  const attack=s.hazard?.kind;
  const p=active?(s.state==='tell'?1-clamp(s.timer/s.hazard.length,0,1):1):0;
  const release=s.state==='impact'?Math.sin(clamp(s.timer/.43,0,1)*Math.PI):0;
  const wind=Math.sin(p*Math.PI/2);
  const lunge=release*(attack==='wave'?1.3:attack==='burst'?1.1:.65);
  const attackDx=active?(attack==='wave'?wind*18:attack==='vortex'?Math.sin(p*Math.PI*2)*23:attack==='lightning'?Math.sin(s.age*55)*8:0):0;
  const attackDy=active?(attack==='burst'?-wind*35:attack==='wave'?-wind*48:attack==='vortex'?-wind*18:attack==='lightning'?-wind*25:0):0;
  const victory=s.state==='victory', fall=clamp((s.victoryTime-3.15)/2.1,0,1);
  const breathe = s.cardMode && s.reduceMotion ? 0 : s.age;
  return {
    visible,
    dx: (s.bossOffset?.[0] ?? 0)+Math.sin(breathe*(1.45+s.phase*.2))*11+attackDx-lunge*40+s.stagger*32+(victory?Math.sin(s.victoryTime*11)*fall*28:0),
    dy: (s.bossOffset?.[1] ?? 0)+Math.sin(breathe*2.5)*9+attackDy+lunge*20+(1-visible)*326+(victory?fall*95:0),
    tilt: Math.sin(breathe*1.33)*.024+(attack==='vortex'&&active?Math.sin(p*Math.PI*2)*.09:0)-lunge*.075+s.stagger*.12+(victory?fall*.12:0),
    attack, progress:p, release,
  };
}

const jaw = new Path2D('M513 647 Q496 724 460 773 Q443 824 423 891 L437 940 L330 953 L292 838 L304 790 Q350 832 390 771 L439 704 Z');
const upperDragon = new Path2D();
upperDragon.rect(0,0,1536,1024);
upperDragon.addPath(jaw);

function dragon(g,s,im,atlas,portDragon) {
  const p=bossPose(s);
  if (portDragon) {
    g.save();
    g.beginPath();
    g.rect(0, 0, W, 531);
    g.clip();
    g.translate(1126 + p.dx, 340 + p.dy);
    g.rotate(p.tilt * .67);
    g.globalAlpha = Math.min(1, p.visible * 1.6);
    if (p.visible > 0) g.drawImage(portDragon, -626, -403, 1128, 564);
    g.restore();
    p.dx += 126;
    p.dy += 13;
    if (p.visible > 0 && (s.stagger || s.state === 'enrage')) {
      glow(g, TARGET[0] + p.dx, TARGET[1] + p.dy, 105, '#97e3ff47');
    }
    return p;
  }
  if(p.visible<=0)return p;
  g.save();
  g.clip(s.cardMode ? cardSea : sea,'evenodd');
  // Rear coil bends in the far water and is partly lost in the surf.
  for(let i=12;i>=0;i--){
    const x=515+i*16,y=204-Math.sin(i/12*Math.PI)*78+(p.dy-(s.bossOffset?.[1] ?? 0))*.75;
    const angle=-.7+i*.11;
    ellipse(g,x,y,30,19,'#142d6e','#273d79',2,angle);
    if(im.naturalWidth){
      g.save();
      g.clip();
      g.translate(x,y);
      g.rotate(angle);
      g.globalAlpha=.62;
      g.drawImage(im,im.naturalWidth*.74,im.naturalHeight*.37,im.naturalWidth*.07,im.naturalHeight*.12,-31,-20,62,40);
      g.restore();
    }
  }
  g.translate(1100+p.dx,452+p.dy);
  g.rotate(p.tilt);
  if(atlas?.naturalWidth){
    g.globalAlpha=Math.min(1,p.visible*1.9);
    drawPose(g,atlas,BOSS_CELLS,bossFrame(s),57,52,1.19);
  } else if(im.naturalWidth){
    g.globalAlpha=Math.min(1,p.visible*1.9);
    g.translate(-408,-411);
    g.scale(674/1536,452/1024);
    const jawProgress=s.hazard&&['tell','impact'].includes(s.state)?(s.state==='tell'?1-clamp(s.timer/s.hazard.length,0,1):1):0;
    const jawAngle=s.state==='tell'?-.035-.22*jawProgress
      :s.state==='impact'?-.26+.38*Math.sin(s.timer/.43*Math.PI):.018*Math.sin(s.age*4);
    g.save();
    g.clip(upperDragon,'evenodd');
    g.drawImage(im,0,0,1536,1024);
    g.restore();
    g.translate(513,647);
    g.rotate(jawAngle);
    g.translate(-513,-647);
    g.clip(jaw);
    g.drawImage(im,0,0,1536,1024);
  }
  g.restore();
  if(s.state==='enrage'||s.state==='impact') {
    glow(g,TARGET[0]+p.dx,TARGET[1]+p.dy,120,s.phase===2?'#aa2cfa79':'#18aaff57');
  }
  if(s.state!=='emerge'&&s.state!=='sinking')glow(g,861+p.dx,274+p.dy,20+Math.sin(s.age*5)*5,'#50e4ff70');
  if(s.stagger>0)glow(g,TARGET[0]+p.dx,TARGET[1]+p.dy,70,'#edb2ffb0');
  return p;
}

function hazard(g,s,ground=floor,port=false,stormfang=false) {
  const h=s.hazard;
  if(!h)return;
  const impact=s.state==='impact';
  const progress=impact?1:1-clamp(s.timer/h.length,0,1);
  g.save();
  g.clip(ground);
  const fill=impact?'#83edffc7':`rgba(247,79,134,${.17+progress*.2})`;
  const border=impact?'#e7fdff':port?'#ff668e':'#ffbb9e';
  if (port && !impact) {
    g.shadowColor = '#f83f85';
    g.shadowBlur = 7;
  }
  if(h.type==='circle'){
    ellipse(g,h.x,h.y,h.r,h.r/1.3,fill,border,4);
    ellipse(g,h.x,h.y,h.r*progress,h.r*progress/1.3,null,impact?'#803fff':'#ffecb3',3);
    if(impact&&(h.kind==='vortex'||h.kind==='abyss')) {
      for(let i=0;i<4;i++)ellipse(g,h.x,h.y,h.r*(.25+i*.2),h.r*(.1+i*.1),null,i%2?'#ffe7ff':'#702aff',6,s.age*5+i);
    }
  } else if(h.type==='lightning') {
    const pulse=.72+Math.sin(s.age*18)*.18;
    ellipse(g,h.x,h.y,h.r,h.r/1.3,impact?'#8aeaffb8':`rgba(116,203,255,${.12+pulse*.13})`,impact?'#edfcff':'#78dfff',4);
    ellipse(g,h.x,h.y,h.r*progress,h.r*progress/1.3,null,'#b8f4ff',2);
    if(impact&&!stormfang){
      glow(g,h.x,h.y-215,96,'#63dffff0');
      const bolt=[[h.x-8,h.y-310],[h.x+18,h.y-256],[h.x-3,h.y-218],[h.x+16,h.y-166],[h.x,h.y-106],[h.x+5,h.y-38]];
      line(g,bolt,'#8beaff',15);line(g,bolt,'#f4ffff',5);
      for(let i=0;i<5;i++)ellipse(g,h.x,h.y,h.r*(.26+i*.15),h.r*(.12+i*.075),null,'#74ddffb8',2,s.age*2+i);
    }
  } else {
    const a=h.type==='sweep'?[[h.x-h.half,330],[h.x+h.half,330],[h.x+h.half,880],[h.x-h.half,880]]:
      [[0,h.y-.32*h.origin-h.half],[W,h.y+.32*(W-h.origin)-h.half],[W,h.y+.32*(W-h.origin)+h.half],[0,h.y-.32*h.origin+h.half]];
    g.beginPath();
    a.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
    g.closePath();
    g.fillStyle=fill;g.fill();
    // Dashed, pulsing bounds read as a deliberate attack warning instead of
    // long solid diagonals that look like stray wires across the dock.
    g.save();g.setLineDash([13,11]);g.lineDashOffset=-s.age*24;
    g.strokeStyle=impact?'rgba(231,253,255,.78)':`rgba(255,187,158,${.32+progress*.32})`;
    g.lineWidth=2.5+progress*1.3;g.stroke();g.restore();
  }
  g.restore();
}

function bossAttack(g,s,pose) {
  const h=s.hazard;
  if(!h||!['tell','impact'].includes(s.state))return;
  if(h.kind==='wave'){
    const p=s.state==='impact'?1-clamp(s.timer/.43,0,1):1-clamp(s.timer/h.length,0,1), y=h.y+Math.sin(s.age*8)*8;
    // A crest that visibly rolls from the monster toward the marked dock lane.
    const frontX=s.state==='impact'?1120-p*890:1450-p*390;
    const height=s.state==='impact'?160-p*45:42+p*150, span=250+p*210, x=frontX;
    g.save();g.globalAlpha=s.state==='impact'?1-p*.75:.2+p*.7;
    const wave=new Path2D();wave.moveTo(x-span,y+92);wave.bezierCurveTo(x-span*.52,y+45-height*.28,x-span*.12,y-height*.28,x+span*.18,y-height);
    wave.bezierCurveTo(x+span*.44,y-height*.76,x+span*.13,y-height*.26,x+span*.52,y-height*.36);
    wave.bezierCurveTo(x+span*.38,y+height*.12,x+span*.18,y+70,x+span*.7,y+102);wave.closePath();
    g.fillStyle='#087ac9d9';g.fill(wave);g.strokeStyle='#77e9ff';g.lineWidth=6+p*9;g.stroke(wave);
    line(g,[[x-span*.3,y+37],[x-span*.05,y+9-height*.35],[x+span*.18,y-height*.78],[x+span*.37,y-height*.42]],'#edffff',5+p*4);
    glow(g,x+span*.15,y-height*.47,45+p*38,'#39cfffff');
    for(let i=0;i<7;i++){
      const q=(i/7+p*.9)%1, sx=x-span*.3+q*span*.8, sy=y-height*(.2+Math.sin(q*Math.PI)*.6)+Math.sin(s.age*13+i)*8;
      ellipse(g,sx,sy,3+i%3,5+i%4,'#d9fbff','#5fe4ff',1,-.35);
    }
    g.restore();return;
  }
  if(h.kind==='vortex'||h.kind==='abyss'){
    const p=1-clamp(s.timer/h.length,0,1), r=h.r*(.35+p*.65), impact=s.state==='impact';
    // Nested elliptical currents create a rising cylindrical prison rather than a flat target ring.
    for(let i=0;i<5;i++){
      const k=(i/5+s.age*(impact?1.1:.48))%1, yy=h.y-20-k*(150+100*p), rx=r*(.42+.58*k), ry=rx*(.22+.1*Math.sin(k*Math.PI));
      ellipse(g,h.x,yy,rx,ry,null,i%2?'#5ef2ff':'#d079ff',2.5+i%2,s.age*(i%2?3:-2)+i);
      for(let j=0;j<3;j++){
        const a=s.age*(2.5+j*.35)+i*1.4+j*2.09;
        const px=h.x+Math.cos(a)*rx, py=yy+Math.sin(a)*ry;
        glow(g,px,py,12,'#66dffff0');ellipse(g,px,py,3,5,'#e7fdff','#a1eeff',1,a);
      }
    }
    for(let side=-1;side<=1;side+=2){
      const points=[];for(let i=0;i<=12;i++){const k=i/12, yy=h.y-15-k*(150+100*p),xx=h.x+side*(r*.6+Math.sin(k*9+s.age*5)*r*.27);points.push([xx,yy]);}
      line(g,points,side<0?'#56dffff0':'#c97affed',5);
    }
    return;
  }
  if(h.kind==='lightning'){
    const p=1-clamp(s.timer/h.length,0,1), sx=TARGET[0]+pose.dx;
    const endY=h.y, charge=.2+p*.8, flicker=Math.sin(s.age*42);
    const trunk=[[sx+Math.sin(s.age*23)*9,172],[sx-28*flicker,215],[sx+24*flicker,251],[sx-12,290],[h.x,endY]];
    line(g,trunk,`rgba(53,190,255,${.25+charge*.58})`,5+charge*7);line(g,trunk,`rgba(229,253,255,${.35+charge*.6})`,1.7+charge*2);
    for(let b=0;b<4;b++){
      const at=.24+b*.16, bx=sx+(h.x-sx)*at, by=172+(endY-172)*at, dir=b%2?1:-1;
      const branch=[[bx,by],[bx+dir*23,by+20],[bx+dir*16,by+43],[bx+dir*45,by+62]];
      line(g,branch,'#42ccffff',3+charge*3);line(g,branch,'#e7fcff',1.5);
    }
    glow(g,sx,180,45+charge*35,'#35bdffb8');
    return;
  }
  if(h.kind!=='burst')return;
  if(s.state==='impact'){
    const p=1-clamp(s.timer/.43,0,1);
    const sx=TARGET[0]+pose.dx, sy=TARGET[1]+pose.dy;
    g.save();g.globalCompositeOperation='screen';
    for(let i=0;i<3;i++){
      const travel=clamp(p-i*.12,0,1),radius=30+travel*173;
      if(!travel)continue;
      const x=sx+(h.x-sx)*travel,y=sy+(h.y-sy)*travel;
      g.globalAlpha=(1-travel)*(.72-i*.13);
      ellipse(g,x,y,radius*.58,radius,null,i%2?'#e5a2ff':'#64d5ff',5-i,.75);
      ellipse(g,x,y,radius*.54,radius*.94,null,'#d1f5ff',2,.75);
    }
    g.restore();
  }
  if(s.timer>.25)return;
  const p=1-clamp(s.timer/.25,0,1);
  const sx=TARGET[0]+pose.dx, sy=TARGET[1]+pose.dy+21;
  const x=sx+(h.x-sx)*p,y=sy+(h.y-sy)*p-Math.sin(p*Math.PI)*34;
  line(g,[[x+32,y-19],[x,y]],'#479affbd',9);
  glow(g,x,y,29,'#66e5ff96');
  ellipse(g,x,y,12,8,'#c8fbff','#21b9ef',3);
}

function bossSkillFrames(g,s,art,quality,pose) {
  const h=s.hazard;
  if(!h||!['tell','impact'].includes(s.state))return;
  // The two legacy sheets contain painted copies of the dragon. Their
  // standalone light and pressure effects are rendered by bossAttack.
  if(art.cinematic?.bakunawa?.naturalWidth&&['burst','lightning'].includes(h.kind))return;
  const id={burst:'roar',wave:'tidal',vortex:'maelstrom',lightning:'stormfang'}[h.kind];
  const sheet=art.skills?.[id];
  const sheetWidth=sheet?.naturalWidth||sheet?.width;
  if(!sheetWidth)return;
  const side=sheetWidth/8;
  const sheetHeight=sheet?.naturalHeight||sheet?.height;
  if(!sheetHeight)return;
  // The first four source poses play during the warning; the release uses the final four.
  const progress=s.state==='tell'?1-clamp(s.timer/h.length,0,1):1+1-clamp(s.timer/.43,0,1);
  // Eight distinct key poses advance at combat speed without silhouette ghosting.
  const frame=clamp(Math.floor(progress*4),0,7);
  let cx=h.x,cy=h.y,size=390,alpha=quality===0?.8:1;
  if(h.kind==='burst'){cx=1070+pose.dx;cy=306+pose.dy;size=470+pose.release*45;alpha*=.88;}
  if(h.kind==='wave'){
    const p=s.state==='tell'?pose.progress:1+1-clamp(s.timer/.43,0,1);
    cx=(s.state==='tell'?1510-p*370:1140-p*790);cy=470+Math.sin(s.age*8)*11;size=500+p*185;alpha*=.88;
  }
  if(h.kind==='vortex'){cx=h.x;cy=h.y-95;size=420+pose.progress*120;alpha*=.92;}
  if(h.kind==='lightning'){cx=1010+pose.dx;cy=300+pose.dy;size=445+pose.release*50;alpha*=.92;}
  // Keep each complete frame inside the battle viewport. The old 500–685 px
  // wave sprite began mostly beyond the right edge, so its early poses looked
  // like badly cropped fragments on smaller screens.
  size=Math.min(size,W-24,H-24);
  cx=clamp(cx,size/2+12,W-size/2-12);
  cy=clamp(cy,size/2+12,H-size/2-12);
  g.save();
  g.globalCompositeOperation='screen';
  // Advance on clean key frames instead of cross-fading different silhouettes,
  // which produced doubled edges and a smeared/cropped look.
  g.imageSmoothingEnabled=true;
  g.imageSmoothingQuality='high';
  g.globalAlpha=alpha;
  g.save();
  if(h.kind==='wave')g.rotate(-.035);
  if(h.kind==='vortex'){g.translate(cx,cy);g.rotate(s.age*(s.state==='impact' ? -.22 : -.1));g.translate(-cx,-cy);}
  // The atlas frames are full square panels. Inset the source a couple of
  // pixels to prevent neighboring frame matte/seams from appearing at runtime.
  const sourceInset=2, sourceSize=side-sourceInset*2;
  const destSize=size;
  g.drawImage(sheet,frame*side+sourceInset,sourceInset,sourceSize,Math.min(sourceSize,sheetHeight-sourceInset*2),cx-destSize/2,cy-destSize/2,destSize,destSize);
  g.restore();
  if(s.state==='impact'&&!s.reduceMotion){
    const flash=clamp(1-s.timer/.24,0,1);
    if(flash>0){g.globalAlpha=flash*(h.kind==='lightning'?.48:.25);glow(g,cx,cy,size*.64,h.kind==='vortex'?'#b23bff':'#50dfffff');}
    if(h.kind==='burst'){
      const q=1-s.timer/.43;
      for(let i=0;i<3;i++)ellipse(g,1065+pose.dx,320+pose.dy,70+q*165+i*20,23+q*48+i*9,null,i%2?'#68eaff':'#e9a0ff',5-i,s.age*2+i);
    }
  }
  g.restore();
}

function impactVfx(g,s,pose,quality) {
  if (s.stagger <= 0) return;
  const progress=clamp(1-s.stagger/.42,0,1),x=TARGET[0]+pose.dx,y=TARGET[1]+pose.dy,r=24+progress*112;
  g.save();g.globalCompositeOperation='screen';g.globalAlpha=(1-progress)*(quality===0?.42:.72);
  glow(g,x,y,54+r*.48,s.phase===2?'#c04aff':'#63dfffff');
  for(let i=0;i<3;i++){const radius=r*(.48+i*.28);ellipse(g,x,y,radius,radius*.46,null,i===1?'#f2bdff':'#8eeaff',Math.max(1,4-i),s.age*(i%2?-.8:.65)+i)}
  const count=quality===0?5:quality===1?9:14;
  for(let i=0;i<count;i++){const a=s.age*(1.2+i%3*.35)+i*Math.PI*2/count,d=r*(.6+(i%4)*.16),px=x+Math.cos(a)*d,py=y+Math.sin(a)*d*.52;
    line(g,[[px-Math.cos(a)*10,py-Math.sin(a)*6],[px,py]],i%3?'#9ceeff':'#f4b6ff',i%3?2:3);glow(g,px,py,7,i%3?'#57dfffff':'#d657ffcc')}
  g.restore();
}

function victoryVfx(g,s,pose,quality) {
  if (s.state !== 'victory') return;
  const t=s.victoryTime,x=s.x,y=s.y-66,tx=TARGET[0]+pose.dx,ty=TARGET[1]+pose.dy;
  g.save();g.globalCompositeOperation='screen';
  if(t<1.58){
    const p=clamp(t/1.58,0,1),r=22+p*82;
    g.globalAlpha=.38+p*.42;
    arcane(g,x+50,y,r,t*2.6,true);
    for(let i=0;i<(quality===0?6:12);i++){
      const a=t*(1.5+i%3*.38)+i*Math.PI*2/(quality===0?6:12),d=38+p*68;
      const sx=x+50+Math.cos(a)*d,sy=y+Math.sin(a)*d*.62;
      glow(g,sx,sy,9,i%2?'#81f2ff':'#e69aff');ellipse(g,sx,sy,2.5,4,'#f8eaff',i%2?'#8cf1ff':'#f1a5ff',1,a);
    }
    glow(g,x+50,y,58+p*42,'#954cff72');
  }else if(t<2.55){
    const p=clamp((t-1.58)/.97,0,1),w=(16+Math.sin(t*35)*3)*(1-p*.28);
    const sx=x+55,sy=y-12;
    glow(g,(sx+tx)/2,(sy+ty)/2,105,'#aa42ff9a');
    line(g,[[sx,sy],[sx+(tx-sx)*.45,sy+(ty-sy)*.45],[tx,ty]],'#a44eff',w*2.5);
    line(g,[[sx,sy],[sx+(tx-sx)*.45,sy+(ty-sy)*.45],[tx,ty]],'#69eaff',w*1.3);
    line(g,[[sx,sy],[tx,ty]],'#f4edff',Math.max(2,w*.32));
    for(let i=0;i<(quality===0?4:8);i++){
      const q=(t*1.8+i/(quality===0?4:8))%1,px=sx+(tx-sx)*q,py=sy+(ty-sy)*q;
      const jitter=Math.sin(t*48+i*4)*8;
      glow(g,px,py+jitter,12,'#c77aff');ellipse(g,px,py+jitter,3,5,'#fff','#9eeaff',1,t*12+i);
    }
    glow(g,tx,ty,110+p*40,'#d45cff');
  }else{
    const p=clamp((t-2.55)/3.05,0,1),r=35+p*235,fade=1-p*.7;
    g.globalAlpha=fade*.75;
    ellipse(g,tx,ty,r,r*.35,null,'#83eaff',6,t*.22);
    ellipse(g,tx,ty,r*.76,r*.27,null,'#cb74ff',3,-t*.3);
    if(quality>0){
      for(let i=0;i<(quality===1?12:22);i++){
        const a=i*2.399+t*(.55+i%3*.12),q=(i*.137+t*.22)%1,d=42+q*210;
        const px=tx+Math.cos(a)*d,py=ty+Math.sin(a)*d*.38;
        glow(g,px,py,7,'#57dffff0');ellipse(g,px,py,2,4,'#f2fdff','#73dcff',1,a);
      }
    }
    glow(g,tx,ty,150*fade,'#8842ff70');
  }
  g.restore();
}

function slashRibbon(g,x,y,r,combo,fraction,crimson=false){
  g.save();g.translate(x,y);g.rotate(combo===2?-.82:combo===3?1.05:-.32);
  const end=-2.6+4.4*Math.min(1,fraction*1.7);
  for(const [width,color] of (crimson?[[1,'#801c36'],[.65,'#ff454e'],[.2,'#ffe4b9']]:[[1,'#153e86'],[.65,'#48caff'],[.2,'#ecffff']])){
    g.beginPath();
    for(let edge=0;edge<2;edge++)for(let i=0;i<=16;i++){
      const u=edge?1-i/16:i/16,a=end-2.4+2.4*u;
      const radius=r+(edge?-1:1)*width*r*.14*Math.sin(Math.PI*u);
      const px=Math.cos(a)*radius,py=Math.sin(a)*radius*.57;
      if(!edge&&!i)g.moveTo(px,py);else g.lineTo(px,py);
    }
    g.closePath();g.fillStyle=color;g.fill();
  }
  g.restore();
}

function swordPose(g,s,x,y,showBlade){
  const release=s.bladeRelease, elapsed=release?s.age-release.age:1;
  const cast=s.cast;
  const kind=cast?.kind||(elapsed<.36?release.kind:null);
  const combo=cast?.combo||release?.combo||1;
  const progress=cast?1-cast.time/cast.total:0;
  const swing=cast?clamp((progress-.7)/.3,0,1):elapsed<.36?1+elapsed:0;
  const face=s.dodge?s.dodge.x<0?-1:1:s.x>MELEE_TARGET[0]?-1:1;
  const angles=[-.95,-1.9,.8,-2.5];
  let angle=s.guard?-1.42:kind?angles[combo-1]+swing*(combo===3?4.8:2.6):-.61;
  if(cast?.kind==='ultimate'&&progress>.26&&progress<.78)angle=-1.3+Math.sin(progress*44)*1.4;
  if(kind==='wave'&&swing>.5)angle=-angle-1.4;
  g.save();
  g.translate(x+face*27,y-61);g.scale(face,1);g.rotate(angle);
  if(kind && kind !== s.fieldEffects?.hero.kind && (swing>0||kind==='ultimate')){
    g.save();g.rotate(-.9);
    slashRibbon(g,0,0,kind==='ultimate'?136:combo===3?99:72,combo,Math.max(.3,swing),true);
    if(kind==='wave'){g.rotate(1.55);slashRibbon(g,0,0,74,2,swing,true)}
    g.restore();
  }
  if(showBlade){
    line(g,[[-13,0],[7,0]],'#59402d',7);
    line(g,[[7,-9],[7,9]],'#dcae69',4);
    g.fillStyle='#ffd8dd';
    g.beginPath();g.moveTo(8,-4);g.lineTo(74,-3);g.lineTo(86,0);g.lineTo(70,4);g.lineTo(8,4);g.fill();
    line(g,[[10,2],[70,2],[84,0]],'#f43b55',2);
  }
  g.restore();
}

function actor(g,s,drawHero,poses,atlas,port=false) {
  const x=Math.round(s.x);let y=Math.round(s.y);
  let frame=atlas?.naturalWidth?heroFrame(s):-1;
  const target=s.hero==='loki'?MELEE_TARGET[0]:TARGET[0];
  const movingSide = port && s.moving && !s.cast && Math.abs(s.vx)>45;
  const facing=s.dodge?s.dodge.x<0?-1:1:movingSide?s.vx<0?-1:1:s.x>target?-1:1;
  const cells = port ? PORT_HERO_CELLS : HERO_CELLS;
  const scale = port ? clamp(1.025 + (s.y - 650) * .00068, .90, 1.13) : .63;
  if (port && frame < 0) {
    frame = s.hero === 'loki' ? 2 : 5;
    const stride = s.reduceMotion ? 0 : Math.abs(Math.sin(s.age * 19));
    y -= Math.round(stride * 5);
  }
  if (port && s.hero === 'yhannie' && frame === 7 && (s.hurt || s.state==='lost')) frame=4;
  if (port) frame = fieldPose(s, frame);
  ellipse(g,x,s.y,port?51:32,port?13:10,'#0b0717a0');
  if(s.cardMode){
    const pulse=s.reduceMotion?0:Math.sin(s.age*2.4);
    const light=s.hero==='loki'?'#ffc699':'#ffbcf4';
    glow(g,x,y,65+pulse*5,s.hero==='loki'?'#fc7b654f':'#c23dff59');
    ellipse(g,x,y-1,62+pulse*2,25,'#54226f37',light,2.4);
    ellipse(g,x,y-1,51+pulse*2,19,null,'#ffd18d83',1.4);
  }
  if(s.cast&&(s.cast.kind==='aerial'||(s.hero==='loki'&&s.cast.kind==='ultimate'))){
    const phase=1-s.cast.time/s.cast.total;
    if(phase>.22)y-=Math.sin(Math.PI*(phase-.22)/.78)*(s.cast.kind==='ultimate'?132:86);
  }
  if (port) paintPortReflection(g, atlas, frame, x, y, s.y, scale, facing, s.hero);
  if(s.guard&&s.hero!=='loki')ellipse(g,x,y-39,44,52,'#277bff34','#78e4ffd8',3);
  if(s.dodge)for(let i=1;i<(s.reduceMotion?2:4);i++){
    g.globalAlpha=.18/i;
    const trailX=x-s.dodge.x*i*17,trailY=y-s.dodge.y*i*15;
    if(frame>=0)drawPose(g,atlas,cells,5,trailX,trailY,scale,facing);
    else drawHero(g,'idle',s.direction,s.age,trailX,trailY,91);
    ellipse(g,trailX,trailY-4,17,5,s.hero==='loki'?'#95c7e8':'#bd7cff');

  }
  g.globalAlpha=s.state==='lost'?.52:!s.reduceMotion&&s.hurt>0&&Math.floor(s.age*24)%2?.58:1;
  let castBlend=null,castStep=0;
  if(s.cast){
    const phase=clamp((1-s.cast.time/s.cast.total)*3,0,2.999),slot=Math.floor(phase),fraction=phase-slot;
    const from=slot===0?1:slot===1?2:(s.cast.kind==='ultimate'?4:3);
    const to=slot===0?2:(s.cast.kind==='ultimate'?4:3);
    // Hold each readable pose, then cross-fade briefly at the transition.
    const mix=clamp((fraction-.72)/.28,0,1);castStep=slot;
    castBlend={from,to,mix:mix*mix*(3-2*mix)};
  }
  const pose=s.state==='won'||(s.state==='victory'&&s.victoryTime>2.55)?7:s.hurt?5:s.dodge?6:s.cast?(castBlend.mix<.5?castBlend.from:castBlend.to):s.shot&&s.shot.t<.45?3:s.guard?2:!s.moving?0:-1;
  // Reuse Marinie City's proven map sprite for idle/movement. The battle atlas
  // contains mostly cast poses, so using its first frame as the opening idle
  // made Yhannie appear to vanish on the dock in the intro.
  const useCombatPose=s.hero!=='loki'&&poses.naturalWidth&&pose>=0&&(s.hurt||s.dodge||s.cast||s.shot||s.state==='won'||s.state==='victory');
  if(frame>=0){
    drawPose(g,atlas,cells,frame,x,y,scale,facing);
  } else if(useCombatPose){
    const cell=poses.naturalWidth/4, height=poses.naturalHeight/2;
    if(s.cast&&castBlend){
      g.globalAlpha*=1-castBlend.mix;
      g.drawImage(poses,(castBlend.from%4)*cell,Math.floor(castBlend.from/4)*height,cell,height,x-86,y-151,172,172);
      if(castBlend.mix>0){
        g.globalAlpha=castBlend.mix;
        g.drawImage(poses,(castBlend.to%4)*cell,Math.floor(castBlend.to/4)*height,cell,height,x-86,y-151,172,172);
      }
      g.globalAlpha=!s.reduceMotion&&s.hurt>0&&Math.floor(s.age*24)%2?.58:1;
    }else g.drawImage(poses,(pose%4)*cell,Math.floor(pose/4)*height,cell,height,x-86,y-151,172,172);
  } else {
    g.save();
    g.translate(x,y);
    if(s.hero==='loki'&&s.cast){
      const lean=-.10+.26*(1-s.cast.time/s.cast.total);
      g.translate(lean*42,0);g.rotate(lean);
    }
    if(s.hurt)g.rotate(-.16);
    if(s.dodge&&!s.reduceMotion)g.rotate(s.dodge.x*.14);
    drawHero(g,s.moving?(Math.hypot(s.vx,s.vy)>200?'run':'walk'):'idle',s.cast?'right':s.direction,s.age,0,0,132);
    g.restore();
  }
  g.globalAlpha=1;
  const guardAge=s.age-(s.guardImpact??-10);
  if(guardAge<.32){
    const q=guardAge/.32,r=16+q*68;
    ellipse(g,x+24,y-52,r,r*.62,null,`rgba(178,240,255,${1-q})`,3);
  }
  if(s.hero==='loki'){
    swordPose(g,s,x,y,frame<0);
    const release=s.bladeRelease,age=s.age-(release?.age??-1);
    if(release?.kind==='crescent'&&age<.36){
      const radius=13+age*260;
      ellipse(g,x+35,y-3,radius,radius*.29,null,'#ff536b',3);
    }
    return;
  }
  const healing=s.age-(s.healStarted??-1);
  if(healing<.7){
    const q=healing/.7;
    g.save();g.globalAlpha=1-q;
    ellipse(g,x,y,28+q*60,10+q*22,null,'#aaff83',3);
    for(let i=0;i<9;i++){
      const angle=i*2.399+q*2;
      ellipse(g,x+Math.cos(angle)*42,y-8-q*(35+i*7),2,4,i%2?'#aaff83':'#ffe4a0');
    }
    g.restore();
  }
  if(s.guard){
    const p=clamp(s.guard/.85,0,1);
    for(let i=0;i<2;i++)ellipse(g,x,y-39,46,47*(.45+i*.25),null,i?'#c88cff':'#73eaff',2,s.age*(i?1:-1)*1.8);
    if(p<.22)for(let i=0;i<8;i++){
      const a=i*Math.PI/4+s.age,r=46+(1-p)*13;
      ellipse(g,x+Math.cos(a)*r,y-39+Math.sin(a)*r,2,2,'#9fefff');
    }
  }
  if(s.cast && s.cast.kind !== s.fieldEffects?.hero.kind){
    const raw=clamp(1-s.cast.time/s.cast.total,0,1),charge=raw*raw*(3-2*raw);
    const r=16+charge*(s.cast.kind==='ultimate'?53:30);
    if(port && s.cast.kind !== 'ultimate'){
      arcane(g,x+62*facing,y-112,38+charge*31,s.reduceMotion?0:s.age,true,true);
      ellipse(g,x,y,57+charge*25,17+charge*6,null,'#81ebffbb',2);
    }else if(s.cast.kind==='ultimate'){
      arcane(g,x,y-47,r*1.45,s.age,true);
      for(let i=0;i<3;i++)ellipse(g,x,y-48,r*(1.25+i*.28),r*(.35+i*.1),null,i%2?'#65dffff0':'#d78aff',2,s.age*(i%2?1.7:-1.3));
    }else if(s.cast.kind==='bolt'){
      if(s.hero==='loki')slashRibbon(g,x+16,y-64,44,s.cast.combo,charge*.5);
      else{
        for(const sign of [-1,1]){
          g.save();g.translate(x+32+sign*(1-charge)*27,y-64);g.rotate(sign*(charge*2.4+.6));
          g.strokeStyle='#c38aff';g.lineWidth=2;const side=16-charge*9;g.strokeRect(-side/2,-side/2,side,side);g.restore();
        }
        ellipse(g,x+32,y-64,3+charge*5,3+charge*5,'#fff2ff');
      }
      if(s.cardMode)arcane(g,x+36,y-64,15+charge*36,s.age,false);
      else if(s.cast.combo===3)arcane(g,x-18,y-60,54,s.age,true);
    }else if(s.cast.kind==='wave'){
      for(let i=0;i<2;i++)ellipse(g,x,y-12-i*33,53+charge*24,12+i*8,null,i?'#b68aff':'#79edff',3,s.age*(i?1:-1));
    }else if(s.cast.kind==='crescent'){
      ellipse(g,x-23,y-79,r,r,'#d1adff');ellipse(g,x-15,y-87,r*.88,r*.88,'#242049');
    }else arcane(g,x+50,y-62,r,s.age,true);
    glow(g,x+42,y+9,60,'#a95bff42');
  }
  if(s.hero!=='loki'&&s.shot?.kind==='bolt'&&s.shot.combo){
    const n=s.shot.combo, glowColor=n===3?'#f4b6ff':'#a66aff';
    for(let i=0;i<n;i++){
      const a=s.age*5+i*Math.PI*2/3;
      ellipse(g,x+Math.cos(a)*32,y-52+Math.sin(a)*15,5,5,glowColor,'#fff',1);
    }
    if(n===3)glow(g,x,y-54,56,'#d653ff8f');
  }
}

function spellContact(g,s,pose,quality,atlas){
  const hit=s.skillImpact;
  if(!hit)return;
  const heavy=hit.kind==='ultimate'||hit.kind==='charge'||(s.hero==='loki'&&hit.combo===3);
  const progress=(s.age-hit.age)/(heavy?.52:.32);
  if(progress<0||progress>=1)return;
  const radius=(heavy?94:49)*(1-(1-progress)**3);
  const count=quality===0?6:12;
  g.save();
  const melee=s.hero==='loki'&&hit.kind!=='wave';
  g.translate(melee?MELEE_TARGET[0]:TARGET[0]+pose.dx,melee?MELEE_TARGET[1]-72:TARGET[1]+pose.dy);
  g.scale(1,.71);
  g.globalAlpha=(1-progress)**1.4;
  g.strokeStyle=s.hero==='loki'?'#ff655a':hit.kind==='wave'?'#63efff':hit.kind==='ultimate'?'#ffd089':'#ce9fff';
  g.lineWidth=3;
  if(atlas?.naturalWidth&&!s.reduceMotion){
    const frame=Math.min(7,Math.floor(progress*8));
    const row=s.hero==='loki'?1:0;
    const size=heavy?240:hit.kind==='charge'?160:125;
    g.drawImage(atlas,frame*64,row*64,64,64,-size/2,-size/2,size,size);
  }
  g.beginPath();g.ellipse(0,0,radius,radius,0,0,Math.PI*2);g.stroke();
  for(let i=0;i<count;i++){
    const angle=i*Math.PI*2/count+hit.age,reach=radius*(1.1+.22*Math.sin(i*9));
    g.save();g.rotate(angle);g.fillStyle=i%2?'#fff4da':g.strokeStyle;
    g.beginPath();g.moveTo(reach+12,0);g.lineTo(reach-3,2.5);g.lineTo(reach-9,0);g.fill();g.restore();
  }
  g.restore();
}

function moonSpear(g, x, y, angle) {
  g.save();
  g.translate(x,y);
  g.rotate(angle);
  glow(g,0,0,42,'#ae65ffac');
  line(g,[[-62,0],[-12,0],[21,0]],'#4edaff',6);
  line(g,[[-51,0],[22,0]],'#fff6ff',2);
  g.beginPath();
  g.moveTo(-5,-9);g.lineTo(23,0);g.lineTo(-5,9);g.lineTo(0,0);g.closePath();
  g.fillStyle='#f1dbff';g.fill();
  g.restore();
}

export function render(g, canvas, art, s, quality, drawHero) {
  const port = s.cardMode ? null : art.port;
  const fieldFx = port?.effects && s.fieldEffects ? port.effects : null;
  const enhancedKind = fieldFx ? s.fieldEffects.hero.kind : null;
  const stormfang = fieldFx && s.hazard?.kind === s.fieldEffects.boss.kind;
  const cover=s.cardMode?Math.max(canvas.width/W,canvas.height/H):null;
  const ratioX=cover??canvas.width/W, ratioY=cover??canvas.height/H;
  const beat = ultimateBeat(s);
  const tidebreaker = s.hero === 'yhannie' ? art.tidebreaker : null;
  const abyssbreaker = s.hero === 'loki' ? art.abyssbreaker : null;
  const enhancedUltimate = Boolean(tidebreaker || abyssbreaker);
  const ultimateShot = enhancedUltimate && (s.shot?.cardKind ?? s.shot?.kind) === 'ultimate';
  const camera=cameraFor(s,quality,beat), zoom=camera.zoom;
  g.setTransform(1,0,0,1,0,0);
  g.fillStyle='#020814';g.fillRect(0,0,canvas.width,canvas.height);
  g.setTransform(ratioX*zoom,0,0,ratioY*zoom,
    canvas.width/2-camera.x*ratioX*zoom,
    canvas.height/2-camera.y*ratioY*zoom);
  g.imageSmoothingEnabled=false;
  if (port) paintPortBackground(g, port, art.crest, s, quality);
  else {
    if(art.dock.naturalWidth)g.drawImage(art.dock,0,0,W,H);
    water(g,s,quality,false,art.crest);
    water(g,s,quality,true,art.crest);
  }
  paintAtmosphere(g,s,quality,false);
  const pose=dragon(g,s,art.dragon,art.cinematic?.bakunawa,port?.dragon);
  if (port) paintPortSurf(g, art.crest, s, quality, pose);
  if(s.cardMode)cardSurf(g,s,art.crest,pose);
  if(quality){
    if(!port)glow(g,258,s.cardMode?224:296,65+Math.sin(s.age*13)*6,'#ff9b343b');
    if(!port&&!s.cardMode)glow(g,226,744,75+Math.sin(s.age*9)*6,'#ff9b343e');
    if(s.phase===2)glow(g,1040,350,235,'#802cff40');
    const shift=s.age-(s.phaseShift??-10);
    if(shift<.65&&!s.reduceMotion){
      g.save();g.globalAlpha=(1-shift/.65)*.65;
      glow(g,1010+pose.dx,307+pose.dy,172+shift*220,'#ac47ff9e');
      g.restore();
    }
  }
  if (!stormfang) {
    bossAttack(g,s,pose);
    bossSkillFrames(g,s,art,quality,pose);
  }
  if(s.hero==='loki'&&s.practice&&!s.cardMode&&s.state!=='victory'&&s.state!=='won'){
    g.save();
    g.setLineDash([7,7]);
    ellipse(g,MELEE_TARGET[0],MELEE_TARGET[1],42,19,null,'#b1e7fd9a',2);
    g.restore();
  }
  hazard(g,s,port?pier:floor,Boolean(port),Boolean(stormfang));
  if (fieldFx) paintStormfang(g,fieldFx,s,pose);
  if (!stormfang) impactVfx(g,s,pose,quality);
  if (s.skillImpact?.kind !== enhancedKind && !(enhancedUltimate && s.skillImpact?.kind === 'ultimate')) spellContact(g,s,pose,quality,art.contact);
  if(s.hero==='loki'&&s.state==='victory'){
    const time=s.victoryTime;
    if(time>=1.58&&time<3.2)slashRibbon(g,TARGET[0]+pose.dx,TARGET[1]+pose.dy,125+time*23,4,(time-1.58)*2);
  }else victoryVfx(g,s,pose,quality);
  const portHero = port?.heroes[s.hero];
  actor(g,s,drawHero,art.poses,portHero ?? art.cinematic?.[s.hero],Boolean(portHero));
  if(s.hero==='loki'&&s.shot?.kind==='wave'&&!ultimateShot){
    const shot=s.shot,q=shot.t,tx=TARGET[0]+pose.dx,ty=TARGET[1]+pose.dy;
    const x=shot.x+(tx-shot.x)*q,y=shot.y+(ty-shot.y)*q;
    slashRibbon(g,x,y,shot.cardKind==='ultimate'?106:53,2,q+.25,true);
    if(shot.cardKind==='wave'||shot.cardKind==='ultimate')slashRibbon(g,x-21,y+13,shot.cardKind==='ultimate'?127:66,3,q+.54,true);
  }else if(s.shot && s.shot.kind !== enhancedKind && !ultimateShot){
    const q=s.shot.t, tx=TARGET[0]+pose.dx, ty=TARGET[1]+pose.dy;
    const origin=port || art.cinematic?.yhannie?.naturalWidth ? s.shot.x-24+(port?85:66)*Math.sign(tx-s.shot.x+24) : s.shot.x;
    const x=origin+(tx-origin)*q,y=s.shot.y+(ty-s.shot.y)*q-Math.sin(q*Math.PI)*45;
    const kind=s.shot.kind, power=kind==='ultimate'?31:kind==='crescent'?22:kind==='wave'?20:kind==='charge'?16:kind==='star'?13:9;
    const tint=(port&&kind!=='ultimate')||kind==='wave'?'#4bdcfff0':kind==='crescent'?'#bb82fff0':kind==='star'?'#ffc1fff0':'#9c45fff0';
    if(kind==='ultimate'){
      arcane(g,tx,ty,90+Math.sin(s.age*9)*8,s.age,true);
      glow(g,x,y,82,'#d64dffbd');
      const beam=14+Math.sin(s.age*22)*3;
      line(g,[[origin,s.shot.y],[x,y]],'#9d4bff',beam*2.2);
      line(g,[[origin,s.shot.y],[x,y]],'#e8a7ff',beam);
      line(g,[[origin,s.shot.y],[x,y]],'#ffffff',4);
      for(let i=0;i<5;i++){
        const q=(s.age*1.4+i*.2)%1,px=origin+(x-origin)*q,py=s.shot.y+(y-s.shot.y)*q;
        glow(g,px,py,12,'#d88aff');ellipse(g,px,py,3,5,'#fff','#a9eaff',1,s.age*8+i);
      }
    }
    line(g,[[origin,s.shot.y],[x,y]],tint,power*.5);
    glow(g,x,y,power*3,tint);
    if(kind==='crescent'&&s.cardMode){
      const angle=Math.atan2(ty-s.shot.y-Math.cos(q*Math.PI)*45*Math.PI,tx-origin);
      moonSpear(g,x,y,angle);
    }else if(kind==='crescent'){
      g.save();g.translate(x,y);g.rotate(q*10);
      ellipse(g,0,0,power,power*.72,'#f5e3ff','#ac5dff',3);
      ellipse(g,5,-4,power*.82,power*.67,'#111545');g.restore();
    }else if(kind==='wave'){
      for(let i=0;i<3;i++)ellipse(g,x-10-i*11,y+Math.sin(q*25+i)*7,power-i*3,power*.45,'#a3f6ff','#35bfff',2);
    }else if(kind==='star'){
      for(let i=0;i<8;i++){const a=s.age*4+i*Math.PI/4;line(g,[[x,y],[x+Math.cos(a)*power*1.9,y+Math.sin(a)*power*1.9]],'#fad9ff',2)}
      ellipse(g,x,y,power,power,'#fff6ff','#ed8dff',2);
    }else{
      const size=kind==='bolt'?power*(1+.35*((s.shot.combo||1)-1)):power;
      const length=Math.min(q,.17);
      for(let i=0;i<4;i++){
        const p=q-length*(i+1)/4,px=origin+(tx-origin)*p,py=s.shot.y+(ty-s.shot.y)*p-Math.sin(p*Math.PI)*45;
        ellipse(g,px,py,size*(1-i*.18),size*.37,i%2?'#bc6aff90':'#61daff90');
      }
      ellipse(g,x,y,size,size*.7,port?'#edffff':'#fff1ff',port?'#48caff':'#be5aff',3);
    }
  }
  paintSkillEffects(g,s,art,pose,quality,enhancedUltimate,enhancedKind);
  if (fieldFx) paintHeroFieldEffects(g,fieldFx,s,pose,quality);
  if (tidebreaker) paintTidebreaker(g, s, tidebreaker, pose, quality, Boolean(art.cinematic?.yhannie?.naturalWidth));
  if (abyssbreaker) paintAbyssbreaker(g, s, abyssbreaker, pose, quality);
  if (port) paintPortForeground(g,port,s);
  else if(art.dock.naturalWidth&&!s.cardMode){
    g.save();g.clip(foreground);g.drawImage(art.dock,0,0,W,H);g.restore();
  }
  paintAtmosphere(g,s,quality,true);
  paintCinematic(g,s,quality);
  paintUltimateFrame(g,canvas,s,art.cutIns?.[s.hero],beat);
}
