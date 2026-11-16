import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface Piece { src: string; height: string }

const SPACING = 3.4;

// Glass cases on stone plinths, each under its own spotlight. The pieces are the workshop's own photos,
// cut out and given relief, so they catch the light and turn like objects.
export async function createVitrine(canvas: HTMLCanvasElement, pieces: Piece[]) {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 800 ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d0b09');
  scene.fog = new THREE.Fog('#0d0b09', 5.5, 13);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.18;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

  // floor: dark polished stone
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), new THREE.MeshStandardMaterial({ color: '#15110e', roughness: 0.38, metalness: 0.1 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  // back wall in pietra serena, very dim
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(80, 12), new THREE.MeshStandardMaterial({ color: '#3a3d39', roughness: 0.95 }));
  wall.position.set(0, 6, -3.2); wall.receiveShadow = true; scene.add(wall);

  scene.add(new THREE.HemisphereLight('#c9c2b3', '#0d0b09', 0.18));

  const stone = new THREE.MeshStandardMaterial({ color: '#6e746c', roughness: 0.82, metalness: 0 });
  const brass = new THREE.MeshStandardMaterial({ color: '#b39258', roughness: 0.32, metalness: 1 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 2.2, clearcoat: 1 });
  const edgeMat = new THREE.LineBasicMaterial({ color: '#b39258', transparent: true, opacity: 0.55 });

  const loader = new THREE.TextureLoader();
  const texs = await Promise.all(pieces.map((p) => Promise.all([loader.loadAsync(p.src), loader.loadAsync(p.height)])));
  const objects: THREE.Mesh[] = [];
  const holders: THREE.Group[] = [];

  pieces.forEach((p, i) => {
    const g = new THREE.Group(); g.position.x = i * SPACING; scene.add(g);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 1.4), stone);
    plinth.position.y = 0.475; plinth.castShadow = plinth.receiveShadow = true; g.add(plinth);
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.035, 1.44), brass); band.position.y = 0.95; g.add(band);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.05, 1.46), brass); foot.position.y = 0.025; g.add(foot);

    const caseGeo = new THREE.BoxGeometry(1.26, 1.75, 1.26);
    const glassBox = new THREE.Mesh(caseGeo, glass); glassBox.position.y = 0.97 + 0.875; glassBox.renderOrder = 2; g.add(glassBox);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(caseGeo), edgeMat); edges.position.copy(glassBox.position); g.add(edges);

    const holder = new THREE.Group(); holder.position.y = 0.97; g.add(holder); holders.push(holder);

    const spot = new THREE.SpotLight('#ffe1b5', 46, 7, 0.36, 0.75, 1.6);
    spot.position.set(i * SPACING + 0.5, 4.2, 1.6);
    spot.target.position.set(i * SPACING, 1.35, 0);
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0004; spot.shadow.radius = 6;
    scene.add(spot, spot.target);

    const tex = texs[i][0]; const hmap = texs[i][1];
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const img = tex.image as { width: number; height: number };
    const asp = img.width / img.height;
    let w = 1.0, h = 1.0 / asp; if (h > 1.3) { h = 1.3; w = 1.3 * asp; }
    const mat = new THREE.MeshStandardMaterial({
      map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.42, metalness: 0.05,
      displacementMap: hmap, displacementScale: 0.16, displacementBias: -0.08, bumpMap: hmap, bumpScale: 2.2,
    });
    const geo = new THREE.PlaneGeometry(w, h, 180, 180);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = h / 2 + 0.03;
    mesh.castShadow = true;
    mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    holder.add(mesh); objects.push(mesh);
    const refMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.1, depthWrite: false, alphaTest: 0.5 });
    const reflection = new THREE.Mesh(geo, refMat); reflection.scale.y = -1; reflection.position.y = -h / 2 - 0.01;
    holder.add(reflection);
  });

  // pointer turns the active piece; touch drags it
  const turn = { target: 0, current: 0, at: -1e9 };
  let dragX: number | null = null;
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') { if (dragX !== null) { turn.target = THREE.MathUtils.clamp(turn.target + (e.clientX - dragX) / 160, -1, 1); dragX = e.clientX; turn.at = performance.now(); } return; }
    const r = canvas.getBoundingClientRect();
    turn.target = ((e.clientX - r.left) / r.width - 0.5) * 2; turn.at = performance.now();
  });
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') dragX = e.clientX; });
  addEventListener('pointerup', () => { dragX = null; });

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.fov = camera.aspect < 0.8 ? 46 : 30;
    camera.updateProjectionMatrix();
  };
  resize();

  return {
    resize,
    count: pieces.length,
    render(progress: number, t: number) {
      const n = pieces.length - 1;
      const x = progress * n * SPACING;
      const between = Math.sin(Math.PI * (progress * n % 1));
      const portrait = camera.aspect < 0.8;
      camera.position.set(x - (portrait ? 0 : 0.2), 2.05 + between * 0.12, (portrait ? 6.6 : 5.3) + between * 0.7);
      camera.lookAt(x - (portrait ? 0 : 0.85), 1.5, 0);
      if (performance.now() - turn.at > 2600) turn.target = Math.sin(t * 0.4) * 0.35;
      turn.current += (turn.target - turn.current) * 0.06;
      const active = Math.round(progress * n);
      holders.forEach((h, i) => {
        const tgt = i === active ? turn.current * 0.62 : Math.sin(t * 0.3 + i) * 0.15;
        h.rotation.y += (tgt - h.rotation.y) * 0.08;
        h.position.y = 0.97 + Math.sin(t * 0.8 + i) * 0.012;
      });
      renderer.render(scene, camera);
    },
  };
}
