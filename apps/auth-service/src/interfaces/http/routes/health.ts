import type { Hono } from 'hono';

export const registerHealthRoutes = (app: Hono) => {
  app.get('/healthz', (c) => c.json({ status: 'ok' }, 200));
  app.get('/api/healthz', (c) => c.json({ status: 'ok' }, 200));
  app.get('/api/v1/healthz', (c) => c.json({ status: 'ok' }, 200));
};

