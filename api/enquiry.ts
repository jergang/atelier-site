// Sends an enquiry from the contact form to the Pellarno inbox.
// Needs SMTP_PASS (the info@pellarno.it mailbox password) set in Vercel.
import nodemailer from 'nodemailer';

type Req = { method?: string; body?: unknown };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; setHeader: (k: string, v: string) => void };

const TO = process.env.ENQUIRY_TO || 'info@pellarno.it';
const USER = process.env.SMTP_USER || 'info@pellarno.it';
const HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const PORT = Number(process.env.SMTP_PORT || 465);

const clean = (v: unknown, max = 200) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Use POST.' });

  const b = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}) as Record<string, unknown>;
  if (clean(b.website)) return res.status(200).json({ ok: true }); // honeypot: bots fill the hidden field

  const name = clean(b.name, 120);
  const email = clean(b.email, 160);
  const company = clean(b.company, 160);
  const piece = clean(b.piece, 60);
  const qty = clean(b.qty, 60);
  const timing = clean(b.timing, 120);
  const brief = String(b.brief ?? '').trim().slice(0, 5000);

  if (!name || !emailOk(email)) return res.status(400).json({ ok: false, error: 'Please add your name and a valid email.' });
  if (!process.env.SMTP_PASS) return res.status(503).json({ ok: false, error: 'not-configured' });

  const rows: [string, string][] = [
    ['Name', name], ['House or company', company || '-'], ['Email', email],
    ['Piece', piece], ['Quantity', qty], ['Timing', timing || '-'],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${brief || '(no description)'}`;
  const html = `<table cellpadding="6" style="font:15px/1.5 Helvetica,Arial,sans-serif;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#777">${k}</td><td><b>${esc(v)}</b></td></tr>`).join('')}</table>` +
    `<p style="font:15px/1.6 Helvetica,Arial,sans-serif;white-space:pre-wrap">${esc(brief || '(no description)')}</p>`;

  try {
    const tx = nodemailer.createTransport({ host: HOST, port: PORT, secure: PORT === 465, auth: { user: USER, pass: process.env.SMTP_PASS } });
    await tx.sendMail({
      from: `"Pellarno website" <${USER}>`,
      to: TO,
      replyTo: `"${name.replace(/"/g, '')}" <${email}>`,
      subject: `Enquiry: ${piece}${company ? ` for ${company}` : ''} (${name})`,
      text, html,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('enquiry send failed', e);
    return res.status(502).json({ ok: false, error: 'send-failed' });
  }
}
