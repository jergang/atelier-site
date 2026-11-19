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

// No server: the form opens the visitor's email app with the enquiry written out.
const MAIL = 'info@pellarno.it';
const form = document.querySelector<HTMLFormElement>('.form')!;
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const status = form.querySelector('.form__status')!;
  if (!form.reportValidity()) return;
  const d = new FormData(form);
  const v = (k: string) => String(d.get(k) ?? '').trim();
  const subject = `Custom project: ${v('piece')}${v('company') ? ' for ' + v('company') : ''}`;
  const body = [
    `Name: ${v('name')}`,
    `House or company: ${v('company') || '-'}`,
    `Email: ${v('email')}`,
    `Piece: ${v('piece')}`,
    `Quantity: ${v('qty')}`,
    `Timing: ${v('timing') || '-'}`,
    '',
    v('brief'),
  ].join('\n');
  const q = (o: Record<string, string>) => Object.entries(o).map(([k, x]) => `${k}=${encodeURIComponent(x)}`).join('&');
  const links: [string, string][] = [
    ['Gmail', `https://mail.google.com/mail/?view=cm&fs=1&${q({ to: MAIL, su: subject, body })}`],
    ['Outlook', `https://outlook.office.com/mail/deeplink/compose?${q({ to: MAIL, subject, body })}`],
    ['Email app', `mailto:${MAIL}?${q({ subject, body })}`],
  ];
  status.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = `Your enquiry is ready. Send it to ${MAIL} with:`;
  const row = document.createElement('div');
  row.className = 'form__send';
  for (const [label, href] of links) {
    const a = document.createElement('a');
    a.className = 'btn btn--light';
    a.href = href; a.textContent = label;
    if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
    row.append(a);
  }
  const copy = document.createElement('button');
  copy.type = 'button'; copy.className = 'btn btn--light'; copy.textContent = 'Copy enquiry';
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(`To: ${MAIL}\nSubject: ${subject}\n\n${body}`); copy.textContent = 'Copied'; }
    catch { copy.textContent = 'Copy failed'; }
  });
  row.append(copy);
  status.append(p, row);
});
