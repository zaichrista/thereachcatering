import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../db.js';
import config from '../config.js';
import { HttpError, idParam, parse, slugify } from '../lib/http.js';
import { categories, menuItems, packages, testimonials } from '../models.js';
import {
  INQUIRY_STATUSES,
  categorySchema,
  inquiryUpdateSchema,
  listQuerySchema,
  loginSchema,
  menuItemSchema,
  packageSchema,
  testimonialSchema,
} from '../schemas.js';

const router = Router();

// --- Auth --------------------------------------------------------------------

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

// Compared against when the email is unknown, so timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const user = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email.toLowerCase());
  const ok = bcrypt.compareSync(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'Invalid email or password');
  const token = jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  res.json({ token });
});

function requireAuth(req, _res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Authentication required');
  try {
    req.admin = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
  next();
}

router.use(requireAuth);

router.get('/me', (req, res) => res.json({ id: req.admin.sub, email: req.admin.email }));

router.get('/stats', (_req, res) => {
  const count = (sql) => db.prepare(sql).get().n;
  res.json({
    new_inquiries: count("SELECT COUNT(*) n FROM inquiries WHERE status = 'new'"),
    total_inquiries: count('SELECT COUNT(*) n FROM inquiries'),
    upcoming_booked: count(
      "SELECT COUNT(*) n FROM inquiries WHERE status = 'booked' AND event_date >= date('now')",
    ),
    unread_messages: count('SELECT COUNT(*) n FROM contact_messages WHERE is_read = 0'),
  });
});

// --- Content CRUD (categories, menu items, packages, testimonials) -------------

function mountCrud(path, crud, schema, { slugFrom } = {}) {
  const patchSchema = schema.partial();

  router.get(path, (_req, res) => res.json(crud.list()));

  router.get(`${path}/:id`, (req, res) => {
    const row = crud.get(parse(idParam, req.params).id);
    if (!row) throw new HttpError(404, 'Not found');
    res.status(200).json(row);
  });

  router.post(path, (req, res) => {
    const data = parse(schema, req.body);
    if (slugFrom) data.slug ??= slugify(data[slugFrom]);
    res.status(201).json(crud.create(data));
  });

  router.patch(`${path}/:id`, (req, res) => {
    const row = crud.update(parse(idParam, req.params).id, parse(patchSchema, req.body));
    if (!row) throw new HttpError(404, 'Not found');
    res.json(row);
  });

  router.delete(`${path}/:id`, (req, res) => {
    if (!crud.remove(parse(idParam, req.params).id)) throw new HttpError(404, 'Not found');
    res.status(204).end();
  });
}

mountCrud('/categories', categories, categorySchema, { slugFrom: 'name' });
mountCrud('/menu-items', menuItems, menuItemSchema);
mountCrud('/packages', packages, packageSchema, { slugFrom: 'name' });
mountCrud('/testimonials', testimonials, testimonialSchema);

// --- Inquiries -----------------------------------------------------------------

const inquiryQuery = listQuerySchema.extend({
  status: z.enum(INQUIRY_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
});

router.get('/inquiries', (req, res) => {
  const { status, q, limit, offset } = parse(inquiryQuery, req.query);
  const where = [];
  const params = [];
  if (status) {
    where.push('i.status = ?');
    params.push(status);
  }
  if (q) {
    where.push('(i.name LIKE ? OR i.email LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) n FROM inquiries i ${clause}`).get(...params).n;
  const rows = db
    .prepare(
      `SELECT i.*, p.name AS package_name FROM inquiries i
       LEFT JOIN packages p ON p.id = i.package_id
       ${clause} ORDER BY i.created_at DESC, i.id DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset);
  res.json({ total, limit, offset, items: rows });
});

router.get('/inquiries/:id', (req, res) => {
  const row = db
    .prepare(
      `SELECT i.*, p.name AS package_name FROM inquiries i
       LEFT JOIN packages p ON p.id = i.package_id WHERE i.id = ?`,
    )
    .get(parse(idParam, req.params).id);
  if (!row) throw new HttpError(404, 'Not found');
  res.json(row);
});

router.patch('/inquiries/:id', (req, res) => {
  const { id } = parse(idParam, req.params);
  const data = parse(inquiryUpdateSchema, req.body);
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  if (keys.length) {
    const sets = [...keys.map((k) => `${k} = ?`), "updated_at = datetime('now')"].join(', ');
    db.prepare(`UPDATE inquiries SET ${sets} WHERE id = ?`).run(...keys.map((k) => data[k]), id);
  }
  const row = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
  if (!row) throw new HttpError(404, 'Not found');
  res.json(row);
});

router.delete('/inquiries/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM inquiries WHERE id = ?').run(parse(idParam, req.params).id);
  if (!changes) throw new HttpError(404, 'Not found');
  res.status(204).end();
});

// --- Contact messages ------------------------------------------------------------

router.get('/messages', (req, res) => {
  const { limit, offset } = parse(listQuerySchema, req.query);
  const total = db.prepare('SELECT COUNT(*) n FROM contact_messages').get().n;
  const items = db
    .prepare('SELECT * FROM contact_messages ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?')
    .all(limit, offset)
    .map((m) => ({ ...m, is_read: !!m.is_read }));
  res.json({ total, limit, offset, items });
});

router.patch('/messages/:id', (req, res) => {
  const { id } = parse(idParam, req.params);
  const { is_read } = parse(z.object({ is_read: z.boolean() }), req.body);
  const { changes } = db.prepare('UPDATE contact_messages SET is_read = ? WHERE id = ?').run(+is_read, id);
  if (!changes) throw new HttpError(404, 'Not found');
  res.json({ id, is_read });
});

router.delete('/messages/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(parse(idParam, req.params).id);
  if (!changes) throw new HttpError(404, 'Not found');
  res.status(204).end();
});

export default router;
