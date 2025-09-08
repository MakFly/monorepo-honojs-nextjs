import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth';

const app = new Hono();

const trustedOrigins = process.env.TRUSTED_ORIGINS?.split(',') || [];

app.use(
  '/api/*',
  cors({
    origin: trustedOrigins,
    credentials: true,
  })
);

app.get('/api/me', async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return c.json(session.user);
});

app.on(['GET', 'POST', 'PUT', 'DELETE'], '/api/auth/*', auth.handler);

const port = 4001;
console.log(`Auth service running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
