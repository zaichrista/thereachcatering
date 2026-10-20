import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import config from './config.js';
import db from './db.js';
import { slugify } from './lib/http.js';
import { categories, menuItems, packages } from './models.js';

/** Creates/updates the admin from ADMIN_EMAIL + ADMIN_PASSWORD. */
export function seedAdmin(email, password) {
  const hash = bcrypt.hashSync(password, 12);
  db.prepare(
    `INSERT INTO admin_users (email, password_hash) VALUES (?, ?)
     ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash`,
  ).run(email.toLowerCase(), hash);
}

// Placeholder content so the front end has something to render. Edit freely via the admin API.
// Prices are illustrative only.
const MENU = {
  'Mezze': {
    description: 'Small plates to share, served at room temperature.',
    items: [
      ['Classic Hummus', 'Chickpea, tahini, lemon, olive oil', ['vegan', 'gluten_free', 'dairy_free'], true],
      ['Baba Ghanoush', 'Smoky charred aubergine, tahini, garlic, pomegranate', ['vegan', 'gluten_free', 'dairy_free']],
      ['Tabbouleh', 'Parsley, mint, bulgur, tomato, lemon', ['vegan', 'dairy_free']],
      ['Labneh', 'Strained yoghurt, za\'atar, olive oil', ['vegetarian', 'gluten_free']],
      ['Falafel', 'Crisp herbed chickpea fritters, tahini sauce', ['vegan', 'dairy_free'], true],
      ['Spanakopita', 'Spinach and feta in flaky filo', ['vegetarian']],
    ],
  },
  'From the Grill': {
    description: 'Charcoal-grilled and marinated overnight.',
    items: [
      ['Chicken Souvlaki', 'Lemon, oregano and garlic marinade', ['gluten_free', 'dairy_free', 'halal'], true],
      ['Lamb Kofta', 'Spiced lamb skewers, sumac onions', ['gluten_free', 'dairy_free', 'halal']],
      ['Grilled Halloumi', 'Honey, thyme, charred lemon', ['vegetarian', 'gluten_free']],
    ],
  },
  'Mains': {
    description: 'Slow-cooked centrepieces for the table.',
    items: [
      ['Slow-Roasted Lamb Shoulder', 'Rosemary, garlic, white wine, 6 hours', ['gluten_free', 'dairy_free', 'halal'], true],
      ['Moussaka', 'Aubergine, spiced lamb ragù, béchamel', []],
      ['Stuffed Vine Leaves', 'Herbed rice, pine nuts, lemon', ['vegan', 'gluten_free', 'dairy_free']],
    ],
  },
  'Sides & Salads': {
    description: 'Fresh, bright and made to go with everything.',
    items: [
      ['Greek Salad', 'Tomato, cucumber, olives, feta, oregano', ['vegetarian', 'gluten_free']],
      ['Fattoush', 'Crisp pita, sumac, radish, herbs', ['vegan', 'dairy_free']],
      ['Lemon Roast Potatoes', 'Oregano, garlic, olive oil', ['vegan', 'gluten_free', 'dairy_free']],
    ],
  },
  'Sweets': {
    description: 'To finish.',
    items: [
      ['Baklava', 'Filo, pistachio, walnut, honey syrup', ['vegetarian']],
      ['Loukoumades', 'Warm honey doughnuts, cinnamon', ['vegetarian']],
      ['Orange Blossom Panna Cotta', 'Candied orange, pistachio', ['vegetarian', 'gluten_free']],
    ],
  },
};

const PACKAGES = [
  {
    name: 'Mezze Grazing Table',
    description: 'A generous spread of dips, salads, breads and bites. Ideal for cocktail-style gatherings.',
    price_per_head_cents: 3500,
    min_guests: 15,
    includes: ['6 mezze dishes', 'Fresh breads and crudités', 'Setup and styling'],
  },
  {
    name: 'The Feast',
    description: 'Family-style sharing platters with grilled meats, sides and dessert.',
    price_per_head_cents: 6500,
    min_guests: 20,
    includes: ['4 mezze', '2 grilled mains', '3 sides', 'Dessert platter', 'Serving staff'],
  },
  {
    name: 'The Grand Banquet',
    description: 'Our full celebration menu with slow-roasted centrepiece, live grill and sweets table.',
    price_per_head_cents: 9500,
    min_guests: 40,
    includes: ['Full mezze course', 'Slow-roasted lamb centrepiece', 'Live grill station', 'Sweets table', 'Staff and full service'],
  },
];

export function seedContent() {
  if (db.prepare('SELECT COUNT(*) n FROM menu_categories').get().n > 0) return false;
  let order = 0;
  for (const [name, { description, items }] of Object.entries(MENU)) {
    const cat = categories.create({ name, slug: slugify(name), description, sort_order: order++ });
    items.forEach(([iname, idesc, dietary, featured], i) =>
      menuItems.create({
        category_id: cat.id,
        name: iname,
        description: idesc,
        dietary,
        is_featured: !!featured,
        sort_order: i,
      }),
    );
  }
  PACKAGES.forEach((p, i) => packages.create({ ...p, slug: slugify(p.name), sort_order: i }));
  return true;
}

// Run directly: `npm run seed`
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { email, password } = config.admin;
  if (email && password) {
    seedAdmin(email, password);
    console.log(`Admin user ready: ${email}`);
  } else {
    console.log('Skipped admin: set ADMIN_EMAIL and ADMIN_PASSWORD to create one.');
  }
  console.log(seedContent() ? 'Seeded sample menu and packages.' : 'Menu already has data, left untouched.');
}
