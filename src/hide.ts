// The hide: one WebGL surface behind the whole page.
// Procedural leather grain, a raking light, stitched seams between chapters,
// and a heat-stamped, foiled wordmark in the hero.

const VERT = `#version 300 es
in vec2 a;
void main(){ gl_Position = vec4(a, 0., 1.); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2  u_res;      // device px
uniform float u_dpr;
uniform float u_time;
uniform vec2  u_light;    // css px
uniform vec2  u_offset;   // css px the surface has travelled
uniform vec3  u_dyeA, u_dyeB;
uniform vec4  u_finA, u_finB; // pebble, saffiano, suede, pebble scale
uniform float u_edge;     // css px along axis
uniform float u_axis;     // 0: seam runs across (edge is a y), 1: seam runs down (edge is an x)
uniform sampler2D u_stamp;
uniform float u_press, u_foil, u_lightAmt, u_stampY;
out vec4 o;

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
vec2  hash2(vec2 p){ return fract(sin(vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3))))*43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){ float v = 0., a = .5; for(int i=0;i<4;i++){ v += a*noise(p); p = p*2.03+7.1; a *= .5; } return v; }

float pebble(vec2 p){
  p += (vec2(noise(p*.4), noise(p*.4+31.7))-.5)*1.3;
  vec2 i = floor(p), f = fract(p);
  float f1 = 9., f2 = 9.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 g = vec2(x,y);
    float d = length(g + hash2(i+g) - f);
    if(d < f1){ f2 = f1; f1 = d; } else if(d < f2){ f2 = d; }
  }
  return smoothstep(0., .5, f2-f1);
}
float saffiano(vec2 p){
  float k = .72;
  float a = sin((p.x*.8 + p.y*.6)*k), b = sin((p.x*.8 - p.y*.6)*k);
  return smoothstep(-.35, .75, a*b);
}
float suede(vec2 p){ return noise(p*.9)*.5 + noise(p*.33)*.5; }

float grain(vec2 p, vec4 fin){
  float h = 0.;
  if(fin.x > .01) h += fin.x * pebble(p / fin.w);
  if(fin.y > .01) h += fin.y * saffiano(p);
  if(fin.z > .01) h += fin.z * suede(p) * .5;
  return h;
}

vec2 g_size;
float g_st, g_stitch;

// everything that has relief: grain, the pressed stamp, the seam and its stitches
float height(vec2 css){
  vec2 p = css + u_offset;
  float d   = (u_axis < .5 ? css.y : css.x) - u_edge;
  float run = (u_axis < .5 ? p.x : p.y);
  vec4 fin  = d > 0. ? u_finB : u_finA;

  vec2 suv = vec2(css.x, css.y + u_stampY) / g_size;
  float st = (suv.y > 0. && suv.y < 1.) ? texture(u_stamp, suv).r : 0.;
  float pressed = st * u_press;

  float h = grain(p, fin) * (1. - .92*pressed);
  h -= pressed * 1.5;

  float row    = d - 11.;
  float c      = fract(run/15.);
  float dash   = smoothstep(.14, .3, c) * smoothstep(.98, .82, c);
  float stitch = smoothstep(3., 1., abs(row)) * dash;
  h -= exp(-d*d/6.)*1.6 + exp(-row*row/70.)*.35;
  h += stitch*1.3;
  g_st = st; g_stitch = stitch;
  return h;
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) / u_dpr;
  g_size   = u_res / u_dpr;
  vec2 size = g_size;
  vec2 p   = css + u_offset;

  float hx = height(css + vec2(1., 0.));
  float hy = height(css + vec2(0., 1.));
  float h0 = height(css);
  float st = g_st, stitch = g_stitch;

  float d  = (u_axis < .5 ? css.y : css.x) - u_edge;
  bool onB = d > 0.;
  vec3 dye = onB ? u_dyeB : u_dyeA;
  vec4 fin = onB ? u_finB : u_finA;

  vec3 n = normalize(vec3(h0-hx, h0-hy, .62));

  vec2  toL  = u_light - css;
  float dist = length(toL);
  float R    = max(size.x, size.y)*.7;
  vec3  L    = normalize(vec3(toL, R*.42));
  float att  = 1./(1. + pow(dist/R, 2.)*1.8);
  float diff = max(dot(n, L), 0.);
  vec3  H    = normalize(L + vec3(0,0,1));
  float sheen = max(1. - fin.z*1.4, 0.);
  float spec = pow(max(dot(n, H), 0.), 60.) * sheen * .28;

  float amb = mix(.03, .34, u_lightAmt);
  float mottle = fbm(p*.011);
  vec3 nap  = dye * (.92 + .16*mottle + fin.z*(fbm(p*.03+3.)-.5)*.2);
  float lumD = dot(dye, vec3(.299,.587,.114));
  vec3 col  = nap * (amb + mix(1.25, .62, lumD)*diff*att*u_lightAmt) + vec3(1.,.93,.82)*spec*att*u_lightAmt;

  float lum = lumD;
  vec3 thread = mix(vec3(.93,.88,.78), vec3(.14,.05,.09), step(.5, lum));
  col = mix(col, thread*(.5 + .75*diff*att), stitch*.95);

  float fm = smoothstep(.42, .62, st) * u_foil;
  vec3 gold = vec3(.86,.68,.36);
  float gs = pow(max(dot(n, H), 0.), 12.);
  vec3 foil = gold*(.32 + 1.15*diff*att) + vec3(1.,.9,.7)*gs*att*.9;
  foil *= .88 + .24*noise(p*.5);
  col = mix(col, foil*u_lightAmt + gold*.04, fm);

  vec2 q = css/size - .5;
  col *= 1. - dot(q,q)*.5;
  col += (hash(css + u_time) - .5)*.018;
  o = vec4(col, 1.);
}`;

export type Finish = [number, number, number, number];
export type RGB = [number, number, number];

export interface HideState {
  light: [number, number];
  offset: [number, number];
  dyeA: RGB; dyeB: RGB;
  finA: Finish; finB: Finish;
  edge: number; axis: number;
  press: number; foil: number; lightAmt: number; stampY: number;
}

export function createHide(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
  } catch (e) { console.warn('hide: shader failed', e); return null; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U: Record<string, WebGLUniformLocation | null> = {};
  for (const n of ['res','dpr','time','light','offset','dyeA','dyeB','finA','finB','edge','axis','stamp','press','foil','lightAmt','stampY'])
    U[n] = gl.getUniformLocation(prog, 'u_' + n);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR],[gl.TEXTURE_MAG_FILTER, gl.LINEAR],[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]])
    gl.texParameteri(gl.TEXTURE_2D, k, v);

  let dpr = 1;
  const resize = () => {
    const small = window.innerWidth < 800;
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();

  return {
    resize,
    get dpr() { return dpr; },
    setStamp(src: HTMLCanvasElement) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    },
    render(s: HideState, time: number) {
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.dpr, dpr);
      gl.uniform1f(U.time, time % 100);
      gl.uniform2f(U.light, s.light[0], s.light[1]);
      gl.uniform2f(U.offset, s.offset[0], s.offset[1]);
      gl.uniform3fv(U.dyeA, s.dyeA); gl.uniform3fv(U.dyeB, s.dyeB);
      gl.uniform4fv(U.finA, s.finA); gl.uniform4fv(U.finB, s.finB);
      gl.uniform1f(U.edge, s.edge); gl.uniform1f(U.axis, s.axis);
      gl.uniform1i(U.stamp, 0);
      gl.uniform1f(U.press, s.press); gl.uniform1f(U.foil, s.foil);
      gl.uniform1f(U.lightAmt, s.lightAmt); gl.uniform1f(U.stampY, s.stampY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
