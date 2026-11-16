import { fullscreen, loadImage, NOISE } from './fs';

// The hero: one photo of the aisle of bags, given depth. Scrolling cranes the camera down the aisle
// towards the front bag while the near rows slide faster than the far ones; dust hangs in the window light.
const FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uImg, uDepth;
uniform vec2 uRes, uImgRes, uMouse;
uniform float uProg, uTime, uIn;
${NOISE}
vec2 coverRange(){
  float va = uRes.x/uRes.y, ia = uImgRes.x/uImgRes.y;
  return va > ia ? vec2(1., ia/va) : vec2(va/ia, 1.);
}
void main(){
  vec2 range = coverRange();
  float p = smoothstep(0., 1., uProg);
  float zoom = mix(1.06, 1.42, p) - (1.-uIn)*.04;
  // centre of the frame travels from the window down to the front bag
  vec2 c = vec2(.5 + uMouse.x*.006, mix(.66, .36, p));
  vec2 s = (vUv - .5) * range / zoom;
  vec2 uv = c + s;
  float d = texture(uDepth, uv).r;
  // per-depth dolly: near pixels are magnified more as we move in, plus pointer parallax
  for(int i=0;i<2;i++){
    float k = 1. + (p*.22 + .03) * d;
    uv = c + s / k + uMouse * .018 * (d - .4);
    d = texture(uDepth, uv).r;
  }
  vec3 col = texture(uImg, uv).rgb;

  // window light: lift and warm the highlights, bloom them a touch
  float lum = dot(col, vec3(.299,.587,.114));
  vec3 bl = vec3(0.);
  for(int i=0;i<6;i++){ float a = float(i)*1.047; bl += texture(uImg, uv + vec2(cos(a),sin(a))*.012).rgb; }
  bl /= 6.;
  col += max(bl - .55, 0.) * vec3(1., .82, .58) * .9;

  // dust in the light shafts
  vec2 sp = vUv * vec2(uRes.x/uRes.y, 1.);
  float dust = 0.;
  for(int l=0;l<3;l++){
    float fl = float(l);
    vec2 g = sp * (9. + fl*7.) + vec2(uTime*.02*(1.+fl), -uTime*.035*(1.+fl*.5));
    vec2 id = floor(g); vec2 f = fract(g) - .5;
    float h = hash(id + fl*17.);
    vec2 off = vec2(hash(id+3.1), hash(id+7.7)) - .5;
    float r = length(f - off*.6);
    dust += smoothstep(.06 - fl*.012, 0., r) * step(.78, h) * (.6 + .4*sin(uTime*1.3 + h*40.));
  }
  float shaft = smoothstep(.15, 1., 1. - abs(vUv.x - .55)*1.6) * smoothstep(.2, 1., vUv.y);
  col += dust * shaft * vec3(1., .86, .66) * .18;

  // grade: deep blacks, warm mids, vignette, fade from black on entry, darken towards exit
  col = pow(col, vec3(1.06));
  vec2 q = vUv - .5;
  col *= 1. - dot(q,q)*1.1;
  col *= mix(.45, 1., smoothstep(0., 1., vUv.y*1.2)) ;
  col *= uIn;
  col *= 1. - smoothstep(.75, 1., uProg)*.55;
  col += (hash(vUv*uRes + uTime) - .5) * .03;
  o = vec4(col, 1.);
}`;

export async function createHero(canvas: HTMLCanvasElement) {
  const fs = fullscreen(canvas, FRAG, 1.75);
  if (!fs) return null;
  const [img, depth] = await Promise.all([loadImage('img/hero-rows.webp'), loadImage('img/hero-depth.webp')]);
  fs.texture('uImg', img, 0);
  fs.texture('uDepth', depth, 1);
  fs.gl.uniform2f(fs.u('uImgRes'), img.naturalWidth, img.naturalHeight);
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = -(e.clientY / innerHeight - .5); }, { passive: true });
  return {
    fs,
    render(prog: number, t: number, entry: number) {
      mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
      const { gl, u } = fs;
      gl.uniform1f(u('uProg'), prog); gl.uniform1f(u('uTime'), t); gl.uniform1f(u('uIn'), entry);
      gl.uniform2f(u('uMouse'), mouse.x, mouse.y);
      fs.draw();
    },
  };
}
