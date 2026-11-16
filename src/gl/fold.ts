import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// From the drawing to the object: a box shoulder bag's pattern is drawn on tracing paper, the leather
// panels are cut, then they lift off the paper and fold into the bag, which turns through eight colours.
// Units are decimetres: a 24 x 16 x 8 cm bag.
const W = 2.4, H = 1.6, D = 0.8, T = 0.035, FLAP = H * 0.62;
const lerp = THREE.MathUtils.lerp;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function saffianoBump() {
  const s = 512, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d')!;
  g.fillStyle = '#808080'; g.fillRect(0, 0, s, s);
  g.lineWidth = 1.4;
  for (let k = 0; k < 2; k++) {
    g.strokeStyle = k ? 'rgba(40,40,40,.55)' : 'rgba(210,210,210,.5)';
    for (let i = -s; i < s * 2; i += 5) {
      g.beginPath();
      if (k) { g.moveTo(i, 0); g.lineTo(i + s * 0.55, s); } else { g.moveTo(i, s); g.lineTo(i + s * 0.55, 0); }
      g.stroke();
    }
  }
  const img = g.getImageData(0, 0, s, s);
  for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() - 0.5) * 30; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
  return t;
}

export function createFold(canvas: HTMLCanvasElement, colours: string[]) {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  const key = new THREE.DirectionalLight('#fff0dc', 2.6); key.position.set(3, 7, 4); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 }); key.shadow.radius = 5; key.shadow.bias = -0.0005;
  const rim = new THREE.DirectionalLight('#b8c4d6', 1.2); rim.position.set(-4, 3, -4);
  scene.add(key, rim, new THREE.AmbientLight('#ffffff', 0.15));

  // tracing paper and the ink drawing
  const paperMat = new THREE.MeshStandardMaterial({ color: '#eee7da', roughness: 1, transparent: true });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), paperMat);
  paper.rotation.x = -Math.PI / 2; paper.position.y = -0.002; paper.receiveShadow = true; scene.add(paper);
  const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.35 }));
  shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.position.y = -0.004; shadowFloor.receiveShadow = true; scene.add(shadowFloor);

  const ink = new THREE.LineBasicMaterial({ color: '#2e4a6b', transparent: true });
  const drawing = new THREE.Group(); scene.add(drawing);
  const pts: THREE.Vector3[] = [];
  const rect = (x0: number, z0: number, x1: number, z1: number) => {
    pts.push(new THREE.Vector3(x0, 0, z0), new THREE.Vector3(x1, 0, z0), new THREE.Vector3(x1, 0, z0), new THREE.Vector3(x1, 0, z1),
      new THREE.Vector3(x1, 0, z1), new THREE.Vector3(x0, 0, z1), new THREE.Vector3(x0, 0, z1), new THREE.Vector3(x0, 0, z0));
  };
  const line = (x0: number, z0: number, x1: number, z1: number) => pts.push(new THREE.Vector3(x0, 0, z0), new THREE.Vector3(x1, 0, z1));
  // pattern pieces, laid out flat around the base
  rect(-W / 2, -D / 2, W / 2, D / 2);                       // base
  rect(-W / 2, D / 2, W / 2, D / 2 + H);                    // front
  rect(-W / 2, -D / 2 - H, W / 2, -D / 2);                  // back
  rect(-W / 2 - H, -D / 2, -W / 2, D / 2);                  // gusset
  rect(W / 2, -D / 2, W / 2 + H, D / 2);                    // gusset
  rect(-W / 2, -D / 2 - H - D, W / 2, -D / 2 - H);          // flap, top
  rect(-W / 2, -D / 2 - H - D - FLAP, W / 2, -D / 2 - H - D); // flap, front
  // seam allowance, dimension lines and ticks
  const a = 0.12;
  rect(-W / 2 - H - a, -D / 2 - a, W / 2 + H + a, D / 2 + a);
  const dz = D / 2 + H + 0.45;
  line(-W / 2, dz, W / 2, dz); line(-W / 2, dz - 0.1, -W / 2, dz + 0.1); line(W / 2, dz - 0.1, W / 2, dz + 0.1);
  const dx = W / 2 + H + 0.45;
  line(dx, D / 2, dx, D / 2 + H); line(dx - 0.1, D / 2, dx + 0.1, D / 2); line(dx - 0.1, D / 2 + H, dx + 0.1, D / 2 + H);
  // grain arrows
  for (const z of [D / 2 + H / 2, -D / 2 - H / 2]) { line(-0.5, z, 0.5, z); line(0.5, z, 0.38, z - 0.08); line(0.5, z, 0.38, z + 0.08); }
  const drawGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const drawLines = new THREE.LineSegments(drawGeo, ink); drawing.add(drawLines);
  const totalVerts = pts.length;

  // leather
  const bump = saffianoBump();
  const leather = new THREE.MeshPhysicalMaterial({ color: colours[0], roughness: 0.48, metalness: 0, bumpMap: bump, bumpScale: 1.2, clearcoat: 0.35, clearcoatRoughness: 0.45, sheen: 0.4, sheenColor: new THREE.Color('#ffffff'), transparent: true });
  const edgePaint = new THREE.MeshStandardMaterial({ color: '#0c0b0a', roughness: 0.3, transparent: true });
  const mats = [edgePaint, edgePaint, leather, leather, edgePaint, edgePaint];
  const thread = new THREE.LineDashedMaterial({ color: '#efe6d4', dashSize: 0.045, gapSize: 0.03, transparent: true });

  const panel = (w: number, d: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, T, d), mats); m.castShadow = m.receiveShadow = true;
    const i = 0.07, y = T / 2 + 0.002;
    const sp = [new THREE.Vector3(-w / 2 + i, y, -d / 2 + i), new THREE.Vector3(w / 2 - i, y, -d / 2 + i), new THREE.Vector3(w / 2 - i, y, d / 2 - i), new THREE.Vector3(-w / 2 + i, y, d / 2 - i), new THREE.Vector3(-w / 2 + i, y, -d / 2 + i)];
    const st = new THREE.Line(new THREE.BufferGeometry().setFromPoints(sp), thread); st.computeLineDistances(); m.add(st);
    const under = st.clone(); under.position.y = -T - 0.004; m.add(under);
    return m;
  };

  const bag = new THREE.Group(); scene.add(bag);
  const base = panel(W, D); bag.add(base);
  const frontP = new THREE.Group(); frontP.position.set(0, 0, D / 2); bag.add(frontP);
  const front = panel(W, H); front.position.z = H / 2; frontP.add(front);
  const backP = new THREE.Group(); backP.position.set(0, 0, -D / 2); bag.add(backP);
  const back = panel(W, H); back.position.z = -H / 2; backP.add(back);
  const leftP = new THREE.Group(); leftP.position.set(-W / 2, 0, 0); bag.add(leftP);
  const left = panel(H, D - 0.01); left.position.x = -H / 2; leftP.add(left);
  const rightP = new THREE.Group(); rightP.position.set(W / 2, 0, 0); bag.add(rightP);
  const right = panel(H, D - 0.01); right.position.x = H / 2; rightP.add(right);
  const flap1P = new THREE.Group(); flap1P.position.set(0, 0, -H); backP.add(flap1P);
  const flap1 = panel(W + 0.03, D + 0.04); flap1.position.z = -(D + 0.04) / 2; flap1P.add(flap1);
  const flap2P = new THREE.Group(); flap2P.position.set(0, 0, -(D + 0.04)); flap1P.add(flap2P);
  const flap2 = panel(W + 0.03, FLAP); flap2.position.z = -FLAP / 2; flap2P.add(flap2);
  // brass turn-lock on the flap tip
  const brass = new THREE.MeshStandardMaterial({ color: '#c9a45e', metalness: 1, roughness: 0.25 });
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.16), brass); lock.position.set(0, -T, -FLAP + 0.16); lock.castShadow = true; flap2P.add(lock);
  const target = new THREE.Vector3();
  const c0 = new THREE.Color(), c1 = new THREE.Color();

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  };
  resize();

  return {
    resize,
    /** p: 0..1 through the pinned scene. Returns which stage is showing (0-4). */
    render(p: number, t: number) {
      const draw = ease(seg(p, 0.02, 0.2));
      const cut = ease(seg(p, 0.2, 0.26));
      const lift = ease(seg(p, 0.3, 0.36));
      const fold = ease(seg(p, 0.33, 0.56));
      const flapA = ease(seg(p, 0.5, 0.6));
      const flapB = ease(seg(p, 0.56, 0.66));
      const spin = seg(p, 0.6, 0.9);
      const toPhoto = ease(seg(p, 0.84, 0.93));

      drawGeo.setDrawRange(0, Math.floor(totalVerts * draw / 2) * 2);
      ink.opacity = 1 - ease(seg(p, 0.36, 0.5));
      paperMat.opacity = 1 - ease(seg(p, 0.4, 0.58));
      [leather, edgePaint, thread].forEach((m) => { m.opacity = cut; });
      bag.visible = cut > 0.001;

      frontP.rotation.x = -Math.PI / 2 * fold;
      backP.rotation.x = Math.PI / 2 * fold;
      leftP.rotation.z = -Math.PI / 2 * ease(seg(p, 0.36, 0.56));
      rightP.rotation.z = Math.PI / 2 * ease(seg(p, 0.36, 0.56));
      flap1P.rotation.x = Math.PI / 2 * flapA;
      flap2P.rotation.x = Math.PI / 2 * flapB;
      bag.position.y = lift * 0.25 * (1 - fold) + T / 2;

      // colour: eight leathers in turn while it spins
      const cf = spin * (colours.length - 1);
      const ci = Math.min(colours.length - 2, Math.floor(cf));
      c0.set(colours[ci]); c1.set(colours[ci + 1]);
      leather.color.copy(c0).lerp(c1, ease(clamp01((cf - ci - 0.35) / 0.3)));
      bag.rotation.y = -0.5 * fold + Math.sin(spin * Math.PI * 2) * 0.75 + spin * 0.9 + Math.sin(t * 0.5) * 0.04 * fold;

      // camera: straight down on the drawing, then a low three-quarter view of the finished bag
      const k = ease(seg(p, 0.28, 0.6));
      const portrait = camera.aspect < 0.8;
      const topY = portrait ? 24 : 17.5;
      const ox = portrait ? 0 : -3.0, ox2 = portrait ? 0 : -1.25;
      camera.position.set(lerp(ox, 3.6 + ox2, k), lerp(topY, 2.7, k), lerp(0.31, portrait ? 7.4 : 5.6, k));
      target.set(lerp(ox, ox2, k), lerp(0, H * 0.5, k), lerp(0.3, 0, k));
      camera.lookAt(target);
      camera.fov = portrait ? 40 : 30; camera.updateProjectionMatrix();

      renderer.render(scene, camera);
      return { stage: p < 0.18 ? 0 : p < 0.33 ? 1 : p < 0.6 ? 2 : p < 0.86 ? 3 : 4, photo: toPhoto, dark: ease(seg(p, 0.4, 0.58)) };
    },
  };
}
