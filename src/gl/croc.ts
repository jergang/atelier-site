import { fullscreen, loadImage, NOISE } from './fs';

// Glazed crocodile under a moving lamp. The scales' relief is read from the photo's own shading,
// so the highlights travel across them the way they would on the real hide.
const FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uImg;
uniform vec2 uRes, uImgRes, uLight;
uniform float uTime, uScroll;
${NOISE}
float L(vec2 uv){ return dot(textureLod(uImg, uv, 1.2).rgb, vec3(.299,.587,.114)); }
void main(){
  float va = uRes.x/uRes.y, ia = uImgRes.x/uImgRes.y;
  vec2 range = va > ia ? vec2(1., ia/va) : vec2(va/ia, 1.);
  vec2 uv = vec2(.5, .5 + (uScroll-.5)*.12) + (vUv-.5)*range/1.08;
  vec3 base = texture(uImg, uv).rgb;
  vec2 px = 2.5 / uImgRes;
  float hx = L(uv+vec2(px.x,0.)) - L(uv-vec2(px.x,0.));
  float hy = L(uv+vec2(0.,px.y)) - L(uv-vec2(0.,px.y));
  vec3 n = normalize(vec3(-hx*5., -hy*5., 1.));
  vec2 frag = vUv * uRes;
  vec3 Lp = vec3(uLight * uRes, uRes.y*.45);
  vec3 ld = normalize(Lp - vec3(frag, 0.));
  float dist = length(uLight*uRes - frag) / uRes.y;
  float att = 1. / (1. + dist*dist*3.);
  float diff = max(dot(n, ld), 0.);
  vec3 h = normalize(ld + vec3(0,0,1));
  float spec = pow(max(dot(n,h),0.), 70.) * 1.6 + pow(max(dot(n,h),0.), 12.)*.12;
  float gloss = smoothstep(.05, .35, dot(base, vec3(.33)));
  vec3 col = base * (.28 + 1.05*diff*att) + vec3(1.,.9,.74) * spec * att * (.4 + gloss);
  vec2 q = vUv - .5; col *= 1. - dot(q,q)*.9;
  col += (hash(frag + uTime) - .5) * .025;
  o = vec4(col, 1.);
}`;

export async function createCroc(canvas: HTMLCanvasElement) {
  const fs = fullscreen(canvas, FRAG, 1.5);
  if (!fs) return null;
  const img = await loadImage('img/croc.webp');
  fs.texture('uImg', img, 0);
  fs.gl.uniform2f(fs.u('uImgRes'), img.naturalWidth, img.naturalHeight);
  const light = { x: .6, y: .6, tx: .6, ty: .6, at: -1e9 };
  canvas.parentElement!.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    light.tx = (e.clientX - r.left) / r.width; light.ty = 1 - (e.clientY - r.top) / r.height; light.at = performance.now();
  });
  return {
    fs,
    render(t: number, scroll: number) {
      if (performance.now() - light.at > 2500) { light.tx = .5 + .32 * Math.cos(t * .35); light.ty = .5 + .28 * Math.sin(t * .5); }
      light.x += (light.tx - light.x) * .06; light.y += (light.ty - light.y) * .06;
      const { gl, u } = fs;
      gl.uniform2f(u('uLight'), light.x, light.y); gl.uniform1f(u('uTime'), t); gl.uniform1f(u('uScroll'), scroll);
      fs.draw();
    },
  };
}
