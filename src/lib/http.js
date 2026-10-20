import { z } from 'zod';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Parse `source` (body/query/params) with a zod schema or throw a 400. */
export function parse(schema, source) {
  const result = schema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    throw new HttpError(400, 'Validation failed', details);
  }
  return result.data;
}

export const idParam = z.object({ id: z.coerce.number().int().positive() });

export const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  const msg = String(err.message || '');
  if (msg.includes('UNIQUE constraint')) {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }
  if (msg.includes('FOREIGN KEY constraint')) {
    return res
      .status(409)
      .json({ error: 'Operation conflicts with related records (missing or still in use)' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
