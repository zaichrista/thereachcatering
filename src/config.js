const env = process.env;
const isProd = env.NODE_ENV === 'production';

if (isProd && !env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export default {
  isProd,
  port: Number(env.PORT) || 4000,
  dbPath: env.DB_PATH || './data/reach.db',
  jwtSecret: env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: env.JWT_EXPIRES_IN || '8h',
  // Comma-separated list of allowed site origins, e.g. https://reachcatering.com
  corsOrigins: (env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  admin: {
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  },
  mail: {
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.MAIL_FROM || 'The Reach Catering <no-reply@localhost>',
    // Where new inquiries / contact messages are sent
    notifyTo: env.NOTIFY_EMAIL,
  },
};
