import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/700.css';
import '@fontsource/hanken-grotesk/800.css';
import './style.css';

// Working name. Swap here for the workshop's real name.
const NAME = 'Pellarno';

// Houses the workshop has produced for, in the past. Official logos from Wikimedia Commons, in src/logos.
const HOUSES = [
  { name: 'Balenciaga', logo: 'balenciaga' },
  { name: 'Saint Laurent', logo: 'saintlaurent', weight: 0.88 },
  { name: 'Givenchy', logo: 'givenchy' },
  { name: 'Maison Margiela', logo: 'margiela', weight: 1.05 },
  { name: 'Prada', logo: 'prada', weight: 0.9 },
  { name: 'Chanel', logo: 'chanel', weight: 0.9 },
];

const LOGOS = import.meta.glob('./logos/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

document.documentElement.classList.add('js');
document.querySelectorAll('[data-name]').forEach((el) => { el.textContent = NAME; });

// Logos: balanced by visual area so wide wordmarks and compact marks look equal.
const list = document.querySelector('.logos')!;
for (const h of HOUSES) {
  const svg = LOGOS[`./logos/${h.logo}.svg`] || '';
  const vb = /viewBox="([^"]+)"/.exec(svg)?.[1].split(/\s+/).map(Number) || [0, 0, 10, 1];
  const k = Math.sqrt(10 / (vb[2] / vb[3])) * (h.weight ?? 1);
  const li = document.createElement('li');
  li.style.setProperty('--k', k.toFixed(3));
  li.innerHTML = `${svg.replace('<svg ', '<svg aria-hidden="true" focusable="false" ')}<span class="sr">${h.name}</span>`;
  list.append(li);
}

// Header turns solid once the hero has passed.
const nav = document.querySelector('.nav')!;
const hero = document.querySelector('.hero')!;
new IntersectionObserver(([e]) => nav.classList.toggle('is-solid', !e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' }).observe(hero);

// Photos and headings fade in once, the first time they come into view.
const fades = document.querySelectorAll('main section:not(.hero) figure, .sec-head, .step__text, .intro > *, .colours__head, .logos, .contatti__head, .make__list, .faq__list');
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px' });
fades.forEach((el) => { el.classList.add('fade'); io.observe(el); });

// The form posts to /api/enquiry, which emails the enquiry to the Pellarno inbox.
const MAIL = 'info@pellarno.it';
const form = document.querySelector<HTMLFormElement>('.form')!;
const status = form.querySelector<HTMLElement>('.form__status')!;
const send = form.querySelector<HTMLButtonElement>('[type=submit]')!;
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  send.disabled = true;
  send.textContent = 'Sending';
  status.textContent = '';
  try {
    const r = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) {
      form.reset();
      status.textContent = 'Thank you. Your enquiry has been sent, and we will reply personally.';
      send.textContent = 'Sent';
      return;
    }
    status.textContent = r.status === 400 && j.error ? j.error : `Your enquiry could not be sent just now. Please write to ${MAIL}.`;
  } catch {
    status.textContent = `Your enquiry could not be sent just now. Please write to ${MAIL}.`;
  }
  send.disabled = false;
  send.textContent = 'Send enquiry';
});
