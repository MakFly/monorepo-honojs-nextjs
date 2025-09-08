import { serve } from '@hono/node-server';
import { createApp } from './interfaces/http/app';
import { env } from './config/env';
import { buildDependencies } from './infrastructure/build';

// Composition root: build infra and create the HTTP app
const deps = buildDependencies(env);
const app = createApp({
  cors: { trustedOrigins: env.TRUSTED_ORIGINS },
  routes: deps.routes,
});

const port = env.PORT;
console.log(`Auth service running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
