import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from './config.js';
import db from './db.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './lib/http.js';

export function createApp() {
  const app = express();

  // Set TRUST_PROXY=1 when behind a reverse proxy / PaaS so rate limiting sees real client IPs.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '50kb' }));
  app.use(
    '/api',
    rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }),
  );

  app.get('/api/health', (_req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok' });
  });

  app.use('/api/admin', adminRoutes);
  app.use('/api', publicRoutes);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(errorHandler);
  return app;
}
