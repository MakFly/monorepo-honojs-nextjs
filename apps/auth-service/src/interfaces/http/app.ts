import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { RoutesRegistrar } from '../../types/http';

type CreateAppDeps = {
  cors: { trustedOrigins: string[] };
  routes: RoutesRegistrar;
};

export const createApp = ({ cors: corsCfg, routes }: CreateAppDeps) => {
  const app = new Hono();

  app.use(
    '/api/*',
    cors({
      origin: corsCfg.trustedOrigins,
      credentials: true,
    })
  );

  // Register routes via provided registrar (dependency inversion)
  routes(app);

  return app;
};
