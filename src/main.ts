import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/bodoni-moda/opsz-italic.css';
import '@fontsource-variable/archivo/wdth.css';
import './style.css';

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { createHide, type HideState } from './hide';
import { DYES, FINISHES } from './palette';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: 'power3.out', duration: 0.9 });

const root = document.documentElement;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
root.classList.add(still ? 'still' : 'has-motion');

const canvas = document.getElementById('hide') as HTMLCanvasElement;
const hide = createHide(canvas);
if (!hide) root.classList.add('no-gl');

const state: HideState = {
  light: [innerWidth * 0.7, innerHeight * 0.3],
  offset: [0, 0],
  dyeA: DYES.bordeaux, dyeB: DYES.bordeaux,
  finA: FINISHES.vitello, finB: FINISHES.vitello,
  edge: -9999, axis: 0,
  press: still ? 1 : 0, foil: still ? 1 : 0, lightAmt: still ? 1 : 0, stampY: 0,
};

/* ---------- the stamp: the wordmark, drawn once and pressed into the hide ---------- */
function drawStamp() {
  if (!hide) return;
  const size = Math.min(innerWidth * 0.28, innerHeight * 0.3);
  root.style.setProperty('--stamp-size', `${size}px`);
  const c = document.createElement('canvas');
  const d = hide.dpr;
  c.width = Math.round(innerWidth * d);
  c.height = Math.round(innerHeight * d);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.filter = `blur(${0.8 * d}px)`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `italic 400 ${size * d}px "Bodoni Moda Variable", Didot, serif`;
  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = `${-0.035 * size * d}px`;
  const cx = c.width / 2;
  const cy = c.height * 0.46;
  // Bodoni's hairlines are too fine to hold foil, so they are thickened the way a brass die would be.
  ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round'; ctx.lineWidth = size * d * 0.014;
  for (const [word, y] of [['Atelier', cy - size * d * 0.08], ['Milano', cy + size * d * 0.78]] as const) {
    ctx.strokeText(word, cx, y); ctx.fillText(word, cx, y);
  }
  hide.setStamp(c);
}

/* ---------- which leather is under which pixel ---------- */
const blocks = [...document.querySelectorAll<HTMLElement>('[data-dye]')];
const dyeOf = (el: HTMLElement) => DYES[el.dataset.dye as keyof typeof DYES];
const finOf = (el: HTMLElement) => FINISHES[el.dataset.finish as keyof typeof FINISHES];

const navMark = document.querySelector<HTMLElement>('.nav__mark')!;
const navLinks = document.querySelector<HTMLElement>('.nav nav')!;
const LIGHT = new Set(['zafferano', 'cipria', 'osso']);
function tint(el: HTMLElement, rects: DOMRect[], x: number) {
  const i = rects.findIndex((r) => r.top <= 30 && r.bottom > 30 && r.left <= x && r.right > x);
  if (i >= 0) el.classList.toggle('is-ink', LIGHT.has(blocks[i].dataset.dye!));
}

function readSeam() {
  const vw = innerWidth, vh = innerHeight, cx = vw / 2, cy = vh / 2;
  const rects = blocks.map((b) => b.getBoundingClientRect());
  tint(navMark, rects, 80); tint(navLinks, rects, vw - 80);
  for (let i = 1; i < blocks.length; i++) {
    const r = rects[i];
    const across = r.top > 0 && r.top < vh && r.left <= cx && r.right > cx;
    const down = r.left > 0 && r.left < vw && r.top <= cy && r.bottom > cy;
    if (across || down) {
      state.dyeA = dyeOf(blocks[i - 1]); state.finA = finOf(blocks[i - 1]);
      state.dyeB = dyeOf(blocks[i]); state.finB = finOf(blocks[i]);
      state.axis = across ? 0 : 1;
      state.edge = across ? r.top : r.left;
      return;
    }
  }
  const i = Math.max(0, rects.findIndex((r) => r.top <= cy && r.bottom > cy && r.left <= cx && r.right > cx));
  state.dyeA = state.dyeB = dyeOf(blocks[i]);
  state.finA = state.finB = finOf(blocks[i]);
  state.edge = -9999; state.axis = 0;
}

/* ---------- light ---------- */
const pointer = { x: innerWidth * 0.7, y: innerHeight * 0.3, at: -1e9 };
addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  pointer.x = e.clientX; pointer.y = e.clientY; pointer.at = performance.now();
}, { passive: true });

let bookST: ScrollTrigger | undefined;
const track = document.querySelector<HTMLElement>('.book__track')!;

function frame(now: number) {
  const t = now / 1000;
  const idle = now - pointer.at > 3500;
  const tx = idle ? innerWidth * (0.5 + 0.34 * Math.cos(t * 0.21)) : pointer.x;
  const ty = idle ? innerHeight * (0.4 + 0.24 * Math.sin(t * 0.29)) : pointer.y;
  const k = still ? 1 : 0.055;
  state.light[0] += (tx - state.light[0]) * k;
  state.light[1] += (ty - state.light[1]) * k;

  const y = scrollY;
  const pinned = bookST ? Math.min(Math.max(y - bookST.start, 0), bookST.end - bookST.start) : 0;
  state.offset[0] = bookST ? -(gsap.getProperty(track, 'x') as number) : 0;
  state.offset[1] = y - pinned;
  state.stampY = y;
  readSeam();
  hide!.render(state, t);
}

/* ---------- motion ---------- */
function motion() {
  const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // The one orchestrated moment: the lamp comes up, the press comes down, the foil catches.
  const hero = document.querySelector('.hero')!;
  const lede = SplitText.create(hero.querySelector('[data-lines]')!, { type: 'lines', mask: 'lines' });
  gsap.set(hero.querySelectorAll('[data-lines]'), { visibility: 'visible' });
  gsap.timeline({ delay: 0.15 })
    .to(state, { lightAmt: 1, duration: 2, ease: 'power2.inOut' })
    .to(state, { press: 1, duration: 0.42, ease: 'power4.in' }, 1.25)
    .fromTo(canvas, { scale: 1.035 }, { scale: 1, duration: 1.4, ease: 'expo.out' }, 1.67)
    .to(state, { foil: 1, duration: 1.1, ease: 'power2.out' }, 1.7)
    .from(lede.lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, 2.0)
    .from('.hero__cue, .nav', { opacity: 0, duration: 1.2 }, 2.3);

  // Headings and asides rise out of a mask, line by line.
  document.querySelectorAll<HTMLElement>('[data-lines]').forEach((el) => {
    if (hero.contains(el)) return;
    gsap.set(el, { visibility: 'visible' });
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 110, duration: 1.15, ease: 'expo.out', stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 88%' },
      }),
    });
  });

  // The manifesto is read at the speed you scroll.
  const text = document.querySelector<HTMLElement>('[data-words]')!;
  gsap.set(text, { visibility: 'visible' });
  const words = SplitText.create(text, { type: 'words', wordsClass: 'w' });
  gsap.fromTo(words.words, { opacity: 0.13 }, {
    opacity: 1, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: text, start: 'top 78%', end: 'bottom 55%', scrub: 0.6 },
  });

  // The sample book turns sideways.
  const dist = () => track.scrollWidth - innerWidth;
  const turn = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: '.book', pin: true, scrub: 0.9, anticipatePin: 1, end: () => `+=${dist()}`, invalidateOnRefresh: true },
  });
  bookST = turn.scrollTrigger!;
  document.querySelectorAll<HTMLElement>('.panel').forEach((panel, i) => {
    const name = panel.querySelector<HTMLElement>('.panel__name')!;
    const over = () => Math.max(0, name.scrollWidth - innerWidth * 0.86);
    gsap.fromTo(name, { x: () => (i ? innerWidth * 0.1 : 0) }, {
      x: () => -over() - innerWidth * 0.1, ease: 'none',
      scrollTrigger: { containerAnimation: turn, trigger: panel, start: i ? 'left right' : 'left left', end: 'right left', scrub: true },
    });
    if (i) gsap.from(panel.querySelector('.panel__tag'), {
      rotate: -16, yPercent: 60, opacity: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { containerAnimation: turn, trigger: panel, start: 'left 45%' },
    });
  });

  // Patterns draw themselves, then the stitch line is marked.
  document.querySelectorAll<HTMLElement>('.piece').forEach((piece) => {
    gsap.timeline({ scrollTrigger: { trigger: piece, start: 'top 85%', end: 'top 30%', scrub: 0.8 } })
      .from(piece.querySelectorAll('.draw'), { strokeDashoffset: 1, ease: 'none', stagger: 0.18 })
      .from(piece.querySelectorAll('.st, text'), { opacity: 0, ease: 'none', duration: 0.3 }, '>-0.1');
  });

  // A thread sews down the process as you read it.
  gsap.from('.thread__line', {
    scaleY: 0, ease: 'none',
    scrollTrigger: { trigger: '.making__body', start: 'top 65%', end: 'bottom 65%', scrub: true },
  });
  document.querySelectorAll<HTMLElement>('.step').forEach((step) => {
    gsap.from(step.children, {
      yPercent: 18, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: step, start: 'top 84%' },
    });
  });

  // The nav steps aside while you read down and returns the moment you scroll back.
  const nav = document.querySelector('.nav')!;
  ScrollTrigger.create({ start: 120, end: 'max', onUpdate: (self) => nav.classList.toggle('is-away', self.direction === 1), onLeaveBack: () => nav.classList.remove('is-away') });

  addEventListener('load', () => ScrollTrigger.refresh());
}

/* ---------- form ---------- */
const form = document.querySelector<HTMLFormElement>('.form')!;
form.addEventListener('submit', (e) => {
  e.preventDefault();
  form.querySelector('.form__status')!.textContent = 'This draft is not connected to an inbox yet, so nothing was sent.';
});

/* ---------- start ---------- */
const fonts = Promise.race([
  Promise.all([document.fonts.load('italic 400 120px "Bodoni Moda Variable"'), document.fonts.load('400 40px "Bodoni Moda Variable"'), document.fonts.ready]),
  new Promise((r) => setTimeout(r, 2500)),
]);

fonts.then(() => {
  drawStamp();
  if (!still) motion();
  if (hide) {
    if (still) { const paint = () => frame(performance.now()); paint(); addEventListener('scroll', paint, { passive: true }); addEventListener('resize', paint); }
    else gsap.ticker.add(() => { if (!document.hidden) frame(performance.now()); });
  }
  let rw = innerWidth;
  addEventListener('resize', () => {
    hide?.resize();
    if (innerWidth !== rw || still) { rw = innerWidth; drawStamp(); }
  });
});
