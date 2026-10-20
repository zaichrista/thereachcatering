import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import db from '../db.js';
import config from '../config.js';
import { HttpError, parse } from '../lib/http.js';
import { sendMail } from '../lib/mailer.js';
import { categories, menuItems, packages, testimonials } from '../models.js';
import { DIETARY_TAGS, contactInputSchema, inquiryInputSchema } from '../schemas.js';

const router = Router();

// --- Read-only content -------------------------------------------------------

router.get('/menu', (req, res) => {
  const { dietary } = parse(z.object({ dietary: z.enum(DIETARY_TAGS).optional() }), req.query);
  const items = menuItems
    .list('WHERE is_available = 1')
    .filter((i) => !dietary || i.dietary.includes(dietary));
  const result = categories
    .list()
    .map((c) => ({ ...c, items: items.filter((i) => i.category_id === c.id) }))
    .filter((c) => c.items.length > 0);
  res.json(result);
});

router.get('/menu/featured', (_req, res) => {
  res.json(menuItems.list('WHERE is_available = 1 AND is_featured = 1'));
});

router.get('/packages', (_req, res) => {
  res.json(packages.list('WHERE is_active = 1'));
});

router.get('/packages/:slug', (req, res) => {
  const [pkg] = packages.list('WHERE is_active = 1 AND slug = ?', [req.params.slug]);
  if (!pkg) throw new HttpError(404, 'Package not found');
  res.json(pkg);
});

router.get('/testimonials', (_req, res) => {
  res.json(testimonials.list('WHERE is_published = 1'));
});

// --- Form submissions --------------------------------------------------------

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many submissions, please try again later.' },
});

const line = (label, v) => (v ? `${label}: ${v}\n` : '');

router.post('/inquiries', formLimiter, (req, res) => {
  const { website, ...data } = parse(inquiryInputSchema, req.body);
  // Honeypot tripped: pretend success so bots learn nothing.
  if (website) return res.status(201).json({ ok: true });

  let pkgName = null;
  if (data.package_id) {
    const pkg = packages.get(data.package_id);
    if (!pkg || !pkg.is_active) throw new HttpError(400, 'Unknown package', [{ field: 'package_id', message: 'Unknown package' }]);
    pkgName = pkg.name;
  }

  const cols = Object.keys(data);
  const { lastInsertRowid } = db
    .prepare(`INSERT INTO inquiries (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
    .run(...cols.map((k) => data[k] ?? null));
  const id = Number(lastInsertRowid);

  // Fire-and-forget; sendMail never throws.
  sendMail({
    to: config.mail.notifyTo,
    replyTo: data.email,
    subject: `New catering inquiry #${id}: ${data.event_type} on ${data.event_date}`,
    text:
      line('Name', data.name) + line('Email', data.email) + line('Phone', data.phone) +
      line('Event', data.event_type) + line('Date', data.event_date) + line('Guests', data.guest_count) +
      line('Venue', data.venue) + line('Budget', data.budget) + line('Package', pkgName) +
      line('Dietary', data.dietary_notes) + `\n${data.message ?? ''}\n`,
  });
  sendMail({
    to: data.email,
    subject: 'We received your catering inquiry',
    text:
      `Hi ${data.name},\n\nThanks for reaching out to The Reach Catering. ` +
      `We've received your inquiry for ${data.event_date} and will be in touch shortly.\n\n` +
      `Reference: #${id}\n`,
  });

  res.status(201).json({ ok: true, id });
});

router.post('/contact', formLimiter, (req, res) => {
  const { website, ...data } = parse(contactInputSchema, req.body);
  if (website) return res.status(201).json({ ok: true });

  const cols = Object.keys(data);
  db.prepare(`INSERT INTO contact_messages (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(
    ...cols.map((k) => data[k] ?? null),
  );

  sendMail({
    to: config.mail.notifyTo,
    replyTo: data.email,
    subject: `Website message: ${data.subject || '(no subject)'}`,
    text: line('From', `${data.name} <${data.email}>`) + `\n${data.message}\n`,
  });

  res.status(201).json({ ok: true });
});

export default router;
