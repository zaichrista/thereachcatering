import db from '../db.js';

/**
 * Minimal table helper. Column names come from the zod schema's keys (never
 * from user input); values are always bound parameters.
 * `json` columns are stored as JSON text; `is_*` columns as 0/1.
 */
export function makeCrud({ table, schema, json = [], orderBy = 'sort_order, id' }) {
  const cols = Object.keys(schema.shape);

  const out = (row) => {
    if (!row) return null;
    const r = { ...row };
    for (const k of json) r[k] = JSON.parse(r[k]);
    for (const k of Object.keys(r)) if (k.startsWith('is_')) r[k] = !!r[k];
    return r;
  };
  const bind = (k, v) => (json.includes(k) ? JSON.stringify(v) : typeof v === 'boolean' ? +v : v);

  const crud = {
    list(where = '', params = []) {
      return db
        .prepare(`SELECT * FROM ${table} ${where} ORDER BY ${orderBy}`)
        .all(...params)
        .map(out);
    },
    get(id) {
      return out(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id));
    },
    create(data) {
      const keys = cols.filter((k) => data[k] !== undefined);
      const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;
      const { lastInsertRowid } = db.prepare(sql).run(...keys.map((k) => bind(k, data[k])));
      return crud.get(Number(lastInsertRowid));
    },
    update(id, data) {
      const keys = cols.filter((k) => data[k] !== undefined);
      if (keys.length === 0) return crud.get(id);
      const sql = `UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(',')} WHERE id = ?`;
      const { changes } = db.prepare(sql).run(...keys.map((k) => bind(k, data[k])), id);
      return changes ? crud.get(id) : null;
    },
    remove(id) {
      return db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id).changes > 0;
    },
  };
  return crud;
}
