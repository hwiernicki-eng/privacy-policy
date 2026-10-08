import { fileURLToPath } from 'node:url';

import { buildApp } from '@server/app';

// Provisoire (M0-T1) : lecture validée par Zod dans config.ts en M0-T5.
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

// dist/server/index.js → dist/client ; en dev (tsx) le dossier n'existe pas et Vite sert le front.
const clientDir = fileURLToPath(new URL('../client', import.meta.url));

const app = await buildApp({ clientDir, logger: true });

const shutdown = (signal: string): void => {
  app.log.info({ signal }, 'arrêt');
  app.close().then(
    () => process.exit(0),
    () => process.exit(1),
  );
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

await app.listen({ port, host });
