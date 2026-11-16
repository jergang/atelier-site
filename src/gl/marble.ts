import { fullscreen, NOISE } from './fs';

// Florentine marbled paper (carta marmorizzata), poured and combed live.
// With a word, the paper shows only inside the letters, edged in brass, on black.
const FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes, uMouse;
uniform float uTime, uTone, uUseMask;
uniform sampler2D uMask;
${NOISE}
vec2 warp(vec2 p, float t){
  vec2 q = vec2(fbm(p + vec2(0., t*.05)), fbm(p + vec2(5.2, 1.3) - t*.04));
  vec2 r = vec2(fbm(p + 3.*q + vec2(1.7, 9.2) + t*.03), fbm(p + 3.*q + vec2(8.3, 2.8)));
  return p + 2.6*r;
}
vec3 paper(vec2 p){
  // the comb: fine parallel drag, nudged by the pointer
  p.x += sin(p.y*9. + uTime*.12)*.045 + uMouse.x*.2*exp(-dot(p-uMouse*1.5,p-uMouse*1.5));
  vec2 w = warp(p, uTime);
  float f = fbm(w*1.1);
  float bands = f*9.;
  float id = floor(bands), fr = fract(bands);
  vec3 avorio = vec3(.91,.87,.79), vino = vec3(.42,.09,.12), ottone = vec3(.74,.58,.31), ink = vec3(.16,.26,.38), nero = vec3(.07,.06,.05), cuoio = vec3(.48,.26,.15);
  float k = mod(id*7., 6.);
  vec3 c = k < 1. ? avorio : k < 2. ? vino : k < 3. ? ottone : k < 4. ? avorio : k < 5. ? ink : cuoio;
  // flat pigment fields with thin dark veins and a pale halo where colours meet, as on poured paper
  float edge = min(fr, 1. - fr);
  c = mix(c, nero, smoothstep(.05, .0, edge) * .75);
  c = mix(c, avorio, smoothstep(.12, .05, edge) * smoothstep(.0, .05, edge) * .35);
  // pigment speckle and paper tooth
  c *= .9 + .18*noise(w*40.);
  c += (noise(p*180.) - .5) * .03;
  return c;
}
void main(){
  vec2 p = (vUv - .5) * vec2(uRes.x/uRes.y, 1.) * 2.;
  vec3 col = paper(p);
  col = mix(col, col*vec3(.5,.3,.3), uTone);
  vec2 q = vUv - .5;
  if (uUseMask > .5) {
    float m = texture(uMask, vUv).r;
    float e = texture(uMask, vUv).g;
    vec3 bg = vec3(.059,.051,.043) * (1. - dot(q,q)*.8);
    col = mix(bg, col, m);
    col = mix(col, vec3(.70,.57,.34), e*.9);
  } else {
    col *= 1. - dot(q,q)*(.5 + uTone*.6);
  }
  col += (hash(vUv*uRes + uTime) - .5)*.025;
  o = vec4(col, 1.);
}`;

export function createMarble(canvas: HTMLCanvasElement, night: boolean, word?: string) {
  const fs = fullscreen(canvas, FRAG, 1.25);
  if (!fs) return null;
  const { gl, u } = fs;
  gl.uniform1f(u('uTone'), night ? 1 : 0);
  gl.uniform1f(u('uUseMask'), word ? 1 : 0);

  const drawMask = () => {
    if (!word) return;
    const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height;
    const g = c.getContext('2d')!;
    const size = Math.min(c.width * 0.22, c.height * 0.5);
    g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
    g.font = `400 ${size}px Italiana, Didot, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if ('letterSpacing' in g) (g as any).letterSpacing = `${-0.02 * size}px`;
    const y = c.height * 0.46;
    // red: the fill; green: a brass hairline around it
    g.lineJoin = 'round';
    g.strokeStyle = '#00ff00'; g.lineWidth = Math.max(2, size * 0.012); g.strokeText(word, c.width / 2, y);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = '#ff0000'; g.fillText(word, c.width / 2, y);
    fs.texture('uMask', c, 0);
  };
  drawMask();

  const m = { x: 0, y: 0, tx: 0, ty: 0 };
  canvas.parentElement!.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    m.tx = ((e.clientX - r.left) / r.width - .5) * 2; m.ty = -((e.clientY - r.top) / r.height - .5) * 2;
  });
  const seed = night ? 40 : 7;
  return {
    resize() { fs.resize(); drawMask(); },
    render(t: number) {
      m.x += (m.tx - m.x) * .03; m.y += (m.ty - m.y) * .03;
      gl.uniform1f(u('uTime'), t + seed); gl.uniform2f(u('uMouse'), m.x, m.y);
      fs.draw();
    },
  };
}
