import nodemailer from 'nodemailer';
import config from '../config.js';

const { host, port, user, pass, from } = config.mail;
const transport = host
  ? nodemailer.createTransport({ host, port, secure: port === 465, auth: user ? { user, pass } : undefined })
  : null;

/**
 * Plain-text email (so no HTML escaping concerns with user input).
 * Never throws: a mail failure must not fail the API request.
 * Without SMTP_HOST configured it just logs, which is handy in dev.
 */
export async function sendMail({ to, subject, text, replyTo }) {
  if (!to) return;
  if (!transport) {
    if (!config.isProd) console.log(`[mail:dry-run] to=${to} subject="${subject}"`);
    return;
  }
  try {
    await transport.sendMail({ from, to, subject, text, replyTo });
  } catch (err) {
    console.error('[mail] failed to send:', err.message);
  }
}
