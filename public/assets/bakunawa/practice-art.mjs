// Animate the painted regions in artwork coordinates. Keep faces and lettering registered.
const vertex = `attribute vec2 position;
varying vec2 uv;
void main(){uv=vec2(position.x*.5+.5,.5-position.y*.5);gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision highp float;
varying vec2 uv;
uniform sampler2D painting;
uniform float t;
float region(vec2 p, vec2 center, vec2 radius){
  return 1.-smoothstep(.45,1.,length((p-center)/radius));
}
void main(){
  vec2 p=uv;
  float wind=sin(t*1.9+p.x*20.)+.42*sin(t*3.1-p.y*17.);
  float scarf=region(p,vec2(.835,.435),vec2(.105,.115))+region(p,vec2(.55,.243),vec2(.09,.08));
  float hair=region(p,vec2(.47,.402),vec2(.063,.093))+region(p,vec2(.205,.528),vec2(.085,.067));
  float dragon=region(p,vec2(.535,.085),vec2(.19,.13));
  float sea=smoothstep(.65,.98,p.y);
  float plate=max(region(p,vec2(.247,.888),vec2(.27,.12)),region(p,vec2(.77,.888),vec2(.23,.12)));
  vec2 shift=vec2(0.,wind*(scarf*.005+hair*.0028)+dragon*.0023*sin(t*1.05));
  shift.x+=sea*.0026*sin(82.*p.y+t*2.3)*(1.-plate);
  float sky=(1.-smoothstep(.14,.35,p.y))*region(p,vec2(.76,.11),vec2(.3,.2));
  shift.x+=sky*.0015*sin(t*.7+p.y*12.);
  vec3 c=texture2D(painting,clamp(p+shift,.001,.999)).rgb;
  vec2 ring=(p-vec2(.172,.226))*vec2(1.778,1.);
  float ink=smoothstep(.05,.4,c.b-c.g)*smoothstep(.25,.85,c.r);
  float orbit=pow(max(0.,cos(atan(ring.y,ring.x)-t*1.6)),9.);
  c+=vec3(.27,.10,.35)*ink*(.25+orbit)*region(p,vec2(.172,.23),vec2(.22,.34));
  float book=region(p,vec2(.449,.486),vec2(.09,.06));
  c+=book*ink*vec3(.19,.08,.27)*(.6+.4*sin(t*3.3));
  float sword=region(p,vec2(.854,.774),vec2(.20,.25));
  float glint=pow(max(0.,cos(p.x*20.+p.y*6.-t*4.)),12.);
  c+=vec3(.13,.29,.34)*sword*smoothstep(.08,.45,c.b-c.r)*glint;
  float lamp=region(p,vec2(.887,.076),vec2(.026,.036));
  float beam=region(p,vec2(.799,.098),vec2(.098,.038))*exp(-90.*abs(p.y-.076-(.887-p.x)*sin(t*.9)*.34));
  c+=vec3(1.,.71,.32)*(.13*lamp*(.6+.4*sin(t*2.))+.12*beam);
  vec2 cell=floor(p*vec2(36.,20.));
  float seed=fract(sin(dot(cell,vec2(17.3,73.7)))*4375.5);
  vec2 mote=fract(p*vec2(36.,20.))-vec2(.5+.24*sin(t*.7+seed*12.),fract(seed+t*.16));
  float spark=(1.-smoothstep(.012,.065,length(mote)))*smoothstep(.76,.98,seed);
  c+=spark*vec3(.7,.69,1.)*(1.-plate)*(.5+.5*sin(seed*19.+t*3.));
  gl_FragColor=vec4(c,1.);
}`;

export async function animateArt(canvas,img,dialog,signal,{shader:fragmentSource=fragment,active=()=>dialog.open}={}){
  await img.decode();
  if(signal.aborted||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false});
  if(!gl)return;
  const program=gl.createProgram(), shaders=[];
  let buffer,texture,frame;
  function cleanup(){
    cancelAnimationFrame(frame);canvas.hidden=true;
    gl.deleteBuffer(buffer||null);gl.deleteTexture(texture||null);
    gl.deleteProgram(program);shaders.forEach(shader=>gl.deleteShader(shader));
  }
  signal.addEventListener('abort',cleanup,{once:true});
  for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragmentSource]]){
    const shader=gl.createShader(type);shaders.push(shader);
    gl.shaderSource(shader,source);gl.compileShader(shader);gl.attachShader(program,shader);
  }
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
  gl.useProgram(program);
  buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  for(const wrap of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,wrap,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);
  const time=gl.getUniformLocation(program,'t'),start=performance.now();
  let last=-100;
  function draw(now){
    if(signal.aborted)return;
    if(active()&&!document.hidden&&now-last>=32){
      last=now;const w=Math.max(1,Math.min(img.naturalWidth,Math.round(img.clientWidth*devicePixelRatio))),h=Math.round(w*img.naturalHeight/img.naturalWidth);
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
      gl.viewport(0,0,w,h);gl.uniform1f(time,(now-start)/1000);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);canvas.hidden=false;
    }
    frame=requestAnimationFrame(draw);
  }
  draw(start);
}
