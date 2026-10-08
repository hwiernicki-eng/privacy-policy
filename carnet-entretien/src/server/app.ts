import { existsSync } from 'node:fs';
import { join } from 'node:path';

import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';

export interface AppOptions {
  /** Dossier du build Vite à servir ; ignoré s'il ne contient pas index.html (mode dev : Vite sert le front). */
  clientDir?: string;
  logger?: boolean;
}

export async function buildApp(opts: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? false });

  // Provisoire (M0-T1) : la vérification SELECT 1 arrive en M0-T5.
  app.get('/health', () => ({ ok: true }));

  await app.register(
    (api, _opts, done) => {
      api.get('/ping', () => ({ pong: true }));
      done();
    },
    { prefix: '/api/v1' },
  );

  if (opts.clientDir && existsSync(join(opts.clientDir, 'index.html'))) {
    await app.register(fastifyStatic, { root: opts.clientDir, wildcard: false });
  }

  return app;
}
