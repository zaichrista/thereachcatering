import config from './config.js';
import { createApp } from './app.js';

const server = createApp().listen(config.port, () => {
  console.log(`Reach Catering API listening on http://localhost:${config.port}`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
