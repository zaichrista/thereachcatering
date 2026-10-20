# The Reach Catering — Backend API

Node (>=22.5) + Express 5 + SQLite (built-in `node:sqlite`, no native build). JSON API under `/api`.

## Run
```
npm install
cp .env.example .env     # set JWT_SECRET, ADMIN_EMAIL/PASSWORD, CORS_ORIGIN
npm run seed             # creates admin + sample Mediterranean menu & packages (placeholder content/prices)
npm run dev              # http://localhost:4000
npm test
```

## Website (`site/`)
Static site (HTML/CSS/JS, no build step). Copy is taken from www.thereachcatering.com; the contact form posts to `/api/contact`.
```
npm run dev        # API on :4000 (seed first with: npm run seed)
npm run site       # website on http://localhost:3000 (served with no caching, so edits always show)
```
The API URL is the `reach-api` meta tag in `site/index.html`; set `CORS_ORIGIN` to the site's origin.
`?t=2000` freezes the hero animation at that millisecond (handy for tuning).

## Public endpoints
| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | |
| GET | `/api/menu?dietary=vegan` | categories with nested available items. Tags: vegan, vegetarian, gluten_free, dairy_free, nut_free, halal |
| GET | `/api/menu/featured` | |
| GET | `/api/packages`, `/api/packages/:slug` | |
| GET | `/api/testimonials` | published only |
| POST | `/api/inquiries` | `name, email, event_type, event_date (YYYY-MM-DD), guest_count`; optional `phone, venue, budget, package_id, dietary_notes, message` |
| POST | `/api/contact` | `name, email, message`, optional `subject` |

Both POST forms are rate-limited (10 / 15 min / IP) and have a honeypot: add a hidden `website` input to the form, kept empty by humans.
Errors: `{ "error": "...", "details": [{ "field", "message" }] }`.

## Admin endpoints (`Authorization: Bearer <token>`)
`POST /api/admin/login {email,password}` → `{token}`, then under `/api/admin`:
- `GET /me`, `GET /stats`
- CRUD (`GET`, `GET/:id`, `POST`, `PATCH/:id`, `DELETE/:id`): `/categories`, `/menu-items`, `/packages`, `/testimonials`
- `GET /inquiries?status=&q=&limit=&offset=`, `GET|PATCH|DELETE /inquiries/:id` (status: new, contacted, quoted, booked, declined, archived; `admin_notes`)
- `GET /messages`, `PATCH /messages/:id {is_read}`, `DELETE /messages/:id`

Prices are integer cents. Deleting a category that still has items returns 409.

## Email
Set `SMTP_*` and `NOTIFY_EMAIL` to get an email on each inquiry/message plus a confirmation to the customer. Unset = skipped.

## Deploy notes
Needs a host with a persistent disk for `DB_PATH` (or swap SQLite for Postgres later). Set `NODE_ENV=production`, a real `JWT_SECRET`, `CORS_ORIGIN` to your site's origin, and `TRUST_PROXY=1` behind a proxy.
