import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import config from './config.js';

if (config.dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
}

const db = new DatabaseSync(config.dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES menu_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER,
  dietary TEXT NOT NULL DEFAULT '[]',
  image_url TEXT,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);

CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_per_head_cents INTEGER,
  min_guests INTEGER NOT NULL DEFAULT 1,
  includes TEXT NOT NULL DEFAULT '[]',
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY,
  author TEXT NOT NULL,
  event_type TEXT,
  quote TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  venue TEXT,
  budget TEXT,
  package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL,
  dietary_notes TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status, created_at);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

export default db;
