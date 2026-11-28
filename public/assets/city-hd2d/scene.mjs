// Landings use the same world-space foot coordinates as the live city.
export const districts = {
  plaza: {name:'City Hall Plaza', x:665, y:306},
  hotel: {name:'MC Hotel', x:1030, y:270},
  market: {name:'Market', x:1166, y:414},
  lighthouse: {name:'Lighthouse View', x:222, y:286},
  arcade: {name:'Game Arcade', x:970, y:602},
  pier: {name:'Old Pier', x:202, y:786},
  dock: {name:'Grand Dock', x:1092, y:772},
  port: {name:'Fishing Port', x:1430, y:594}
};

// Coordinates are in the 1536 × 864 gameplay space.
const remakeVents = [[1202,4,-1],[1222,10,1],[1233,14,1]];
const remakeLamps = [[73,164],[468,279],[190,256],[950,289],[176,567],[446,572],[850,569],[978,627],[1145,612],[1255,612]];
const remakeEmission = [[905,471,147,31,1,.85],[1117,319,62,28,0,.45]];
const exhausts = [[1247,31,1],[1523,38,-1]];
const dockLamps = [[171,766],[299,775],[975,752],[1263,608]];
const waterLights = [[177,802],[292,815],[980,806],[1419,831]];
const screens = [[914,527],[946,526],[984,527],[1008,527]];

function canvas(width,height) {
  const surface = document.createElement('canvas');
  surface.width = width;
  surface.height = height;
  return surface;
}

// The distant roofline is softened once. Streets, silhouettes and actor sprites
// never pass through a blur filter. Use a tiny downsample on browsers without filters.
function finishRoofline(art) {
  const plate = canvas(art.naturalWidth,art.naturalHeight);
  const paint = plate.getContext('2d');
  paint.drawImage(art,0,0);
  const height = 72;
  const edge = canvas(plate.width,height);
  const g = edge.getContext('2d');
  if ('filter' in g) {
    g.filter = 'blur(0.8px)';
    g.drawImage(art,0,0);
    g.filter = 'none';
  } else {
    const half = canvas(plate.width/2,height/2);
    half.getContext('2d').drawImage(art,0,0,plate.width,height,0,0,half.width,half.height);
    g.drawImage(half,0,0,edge.width,height);
  }
  g.globalCompositeOperation = 'destination-in';
  const fade = g.createLinearGradient(0,0,0,height);
  fade.addColorStop(0,'rgba(0,0,0,.39)');
  fade.addColorStop(1,'transparent');
  g.fillStyle = fade;
  g.fillRect(0,0,edge.width,height);
  paint.drawImage(edge,0,0);
  return plate;
}

function makeGlow() {
  const sprite = canvas(48,48);
  const g = sprite.getContext('2d');
  const light = g.createRadialGradient(24,24,0,24,24,24);
  light.addColorStop(0,'#ffecad');
  light.addColorStop(.13,'rgba(255,208,123,.6)');
  light.addColorStop(.45,'rgba(252,155,76,.19)');
  light.addColorStop(1,'rgba(250,133,61,0)');
  g.fillStyle = light;
  g.fillRect(0,0,48,48);
  return sprite;
}

function chimneySteam(g,time,day,vents) {
  for (const [x,y,direction] of vents) {
    for (let i=0;i<6;i++) {
      const age = (time*.24+i/6+(direction+1)*.18)%1;
      const drift = direction*(age*23+Math.sin(age*8+i)*age*3);
      const px = Math.round(x+drift);
      const py = Math.round(y-age*(23+5*age));
      const size = Math.round(2+age*5);
      g.globalAlpha = (.12+day*.16)*Math.sin(age*Math.PI);
      g.fillStyle = '#a5b3b1';
      g.fillRect(px-size,py-size,2*size,size);
      g.fillRect(px-size+1,py,2*size-2,2);
      g.fillStyle = '#e8debd';
      g.fillRect(px-size+2,py-size-2,Math.max(1,size+1),3);
    }
  }
  g.globalAlpha = 1;
}

function harborReflections(g,time,strength,waterClip) {
  g.save();
  g.clip(waterClip);
  g.fillStyle = '#f7c98b';
  for (const [x,y] of waterLights) {
    for (let i=0;i<9;i++) {
      const phase = time*1.7+i*.87+x;
      const width = Math.round((2+i*.9)*(.7+.3*Math.sin(phase)));
      g.globalAlpha = strength*(1-i/12)*(.35+.16*Math.cos(phase));
      g.fillRect(Math.round(x-width/2+Math.sin(phase)*3),y+i*4,width,1);
    }
  }
  g.restore();
}

async function loadPlate(filename) {
  const art = new Image();
  art.decoding = 'async';
  art.src = new URL(filename,import.meta.url).href;
  await art.decode();
  return art;
}

// Build both transforms once. Each lookup examines only nearby triangles.
export function createProjection(mesh) {
  function index(from,to) {
    const buckets = new Map();
    const cell = 64;
    for (const [i,j,k] of mesh.triangles) {
      const [ax,ay]=from[i], [bx,by]=from[j], [cx,cy]=from[k];
      const det=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
      if(Math.abs(det)<1e-9)throw new Error('Invalid city projection triangle');
      const triangle={ax,ay,ux:(cy-ay)/det,uy:(ax-cx)/det,vx:(ay-by)/det,vy:(bx-ax)/det,a:to[i],b:to[j],c:to[k]};
      for(let y=Math.floor(Math.min(ay,by,cy)/cell);y<=Math.floor(Math.max(ay,by,cy)/cell);y++){
        for(let x=Math.floor(Math.min(ax,bx,cx)/cell);x<=Math.floor(Math.max(ax,bx,cx)/cell);x++){
          const key=x+','+y;
          if(!buckets.has(key))buckets.set(key,[]);
          buckets.get(key).push(triangle);
        }
      }
    }
    return (x,y)=>{
      const candidates=buckets.get(Math.floor(x/cell)+','+Math.floor(y/cell));
      if(candidates)for(const t of candidates){
        const dx=x-t.ax,dy=y-t.ay,u=dx*t.ux+dy*t.uy,v=dx*t.vx+dy*t.vy;
        if(u < -1e-7 || v < -1e-7 || u+v > 1.0000001)continue;
        const w=1-u-v;
        return [w*t.a[0]+u*t.b[0]+v*t.c[0],w*t.a[1]+u*t.b[1]+v*t.c[1]];
      }
      return [x,y];
    };
  }
  const forward=index(mesh.canonicalWorld,mesh.renderWorld);
  const inverse=index(mesh.renderWorld,mesh.canonicalWorld);
  return (x,y,reverse=false)=>reverse?inverse(x,y):forward(x,y);
}

async function loadGeometry(filename) {
  const response = await fetch(new URL(filename,import.meta.url));
  if (!response.ok) throw new Error('Could not load city geometry');
  return response.json();
}

// Build one nearest-neighbor material mask for the WebGL passes and the Canvas effects.
export function decodeHarborWater(packed, clip = new Path2D()) {
  const cell = 2, width = 768, height = 432;
  if (packed.length !== width * height / 8) throw new Error('Invalid harbor water mask');
  const pixels = new Uint8Array(width * height);
  const glints = [];
  for (let y = 0; y < height; y++) {
    let start = -1;
    for (let x = 0; x <= width; x++) {
      const i = y * width + x;
      const wet = x < width && (packed[i >> 3] & (128 >> (i & 7)));
      if (wet) {
        pixels[i] = 255;
        const hash = (Math.imul(x+1,73856093) ^ Math.imul(y+1,19349663)) >>> 0;
        if (hash % 157 === 0) {
          glints.push({x:x*cell+1, y:y*cell+1, ph:(hash & 255)*Math.PI/128,
            sp:0.65+((hash >>> 8) & 31)/32, len:1+((hash >>> 14) & 1)});
        }
        if (start < 0) start = x;
      } else if (start >= 0) {
        clip.rect(start * cell, y * cell, (x - start) * cell, cell);
        start = -1;
      }
    }
  }
  function contains(x, y) {
    return x >= 0 && y >= 0 && x < width * cell && y < height * cell &&
      pixels[Math.floor(y / cell) * width + Math.floor(x / cell)] !== 0;
  }
  return {width, height, pixels, clip, contains, glints};
}

async function loadHarborWater() {
  const response = await fetch(new URL('./repair-water.bin', import.meta.url));
  if (!response.ok) throw new Error('Could not load the remake harbor water mask');
  const water = decodeHarborWater(new Uint8Array(await response.arrayBuffer()));
  const floorResponse = await fetch(new URL('./repair-floor.bin', import.meta.url));
  if (!floorResponse.ok) throw new Error('Could not load the repaired city floor');
  water.floor = new Uint8Array(await floorResponse.arrayBuffer());
  if (water.floor.length !== 384*216) throw new Error('Invalid repaired city floor');
  return water;
}

export async function createCityEdition(prepareOccluder) {
  const [remake, previous, geometry, mesh, water] = await Promise.all([
    loadPlate('./city-geometry-repair.png'), loadPlate('./marinie-city.webp'), loadGeometry('./repair-foreground.json'), loadGeometry('./city-repair-projection.json'), loadHarborWater()
  ]);
  if (remake.naturalWidth < 1536 || Math.abs(remake.naturalWidth/remake.naturalHeight-16/9) > .003)
    throw new Error('Remade map has incompatible resolution');
  const previousPlate = finishRoofline(previous);
  const glow = makeGlow();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  return {
    image:remake, active:true, remade:true, water,
    project:createProjection(mesh),
    foreground:geometry.map(prepareOccluder),
    lights:remakeLamps.map(([x,y])=>({x,y,r:32,h:22,c:[1,.76,.48],i:.65})),
    emission:remakeEmission,
    drawLights(g,t,light) {
      if(light<=0)return;
      g.save();
      g.globalCompositeOperation='screen';
      for(const [x,y] of remakeLamps){
        g.globalAlpha=light*(.48+.035*Math.sin(t*1.6+x));
        g.drawImage(glow,x-19,y-19,38,38);
      }
      g.translate(75.4,151.8);
      g.rotate(t*.48);
      const beam = g.createLinearGradient(0,0,430,0);
      beam.addColorStop(0,'rgba(255,233,161,.38)');
      beam.addColorStop(1,'rgba(255,233,161,0)');
      g.globalAlpha=light;
      g.fillStyle=beam;
      g.beginPath();
      g.moveTo(0,-2);
      g.lineTo(430,-38);
      g.lineTo(430,38);
      g.lineTo(0,2);
      g.fill();
      g.restore();
    },
    chooseArt(value) {
      this.active = value !== 'original';
      this.remade = value === 'remake';
      this.image = value === 'previous' ? previousPlate : remake;
    },
    drawHarbor(g,time,day,dusk,night,waterClip) {
      const t = reducedMotion.matches ? 1 : time;
      const emission = .1+dusk*.40+night*.70;
      g.save();
      chimneySteam(g,t,day,this.remade?remakeVents:exhausts);
      if(this.remade){g.restore();return}
      g.globalCompositeOperation = 'screen';
      for (const [x,y] of dockLamps) {
        g.globalAlpha = emission*(.67+.04*Math.sin(t*.8+x));
        g.drawImage(glow,x-15,y-15,30,30);
      }
      for (const [i,[x,y]] of screens.entries()) {
        g.globalAlpha = (.13+emission*.12)*(.78+.22*Math.sin(t*2+i));
        g.fillStyle = i%2 ? '#ffacc6' : '#8ce7e8';
        g.fillRect(x-3,y,6,1);
      }
      harborReflections(g,t,emission,waterClip);
      g.restore();
    }
  };
}
