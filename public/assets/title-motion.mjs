import {animateArt} from './bakunawa/practice-art.mjs?v=title-motion';

const shader = `precision highp float;
varying vec2 uv;
uniform sampler2D painting;
uniform float t;
float patch(vec2 p,vec2 center,vec2 size){
  return 1.-smoothstep(.2,1.,length((p-center)/size));
}
void main(){
  vec2 p=uv;
  float dragon=patch(p,vec2(.755,.155),vec2(.245,.16));
  float mane=patch(p,vec2(.72,.075),vec2(.27,.10));
  float scarf=patch(p,vec2(.32,.72),vec2(.13,.12));
  float hair=patch(p,vec2(.704,.486),vec2(.063,.076));
  float foam=patch(p,vec2(.775,.968),vec2(.64,.13));
  float haze=patch(p,vec2(.47,.327),vec2(.16,.125));
  float magic=patch(p,vec2(.895,.51),vec2(.139,.24));
  p.x+=.0035*sin(uv.y*44.+t*2.05)*foam+.0042*sin(t*1.1+uv.y*18.)*haze;
  p.y+=.0030*sin(t*1.05+uv.x*13.)*dragon+.0055*sin(t*2.+uv.x*21.)*mane;
  p.y+=.009*sin(t*2.4+uv.x*22.)*scarf+.0037*sin(t*2.1+uv.x*21.)*hair;
  p+=vec2(sin(uv.y*20.+t*2.4),cos(uv.x*24.-t*2.3))*.0031*magic;
  vec3 c=texture2D(painting,clamp(p,.0001,.9999)).rgb;
  float electric=smoothstep(.14,.58,c.b-c.r)*smoothstep(.44,.9,c.b);
  c+=vec3(.11,.27,.38)*electric*magic*(.55+.45*sin(t*3.0+uv.y*18.));
  c+=vec3(.20,.09,.36)*mane*smoothstep(.10,.42,c.b-c.g)*(.5+.5*sin(t*1.8+uv.x*13.));
  float eye=patch(uv,vec2(.551,.149),vec2(.023,.032));
  c+=eye*vec3(.03,.28,.48)*(.74+.26*sin(t*2.4));
  float staff=patch(uv,vec2(.916,.390),vec2(.053,.066));
  c+=staff*vec3(.27,.17,.07)*(.55+.45*sin(t*2.7));
  float edge=patch(uv,vec2(.534,.915),vec2(.16,.075));
  c+=edge*vec3(.33,.13,.06)*smoothstep(.12,.4,c.r-c.b)*pow(max(0.,cos(t*2.1-uv.x*38.)),12.);
  vec2 lattice=uv*vec2(51.,29.)+vec2(-.11,-.28)*t;
  vec2 cell=floor(lattice);
  float seed=fract(sin(dot(cell,vec2(31.7,83.1)))*19263.2);
  vec2 grain=fract(lattice)-vec2(.52+.25*sin(seed*7.+t),.5);
  float mote=(1.-smoothstep(.028,.079,length(grain)))*smoothstep(.82,1.,seed);
  c+=mote*smoothstep(.29,.61,uv.x)*vec3(.96,.56,.36)*(.54+.46*sin(t*3.+seed*20.));
  gl_FragColor=vec4(c,1.);
}`;

export function startTitleMotion(art,signal,active){
  return animateArt(art.querySelector('canvas'),art.querySelector('img'),art,signal,{shader,active});
}
