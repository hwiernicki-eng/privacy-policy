import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@server/app';

describe('routes de base', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/ping répond { pong: true }', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/ping' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ pong: true });
  });

  it('GET /health répond 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
  });
});
