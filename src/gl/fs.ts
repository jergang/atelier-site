// A tiny WebGL2 helper for full-screen fragment shaders (hero, crocodile, marble).

const VERT = `#version 300 es
in vec2 a; out vec2 vUv;
void main(){ vUv = a*.5+.5; gl_Position = vec4(a,0.,1.); }`;

export const NOISE = `
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.02+11.3; a*=.5; } return v; }
`;

export interface FS {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  u: (name: string) => WebGLUniformLocation | null;
  texture: (name: string, src: TexImageSource, unit: number) => void;
  resize: () => void;
  draw: () => void;
  dpr: number;
}

export function fullscreen(canvas: HTMLCanvasElement, frag: string, maxDpr = 1.5): FS | null {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return null;
  const sh = (t: number, s: string) => {
    const o = gl.createShader(t)!; gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o) || 'shader');
    return o;
  };
  const prog = gl.createProgram()!;
  try {
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
  } catch (e) { console.warn('shader failed', e); return null; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const cache = new Map<string, WebGLUniformLocation | null>();
  const u = (n: string) => { if (!cache.has(n)) cache.set(n, gl.getUniformLocation(prog, n)); return cache.get(n)!; };
  const api: FS = {
    gl, canvas, u, dpr: 1,
    texture(name, src, unit) {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(u(name), unit);
    },
    resize() {
      const r = canvas.getBoundingClientRect();
      api.dpr = Math.min(devicePixelRatio || 1, innerWidth < 800 ? 1.25 : maxDpr);
      canvas.width = Math.max(1, Math.round(r.width * api.dpr));
      canvas.height = Math.max(1, Math.round(r.height * api.dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u('uRes'), canvas.width, canvas.height);
    },
    draw() { gl.drawArrays(gl.TRIANGLES, 0, 3); },
  };
  api.resize();
  return api;
}

export const loadImage = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
  const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src;
});

/** Calls back with true/false as the element nears or leaves the viewport. */
export function whenVisible(el: Element, cb: (v: boolean) => void, margin = '25%') {
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: `${margin} 0px ${margin} 0px` }).observe(el);
}
