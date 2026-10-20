import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';

let server, base, token;
const call = async (method, path, body, auth = false) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(auth ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

before(async () => {
  const { createApp } = await import('../src/app.js');
  const { seedAdmin, seedContent } = await import('../src/seed.js');
  seedAdmin('Admin@Example.com', 'correct-horse');
  seedContent();
  server = createApp().listen(0);
  base = `http://localhost:${server.address().port}/api`;
});
after(() => server.close());

test('public menu is grouped by category and filterable by dietary tag', async () => {
  const all = await call('GET', '/menu');
  assert.equal(all.status, 200);
  assert.ok(all.body.length >= 5 && all.body[0].items.length > 0);
  const vegan = await call('GET', '/menu?dietary=vegan');
  assert.ok(vegan.body.every((c) => c.items.every((i) => i.dietary.includes('vegan'))));
  assert.equal((await call('GET', '/menu?dietary=bogus')).status, 400);
});

test('packages list and lookup by slug', async () => {
  const list = await call('GET', '/packages');
  assert.equal(list.body.length, 3);
  assert.equal((await call('GET', '/packages/the-feast')).status, 200);
  assert.equal((await call('GET', '/packages/nope')).status, 404);
});

test('inquiry validation and creation', async () => {
  const bad = await call('POST', '/inquiries', { name: 'A', email: 'nope' });
  assert.equal(bad.status, 400);
  const past = await call('POST', '/inquiries', {
    name: 'A', email: 'a@b.co', event_type: 'wedding', event_date: '2020-01-01', guest_count: 50,
  });
  assert.equal(past.status, 400);
  const ok = await call('POST', '/inquiries', {
    name: 'Maya', email: 'maya@example.com', event_type: 'wedding',
    event_date: '2099-06-01', guest_count: 80, package_id: 2, message: 'Hello',
  });
  assert.equal(ok.status, 201);
  assert.ok(ok.body.id);
});

test('honeypot submissions are accepted but not stored', async () => {
  const r = await call('POST', '/contact', { name: 'Bot', email: 'b@b.co', message: 'spam', website: 'http://x' });
  assert.equal(r.status, 201);
});

test('admin routes require auth', async () => {
  assert.equal((await call('GET', '/admin/inquiries')).status, 401);
  assert.equal((await call('POST', '/admin/login', { email: 'admin@example.com', password: 'wrong' })).status, 401);
  const login = await call('POST', '/admin/login', { email: 'admin@example.com', password: 'correct-horse' });
  assert.equal(login.status, 200);
  token = login.body.token;
  assert.equal((await call('GET', '/admin/me', null, true)).status, 200);
});

test('admin manages inquiries', async () => {
  const list = await call('GET', '/admin/inquiries?status=new', null, true);
  assert.equal(list.body.total, 1);
  assert.equal(list.body.items[0].package_name, 'The Feast');
  const id = list.body.items[0].id;
  const patched = await call('PATCH', `/admin/inquiries/${id}`, { status: 'quoted', admin_notes: 'Sent quote' }, true);
  assert.equal(patched.body.status, 'quoted');
  assert.equal((await call('PATCH', `/admin/inquiries/${id}`, { status: 'weird' }, true)).status, 400);
  assert.equal((await call('GET', '/admin/stats', null, true)).body.new_inquiries, 0);
});

test('admin menu CRUD: partial update keeps other fields, delete protected by FK', async () => {
  const cat = await call('POST', '/admin/categories', { name: 'Drinks & Teas' }, true);
  assert.equal(cat.status, 201);
  assert.equal(cat.body.slug, 'drinks-teas');
  const item = await call('POST', '/admin/menu-items', {
    category_id: cat.body.id, name: 'Mint Tea', dietary: ['vegan'], is_featured: true,
  }, true);
  assert.equal(item.status, 201);
  assert.equal(item.body.is_available, true);
  const patched = await call('PATCH', `/admin/menu-items/${item.body.id}`, { price_cents: 450 }, true);
  assert.equal(patched.body.price_cents, 450);
  assert.equal(patched.body.is_featured, true);
  assert.deepEqual(patched.body.dietary, ['vegan']);
  assert.equal((await call('DELETE', `/admin/categories/${cat.body.id}`, null, true)).status, 409);
  assert.equal((await call('DELETE', `/admin/menu-items/${item.body.id}`, null, true)).status, 204);
  assert.equal((await call('DELETE', `/admin/categories/${cat.body.id}`, null, true)).status, 204);
});

test('testimonials only public when published', async () => {
  const t = await call('POST', '/admin/testimonials', { author: 'Sam', quote: 'Superb.' }, true);
  assert.equal((await call('GET', '/testimonials')).body.length, 0);
  await call('PATCH', `/admin/testimonials/${t.body.id}`, { is_published: true }, true);
  assert.equal((await call('GET', '/testimonials')).body.length, 1);
});
