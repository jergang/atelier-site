import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import './style.css';

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { NAME, HOUSES, VITRINE, BAG_COLOURS } from './config';
import { PLANS } from './plans';

// Official logos, inlined so they take the page's colour.
const LOGOS = import.meta.glob('./logos/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
function logo(h: { logo: string; weight?: number }) {
  const svg = LOGOS[`./logos/${h.logo}.svg`] || '';
  const vb = /viewBox="([^"]+)"/.exec(svg)?.[1].split(/\s+/).map(Number) || [0, 0, 10, 1];
  // balance by visual area rather than height, so wide wordmarks and compact marks look equal
  const k = Math.sqrt(10 / (vb[2] / vb[3])) * (h.weight ?? 1);
  return { svg: svg.replace('<svg ', '<svg aria-hidden="true" focusable="false" '), k: k.toFixed(3) };
}
import { createHide, type HideState } from './gl/hide';
import { createHero } from './gl/hero';
import { createCroc } from './gl/croc';
import { createMarble } from './gl/marble';
import { createVitrine } from './gl/vitrine';
import { createFold } from './gl/fold';
import { whenVisible } from './gl/fs';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: 'power3.out', duration: 1 });

const root = document.documentElement;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll(s)] as T[];
const hasGL = !!document.createElement('canvas').getContext('webgl2');
root.classList.add(hasGL ? 'gl' : 'no-gl');

$$('[data-name]').forEach((el) => { el.textContent = NAME; });
document.title = `${NAME}, leather goods made in Florence`;

/* ---------- smooth scroll ---------- */
const lenis = still ? null : new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.85, anchors: true });
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- a render loop per canvas, run only while it is on screen ---------- */
type Loop = (t: number) => void;
const loops = new Set<Loop>();
function onScreen(el: Element, loop: Loop) { whenVisible(el, (v) => { if (v) loops.add(loop); else loops.delete(loop); }); }
gsap.ticker.add(() => { if (document.hidden) return; const t = performance.now() / 1000; loops.forEach((l) => l(t)); });
const resizers: (() => void)[] = [];
let lastW = innerWidth;
addEventListener('resize', () => { resizers.forEach((r) => r()); if (innerWidth !== lastW) { lastW = innerWidth; ScrollTrigger.refresh(); } });

/* ---------- 0. opening: the name foil-stamped into black calf ---------- */
function opening(): Promise<void> {
  const el = $('.opening');
  if (still || !hasGL) { root.classList.add('no-open'); return Promise.resolve(); }
  const canvas = $<HTMLCanvasElement>('.opening__gl');
  const hide = createHide(canvas);
  if (!hide) { root.classList.add('no-open'); return Promise.resolve(); }
  lenis?.stop();
  const nero: [number, number, number] = [0.085, 0.07, 0.06];
  const s: HideState = { light: [innerWidth * 0.62, innerHeight * 0.32], offset: [0, 0], dyeA: nero, dyeB: nero, finA: [1, 0, 0, 11], finB: [1, 0, 0, 11], edge: -9999, axis: 0, press: 0, foil: 0, lightAmt: 0, stampY: 0 };
  const size = Math.min(innerWidth * 0.13, innerHeight * 0.24);
  const c = document.createElement('canvas'); const d = hide.dpr;
  c.width = Math.round(innerWidth * d); c.height = Math.round(innerHeight * d);
  const g = c.getContext('2d')!;
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.textAlign = 'center'; g.lineJoin = 'round';
  g.font = `600 ${size * d}px "Cormorant Garamond", Garamond, serif`;
  g.filter = `blur(${0.7 * d}px)`; g.lineWidth = size * d * 0.008;
  const words = NAME.split(' ');
  words.forEach((w, i) => { const y = c.height * 0.5 + (i - (words.length - 1) / 2) * size * d * 0.95 + size * d * 0.32; g.strokeText(w, c.width / 2, y); g.fillText(w, c.width / 2, y); });
  hide.setStamp(c);
  let alive = true;
  const loop = (now: number) => {
    if (!alive) return;
    const t = now / 1000;
    s.light[0] = innerWidth * (0.5 + 0.28 * Math.cos(t * 0.9)); s.light[1] = innerHeight * (0.38 + 0.12 * Math.sin(t * 1.1));
    hide.render(s, t); requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  return new Promise((done) => {
    const tl = gsap.timeline({ onComplete: () => { alive = false; el.remove(); lenis?.start(); done(); } })
      .to(s, { lightAmt: 1, duration: 1.4, ease: 'power2.inOut' })
      .to(s, { press: 1, duration: 0.38, ease: 'power4.in' }, 0.9)
      .fromTo(canvas, { scale: 1.03 }, { scale: 1, duration: 1.2, ease: 'expo.out' }, 1.28)
      .to(s, { foil: 1, duration: 0.9 }, 1.3)
      .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.3, ease: 'expo.inOut' }, 2.55);
    el.style.clipPath = 'inset(0% 0% 0% 0%)';
    const skip = () => tl.progress() < 0.8 && tl.seek(2.55);
    addEventListener('keydown', skip, { once: true }); el.addEventListener('click', skip, { once: true });
  });
}

/* ---------- 1. hero ---------- */
async function hero() {
  const section = $('.hero');
  const entry = { v: still ? 1 : 0 };
  const progress = { v: 0 };
  ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom top', onUpdate: (st) => { progress.v = st.progress; } });
  if (hasGL) {
    const h = await createHero($<HTMLCanvasElement>('.hero__gl')).catch(() => null);
    if (h) { resizers.push(() => h.fs.resize()); onScreen(section, (t) => h.render(progress.v, t, entry.v)); }
    else root.classList.replace('gl', 'no-gl');
  }
  return {
    reveal() {
      const name = SplitText.create('.hero__name', { type: 'words,chars', mask: 'chars' });
      const line = SplitText.create('.hero__line', { type: 'lines', mask: 'lines' });
      gsap.timeline()
        .to(entry, { v: 1, duration: 2.2, ease: 'power2.out' }, 0)
        .from(name.chars, { yPercent: 110, duration: 1.6, ease: 'expo.out', stagger: 0.045 }, 0.2)
        .from(line.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out' }, 0.9)
        .from('.hero__cta, .hero__cue, .nav', { opacity: 0, duration: 1.2 }, 1.2);
      gsap.to('.hero__copy', { yPercent: -40, opacity: 0, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: '60% top', scrub: true } });
    },
  };
}

/* ---------- 2. the houses ---------- */
function maisons() {
  const band = $('.mband');
  const peek = $('.maisons__peek'); const peekImg = $<HTMLImageElement>('img', peek); const peekCap = $('figcaption', peek);
  const row = document.createElement('div'); row.className = 'mrow';
  for (let k = 0; k < 2; k++) {
    const set = document.createElement('div'); set.className = 'mrow__set';
    if (k) set.setAttribute('aria-hidden', 'true');
    HOUSES.forEach((h, i) => {
      const el = document.createElement('span'); el.className = 'logo';
      const l = logo(h);
      el.innerHTML = `${l.svg}<span class="sr">${h.name}</span>`;
      el.style.setProperty('--k', l.k); el.style.setProperty('--i', String(i)); el.dataset.name = h.name;
      set.append(el);
    });
    row.append(set);
  }
  band.append(row);
  const pos = { x: 0, speed: 1, target: 1 };
  const phone = matchMedia('(max-width: 700px)');
  gsap.ticker.add(() => {
    if (phone.matches || still) return;
    const v = lenis ? Math.abs(lenis.velocity) : 0;
    pos.speed += ((pos.target + Math.min(v * 0.06, 3)) - pos.speed) * 0.08;
    pos.x = (pos.x - 0.012 * pos.speed) % 50;
    gsap.set(row, { xPercent: pos.x });
  });
  const qx = gsap.quickTo(peek, 'x', { duration: 0.7, ease: 'power3' }), qy = gsap.quickTo(peek, 'y', { duration: 0.7, ease: 'power3' });
  addEventListener('pointermove', (e) => { qx(e.clientX + 24); qy(e.clientY - 140); }, { passive: true });
  band.addEventListener('pointerover', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.logo'); if (!el) return;
    pos.target = 0.1;
    const h = HOUSES.find((x) => x.name === el.dataset.name);
    if (h?.image) { peekImg.src = h.image; peekCap.textContent = `${h.name}, ${h.piece?.toLowerCase()}`; peek.classList.add('is-on'); }
    else peek.classList.remove('is-on');
  });
  band.addEventListener('pointerleave', () => { pos.target = 1; peek.classList.remove('is-on'); });
  const sec = $('.maisons');
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { sec.classList.add('is-in'); o.disconnect(); } }, { threshold: 0.2 }).observe(sec);
}

/* ---------- 3. the vitrine ---------- */
function vetrina() {
  const section = $('.vetrina'); const stage = $('.vetrina__stage');
  const label = $('.vetrina__label'), house = $('.vetrina__house'), object = $('.vetrina__object'), detail = $('.vetrina__detail'), count = $('.vetrina__count');
  let shown = -1;
  const show = (i: number) => {
    if (i === shown) return; shown = i;
    label.classList.add('is-swap');
    setTimeout(() => { const v = VITRINE[i]; const hh = HOUSES.find((x) => x.name === v.house); if (hh) { const l = logo(hh); house.innerHTML = `${l.svg}<span class="sr">${v.house}</span>`; house.style.setProperty('--k', l.k); } else house.textContent = v.house; object.textContent = v.object; detail.textContent = v.detail; count.textContent = `${i + 1} / ${VITRINE.length}`; label.classList.remove('is-swap'); }, shown < 0 ? 0 : 280);
  };
  show(0);
  const vp = hasGL ? createVitrine($<HTMLCanvasElement>('.vetrina__gl'), VITRINE.map((p) => ({ src: p.src, height: p.height }))) : null;
  const prog = { v: 0 };
  ScrollTrigger.create({
    trigger: section, start: 'top top', end: () => `+=${innerHeight * (VITRINE.length - 0.2)}`, pin: stage, scrub: true, anticipatePin: 1,
    onUpdate: (st) => { prog.v = st.progress; show(Math.round(st.progress * (VITRINE.length - 1))); },
  });
  vp?.then((v) => { if (!v) return; resizers.push(v.resize); let p = 0; onScreen(stage, (t) => { p += (prog.v - p) * 0.12; v.render(p, t); }); });
  gsap.from('.vetrina__head > *', { yPercent: 40, opacity: 0, stagger: 0.12, scrollTrigger: { trigger: section, start: 'top 70%' } });
}

/* ---------- 4. from the drawing to the object ---------- */
function disegno() {
  const section = $('.disegno'); const stage = $('.disegno__stage');
  const photo = $('.disegno__photo'); const steps = $$('.disegno__steps li');
  const canvasEl = $<HTMLCanvasElement>('.disegno__gl');
  const f = hasGL ? createFold(canvasEl, BAG_COLOURS) : null;
  const prog = { v: 0 };
  ScrollTrigger.create({ trigger: section, start: 'top top', end: () => `+=${innerHeight * 4.2}`, pin: stage, scrub: true, anticipatePin: 1, onUpdate: (st) => { prog.v = st.progress; } });
  const paper = [238, 231, 218], dark = [15, 13, 11];
  const paint = (r: { stage: number; photo: number; dark: number }) => {
    const mix = (k: number) => paper.map((c, i) => Math.round(c + (dark[i] - c) * k)).join(',');
    stage.style.background = `rgb(${mix(r.dark)})`;
    stage.style.setProperty('--disegno-ink', r.dark > 0.5 ? 'var(--avorio)' : 'var(--nero)');
    photo.style.opacity = String(r.photo);
    canvasEl.style.opacity = String(1 - r.photo);
    steps.forEach((s, i) => s.classList.toggle('is-on', i === r.stage));
  };
  if (f) { resizers.push(f.resize); let p = 0; onScreen(stage, (t) => { p += (prog.v - p) * 0.1; paint(f.render(p, t)); }); }
  else { photo.style.opacity = '1'; steps.forEach((s) => s.classList.add('is-on')); }

  $$('[data-plan]').forEach((el) => { el.innerHTML = PLANS[el.dataset.plan!]; });
  // each blueprint draws itself, then flips to the real piece as it passes the middle of the screen
  $$('.card').forEach((card, i) => {
    const paths = $$<SVGPathElement>('.bp', card);
    paths.forEach((p) => { const len = (p as unknown as SVGGeometryElement).getTotalLength?.() || 300; p.style.strokeDasharray = p.classList.contains('bp--st') ? '4 3' : `${len}`; if (!p.classList.contains('bp--st')) p.style.strokeDashoffset = `${len}`; });
    gsap.to(paths.filter((p) => !p.classList.contains('bp--st')), { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', stagger: 0.05, delay: i * 0.12, scrollTrigger: { trigger: '.cards', start: 'top 80%' } });
    ScrollTrigger.create({ trigger: card, start: 'top 35%', end: 'bottom top', toggleClass: 'is-flipped' });
  });
}

/* ---------- 5. production: walking past the shelves ---------- */
function produzione() {
  const section = $('.produzione'); const track = $('.produzione__track');
  const frames = $$('.frame', track);
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  const move = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: section, pin: true, scrub: 0.8, start: 'top top', end: () => `+=${dist()}`, invalidateOnRefresh: true, anticipatePin: 1 } });
  gsap.ticker.add(() => {
    if (!move.scrollTrigger?.isActive) return;
    frames.forEach((f) => { const r = f.getBoundingClientRect(); const k = ((r.left + r.width / 2) / innerWidth - 0.5) * 2; gsap.set(f, { rotateY: -k * 14, z: -Math.abs(k) * 120, opacity: 1 - Math.min(Math.abs(k), 1.4) * 0.35 }); });
  });
}

/* ---------- 6. materials ---------- */
async function materiali() {
  const croc = $('.croc'); const prog = { v: 0 };
  ScrollTrigger.create({ trigger: croc, start: 'top bottom', end: 'bottom top', onUpdate: (st) => { prog.v = st.progress; } });
  if (hasGL) {
    const c = await createCroc($<HTMLCanvasElement>('.croc__gl')).catch(() => null);
    if (c) { resizers.push(() => c.fs.resize()); onScreen(croc, (t) => c.render(t, prog.v)); }
  }
  $$('.swatch__tile').forEach((tile) => {
    tile.addEventListener('pointermove', (e) => {
      const r = tile.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      tile.style.setProperty('--lx', `${x * 100}%`); tile.style.setProperty('--ly', `${y * 100}%`);
      tile.style.setProperty('--rx', `${(0.5 - y) * 14}deg`); tile.style.setProperty('--ry', `${(x - 0.5) * 14}deg`);
    });
    tile.addEventListener('pointerleave', () => { tile.style.setProperty('--rx', '0deg'); tile.style.setProperty('--ry', '0deg'); });
  });
  gsap.from('.swatch', { yPercent: 25, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '.swatches', start: 'top 80%' } });
}

/* ---------- 7. the hands ---------- */
function mani() {
  $$('.shot').forEach((s) => {
    const box = $('.shot__img', s), img = $('img', s);
    gsap.fromTo(box, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: s, start: 'top 85%' } });
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* ---------- 8 & 9. Florence and contact ---------- */
function marbles() {
  $$<HTMLCanvasElement>('canvas.marble').forEach((c) => {
    const word = c.dataset.word;
    const m = hasGL ? createMarble(c, c.dataset.tone === 'night', word) : null;
    if (!m) { if (word) root.classList.add('no-marble-word'); return; }
    if (word) root.classList.add('marble-word');
    resizers.push(() => m.resize());
    onScreen(c, (t) => m.render(t * 0.6));
  });
  if (!still) {
    gsap.fromTo('.firenze__word', { scale: 1.25, letterSpacing: '.08em' }, { scale: 1, letterSpacing: '-.02em', ease: 'none', scrollTrigger: { trigger: '.firenze', start: 'top bottom', end: 'center center', scrub: true } });
  }
  const form = $<HTMLFormElement>('.form');
  form.addEventListener('submit', (e) => { e.preventDefault(); $('.form__status').textContent = 'This draft is not connected to an inbox yet, so nothing was sent.'; });
}

/* ---------- headings rise out of a mask ---------- */
function titles() {
  $$('.title, .contatti__title').forEach((el) => {
    if (el.closest('.vetrina, .disegno')) return;
    SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 85%' } }) });
  });
}

/* ---------- nav steps aside while reading down ---------- */
function nav() {
  const n = $('.nav');
  ScrollTrigger.create({ start: 200, end: 'max', onUpdate: (st) => n.classList.toggle('is-away', st.direction === 1), onLeaveBack: () => n.classList.remove('is-away') });
}

/* ---------- start ---------- */
(async () => {
  await Promise.race([Promise.all([document.fonts.load('600 100px "Cormorant Garamond"'), document.fonts.load('500 100px "Cormorant Garamond"'), document.fonts.load('400 18px "Hanken Grotesk"')]), new Promise((r) => setTimeout(r, 2500))]);
  const h = await hero();
  maisons(); vetrina(); disegno(); produzione(); materiali(); mani(); marbles(); nav();
  if (!still) titles();
  ScrollTrigger.refresh();
  await opening();
  if (!still) h.reveal();
  addEventListener('load', () => ScrollTrigger.refresh());
})();
